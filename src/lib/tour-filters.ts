import type { Tour, TourCategory } from "@/data/catalog";

/** Duration buckets derived from `durationDays`, not a separate stored field. */
export type DurationBucket = "day" | "short" | "week" | "expedition";

export type TourFilters = {
  query: string;
  category: TourCategory | "all";
  duration: DurationBucket | "all";
};

export const EMPTY_FILTERS: TourFilters = { query: "", category: "all", duration: "all" };

export const CATEGORY_OPTIONS: { value: TourCategory | "all"; label: string }[] = [
  { value: "all", label: "All experiences" },
  { value: "culture", label: "Culture & heritage" },
  { value: "wildlife", label: "Wildlife" },
  { value: "beaches", label: "Beaches & islands" },
  { value: "adventure", label: "Adventure" },
];

export const DURATION_OPTIONS: { value: DurationBucket | "all"; label: string }[] = [
  { value: "all", label: "Any length" },
  { value: "day", label: "Day trips" },
  { value: "short", label: "2–4 days" },
  { value: "week", label: "5–14 days" },
  { value: "expedition", label: "15+ days" },
];

function inDurationBucket(days: number, bucket: DurationBucket): boolean {
  if (bucket === "day") return days <= 1;
  if (bucket === "short") return days >= 2 && days <= 4;
  if (bucket === "week") return days >= 5 && days <= 14;
  return days >= 15;
}

/** Pure filter over the catalogue — keeps matching logic out of the view. */
export function filterTours(tours: Tour[], filters: TourFilters): Tour[] {
  const needle = filters.query.trim().toLowerCase();
  return tours.filter((tour) => {
    if (filters.category !== "all" && tour.category !== filters.category) return false;
    if (filters.duration !== "all" && !inDurationBucket(tour.durationDays, filters.duration)) return false;
    if (!needle) return true;
    const haystack = [tour.title, tour.summary, tour.destinationSlug.replace(/-/g, " "), ...tour.highlights]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function isFiltered(filters: TourFilters): boolean {
  return filters.query.trim() !== "" || filters.category !== "all" || filters.duration !== "all";
}
