import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listMyReviews } from "@/lib/server/ops";
import { getTour } from "@/data/catalog";

export const Route = createFileRoute("/account/reviews")({ component: Reviews });

function Reviews() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listMyReviews>>>([]);
  useEffect(() => {
    void listMyReviews().then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.id} className="rounded-md border border-line bg-surface px-4 py-3 text-sm">
          <p className="font-medium">{getTour(r.tour_slug)?.title ?? r.tour_slug}</p>
          <p className="text-muted">
            {r.rating}/5 · {r.status}
          </p>
          <p className="mt-1">{r.body}</p>
        </li>
      ))}
      {rows.length === 0 ? <p className="text-sm text-muted">No reviews yet.</p> : null}
    </ul>
  );
}
