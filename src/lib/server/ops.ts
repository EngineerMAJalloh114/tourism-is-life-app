import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { tours } from "@/data/catalog";
import { optionalAuthMiddleware } from "@/lib/server/optional-auth";
import { parseStatus } from "@/lib/server/booking-state";
import { getPaymentMode } from "@/lib/server/payments";
import { atLeast, isStaff, parseRole, type Role } from "@/lib/roles";
import { notifyBookingConfirmed, notifyEnquiryReceived } from "@/services/notify";
import { activePaymentProvider } from "@/services/payments";
import { bootstrapEmailAllowed, demoPaymentsAllowed, isDeployedRuntime } from "@/lib/server/config";
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
  writeAudit,
  type BookingRow,
} from "@/lib/server/booking-engine";

const enquirySchema = z.object({
  type: z.enum(["B2C", "B2B", "CRUISE", "MICE"]),
  payload: z.record(z.string(), z.string()),
});

export type { BookingRow };

export const submitEnquiry = createServerFn({ method: "POST" })
  .middleware([optionalAuthMiddleware])
  .validator((d) => enquirySchema.parse(d))
  .handler(async ({ data, context }) => {
    await guardPublicMutation("enquiry", 8, 60 * 60 * 1000);
    const payload = data.payload;
    const email = (payload.email || context.email || "").trim().toLowerCase();
    const name = (payload.contact || payload.name || "").trim();
    if (!email || !email.includes("@")) {
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
    void notifyEnquiryReceived({ email, name, ref: id, type: data.type }).catch(() => undefined);
    log.info("enquiry.submitted", { id, type: data.type });
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

export const getMyRole = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ role: string }>`
      select role from staff_profiles where user_id = ${context.userId} limit 1
    `;
    const staffCount = await sql<{ n: number }>`select count(*)::int as n from staff_profiles`;
    const empty = (staffCount[0]?.n ?? 0) === 0;
    return {
      role: parseRole(rows[0]?.role) as Role,
      canBootstrap: empty && bootstrapEmailAllowed(context.email),
      bootstrapLocked: empty && isDeployedRuntime() && !bootstrapEmailAllowed(context.email),
    };
  });

export const bootstrapStaff = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!bootstrapEmailAllowed(context.email)) {
      throw new Error(
        isDeployedRuntime()
          ? "Staff bootstrap is locked. Set BOOTSTRAP_ADMIN_EMAIL to the first operator’s address."
          : "A verified email is required to claim operations.",
      );
    }
    const sql = await getSql();
    return sql.transaction(async (tx) => {
      const claimed = await tx<{ user_id: string }>`
        insert into bootstrap_lock (id, user_id) values (${1}, ${context.userId})
        on conflict (id) do nothing
        returning user_id
      `;
      const lock = claimed[0] ?? (await tx<{ user_id: string }>`select user_id from bootstrap_lock where id = 1`)[0];
      if (!lock || lock.user_id !== context.userId) {
        throw new Error("Staff already provisioned.");
      }
      await tx`
        insert into staff_profiles (user_id, role) values (${context.userId}, ${"SUPER_ADMIN"})
        on conflict (user_id) do nothing
      `;
      await writeAudit(tx, context.userId, "staff.bootstrap", "staff_profiles", context.userId);
      log.info("staff.bootstrap", { userId: context.userId });
      return { role: "SUPER_ADMIN" as const };
    });
  });

async function requireStaff(userId: string, min: Role = "STAFF"): Promise<Role> {
  const sql = await getSql();
  const rows = await sql<{ role: string }>`
    select role from staff_profiles where user_id = ${userId} limit 1
  `;
  const role = parseRole(rows[0]?.role);
  if (!isStaff(role) || !atLeast(role, min)) throw new Error("Forbidden");
  return role;
}

export const adminSnapshot = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    await expireHolds(sql);
    const bookings = await sql<{ status: string; n: number }>`
      select status, count(*)::int as n from bookings group by status
    `;
    const enquiries = await sql<{ type: string; n: number }>`
      select type, count(*)::int as n from enquiries where status = 'open' group by type
    `;
    const pendingReviews = await sql<{ n: number }>`
      select count(*)::int as n from reviews where status = 'pending'
    `;
    const upcoming = await sql<{
      id: string;
      tour_slug: string;
      travel_date: string;
      guests: number;
      status: string;
    }>`
      select id, tour_slug, travel_date, guests, status
      from bookings
      where status = 'CONFIRMED' and travel_date >= current_date
      order by travel_date asc
      limit 8
    `;
    const lowCap = await sql<{
      tour_slug: string;
      travel_date: string;
      max_capacity: number;
      booked_seats: number;
      reserved_seats: number;
    }>`
      select tour_slug, travel_date, max_capacity, booked_seats, reserved_seats
      from availability
      where (max_capacity - booked_seats - reserved_seats) <= 2
      order by travel_date asc
      limit 8
    `;
    const byStatus: Record<string, number> = {};
    for (const row of bookings) byStatus[row.status] = row.n;
    return {
      byStatus,
      openEnquiries: enquiries,
      pendingReviews: pendingReviews[0]?.n ?? 0,
      upcoming,
      lowCap,
      publishedTours: tours.length,
    };
  });

export const adminListBookings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    await expireHolds(sql);
    return sql.query<BookingRow>(
      `select ${BOOKING_SELECT.replace(/\s+/g, " ")} from bookings order by created_at desc limit 100`,
    );
  });

export const adminListEnquiries = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    return sql<{
      id: string;
      type: string;
      payload: string;
      status: string;
      guest_email: string | null;
      guest_name: string | null;
      created_at: string;
    }>`
      select id, type, payload, status, guest_email, guest_name, created_at
      from enquiries
      order by created_at desc
      limit 100
    `;
  });

export const adminSetEnquiryStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d) => z.object({ id: z.string(), status: z.enum(["open", "closed"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    await sql`update enquiries set status = ${data.status} where id = ${data.id}`;
    await writeAudit(sql, context.userId, "enquiry.status", "enquiry", data.id, data.status);
    return { ok: true as const };
  });

export const adminListAvailability = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    await expireHolds(sql);
    return sql<{
      tour_slug: string;
      travel_date: string;
      max_capacity: number;
      booked_seats: number;
      reserved_seats: number;
    }>`
      select tour_slug, travel_date, max_capacity, booked_seats, reserved_seats
      from availability
      order by travel_date desc
      limit 80
    `;
  });

export const adminListReviews = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireStaff(context.userId);
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
      from reviews
      order by created_at desc
      limit 80
    `;
  });

export const adminModerateReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d) =>
    z.object({ id: z.string(), status: z.enum(["approved", "rejected"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    await sql`update reviews set status = ${data.status} where id = ${data.id}`;
    await writeAudit(sql, context.userId, "review.moderate", "review", data.id, data.status);
    return { ok: true as const };
  });

export const adminListAudit = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireStaff(context.userId, "ADMIN");
    const sql = await getSql();
    return sql<{
      id: string;
      actor_id: string | null;
      action: string;
      entity: string;
      entity_id: string | null;
      detail: string | null;
      created_at: string;
    }>`
      select id, actor_id, action, entity, entity_id, detail, created_at
      from audit_logs
      order by created_at desc
      limit 80
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

export const adminListStaff = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireStaff(context.userId, "ADMIN");
    const sql = await getSql();
    return sql<{
      user_id: string;
      role: string;
      created_at: string;
      email: string | null;
      name: string | null;
    }>`
      select s.user_id, s.role, s.created_at, u.email, u.name
      from staff_profiles s
      left join "user" u on u.id = s.user_id
      order by s.created_at asc
    `;
  });

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d) =>
    z
      .object({
        userId: z.string().min(1),
        role: z.enum(["STAFF", "BOOKING_MANAGER", "CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN", "CUSTOMER"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const actorRole = await requireStaff(context.userId, "ADMIN");
    if (data.userId === context.userId) throw new Error("You cannot change your own role here.");
    if (data.role === "SUPER_ADMIN" && actorRole !== "SUPER_ADMIN") {
      throw new Error("Only SUPER_ADMIN can grant SUPER_ADMIN.");
    }
    const sql = await getSql();
    const target = await sql<{ role: string }>`
      select role from staff_profiles where user_id = ${data.userId} limit 1
    `;
    if (target[0]?.role === "SUPER_ADMIN" && data.role !== "SUPER_ADMIN") {
      const supers = await sql<{ n: number }>`
        select count(*)::int as n from staff_profiles where role = 'SUPER_ADMIN'
      `;
      if ((supers[0]?.n ?? 0) <= 1) {
        throw new Error("The last SUPER_ADMIN cannot be demoted.");
      }
    }
    if (data.role === "CUSTOMER") {
      await sql`delete from staff_profiles where user_id = ${data.userId}`;
    } else {
      await sql`
        insert into staff_profiles (user_id, role)
        values (${data.userId}, ${data.role})
        on conflict (user_id) do update set role = ${data.role}, updated_at = now()
      `;
    }
    await writeAudit(sql, context.userId, "staff.role", "staff_profiles", data.userId, data.role);
    return { ok: true as const };
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
