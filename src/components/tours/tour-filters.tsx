import { Search, X } from "lucide-react";
import {
  CATEGORY_OPTIONS,
  DURATION_OPTIONS,
  EMPTY_FILTERS,
  isFiltered,
  type TourFilters,
} from "@/lib/tour-filters";

export function TourFilterBar({
  filters,
  onChange,
  resultCount,
}: {
  filters: TourFilters;
  onChange: (next: TourFilters) => void;
  resultCount: number;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 sm:p-5">
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="tour-search" className="text-xs uppercase tracking-[0.16em] text-muted">
            Search
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              id="tour-search"
              type="search"
              value={filters.query}
              onChange={(e) => onChange({ ...filters, query: e.target.value })}
              placeholder="Tiwai, Bunce Island, Freetown…"
              className="min-h-11 w-full rounded-md border border-line bg-ivory pl-9 pr-3 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tour-category" className="text-xs uppercase tracking-[0.16em] text-muted">
            Experience
          </label>
          <select
            id="tour-category"
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value as TourFilters["category"] })}
            className="min-h-11 w-full rounded-md border border-line bg-ivory px-3 text-sm"
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tour-duration" className="text-xs uppercase tracking-[0.16em] text-muted">
            Length
          </label>
          <select
            id="tour-duration"
            value={filters.duration}
            onChange={(e) => onChange({ ...filters, duration: e.target.value as TourFilters["duration"] })}
            className="min-h-11 w-full rounded-md border border-line bg-ivory px-3 text-sm"
          >
            {DURATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            disabled={!isFiltered(filters)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-line px-4 text-sm text-brand disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="size-4" aria-hidden /> Clear
          </button>
        </div>
      </div>

      <p className="mt-3 text-sm text-muted" role="status" aria-live="polite">
        {resultCount} {resultCount === 1 ? "tour" : "tours"} shown
      </p>
    </div>
  );
}
