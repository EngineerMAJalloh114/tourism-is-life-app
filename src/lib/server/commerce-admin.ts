/**
 * Read-only views over the dormant booking tables. They leave the admin in task
 * A4; until then they are guarded like the enquiry desk because bookings hold
 * guest names, emails and phone numbers.
 */
import { inTransaction } from "@/lib/sql";
import { adminOperation } from "@/lib/server/access";
import { audit } from "@/lib/server/audit";
import { BOOKING_SELECT, expireHolds, type BookingRow } from "@/lib/server/booking-engine";
import { NotFoundError } from "@/lib/server/errors";

export const listBookings = adminOperation("enquiries.read", async (sql) => {
  await expireHolds(sql);
  return sql.query<BookingRow>(
    `select ${BOOKING_SELECT.replace(/\s+/g, " ")} from bookings order by created_at desc limit 100`,
  );
});

export const listAvailability = adminOperation("enquiries.read", async (sql) => {
  await expireHolds(sql);
  return sql<{ tour_slug: string; travel_date: string; max_capacity: number; booked_seats: number; reserved_seats: number }>`
    select tour_slug, travel_date, max_capacity, booked_seats, reserved_seats
    from availability
    order by travel_date desc
    limit 80
  `;
});

export const listReviews = adminOperation("enquiries.manage", async (sql) => {
  return sql<{ id: string; tour_slug: string; rating: number; body: string; status: string; created_at: string }>`
    select id, tour_slug, rating, body, status, created_at
    from reviews
    order by created_at desc
    limit 80
  `;
});

export const moderateReview = adminOperation(
  "enquiries.manage",
  async (sql, actor, input: { id: string; status: "approved" | "rejected" }) => {
    return inTransaction(sql, async (tx) => {
      const current = await tx<{ status: string }>`
        select status from reviews where id = ${input.id} for update
      `;
      if (!current[0]) throw new NotFoundError("That review does not exist.");
      await tx`update reviews set status = ${input.status} where id = ${input.id}`;
      await audit(tx, {
        actor,
        action: "review.moderate",
        entity: "reviews",
        entityId: input.id,
        before: { status: current[0].status },
        after: { status: input.status },
      });
      return { ok: true as const };
    });
  },
);
