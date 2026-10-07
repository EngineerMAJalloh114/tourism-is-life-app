import { Link } from "@tanstack/react-router";
import { ArrowRight, X } from "lucide-react";
import { useMemo } from "react";
import { FilterPanel, type FacetGroup, type FacetOption } from "@/components/hospitality/filters";
import { HospitalityHero } from "@/components/hospitality/hospitality-hero";
import { DiningCard, StayCard } from "@/components/hospitality/listing-card";
import { SampleNotice } from "@/components/hospitality/sample-notice";
import { SearchBar } from "@/components/hospitality/search-bar";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import {
  AMENITY_LABELS,
  DINING_STYLE_LABELS,
  FEATURE_LABELS,
  STAY_TYPE_LABELS,
} from "@/data/hospitality";
import { useFavoritesHydration } from "@/lib/hospitality/favorites";
import {
  DEFAULT_SEARCH,
  activeFilterCount,
  availableSorts,
  countBy,
  filterDining,
  filterStays,
  nightsBetween,
  parseSearch,
  resultsHeading,
  sortDining,
  sortStays,
  toUrlSearch,
  type UrlSearch,
} from "@/lib/hospitality/search";
import { useHeaderOffset } from "@/lib/hospitality/use-header-offset";
import type { DestinationOption, HeroSlide, HospitalitySearch, Kind, Restaurant, Stay } from "@/lib/hospitality/types";

function scrollToResults() {
  const el = document.getElementById("results");
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

function facet(counts: Map<string, number>, labels: Record<string, string>): FacetOption[] {
  return [...counts.entries()]
    .map(([id, count]) => ({ id, label: labels[id] ?? id.replace(/^./, (c) => c.toUpperCase()), count }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove filter: ${label}`}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-xs text-ink transition-colors hover:border-gold focus-visible:outline-2 focus-visible:outline-gold"
    >
      {label}
      <X className="size-3.5" aria-hidden />
    </button>
  );
}

/**
 * The whole discovery experience on one route: hero, docked search, featured
 * strip, filtered results. State lives in the URL (`search`), so a search can be
 * shared, reloaded and reached with Back, and switching Stays and Dining
 * re-renders in place with no page load.
 */
export function HospitalityDiscover({
  search,
  onNavigate,
  stays,
  dining,
  destinations,
  slides,
}: {
  search: UrlSearch;
  onNavigate: (next: UrlSearch) => void;
  stays: Stay[];
  dining: Restaurant[];
  destinations: DestinationOption[];
  slides: HeroSlide[];
}) {
  useFavoritesHydration();
  const headerTop = useHeaderOffset(6);
  const value = useMemo(() => parseSearch(search as Record<string, unknown>), [search]);
  const kind = value.kind;
  const destName = (id: string) => destinations.find((d) => d.id === id)?.name ?? id;

  const commit = (next: HospitalitySearch) => onNavigate(toUrlSearch(next));
  const changeKind = (k: Kind) => commit({ ...DEFAULT_SEARCH, kind: k, dest: value.dest });
  const reset = () => commit({ ...DEFAULT_SEARCH, kind });

  const scope = kind === "stays" ? stays.filter((s) => !value.dest || s.destination === value.dest) : dining.filter((d) => !value.dest || d.destination === value.dest);
  const filteredStays = useMemo(() => sortStays(filterStays(stays, value, destinations), value.sort), [stays, value, destinations]);
  const filteredDining = useMemo(() => sortDining(filterDining(dining, value, destinations), value.sort), [dining, value, destinations]);
  const count = kind === "stays" ? filteredStays.length : filteredDining.length;

  const groups: FacetGroup[] =
    kind === "stays"
      ? [
          { key: "types", label: "Property type", options: facet(countBy(scope as Stay[], (s) => s.type), STAY_TYPE_LABELS) },
          { key: "amenities", label: "Amenities", options: facet(countBy(scope as Stay[], (s) => s.amenities), AMENITY_LABELS) },
        ]
      : [
          { key: "cuisines", label: "Cuisine", options: facet(countBy(scope as Restaurant[], (r) => r.cuisines), Object.fromEntries(dining.flatMap((d) => d.cuisines).map((c) => [c.toLowerCase(), c]))) },
          { key: "styles", label: "Dining style", options: facet(countBy(scope as Restaurant[], (r) => r.style), DINING_STYLE_LABELS) },
          { key: "features", label: "Features", options: facet(countBy(scope as Restaurant[], (r) => r.features), FEATURE_LABELS) },
        ];

  const cuisineList = useMemo(() => [...new Set(dining.flatMap((d) => d.cuisines))].sort(), [dining]);
  const sorts = availableSorts(kind === "stays" ? stays : dining, kind);
  const filtered = activeFilterCount(value) > 0 || Boolean(value.checkIn || value.date || value.time);
  const featured = (kind === "stays" ? stays : dining).filter((x) => x.featured).slice(0, 5);
  const nights = nightsBetween(value.checkIn, value.checkOut);

  const chips: { label: string; remove: () => void }[] = [];
  if (value.dest) chips.push({ label: destName(value.dest), remove: () => commit({ ...value, dest: "" }) });
  if (value.q) chips.push({ label: `"${value.q}"`, remove: () => commit({ ...value, q: "" }) });
  for (const g of groups)
    for (const id of value[g.key]) {
      const label = g.options.find((o) => o.id === id)?.label ?? id;
      chips.push({ label, remove: () => commit({ ...value, [g.key]: value[g.key].filter((x) => x !== id) }) });
    }

  const guestCount = value.adults + value.children;
  const guestsChosen = value.adults !== DEFAULT_SEARCH.adults || value.children > 0;
  const bookingLine =
    kind === "stays"
      ? [nights > 0 ? `${nights} ${nights === 1 ? "night" : "nights"}` : "", nights > 0 || guestsChosen ? `${guestCount} ${guestCount === 1 ? "guest" : "guests"}` : ""].filter(Boolean).join(", ")
      : [value.date ? "1 date chosen" : "", value.party !== DEFAULT_SEARCH.party ? `party of ${value.party}` : ""].filter(Boolean).join(", ");

  const featuredGrid = "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";
  // Narrower than the featured row because the filter sidebar takes the left column from lg.
  const resultsGrid = "grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";

  return (
    <div style={{ "--hosp-sticky": `${headerTop + 104}px` } as React.CSSProperties}>
      <SampleNotice />
      <HospitalityHero key={kind} kind={kind} slides={slides.filter((s) => s.kind === kind)} onKindChange={changeKind} />

      {/* Overlaps the hero's lower edge, then docks under the site header as the page scrolls. */}
      <div className="container-page relative z-30 mt-3 md:-mt-8 lg:sticky lg:-mt-10" style={{ top: headerTop }}>
        <SearchBar
          value={value}
          destinations={destinations}
          cuisines={cuisineList}
          onSearch={(next) => {
            commit(next);
            requestAnimationFrame(scrollToResults);
          }}
        />
      </div>

      {!filtered && featured.length > 0 ? (
        <section aria-labelledby="featured-title" className="container-page pb-2 pt-8 sm:pt-10">
          <Reveal className="flex items-end justify-between gap-4">
            <h2 id="featured-title" className="font-display text-xl text-heading sm:text-2xl">
              {kind === "stays" ? "Recommended places to stay" : "Recommended places to dine"}
            </h2>
            <Button asChild variant="outline" size="sm" className="shrink-0 rounded-full">
              <a href="#results">View all</a>
            </Button>
          </Reveal>
          <ul className={`mt-5 ${featuredGrid}`}>
            {featured.map((x, i) => (
              <li key={x.id}>
                <Reveal delay={i * 70}>
                  {kind === "stays" ? (
                    <StayCard stay={x as Stay} destinationName={destName(x.destination)} eager={i < 2} />
                  ) : (
                    <DiningCard place={x as Restaurant} destinationName={destName(x.destination)} eager={i < 2} />
                  )}
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section id="results" aria-labelledby="results-title" className="container-page scroll-mt-48 py-8 sm:py-10">
        <div className="lg:grid lg:grid-cols-[14rem_1fr] lg:gap-6 xl:grid-cols-[15rem_1fr]">
          <FilterPanel value={value} groups={groups} onChange={commit} onReset={reset} resultCount={count} />

          <div className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="results-title" className="font-display text-xl text-heading sm:text-2xl">
                  {resultsHeading(value, destinations)}
                </h2>
                <p role="status" aria-live="polite" className="mt-1 text-sm text-muted">
                  {count} {count === 1 ? "place" : "places"}
                  {bookingLine ? `. ${bookingLine}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted">
                  Sort
                  <select
                    value={value.sort}
                    onChange={(e) => commit({ ...value, sort: e.target.value as HospitalitySearch["sort"] })}
                    className="min-h-11 rounded-md border border-line bg-page px-3 text-sm normal-case tracking-normal text-ink focus-visible:border-gold"
                  >
                    {sorts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {chips.length > 0 ? (
              <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
                {chips.map((c) => (
                  <Chip key={c.label} label={c.label} onRemove={c.remove} />
                ))}
                <button type="button" onClick={reset} className="min-h-9 px-2 text-xs uppercase tracking-[0.14em] text-muted underline-offset-4 hover:text-heading hover:underline focus-visible:outline-2 focus-visible:outline-gold">
                  Clear all
                </button>
              </div>
            ) : null}

            {kind === "stays" ? (
              <p className="mt-3 text-sm text-muted">
                Dates and guests travel with your enquiry. Availability is not live: our desk confirms it with the property.
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Date, time and party size travel with your enquiry. Tables are not booked online: our desk confirms with the restaurant.
              </p>
            )}

            {count === 0 ? (
              <div className="mt-8 rounded-3xl border border-dashed border-line bg-surface p-8 text-center">
                <p className="font-display text-xl text-heading">No places match these filters.</p>
                <p className="mt-2 text-sm text-muted">Try another destination, or clear a filter.</p>
                <Button type="button" variant="dark" className="mt-5" onClick={reset}>
                  Clear all filters
                </Button>
              </div>
            ) : (
              <ul className={`mt-6 ${resultsGrid}`}>
                {kind === "stays"
                  ? filteredStays.map((x) => (
                      <li key={x.id}>
                        <StayCard stay={x} destinationName={destName(x.destination)} />
                      </li>
                    ))
                  : filteredDining.map((x) => (
                      <li key={x.id}>
                        <DiningCard place={x} destinationName={destName(x.destination)} />
                      </li>
                    ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="help-title" className="container-page pb-14 lg:pb-20">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-brand-dark p-5 text-ivory sm:flex-row sm:items-center sm:p-7">
            <div className="max-w-xl">
              <h2 id="help-title" className="font-display text-xl sm:text-2xl">
                Need help choosing?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ivory/85">
                Tell us where you are going and what you need. Our team can suggest places to stay and dine as part of a
                journey we plan for you.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/contact">
                Send an enquiry <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
