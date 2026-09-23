import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Mountain } from "lucide-react";
import type { Tour } from "@/data/catalog";

export function TourCard({ tour }: { tour: Tour }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <Link to="/tours/$slug" params={{ slug: tour.slug }} className="relative block aspect-[4/3] overflow-hidden">
        <img
          src={tour.image}
          alt={tour.imageAlt}
          className="size-full object-cover transition duration-700 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-sm bg-brand/90 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-ivory">
          {tour.duration}
        </span>
        {!tour.bookable ? (
          <span className="absolute right-3 top-3 rounded-sm bg-gold px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-brand-dark">
            Quote
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{tour.category.replace("-", " ")}</p>
        <h3 className="mt-1 font-display text-2xl text-heading">
          <Link to="/tours/$slug" params={{ slug: tour.slug }} className="hover:text-gold-ink">
            {tour.title}
          </Link>
        </h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="size-3.5" aria-hidden /> {tour.destinationSlug.replace(/-/g, " ")}
        </p>
        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-ink/80">{tour.summary}</p>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-sm">
          <span className="inline-flex items-center gap-1 text-muted">
            <Clock className="size-3.5" aria-hidden /> {tour.duration}
          </span>
          <span className="inline-flex items-center gap-1 text-muted">
            <Mountain className="size-3.5" aria-hidden /> {tour.difficulty}
          </span>
        </div>
        <p className="mt-3 font-medium text-heading">
          {tour.bookable ? "Check availability" : "Request a quote"}
        </p>
      </div>
    </article>
  );
}
