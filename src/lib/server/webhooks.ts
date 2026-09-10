import { getSql } from "@/lib/db";
import { publicId } from "@/lib/server/crypto";
import { settleBookingTx, releaseAndMark, expireHolds, type BookingRow } from "@/lib/server/booking-engine";
import { demoPaymentsAllowed } from "@/lib/server/config";
import { evaluatePaymentEvent } from "@/lib/server/evaluate-payment";
import { parseStatus } from "@/lib/server/booking-state";
import { log } from "@/lib/server/logger";
import type { VerifiedPaymentEvent } from "@/lib/server/payments";

const BOOKING_SELECT = `
  id, user_id, tour_slug, travel_date, guests, status, guest_name, guest_email,
  guest_phone, notes, hold_expires_at, voucher_code, payment_provider,
  coalesce(amount_cents, 0) as amount_cents, coalesce(currency, 'USD') as currency, created_at
`;

export async function applyVerifiedPaymentEvent(event: VerifiedPaymentEvent) {
  const sql = await getSql();
  return sql.transaction(async (tx) => {
    const inserted = await tx<{ id: string }>`
      insert into webhook_events (id, provider, provider_event_id, payload, status)
      values (
        ${publicId()},
        ${event.provider},
        ${event.eventId},
        ${JSON.stringify({
          provider: event.provider,
          eventId: event.eventId,
          bookingId: event.bookingId,
          success: event.success,
          amountCents: event.amountCents ?? null,
          currency: event.currency ?? null,
        })},
        ${"processing"}
      )
      on conflict (provider, provider_event_id) do nothing
      returning id
    `;

    if (!inserted[0]) {
      const existing = await tx<{ id: string; status: string }>`
        select id, status from webhook_events
        where provider = ${event.provider} and provider_event_id = ${event.eventId}
        limit 1
      `;
      log.info("webhook.duplicate", { provider: event.provider, eventId: event.eventId });
      return { ok: true as const, duplicate: true, status: existing[0]?.status ?? "applied" };
    }

    await expireHolds(tx);

    const rows = await tx.query<BookingRow>(
      `select ${BOOKING_SELECT.replace(/\s+/g, " ")} from bookings where id = $1 for update`,
      [event.bookingId],
    );
    const booking = rows[0];
    if (!booking) {
      await tx`
        update webhook_events set status = ${"unknown_booking"}
        where provider = ${event.provider} and provider_event_id = ${event.eventId}
      `;
      log.warn("webhook.unknown_booking", { bookingId: event.bookingId, provider: event.provider });
      return { ok: false as const, reason: "unknown_booking" };
    }

    const decision = evaluatePaymentEvent(
      {
        status: parseStatus(booking.status),
        amountCents: Number(booking.amount_cents ?? 0),
        currency: booking.currency || "USD",
      },
      {
        provider: event.provider,
        success: event.success,
        amountCents: event.amountCents,
        currency: event.currency,
      },
      demoPaymentsAllowed(),
    );

    if (decision.action === "reject") {
      await tx`
        update webhook_events set status = ${`rejected:${decision.reason}`}
        where provider = ${event.provider} and provider_event_id = ${event.eventId}
      `;
      log.warn("webhook.rejected", { reason: decision.reason, bookingId: booking.id, provider: event.provider });
      return { ok: false as const, reason: decision.reason };
    }

    if (decision.action === "ignore") {
      await tx`
        update webhook_events set status = ${`ignored:${decision.reason}`}
        where provider = ${event.provider} and provider_event_id = ${event.eventId}
      `;
      return { ok: true as const, duplicate: false, bookingId: booking.id, status: booking.status };
    }

    if (decision.action === "confirm") {
      const result = await settleBookingTx(
        tx,
        booking,
        event.provider,
        event.eventId,
        null,
        Number(booking.amount_cents ?? 0),
        booking.currency || "USD",
      );
      await tx`
        update webhook_events set status = ${"applied"}
        where provider = ${event.provider} and provider_event_id = ${event.eventId}
      `;
      return { ok: true as const, duplicate: false, bookingId: result.id, status: result.status };
    }

    await releaseAndMark(tx, booking, "FAILED", null);
    await tx`
      update webhook_events set status = ${"failed_payment"}
      where provider = ${event.provider} and provider_event_id = ${event.eventId}
    `;
    return { ok: true as const, duplicate: false, bookingId: booking.id, status: "FAILED" };
  });
}
