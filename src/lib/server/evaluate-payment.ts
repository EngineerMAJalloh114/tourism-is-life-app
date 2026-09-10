import type { BookingStatus } from "@/lib/server/booking-state";
import { canTransition } from "@/lib/server/booking-state";

export type PaymentDecision =
  | { action: "confirm" }
  | { action: "fail" }
  | { action: "ignore"; reason: string }
  | { action: "reject"; reason: string };

export type PaymentEventInput = {
  provider: "demo" | "stripe" | "moneroo";
  success: boolean;
  amountCents?: number | null;
  currency?: string | null;
};

export type BookingPaymentInput = {
  status: BookingStatus | string;
  amountCents: number;
  currency: string;
};

/**
 * Pure payment/booking decision. Used by webhooks and by tests.
 * Live providers must present a matching positive amount. Demo is never
 * allowed to confirm when `demoAllowed` is false.
 */
export function evaluatePaymentEvent(
  booking: BookingPaymentInput,
  event: PaymentEventInput,
  demoAllowed: boolean,
): PaymentDecision {
  if (booking.status === "CONFIRMED" && event.success) {
    return { action: "ignore", reason: "already_confirmed" };
  }
  if (booking.status === "EXPIRED" || booking.status === "CANCELLED") {
    return { action: "ignore", reason: `booking_${String(booking.status).toLowerCase()}` };
  }

  if (event.provider === "demo" && !demoAllowed) {
    return { action: "reject", reason: "demo_disabled" };
  }

  if (event.success) {
    if (event.provider !== "demo") {
      if (!event.amountCents || event.amountCents <= 0) {
        return { action: "reject", reason: "missing_or_zero_amount" };
      }
      if (booking.amountCents <= 0) {
        return { action: "reject", reason: "quote_only_booking" };
      }
      if (event.amountCents !== booking.amountCents) {
        return { action: "reject", reason: "amount_mismatch" };
      }
      const eventCcy = (event.currency ?? "").toUpperCase();
      if (!eventCcy || eventCcy !== booking.currency.toUpperCase()) {
        return { action: "reject", reason: "currency_mismatch" };
      }
    }
    if (booking.status === "HOLD") {
      return { action: "reject", reason: "guest_details_required" };
    }
    if (!canTransition(booking.status as BookingStatus, "CONFIRMED")) {
      return { action: "reject", reason: `invalid_transition_${booking.status}` };
    }
    return { action: "confirm" };
  }

  if (booking.status === "HOLD" || booking.status === "PENDING_PAYMENT") {
    if (!canTransition(booking.status as BookingStatus, "FAILED")) {
      return { action: "reject", reason: "invalid_fail_transition" };
    }
    return { action: "fail" };
  }
  return { action: "ignore", reason: "not_payable" };
}
