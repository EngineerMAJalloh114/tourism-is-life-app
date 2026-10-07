import { createFileRoute, Link } from "@tanstack/react-router";
import { tours } from "@/data/catalog";

export const Route = createFileRoute("/admin/tours")({ component: Page });

function Page() {
  return (
    <ul className="space-y-2 text-sm">
      {tours.map((t) => (
        <li key={t.slug} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-surface px-4 py-3">
          <span>
            {t.title} · {t.bookable ? "bookable" : "quote"}
          </span>
          <Link to="/tours/$slug" params={{ slug: t.slug }} className="text-heading hover:text-gold-ink">
            View
          </Link>
        </li>
      ))}
    </ul>
  );
}
