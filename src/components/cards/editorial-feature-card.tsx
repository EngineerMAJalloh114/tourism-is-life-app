import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { Tour } from "@/data/catalog";

/**
 * Homepage Signature Experiences only. Larger, more portrait photography than
 * `TourCard` and a category/duration line laid over the image rather than
 * corner badges, for a more editorial feel — never at the cost of the actual
 * tour facts, which still show in full below the image.
 *
 * The overlay kicker is ivory, not gold. Measured per pixel against the actual
 * signature-tour photography, gold at this position (bottom edge, an 11px
 * label) measured 2.36:1–5.38:1 across the four themes — failing 4.5:1 in
 * most of them — because the `/85` gradient stop here is much weaker than
 * `DestinationCard`'s `/45`-from-bottom coverage. Ivory in the same spot
 * measures 6.3:1–11.15:1. Same lesson as the hero kicker in `hero-frame.tsx`:
 * gold reads correctly on solid surfaces, not over photography.
 */
export function EditorialFeatureCard({ tour }: { tour: Tour }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <Link to="/tours/$slug" params={{ slug: tour.slug }} className="relative block aspect-[3/4] overflow-hidden">
        <img
          src={tour.image}
          alt={tour.imageAlt}
          loading="lazy"
          className="size-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/85 via-brand-dark/10 to-transparent" />
        <p className="absolute inset-x-0 bottom-0 p-4 text-[11px] uppercase tracking-[0.18em] text-ivory">
          {tour.category.replace("-", " ")} · {tour.duration}
        </p>
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-2xl text-heading">
          <Link to="/tours/$slug" params={{ slug: tour.slug }} className="hover:text-gold-ink">
            {tour.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-ink/80">{tour.summary}</p>
        <Link
          to="/tours/$slug"
          params={{ slug: tour.slug }}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-heading group-hover:text-gold-ink"
        >
          {tour.bookable ? "Check availability" : "Request a quote"} <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
