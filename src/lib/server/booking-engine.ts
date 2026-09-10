import type { Sql } from "@/lib/db";
import { tours } from "@/data/catalog";
import { accessTokenMatches, bookingRef, publicId, randomToken, sha256Hex } from "@/lib/server/crypto";
import { HOLD_MS, assertTransition, parseStatus } from "@/lib/server/booking-state";
import { quoteForSlug } from "@/lib/server/pricing";
import { log } from "@/lib/server/logger";
import { acquireHoldLock, releaseHoldLock } from "@/services/reservations";

export type BookingRow = {
  id: string;
  user_id: string | null;
  tour_slug: string;
  travel_date: string;
  guests: number;
  status: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  notes: string | null;
  hold_expires_at: string | null;
  voucher_code: string | null;
  payment_provider: string | null;
  amount_cents: number;
  currency: string;
  created_at: string;
};

const BOOKING_SELECT = `
  id, user_id, tour_slug, travel_date, guests, status, guest_name, guest_email,
  guest_phone, notes, hold_expires_at, voucher_code, payment_provider,
  coalesce(amount_cents, 0) as amount_cents, coalesce(currency, 'USD') as currency, created_at
`;

export async function expireHolds(sql: Sql): Promise<number> {
  const expired = await sql<{
    id: string;
    guests: number;
    tour_slug: string;
    travel_date: string;
  }>`
    update bookings
    set status = ${"EXPIRED"}, updated_at = now()
    where status in ('HOLD', 'PENDING_PAYMENT')
      and hold_expires_at is not null
      and hold_expires_at < now()
    returning id, guests, tour_slug, travel_date
  `;
  const grouped = new Map<string, { tour_slug: string; travel_date: string; guests: number }>();
  for (const row of expired) {
    const key = `${row.tour_slug}|${row.travel_date}`;
    const cur = grouped.get(key) ?? { tour_slug: row.tour_slug, travel_date: row.travel_date, guests: 0 };
    cur.guests += Number(row.guests);
    grouped.set(key, cur);
  }
  for (const g of grouped.values()) {
    const updated = await sql<{ tour_slug: string }>`
      update availability
      set reserved_seats = reserved_seats - ${g.guests}
      where tour_slug = ${g.tour_slug}
        and travel_date = ${g.travel_date}
        and reserved_seats >= ${g.guests}
      returning tour_slug
    `;
    if (!updated[0]) {
      log.error("inventory.expire_underflow", {
        tour_slug: g.tour_slug,
        travel_date: g.travel_date,
        guests: g.guests,
      });
    }
  }
  if (expired.length) {
    log.info("booking.holds_expired", { count: expired.length });
  }
  return expired.length;
}

export async function createHoldTx(
  sql: Sql,
  data: { tourSlug: string; travelDate: string; guests: number; userId: string | null; email: string | null },
): Promise<{ id: string; accessToken: string; status: "HOLD"; holdExpiresAt: string }> {
  const tour = tours.find((t) => t.slug === data.tourSlug);
  if (!tour || !tour.bookable) throw new Error("This programme is quote-only.");
  if (data.guests < tour.groupMin || data.guests > tour.groupMax) {
    throw new Error(`Group size must be ${tour.groupMin}–${tour.groupMax}.`);
  }
  const quote = quoteForSlug(data.tourSlug, data.guests);

  return sql.transaction(async (tx) => {
    await expireHolds(tx);
    await tx`
      insert into availability (tour_slug, travel_date, max_capacity, booked_seats, reserved_seats)
      values (${data.tourSlug}, ${data.travelDate}, ${tour.groupMax}, ${0}, ${0})
      on conflict (tour_slug, travel_date) do nothing
    `;
    const reserved = await tx<{ booked_seats: number; reserved_seats: number; max_capacity: number }>`
      update availability
      set reserved_seats = reserved_seats + ${data.guests}
      where tour_slug = ${data.tourSlug}
        and travel_date = ${data.travelDate}
        and (max_capacity - booked_seats - reserved_seats) >= ${data.guests}
      returning booked_seats, reserved_seats, max_capacity
    `;
    if (!reserved[0]) throw new Error("CAPACITY_EXCEEDED");

    const id = bookingRef();
    const token = randomToken(24);
    const expires = new Date(Date.now() + HOLD_MS).toISOString();
    await tx`
      insert into bookings (
        id, user_id, tour_slug, travel_date, guests, status,
        guest_name, guest_email, access_token, hold_expires_at,
        amount_cents, currency
      )
      values (
        ${id},
        ${data.userId},
        ${data.tourSlug},
        ${data.travelDate},
        ${data.guests},
        ${"HOLD"},
        ${""},
        ${data.email ?? ""},
        ${sha256Hex(token)},
        ${expires},
        ${quote.amountCents},
        ${quote.currency}
      )
    `;
    await tx`
      insert into audit_logs (id, actor_id, action, entity, entity_id, detail)
      values (${publicId()}, ${data.userId}, ${"booking.hold"}, ${"booking"}, ${id}, ${data.tourSlug})
    `;
    await acquireHoldLock({
      tourSlug: data.tourSlug,
      travelDate: data.travelDate,
      bookingId: id,
      guests: data.guests,
    });
    log.info("booking.hold_created", { bookingId: id, tour_slug: data.tourSlug, guests: data.guests });
    return { id, accessToken: token, status: "HOLD" as const, holdExpiresAt: expires };
  });
}

export async function loadBookingAuthorized(
  sql: Sql,
  id: string,
  token: string,
  userId: string | null,
): Promise<BookingRow> {
  await expireHolds(sql);
  const found = await sql.query<BookingRow & { access_token: string | null }>(
    `select ${BOOKING_SELECT.replace(/\s+/g, " ")}, access_token
     from bookings where id = $1 limit 1`,
    [id],
  );
  const booking = found[0];
  if (!booking) throw new Error("Booking not found");
  const tokenOk = accessTokenMatches(booking.access_token, token);
  const ownerOk = Boolean(userId && booking.user_id && booking.user_id === userId);
  if (!tokenOk && !ownerOk) throw new Error("Unauthorized");
  return {
    id: booking.id,
    user_id: booking.user_id,
    tour_slug: booking.tour_slug,
    travel_date: booking.travel_date,
    guests: booking.guests,
    status: booking.status,
    guest_name: booking.guest_name,
    guest_email: booking.guest_email,
    guest_phone: booking.guest_phone,
    notes: booking.notes,
    hold_expires_at: booking.hold_expires_at,
    voucher_code: booking.voucher_code,
    payment_provider: booking.payment_provider,
    amount_cents: Number(booking.amount_cents ?? 0),
    currency: booking.currency || "USD",
    created_at: booking.created_at,
  };
}

async function writeAudit(
  sql: Sql,
  actorId: string | null,
  action: string,
  entity: string,
  entityId: string,
  detail?: string,
) {
  await sql`
    insert into audit_logs (id, actor_id, action, entity, entity_id, detail)
    values (${publicId()}, ${actorId}, ${action}, ${entity}, ${entityId}, ${detail ?? null})
  `;
}

export async function settleBookingTx(
  sql: Sql,
  booking: BookingRow,
  provider: string,
  providerEventId: string,
  actorId: string | null,
  amountCents: number,
  currency: string,
) {
  return sql.transaction(async (tx) => {
    const locked = (
      await tx.query<BookingRow>(
        `select ${BOOKING_SELECT.replace(/\s+/g, " ")} from bookings where id = $1 for update`,
        [booking.id],
      )
    )[0];
    if (!locked) throw new Error("Booking not found");
    const status = parseStatus(locked.status);
    if (status === "CONFIRMED") {
      return { id: locked.id, status: "CONFIRMED" as const, voucher: locked.voucher_code, demo: provider === "demo" };
    }
    if (status === "EXPIRED" || status === "CANCELLED") {
      throw new Error(`Booking is ${status.toLowerCase()}`);
    }
    if (status === "HOLD") throw new Error("Complete guest details before payment.");
    assertTransition(status, "CONFIRMED");

    const converted = await tx<{ booked_seats: number }>`
      update availability
      set reserved_seats = reserved_seats - ${locked.guests},
          booked_seats = booked_seats + ${locked.guests}
      where tour_slug = ${locked.tour_slug}
        and travel_date = ${locked.travel_date}
        and reserved_seats >= ${locked.guests}
        and booked_seats + ${locked.guests} <= max_capacity
      returning booked_seats
    `;
    if (!converted[0]) throw new Error("CAPACITY_EXCEEDED");

    const voucher = `VCH-${locked.id.replace(/[^A-Z0-9]/gi, "").slice(-12).toUpperCase()}`;
    const updated = await tx<{ id: string; voucher_code: string | null }>`
      update bookings
      set status = ${"CONFIRMED"},
          payment_provider = ${provider},
          voucher_code = ${voucher},
          updated_at = now()
      where id = ${locked.id} and status = ${"PENDING_PAYMENT"}
      returning id, voucher_code
    `;
    if (!updated[0]) throw new Error("Booking could not be confirmed");

    const existingPay = await tx<{ id: string }>`
      select id from payments
      where provider = ${provider} and provider_ref = ${providerEventId}
      limit 1
    `;
    if (!existingPay[0]) {
      await tx`
        insert into payments (id, booking_id, provider, provider_ref, amount_label, status, amount_cents, currency)
        values (
          ${publicId()},
          ${locked.id},
          ${provider},
          ${providerEventId},
          ${amountCents > 0 ? String(amountCents) : "quote"},
          ${"succeeded"},
          ${amountCents},
          ${currency}
        )
      `;
    }
    await writeAudit(tx, actorId, "booking.confirmed", "booking", locked.id, provider);
    await releaseHoldLock({
      tourSlug: locked.tour_slug,
      travelDate: locked.travel_date,
      bookingId: locked.id,
      guests: locked.guests,
    });
    log.info("booking.confirmed", { bookingId: locked.id, provider, amountCents });
    return { id: locked.id, status: "CONFIRMED" as const, voucher, demo: provider === "demo" };
  });
}

export async function releaseAndMark(
  sql: Sql,
  booking: BookingRow,
  next: "FAILED" | "CANCELLED" | "EXPIRED",
  actorId: string | null,
) {
  return sql.transaction(async (tx) => {
    const locked = (
      await tx.query<{ id: string; status: string; guests: number; tour_slug: string; travel_date: string }>(
        `select id, status, guests, tour_slug, travel_date from bookings where id = $1 for update`,
        [booking.id],
      )
    )[0];
    if (!locked) throw new Error("Booking not found");
    const status = parseStatus(locked.status);
    if (status === "CONFIRMED") throw new Error("Already confirmed");
    assertTransition(status, next);
    if (status === "HOLD" || status === "PENDING_PAYMENT") {
      await tx`
        update availability
        set reserved_seats = reserved_seats - ${locked.guests}
        where tour_slug = ${locked.tour_slug}
          and travel_date = ${locked.travel_date}
          and reserved_seats >= ${locked.guests}
      `;
    }
    await tx`
      update bookings set status = ${next}, updated_at = now()
      where id = ${locked.id} and status = ${locked.status}
    `;
    await releaseHoldLock({
      tourSlug: locked.tour_slug,
      travelDate: locked.travel_date,
      bookingId: locked.id,
      guests: locked.guests,
    });
    await writeAudit(tx, actorId, `booking.${next.toLowerCase()}`, "booking", locked.id);
    log.info("booking.status", { bookingId: locked.id, status: next });
    return { id: locked.id, status: next };
  });
}

export { BOOKING_SELECT, writeAudit };
