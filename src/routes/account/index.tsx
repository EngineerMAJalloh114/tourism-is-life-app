import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listMyBookings, listMyEnquiries, listSavedTours, getMyRole } from "@/lib/server/ops";
import { getTour } from "@/data/catalog";
import { isStaff } from "@/lib/roles";

export const Route = createFileRoute("/account/")({ component: AccountHome });

function AccountHome() {
  const [bookings, setBookings] = useState<Awaited<ReturnType<typeof listMyBookings>>>([]);
  const [enquiries, setEnquiries] = useState<Awaited<ReturnType<typeof listMyEnquiries>>>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [staff, setStaff] = useState(false);

  useEffect(() => {
    void listMyBookings().then(setBookings).catch(() => setBookings([]));
    void listMyEnquiries().then(setEnquiries).catch(() => setEnquiries([]));
    void listSavedTours()
      .then((rows) => setSaved(rows.map((r) => r.tour_slug)))
      .catch(() => setSaved([]));
    void getMyRole()
      .then((r) => setStaff(isStaff(r.role) || r.canBootstrap))
      .catch(() => setStaff(false));
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section>
        <h2 className="font-display text-2xl text-heading">Recent bookings</h2>
        <ul className="mt-4 space-y-3">
          {bookings.slice(0, 4).map((b) => (
            <li key={b.id} className="rounded-md border border-line bg-surface px-4 py-3 text-sm">
              <Link to="/account/bookings/$ref" params={{ ref: b.id }} className="font-medium text-heading hover:text-gold-ink">
                {getTour(b.tour_slug)?.title ?? b.tour_slug}
              </Link>
              <p className="text-muted">
                {b.travel_date} · {b.guests} guests · {b.status}
              </p>
            </li>
          ))}
          {bookings.length === 0 ? <p className="text-sm text-muted">No bookings yet.</p> : null}
        </ul>
      </section>
      <section>
        <h2 className="font-display text-2xl text-heading">Enquiries</h2>
        <ul className="mt-4 space-y-3">
          {enquiries.slice(0, 4).map((e) => (
            <li key={e.id} className="rounded-md border border-line bg-surface px-4 py-3 text-sm">
              {e.type} · {e.status} · {e.id}
            </li>
          ))}
          {enquiries.length === 0 ? <p className="text-sm text-muted">No enquiries yet.</p> : null}
        </ul>
        {staff ? (
          <p className="mt-6 text-sm">
            <Link to="/admin" className="text-heading hover:text-gold-ink">
              Open operations desk →
            </Link>
          </p>
        ) : null}
        {saved.length ? (
          <p className="mt-4 text-sm text-muted">{saved.length} saved tour{saved.length === 1 ? "" : "s"}.</p>
        ) : null}
      </section>
    </div>
  );
}
