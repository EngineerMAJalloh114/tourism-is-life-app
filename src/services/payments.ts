/**
 * Payment provider abstraction.
 * Live confirmation must come from a verified webhook — never from the browser.
 * Amounts are always server-side. A $0 live charge is refused.
 */

import {
  getPaymentMode,
  parseDemoEvent,
  parseStripeAmount,
  verifyHmacSha256,
  verifyStripeSignature,
  type PaymentMode,
  type PaymentProvider,
  type VerifiedPaymentEvent,
} from "@/lib/server/payments";

export interface PaymentInitiation {
  provider: PaymentProvider | "none";
  bookingId: string;
  redirectUrl?: string;
  clientSecret?: string;
  demo: boolean;
  quoteOnly?: boolean;
}

export type ChargeableBooking = {
  id: string;
  amountCents: number;
  currency: string;
  tourTitle?: string;
  guestEmail?: string;
  guestName?: string;
};

export interface PaymentProviderAdapter {
  readonly id: PaymentProvider;
  configured(): boolean;
  initiate(booking: ChargeableBooking): Promise<PaymentInitiation>;
  parseWebhook(rawBody: string, signature: string | null): VerifiedPaymentEvent | null;
}

class StripeProvider implements PaymentProviderAdapter {
  readonly id = "stripe" as const;
  configured() {
    return Boolean(process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_WEBHOOK_SECRET?.trim());
  }
  async initiate(booking: ChargeableBooking): Promise<PaymentInitiation> {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key) {
      throw new Error("Stripe is not configured");
    }
    if (!Number.isInteger(booking.amountCents) || booking.amountCents <= 0) {
      throw new Error("Refusing a zero-amount live charge. This programme is quote-only.");
    }
    const origin = process.env.APP_ORIGIN?.trim() || "https://tourismislife.com";
    const currency = booking.currency.toLowerCase();
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": `til_pay_${booking.id}`,
      },
      body: new URLSearchParams({
        mode: "payment",
        client_reference_id: booking.id,
        success_url: `${origin}/checkout/${booking.id}/processing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout/${booking.id}/cancelled`,
        "metadata[bookingId]": booking.id,
        "metadata[amountCents]": String(booking.amountCents),
        "metadata[currency]": booking.currency.toUpperCase(),
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": currency,
        "line_items[0][price_data][unit_amount]": String(booking.amountCents),
        "line_items[0][price_data][product_data][name]": booking.tourTitle
          ? `Tourism Is Life · ${booking.tourTitle}`
          : `Tourism Is Life booking ${booking.id}`,
      }),
    });
    if (!res.ok) {
      throw new Error("Stripe session could not be created");
    }
    const json = (await res.json()) as { url?: string; client_secret?: string };
    return {
      provider: "stripe",
      bookingId: booking.id,
      redirectUrl: json.url,
      clientSecret: json.client_secret,
      demo: false,
    };
  }
  parseWebhook(rawBody: string, signature: string | null): VerifiedPaymentEvent | null {
    const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!secret || !verifyStripeSignature(rawBody, signature, secret)) return null;
    const json = JSON.parse(rawBody) as {
      id?: string;
      type?: string;
      data?: { object?: Record<string, unknown> };
    };
    const obj = json.data?.object ?? {};
    const meta = obj.metadata as { bookingId?: string } | undefined;
    const bookingId = String(obj.client_reference_id ?? meta?.bookingId ?? "");
    if (!json.id || !bookingId) return null;
    const { amountCents, currency } = parseStripeAmount(obj);
    const paid =
      json.type === "checkout.session.completed" ||
      json.type === "payment_intent.succeeded" ||
      obj.payment_status === "paid";
    return {
      provider: "stripe",
      eventId: json.id,
      bookingId,
      success: Boolean(paid),
      amountCents,
      currency,
    };
  }
}

class MonerooProvider implements PaymentProviderAdapter {
  readonly id = "moneroo" as const;
  configured() {
    return Boolean(process.env.MONEROO_SECRET_KEY?.trim() && process.env.MONEROO_WEBHOOK_SECRET?.trim());
  }
  async initiate(booking: ChargeableBooking): Promise<PaymentInitiation> {
    const key = process.env.MONEROO_SECRET_KEY?.trim();
    if (!key) throw new Error("Moneroo is not configured");
    if (!Number.isInteger(booking.amountCents) || booking.amountCents <= 0) {
      throw new Error("Refusing a zero-amount live charge. This programme is quote-only.");
    }
    const origin = process.env.APP_ORIGIN?.trim() || "https://tourismislife.com";
    const res = await fetch("https://api.moneroo.io/v1/payments/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `til_pay_${booking.id}`,
      },
      body: JSON.stringify({
        amount: booking.amountCents,
        currency: booking.currency.toUpperCase(),
        customer: {
          email: booking.guestEmail,
          name: booking.guestName,
        },
        metadata: { bookingId: booking.id, amountCents: booking.amountCents, currency: booking.currency },
        return_url: `${origin}/checkout/${booking.id}/processing`,
      }),
    });
    if (!res.ok) throw new Error("Moneroo payment could not be started");
    const json = (await res.json()) as { data?: { checkout_url?: string } };
    return {
      provider: "moneroo",
      bookingId: booking.id,
      redirectUrl: json.data?.checkout_url,
      demo: false,
    };
  }
  parseWebhook(rawBody: string, signature: string | null): VerifiedPaymentEvent | null {
    const secret = process.env.MONEROO_WEBHOOK_SECRET?.trim();
    if (!secret || !signature || !verifyHmacSha256(rawBody, secret, signature)) return null;
    const json = JSON.parse(rawBody) as {
      id?: string;
      event?: string;
      data?: {
        id?: string;
        metadata?: { bookingId?: string };
        status?: string;
        amount?: number;
        currency?: string;
        bookingId?: string;
        reference?: string;
      };
    };
    const bookingId = String(json.data?.metadata?.bookingId ?? json.data?.bookingId ?? json.data?.reference ?? "");
    const eventId = json.id || json.data?.id;
    if (!eventId || !bookingId) return null;
    const amount = typeof json.data?.amount === "number" ? json.data.amount : null;
    const currency = typeof json.data?.currency === "string" ? json.data.currency.toUpperCase() : null;
    return {
      provider: "moneroo",
      eventId,
      bookingId,
      success: json.data?.status === "success" || json.event === "payment.success" || json.event === "payment.succeeded",
      amountCents: amount,
      currency,
    };
  }
}

class DemoProvider implements PaymentProviderAdapter {
  readonly id = "demo" as const;
  configured() {
    return true;
  }
  async initiate(booking: ChargeableBooking): Promise<PaymentInitiation> {
    return { provider: "demo", bookingId: booking.id, demo: true, quoteOnly: booking.amountCents <= 0 };
  }
  parseWebhook(rawBody: string): VerifiedPaymentEvent | null {
    try {
      return parseDemoEvent(JSON.parse(rawBody));
    } catch {
      return null;
    }
  }
}

const stripe = new StripeProvider();
const moneroo = new MonerooProvider();
const demo = new DemoProvider();

export function activePaymentProvider(): PaymentProviderAdapter {
  if (stripe.configured()) return stripe;
  if (moneroo.configured()) return moneroo;
  return demo;
}

export function paymentMode(): PaymentMode {
  return getPaymentMode();
}

export { stripe, moneroo, demo };
