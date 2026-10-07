import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listMyBookings } from "@/lib/server/ops";
import { getTour } from "@/data/catalog";

export const Route = createFileRoute("/account/bookings/")({
  component: BookingsList,
});

function BookingsList() {
  const [bookings, setBookings] = useState<Awaited<ReturnType<typeof listMyBookings>>>([]);
  useEffect(() => {
    void listMyBookings().then(setBookings).catch(() => setBookings([]));
  }, []);
  return (
    <ul className="space-y-3">
      {bookings.map((b) => (
        <li key={b.id} className="rounded-md border border-line bg-surface px-4 py-3">
          <Link to="/account/bookings/$ref" params={{ ref: b.id }} className="font-medium text-heading hover:text-gold-ink">
            {getTour(b.tour_slug)?.title ?? b.tour_slug}
          </Link>
          <p className="text-sm text-muted">
            {b.travel_date} · {b.guests} guests · {b.status} · {b.id}
          </p>
        </li>
      ))}
      {bookings.length === 0 ? <p className="text-sm text-muted">No bookings yet.</p> : null}
    </ul>
  );
}
