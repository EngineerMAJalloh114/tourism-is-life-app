import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CatalogImage } from "@/components/cruise/catalog-image";
import { Button } from "@/components/ui/button";
import {
  ACTIVITY_FILTERS,
  EXPERIENCE_FILTERS,
  excursions,
  filterExcursions,
  type ExperienceTag,
  type GroupFilter,
  type PriceFilter,
} from "@/data/cruise";
import { cn } from "@/lib/utils";

export function ExcursionExplorer({
  selectedId,
  onSelect,
}: {
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const [price, setPrice] = useState<PriceFilter>("all");
  const [group, setGroup] = useState<GroupFilter>("all");
  const [experiences, setExperiences] = useState<ExperienceTag[]>([]);
  const [activities, setActivities] = useState<string[]>([]);

  const visible = useMemo(
    () => filterExcursions(excursions, { price, group, experiences, activities }),
    [price, group, experiences, activities],
  );

  function toggleExperience(tag: ExperienceTag) {
    setExperiences((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  }

  function toggleActivity(label: string) {
    setActivities((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
  }

  return (
    <div>
      <div className="rounded-lg border border-line bg-surface p-4 sm:p-5">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Compare & filter</p>
        <p className="mt-1 text-sm text-muted">
          Experience and activity tags are filters derived from the proposal descriptions, not extra product claims.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted">Price</span>
            <select
              value={price}
              onChange={(e) => setPrice(e.target.value as PriceFilter)}
              className="min-h-11 w-full rounded-md border border-line bg-ivory px-3 text-sm"
            >
              <option value="all">All published prices</option>
              <option value="under-70">Under $70</option>
              <option value="70-80">$70–$80</option>
              <option value="over-80">Over $80</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted">
              Group size
            </span>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value as GroupFilter)}
              className="min-h-11 w-full rounded-md border border-line bg-ivory px-3 text-sm"
            >
              <option value="all">All published group sizes</option>
              <option value="small">Smaller groups (max 75)</option>
              <option value="medium">Mid-size (min 30, under 120)</option>
              <option value="large">Large groups (min 120)</option>
            </select>
          </label>
        </div>
        <fieldset className="mt-4">
          <legend className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Experience type</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXPERIENCE_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleExperience(item.id)}
                aria-pressed={experiences.includes(item.id)}
                className={cn(
                  "min-h-11 rounded-md border px-3 text-xs uppercase tracking-[0.14em]",
                  experiences.includes(item.id)
                    ? "border-brand bg-brand text-ivory"
                    : "border-line bg-ivory text-ink hover:border-gold",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-4">
          <legend className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Activity</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {ACTIVITY_FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleActivity(item)}
                aria-pressed={activities.includes(item)}
                className={cn(
                  "min-h-11 rounded-md border px-3 text-xs uppercase tracking-[0.14em]",
                  activities.includes(item)
                    ? "border-gold bg-gold/15 text-brand"
                    : "border-line bg-ivory text-ink hover:border-gold",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {visible.length === 0 ? (
        <p className="mt-8 text-muted" role="status">
          Excursion information is currently unavailable for these filters. Clear a filter or contact the cruise desk.
        </p>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {visible.map((item) => (
            <li key={item.id}>
              <article className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <CatalogImage src={item.image} alt={item.imageAlt} className="size-full" />
                  <span className="absolute left-3 top-3 rounded-sm bg-brand/90 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-ivory">
                    ${item.priceUsdPerPerson} pp
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{item.destination}</p>
                  <h3 className="mt-1 font-display text-2xl text-brand">{item.name}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/80">{item.summary}</p>
                  {item.itineraryNotes ? (
                    <p className="mt-3 text-sm text-muted">{item.itineraryNotes}</p>
                  ) : null}
                  <dl className="mt-4 grid gap-2 border-t border-line pt-4 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Group</dt>
                      <dd>
                        {item.groupMin}–{item.groupMax} people
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Departure</dt>
                      <dd>{item.departure}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs uppercase tracking-[0.12em] text-muted">Included</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-ink/80">
                    {item.inclusions.map((entry) => (
                      <li key={entry}>{entry}</li>
                    ))}
                  </ul>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button type="button" size="sm" onClick={() => onSelect(item.id)}>
                      Request this plan
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/cruise/quote" search={{ excursion: item.id }}>
                        Open quote form
                      </Link>
                    </Button>
                  </div>
                  {selectedId === item.id ? (
                    <p className="mt-2 text-sm text-ok" role="status">
                      Selected for the request form below.
                    </p>
                  ) : null}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
