import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminListReviews, adminModerateReview } from "@/lib/server/ops";
import { getTour } from "@/data/catalog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/reviews")({ component: Page });

function Page() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminListReviews>>>([]);
  async function load() {
    setRows(await adminListReviews());
  }
  useEffect(() => {
    void load().catch(() => setRows([]));
  }, []);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.id} className="rounded-md border border-line bg-surface p-4 text-sm">
          <p className="font-medium">
            {getTour(r.tour_slug)?.title ?? r.tour_slug} · {r.rating}/5 · {r.status}
          </p>
          <p className="mt-2">{r.body}</p>
          {r.status === "pending" ? (
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                type="button"
                onClick={async () => {
                  await adminModerateReview({ data: { id: r.id, status: "approved" } });
                  await load();
                }}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={async () => {
                  await adminModerateReview({ data: { id: r.id, status: "rejected" } });
                  await load();
                }}
              >
                Reject
              </Button>
            </div>
          ) : null}
        </li>
      ))}
      {rows.length === 0 ? <p className="text-sm text-muted">No reviews.</p> : null}
    </ul>
  );
}
