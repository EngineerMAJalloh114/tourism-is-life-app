import { Link } from "@tanstack/react-router";
import { ChevronRight, MapPin, MessageSquareText } from "lucide-react";
import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

export function DetailBreadcrumb({ kind, name }: { kind: "stays" | "dining"; name: string }) {
  const crumb = "inline-flex min-h-8 items-center rounded-sm text-muted transition-colors hover:text-heading focus-visible:outline-2 focus-visible:outline-gold";
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link to="/" className={crumb}>
            Home
          </Link>
        </li>
        <ChevronRight className="size-3.5 text-muted" aria-hidden />
        <li>
          <Link to="/hospitality" search={kind === "dining" ? { kind: "dining" } : {}} className={crumb}>
            {kind === "stays" ? "Places to stay" : "Places to dine"}
          </Link>
        </li>
        <ChevronRight className="size-3.5 text-muted" aria-hidden />
        <li aria-current="page" className="text-heading">
          {name}
        </li>
      </ol>
    </nav>
  );
}

export function DetailSection({ id, title, children, className }: { id: string; title: string; children: ReactNode; className?: string }) {
  return (
    <Reveal>
      <section aria-labelledby={id} className={cn("border-t border-line py-5", className)}>
        <h2 id={id} className="font-display text-xl text-heading">
          {title}
        </h2>
        <div className="mt-3">{children}</div>
      </section>
    </Reveal>
  );
}

export function IconGrid({ items }: { items: { id: string; label: string; icon: ReactNode }[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
      {items.map((it) => (
        <li key={it.id} className="flex items-center gap-3 text-sm text-ink">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-gold-ink">{it.icon}</span>
          {it.label}
        </li>
      ))}
    </ul>
  );
}

export function ReviewsNote({ published }: { published: boolean }) {
  // There is no review system yet, so there is nothing to render but an honest state.
  void published;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-line bg-surface p-4 text-sm text-muted">
      <MessageSquareText className="mt-0.5 size-5 shrink-0 text-gold-ink" aria-hidden />
      <p>No guest reviews are published for this place yet. Ratings and reviews will appear here only when they are real and collected.</p>
    </div>
  );
}

export function LocationCard({ place }: { place: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-surface p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-page text-gold-ink shadow-[var(--shadow-card)]">
        <MapPin className="size-5" aria-hidden />
      </span>
      <div>
        <p className="font-medium text-heading">{place}</p>
        <p className="mt-1 text-sm text-muted">The exact address and directions are confirmed with the place when you enquire.</p>
      </div>
    </div>
  );
}
