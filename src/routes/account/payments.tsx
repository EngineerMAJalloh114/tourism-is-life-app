import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listMyBookings } from "@/lib/server/ops";

export const Route = createFileRoute("/account/payments")({ component: Payments });

function Payments() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listMyBookings>>>([]);
  useEffect(() => {
    void listMyBookings().then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <ul className="space-y-3 text-sm">
      {rows.map((b) => (
        <li key={b.id} className="rounded-md border border-line bg-surface px-4 py-3">
          {b.id} · {b.status} · {b.payment_provider ?? "—"}
        </li>
      ))}
      {rows.length === 0 ? <p className="text-muted">No payment records.</p> : null}
    </ul>
  );
}
