import { createFileRoute } from "@tanstack/react-router";
import { requirePageCapability } from "@/lib/admin-access";
import { AdminRouteError } from "@/components/admin/admin-route-error";
import { useEffect, useState } from "react";
import { adminListAvailability } from "@/lib/server/admin/commerce.functions";
import { getTour } from "@/data/catalog";

export const Route = createFileRoute("/admin/availability")({
  beforeLoad: ({ context }) => requirePageCapability(context.access, "enquiries.read"),
  errorComponent: AdminRouteError,
  component: Page,
});

function Page() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminListAvailability>>>([]);
  useEffect(() => {
    void adminListAvailability().then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-[0.12em] text-muted">
            <th className="py-2">Date</th>
            <th>Tour</th>
            <th>Booked</th>
            <th>Reserved</th>
            <th>Max</th>
            <th>Left</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={`${s.tour_slug}-${s.travel_date}`} className="border-b border-line/70">
              <td className="py-2">{s.travel_date}</td>
              <td>{getTour(s.tour_slug)?.title ?? s.tour_slug}</td>
              <td>{s.booked_seats}</td>
              <td>{s.reserved_seats}</td>
              <td>{s.max_capacity}</td>
              <td>{s.max_capacity - s.booked_seats - s.reserved_seats}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? <p className="mt-4 text-sm text-muted">No availability rows yet.</p> : null}
    </div>
  );
}
