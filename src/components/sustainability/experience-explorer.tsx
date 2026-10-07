import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { getCircuit, getDestination, getTour } from "@/data/catalog";
import { EXPERIENCES, FILTERS, type ExperienceFilter } from "@/data/sustainability";
import { cn } from "@/lib/utils";

const LABEL = Object.fromEntries(FILTERS.map((f) => [f.id, f.label])) as Record<ExperienceFilter, string>;

/**
 * Responsible-tourism relevance shown on real catalogue tours. Every card is
 * built from an existing tour (`getTour`) and links to its real route; the
 * relevance line only restates a rule or practical note already on that tour.
 */
export function ExperienceExplorer({
  filter,
  onFilterChange,
}: {
  filter: ExperienceFilter;
  onFilterChange: (f: ExperienceFilter) => void;
}) {
  const items = EXPERIENCES.flatMap((e) => {
    const tour = getTour(e.slug);
    if (!tour) return [];
    const destination = getDestination(tour.destinationSlug);
    const circuit = getCircuit(tour.circuit);
    const location =
      destination && destination.name !== tour.title
        ? `${destination.name}, ${circuit?.name ?? ""}`.replace(/, $/, "")
        : (circuit?.name ?? "Sierra Leone");
    return [{ ...e, tour, location }];
  });
  const shown = items.filter((i) => filter === "all" || i.tags.includes(filter));

  return (
    <section id="experiences" aria-labelledby="experiences-title" className="container-page scroll-mt-48 py-14 lg:py-20">
      <Reveal className="grid gap-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="text-xs uppercase tracking-[0.22em] text-gold-ink">What it looks like</p>
          <h2 id="experiences-title" className="mt-3 font-display text-3xl text-heading sm:text-4xl lg:text-5xl">
            See responsible tourism in action
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            Real journeys from our catalogue, and what each one asks of the traveler.
          </p>
        </div>
      </Reveal>

      <div
        role="group"
        aria-label="Filter experiences"
        className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => onFilterChange(f.id)}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-full border px-5 text-sm transition-[background-color,color,border-color] duration-200 focus-visible:outline-2 focus-visible:outline-gold motion-reduce:transition-none",
              filter === f.id
                ? "border-brand bg-brand text-ivory"
                : "border-line bg-transparent text-ink hover:border-gold-ink/50",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        Showing {shown.length} of {items.length} experiences
      </p>

      <ul key={filter} className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((item, i) => (
          <li key={item.slug} className="sus-rise" style={{ animationDelay: `${Math.min(i, 5) * 70}ms` }}>
            <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] focus-within:shadow-[var(--shadow-lift)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
              <div className="relative overflow-hidden">
                <img
                  src={item.tour.image}
                  alt={item.tour.imageAlt}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
                />
                <span className="absolute left-3 top-3 rounded-full bg-page/92 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-heading shadow-sm backdrop-blur-sm">
                  {LABEL[item.tags[0]]}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-xl leading-snug text-heading">{item.tour.title}</h3>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                  <MapPin className="size-3.5 shrink-0" aria-hidden />
                  {item.location}
                </p>
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">{item.tour.summary}</p>
                <p className="mt-3 border-t border-line pt-3 text-sm leading-relaxed text-ink">
                  <span className="mb-0.5 block text-[11px] uppercase tracking-[0.16em] text-gold-ink">
                    Responsible travel
                  </span>
                  {item.relevance}
                </p>
                <Link
                  to="/tours/$slug"
                  params={{ slug: item.tour.slug }}
                  aria-label={`Explore experience: ${item.tour.title}`}
                  className="mt-auto inline-flex min-h-11 items-center gap-2 pt-3 text-sm font-medium text-gold-ink focus-visible:outline-2 focus-visible:outline-gold"
                >
                  <span className="underline-offset-4 group-hover:underline">Explore Experience</span>
                  <ArrowRight
                    className="size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
                    aria-hidden
                  />
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
