/**
 * Dashboard counts. `dashboard.view` holds no personal data: every figure here
 * is a count or a date, never a name, email or phone number.
 */
import { tours } from "@/data/catalog";
import { adminOperation } from "@/lib/server/access";
import { expireHolds } from "@/lib/server/booking-engine";

export const dashboardSnapshot = adminOperation("dashboard.view", async (sql) => {
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
  const upcoming = await sql<{ id: string; tour_slug: string; travel_date: string; guests: number; status: string }>`
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
