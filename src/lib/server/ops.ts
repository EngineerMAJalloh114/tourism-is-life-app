import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { tours } from "@/data/catalog";
import { optionalAuthMiddleware } from "@/lib/server/optional-auth";
import { parseStatus } from "@/lib/server/booking-state";
import { getPaymentMode } from "@/lib/server/payments";
import { isValidEmail, notifyBookingConfirmed, notifyEnquiryReceived, notifyEnquiryTeam } from "@/services/notify";
import { activePaymentProvider } from "@/services/payments";
import { demoPaymentsAllowed } from "@/lib/server/config";
import { publicId } from "@/lib/server/crypto";
import { liveChargeAllowed, quoteForSlug } from "@/lib/server/pricing";
import { guardPublicMutation } from "@/lib/server/public-guard";
import { log } from "@/lib/server/logger";
import {
  BOOKING_SELECT,
  createHoldTx,
  expireHolds,
  loadBookingAuthorized,
  releaseAndMark,
  settleBookingTx,
  type BookingRow,
} from "@/lib/server/booking-engine";

const enquirySchema = z.object({
  type: z.enum(["B2C", "B2B", "CRUISE", "MICE"]),
  payload: z.record(z.string().max(60), z.string().max(4000)).refine((p) => Object.keys(p).length <= 20, {
    message: "Too many fields.",
  }),
});

export type { BookingRow };

export const submitEnquiry = createServerFn({ method: "POST" })
  .middleware([optionalAuthMiddleware])
  .validator((d) => enquirySchema.parse(d))
  .handler(async ({ data, context }) => {
    await guardPublicMutation("enquiry", 8, 60 * 60 * 1000);
    const payload = Object.fromEntries(
      Object.entries(data.payload).map(([k, v]) => [k, v.trim()]),
    );
    const email = (payload.email || context.email || "").trim().toLowerCase();
    const name = (payload.contact || payload.name || "").trim();
    if (!email || !isValidEmail(email)) {
      throw new Error("A valid email is required so the desk can reply.");
    }
    const sql = await getSql();
    const id = `ENQ-${publicId(6).toUpperCase()}`;
    await sql`
      insert into enquiries (id, user_id, type, payload, status, guest_email, guest_name)
      values (
        ${id},
        ${context.userId},
        ${data.type},
        ${JSON.stringify(payload)},
        ${"open"},
        ${email},
        ${name || null}
      )
    `;
    log.info("enquiry.submitted", { id, type: data.type });
    // The enquiry row above is the source of truth and is already committed —
    // a Resend failure here must never lose it or be surfaced as a save
    // failure. Awaited (not fire-and-forget): this Vercel/Nitro Node runtime
    // does not expose a background-task API, and a serverless function may
    // freeze immediately after the response is sent, so an un-awaited send
    // can silently never complete. sendEmail() has its own timeout and never
    // throws, so this can't hang the request or turn into an unhandled
    // rejection.
    await Promise.allSettled([
      notifyEnquiryTeam({ ref: id, type: data.type, email, phone: payload.phone, payload }),
      notifyEnquiryReceived({ email, name, ref: id, type: data.type }),
    ]);
    return { id, status: "open" as const };
  });

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .validator((d) => z.object({ email: z.string().email() }).parse(d))
  .handler(async ({ data }) => {
    await guardPublicMutation("newsletter", 5, 60 * 60 * 1000);
    const sql = await getSql();
    await sql`
      insert into newsletter_subscribers (email, source)
      values (${data.email.toLowerCase()}, ${"site"})
      on conflict (email) do nothing
    `;
    return { ok: true as const };
  });

export const listMyEnquiries = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{
      id: string;
      type: string;
      payload: string;
      status: string;
      created_at: string;
    }>`
      select id, type, payload, status, created_at
      from enquiries
      where user_id = ${context.userId}
      order by created_at desc
    `;
  });

export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await expireHolds(sql);
    return sql.query<BookingRow>(
      `select ${BOOKING_SELECT.replace(/\s+/g, " ")}
       from bookings where user_id = $1 order by created_at desc`,
      [context.userId],
    );
  });

const slotSchema = z.object({
  tourSlug: z.string(),
  travelDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const getAvailability = createServerFn({ method: "GET" })
  .validator((d) => slotSchema.parse(d))
  .handler(async ({ data }) => {
    const tour = tours.find((t) => t.slug === data.tourSlug);
    if (!tour) throw new Error("Unknown tour");
    const sql = await getSql();
    await expireHolds(sql);
    const rows = await sql<{
      booked_seats: number;
      reserved_seats: number;
      max_capacity: number;
    }>`
      select booked_seats, reserved_seats, max_capacity
      from availability
      where tour_slug = ${data.tourSlug} and travel_date = ${data.travelDate}
    `;
    const row = rows[0];
    const max = row?.max_capacity ?? tour.groupMax;
    const booked = row?.booked_seats ?? 0;
    const reserved = row?.reserved_seats ?? 0;
    return {
      maxCapacity: max,
      bookedSeats: booked,
      reservedSeats: reserved,
      remaining: max - booked - reserved,
      bookable: tour.bookable,
    };
  });

const holdSchema = z.object({
  tourSlug: z.string().min(1).max(120),
  travelDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).max(40),
});

export const createHold = createServerFn({ method: "POST" })
  .middleware([optionalAuthMiddleware])
  .validator((d) => holdSchema.parse(d))
  .handler(async ({ data, context }) => {
    await guardPublicMutation("hold", 20, 60 * 60 * 1000);
    const date = new Date(`${data.travelDate}T00:00:00Z`);
    if (Number.isNaN(date.getTime()) || date.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
      throw new Error("Travel date must be in the future.");
    }
    const sql = await getSql();
    return createHoldTx(sql, {
      tourSlug: data.tourSlug,
      travelDate: data.travelDate,
      guests: data.guests,
      userId: context.userId,
      email: context.email,
    });
  });

export const getCheckoutBooking = createServerFn({ method: "GET" })
  .middleware([optionalAuthMiddleware])
  .validator((d) => z.object({ id: z.string(), token: z.string().min(8) }).parse(d))
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const booking = await loadBookingAuthorized(sql, data.id, data.token, context.userId);
    const mode = getPaymentMode();
    const quote = quoteForSlug(booking.tour_slug, booking.guests);
    return {
      ...booking,
      paymentMode: mode,
      quoteOnly: !liveChargeAllowed(quote),
      demoAllowed: demoPaymentsAllowed(),
    };
  });

const guestSchema = z.object({
  id: z.string(),
  token: z.string().min(8),
  guestName: z.string().min(2).max(120),
  guestEmail: z.string().email(),
  guestPhone: z.string().max(40).optional(),
  notes: z.string().max(2000).optional(),
});

export const saveGuestDetails = createServerFn({ method: "POST" })
  .middleware([optionalAuthMiddleware])
  .validator((d) => guestSchema.parse(d))
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const booking = await loadBookingAuthorized(sql, data.id, data.token, context.userId);
    const status = parseStatus(booking.status);
    if (status !== "HOLD" && status !== "PENDING_PAYMENT") {
      throw new Error("This booking can no longer be edited.");
    }
    await sql`
      update bookings
      set guest_name = ${data.guestName},
          guest_email = ${data.guestEmail},
          guest_phone = ${data.guestPhone ?? null},
          notes = ${data.notes ?? null},
          user_id = coalesce(user_id, ${context.userId}),
          status = ${"PENDING_PAYMENT"},
          updated_at = now()
      where id = ${booking.id} and status in ('HOLD', 'PENDING_PAYMENT')
    `;
    return { id: booking.id, status: "PENDING_PAYMENT" as const };
  });

export const confirmDemoPayment = createServerFn({ method: "POST" })
  .middleware([optionalAuthMiddleware])
  .validator((d) => z.object({ id: z.string(), token: z.string().min(8) }).parse(d))
  .handler(async ({ data, context }) => {
    if (!demoPaymentsAllowed()) {
      throw new Error("Demo settlement is disabled. Live payment or an operations invoice is required.");
    }
    const sql = await getSql();
    const booking = await loadBookingAuthorized(sql, data.id, data.token, context.userId);
    const result = await settleBookingTx(
      sql,
      booking,
      "demo",
      `demo_${booking.id}`,
      context.userId,
      Number(booking.amount_cents ?? 0),
      booking.currency || "USD",
    );
    const tourTitle = tours.find((t) => t.slug === booking.tour_slug)?.title ?? booking.tour_slug;
    if (result.status === "CONFIRMED") {
      void notifyBookingConfirmed({
        email: booking.guest_email,
        name: booking.guest_name,
        bookingId: booking.id,
        tourTitle,
        travelDate: booking.travel_date,
        voucher: result.voucher ?? "",
        phone: booking.guest_phone,
      }).catch(() => undefined);
    }
    return result;
  });

export const failPayment = createServerFn({ method: "POST" })
  .middleware([optionalAuthMiddleware])
  .validator((d) => z.object({ id: z.string(), token: z.string().min(8) }).parse(d))
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const booking = await loadBookingAuthorized(sql, data.id, data.token, context.userId);
    return releaseAndMark(sql, booking, "FAILED", context.userId);
  });

export const cancelBooking = createServerFn({ method: "POST" })
  .middleware([optionalAuthMiddleware])
  .validator((d) => z.object({ id: z.string(), token: z.string().min(8) }).parse(d))
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const booking = await loadBookingAuthorized(sql, data.id, data.token, context.userId);
    const status = parseStatus(booking.status);
    if (status === "CONFIRMED") {
      throw new Error("Confirmed bookings must be changed by the operations desk.");
    }
    return releaseAndMark(sql, booking, "CANCELLED", context.userId);
  });

export const toggleSavedTour = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const existing = await sql<{ tour_slug: string }>`
      select tour_slug from saved_tours
      where user_id = ${context.userId} and tour_slug = ${data.slug}
    `;
    if (existing.length) {
      await sql`
        delete from saved_tours where user_id = ${context.userId} and tour_slug = ${data.slug}
      `;
      return { saved: false };
    }
    await sql`
      insert into saved_tours (user_id, tour_slug) values (${context.userId}, ${data.slug})
    `;
    return { saved: true };
  });

export const listSavedTours = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{ tour_slug: string }>`
      select tour_slug from saved_tours where user_id = ${context.userId}
    `;
  });

export const isTourSaved = createServerFn({ method: "GET" })
  .middleware([optionalAuthMiddleware])
  .validator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    if (!context.userId) return { saved: false };
    const sql = await getSql();
    const rows = await sql<{ tour_slug: string }>`
      select tour_slug from saved_tours
      where user_id = ${context.userId} and tour_slug = ${data.slug}
    `;
    return { saved: rows.length > 0 };
  });

export const submitReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d) =>
    z
      .object({
        bookingId: z.string(),
        rating: z.number().int().min(1).max(5),
        body: z.string().min(12).max(2000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const rows = await sql<{ id: string; tour_slug: string; status: string }>`
      select id, tour_slug, status from bookings
      where id = ${data.bookingId} and user_id = ${context.userId}
      limit 1
    `;
    const booking = rows[0];
    if (!booking || booking.status !== "CONFIRMED") {
      throw new Error("Reviews are only accepted after a confirmed booking.");
    }
    const existing = await sql<{ id: string }>`
      select id from reviews where booking_id = ${booking.id} limit 1
    `;
    if (existing.length) throw new Error("A review is already on file for this booking.");
    const id = publicId();
    await sql`
      insert into reviews (id, booking_id, user_id, tour_slug, rating, body, status)
      values (${id}, ${booking.id}, ${context.userId}, ${booking.tour_slug}, ${data.rating}, ${data.body}, ${"pending"})
    `;
    return { id, status: "pending" as const };
  });

export const listApprovedReviews = createServerFn({ method: "GET" })
  .validator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const sql = await getSql();
    return sql<{ id: string; rating: number; body: string; created_at: string }>`
      select id, rating, body, created_at
      from reviews
      where tour_slug = ${data.slug} and status = ${"approved"}
      order by created_at desc
    `;
  });

export const listMyReviews = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql<{
      id: string;
      tour_slug: string;
      rating: number;
      body: string;
      status: string;
      created_at: string;
    }>`
      select id, tour_slug, rating, body, status, created_at
      from reviews where user_id = ${context.userId}
      order by created_at desc
    `;
  });

export const getPaymentConfig = createServerFn({ method: "GET" }).handler(async () => {
  return getPaymentMode();
});

export const initiatePayment = createServerFn({ method: "POST" })
  .middleware([optionalAuthMiddleware])
  .validator((d) => z.object({ id: z.string(), token: z.string().min(8) }).parse(d))
  .handler(async ({ data, context }) => {
    await guardPublicMutation("pay", 30, 60 * 60 * 1000);
    const sql = await getSql();
    const booking = await loadBookingAuthorized(sql, data.id, data.token, context.userId);
    const status = parseStatus(booking.status);
    if (status !== "PENDING_PAYMENT") {
      throw new Error("Complete guest details before payment.");
    }
    const quote = quoteForSlug(booking.tour_slug, booking.guests);
    const mode = getPaymentMode();
    if (mode.provider === "demo") {
      if (!demoPaymentsAllowed()) {
        return {
          provider: "none" as const,
          bookingId: booking.id,
          demo: false,
          quoteOnly: true,
        };
      }
      return activePaymentProvider().initiate({
        id: booking.id,
        amountCents: quote.amountCents,
        currency: quote.currency,
      });
    }
    if (!liveChargeAllowed(quote)) {
      throw new Error("This programme has no published fare. The operations desk will invoice you.");
    }
    const tourTitle = tours.find((t) => t.slug === booking.tour_slug)?.title;
    return activePaymentProvider().initiate({
      id: booking.id,
      amountCents: quote.amountCents,
      currency: quote.currency,
      tourTitle,
      guestEmail: booking.guest_email,
      guestName: booking.guest_name,
    });
  });

export type { BookingStatus } from "@/lib/server/booking-state";
