import { createFileRoute } from "@tanstack/react-router";
import { requirePageCapability } from "@/lib/admin-access";
import { AdminRouteError } from "@/components/admin/admin-route-error";
import { useEffect, useState } from "react";
import { adminSnapshot } from "@/lib/server/admin/dashboard.functions";
import { getTour } from "@/data/catalog";

export const Route = createFileRoute("/admin/")({
  beforeLoad: ({ context }) => requirePageCapability(context.access, "dashboard.view"),
  errorComponent: AdminRouteError,
  component: Dashboard,
});

function Dashboard() {
  const [data, setData] = useState<Awaited<ReturnType<typeof adminSnapshot>> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    void adminSnapshot()
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load"));
  }, []);
  if (err) return <p className="text-danger">{err}</p>;
  if (!data) return <p className="text-muted">Loading snapshot…</p>;
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Published tours", String(data.publishedTours)],
          ["Confirmed", String(data.byStatus.CONFIRMED ?? 0)],
          ["Holds / pending", String((data.byStatus.HOLD ?? 0) + (data.byStatus.PENDING_PAYMENT ?? 0))],
          ["Pending reviews", String(data.pendingReviews)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-line bg-surface p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">{k}</p>
            <p className="mt-2 font-display text-3xl text-heading">{v}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-10 font-display text-2xl text-heading">Upcoming departures</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {data.upcoming.map((u) => (
          <li key={u.id}>
            {u.travel_date} · {getTour(u.tour_slug)?.title ?? u.tour_slug} · {u.guests} guests
          </li>
        ))}
        {data.upcoming.length === 0 ? <li className="text-muted">None on file.</li> : null}
      </ul>
      <h2 className="mt-10 font-display text-2xl text-heading">Low capacity</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {data.lowCap.map((s) => (
          <li key={`${s.tour_slug}-${s.travel_date}`}>
            {s.travel_date} · {getTour(s.tour_slug)?.title ?? s.tour_slug} ·{" "}
            {s.max_capacity - s.booked_seats - s.reserved_seats} left
          </li>
        ))}
        {data.lowCap.length === 0 ? <li className="text-muted">No tight dates.</li> : null}
      </ul>
      <h2 className="mt-10 font-display text-2xl text-heading">Open enquiries</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {data.openEnquiries.map((e) => (
          <li key={e.type}>
            {e.type}: {e.n}
          </li>
        ))}
        {data.openEnquiries.length === 0 ? <li className="text-muted">None open.</li> : null}
      </ul>
    </div>
  );
}
