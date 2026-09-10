import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminListBookings } from "@/lib/server/ops";
import { getTour } from "@/data/catalog";

export const Route = createFileRoute("/admin/bookings")({ component: Page });

function Page() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminListBookings>>>([]);
  useEffect(() => {
    void adminListBookings().then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-[0.12em] text-muted">
            <th className="py-2">Ref</th>
            <th>Tour</th>
            <th>Date</th>
            <th>Guests</th>
            <th>Status</th>
            <th>Guest</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id} className="border-b border-line/70">
              <td className="py-2 font-mono text-xs">{b.id}</td>
              <td>{getTour(b.tour_slug)?.title ?? b.tour_slug}</td>
              <td>{b.travel_date}</td>
              <td>{b.guests}</td>
              <td>{b.status}</td>
              <td>{b.guest_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? <p className="mt-4 text-sm text-muted">No bookings.</p> : null}
    </div>
  );
}
