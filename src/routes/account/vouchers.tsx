import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listMyBookings } from "@/lib/server/ops";
import { getTour } from "@/data/catalog";

export const Route = createFileRoute("/account/vouchers")({ component: Vouchers });

function Vouchers() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listMyBookings>>>([]);
  useEffect(() => {
    void listMyBookings().then(setRows).catch(() => setRows([]));
  }, []);
  const confirmed = rows.filter((b) => b.status === "CONFIRMED" && b.voucher_code);
  return (
    <ul className="space-y-3">
      {confirmed.map((b) => (
        <li key={b.id} className="rounded-md border border-gold/40 bg-surface px-4 py-3">
          <p className="font-display text-xl text-brand">{b.voucher_code}</p>
          <p className="text-sm text-muted">
            {getTour(b.tour_slug)?.title} · {b.travel_date}
          </p>
        </li>
      ))}
      {confirmed.length === 0 ? <p className="text-sm text-muted">No vouchers yet.</p> : null}
    </ul>
  );
}
