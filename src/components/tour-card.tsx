import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Mountain } from "lucide-react";
import type { Tour } from "@/data/catalog";
import { useCardTilt } from "@/lib/use-card-tilt";

/**
 * Compact by default (image + category + title only) with the rest —
 * location, summary, duration/difficulty, CTA — revealed on hover via
 * `.reveal-panel` (styles.css), plus a cursor-tracked tilt via
 * `useCardTilt`. Built to a supplied reference video of a card carousel:
 * its cards stayed minimal until engaged, then expanded with the details.
 * Neither behaviour reaches touch devices, which can't hover — see both
 * files' own comments for why that's a deliberate accessibility floor, not
 * an oversight.
 */
export function TourCard({ tour }: { tour: Tour }) {
  const tilt = useCardTilt();

  return (
    <article
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      style={tilt.style}
      className="glass-card group relative isolate flex h-full flex-col overflow-hidden rounded-xl shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-300 ease-out will-change-transform hover:shadow-[var(--shadow-lift)]"
    >
      <Link
        to="/tours/$slug"
        params={{ slug: tour.slug }}
        className="relative z-10 block aspect-[16/9] overflow-hidden sm:aspect-[3/2]"
      >
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
      <div className="relative z-10 flex flex-1 flex-col p-3.5 sm:p-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{tour.category.replace("-", " ")}</p>
        <h3 className="mt-1 font-display text-lg text-heading sm:text-xl">
          <Link to="/tours/$slug" params={{ slug: tour.slug }} className="hover:text-gold-ink">
            {tour.title}
          </Link>
        </h3>
        <div className="reveal-panel mt-0.5">
          <div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <MapPin className="size-3.5 shrink-0" aria-hidden /> {tour.destinationSlug.replace(/-/g, " ")}
            </p>
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink/80">{tour.summary}</p>
            <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2.5 text-sm">
              <span className="inline-flex items-center gap-1 text-muted">
                <Clock className="size-3.5" aria-hidden /> {tour.duration}
              </span>
              <span className="inline-flex items-center gap-1 text-muted">
                <Mountain className="size-3.5" aria-hidden /> {tour.difficulty}
              </span>
            </div>
            <p className="mt-1.5 font-medium text-heading">
              {tour.bookable ? "Check availability" : "Request a quote"}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
