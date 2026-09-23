import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listSavedTours } from "@/lib/server/ops";
import { getTour } from "@/data/catalog";

export const Route = createFileRoute("/account/saved")({ component: Saved });

function Saved() {
  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => {
    void listSavedTours()
      .then((rows) => setSaved(rows.map((r) => r.tour_slug)))
      .catch(() => setSaved([]));
  }, []);
  return (
    <ul className="space-y-2">
      {saved.map((slug) => (
        <li key={slug}>
          <Link to="/tours/$slug" params={{ slug }} className="text-heading hover:text-gold-ink">
            {getTour(slug)?.title ?? slug}
          </Link>
        </li>
      ))}
      {saved.length === 0 ? <p className="text-sm text-muted">None saved.</p> : null}
    </ul>
  );
}
