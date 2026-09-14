import { createHmac, timingSafeEqual } from "node:crypto";
import { demoPaymentsAllowed, liveMonerooConfigured, liveStripeConfigured } from "@/lib/server/config";

export type PaymentProvider = "demo" | "stripe" | "moneroo";

export type PaymentMode = {
  provider: PaymentProvider;
  live: boolean;
  label: string;
  demoAllowed: boolean;
};

export function getPaymentMode(): PaymentMode {
  if (liveStripeConfigured()) {
    const key = process.env.STRIPE_SECRET_KEY!.trim();
    return {
      provider: "stripe",
      live: key.startsWith("sk_live_"),
      label: "Stripe card checkout",
      demoAllowed: false,
    };
  }
  if (liveMonerooConfigured()) {
    return {
      provider: "moneroo",
      live: true,
      label: "Moneroo (Orange Money / Afrimoney)",
      demoAllowed: false,
    };
  }
  const demoAllowed = demoPaymentsAllowed();
  return {
    provider: "demo",
    live: false,
    demoAllowed,
    label: demoAllowed ? "Test settlement, not a card charge" : "Invoice, live payment is not configured",
  };
}

export function verifyHmacSha256(payload: string, secret: string, signature: string): boolean {
  if (!secret || !signature) return false;
  const digest = createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(digest);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Stripe-style signed payload: t=timestamp,v1=hmac */
export function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  toleranceSec = 300,
): boolean {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, ...rest] = p.split("=");
      return [k.trim(), rest.join("=")];
    }),
  );
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;
  const age = Math.abs(Date.now() / 1000 - Number(t));
  if (!Number.isFinite(Number(t)) || age > toleranceSec) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(v1);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export type VerifiedPaymentEvent = {
  provider: PaymentProvider;
  eventId: string;
  bookingId: string;
  success: boolean;
  amountCents?: number | null;
  currency?: string | null;
};

export function parseDemoEvent(body: unknown): VerifiedPaymentEvent | null {
  if (!body || typeof body !== "object") return null;
  const rec = body as Record<string, unknown>;
  if (typeof rec.bookingId !== "string" || typeof rec.eventId !== "string") return null;
  return {
    provider: "demo",
    eventId: rec.eventId,
    bookingId: rec.bookingId,
    success: rec.success !== false,
    amountCents: typeof rec.amountCents === "number" ? rec.amountCents : 0,
    currency: typeof rec.currency === "string" ? rec.currency : "USD",
  };
}

export function parseStripeAmount(obj: Record<string, unknown>): { amountCents: number | null; currency: string | null } {
  const amount =
    typeof obj.amount_total === "number"
      ? obj.amount_total
      : typeof obj.amount === "number"
        ? obj.amount
        : null;
  const currency = typeof obj.currency === "string" ? obj.currency.toUpperCase() : null;
  return { amountCents: amount, currency };
}
