import type {
  DestinationOption,
  HospitalitySearch,
  Kind,
  Restaurant,
  SortId,
  Stay,
} from "@/lib/hospitality/types";

/**
 * Pure search, filter and URL-state logic for the hospitality experience.
 * Nothing here touches React, the DOM or the clock, so it is unit-tested and
 * can run on the server or the client.
 */

/** The shape kept in the URL: flat, optional, defaults omitted. */
export interface UrlSearch {
  kind?: Kind;
  dest?: string;
  q?: string;
  in?: string;
  out?: string;
  adults?: number;
  kids?: number;
  types?: string;
  amenities?: string;
  date?: string;
  time?: string;
  party?: number;
  cuisines?: string;
  styles?: string;
  features?: string;
  sort?: SortId;
}

export const DEFAULT_SEARCH: HospitalitySearch = {
  kind: "stays",
  dest: "",
  q: "",
  checkIn: "",
  checkOut: "",
  adults: 2,
  children: 0,
  types: [],
  amenities: [],
  date: "",
  time: "",
  party: 2,
  cuisines: [],
  styles: [],
  features: [],
  sort: "featured",
};

const SORTS: SortId[] = ["featured", "name-asc", "name-desc", "price-asc", "rating-desc"];
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A real calendar date in `YYYY-MM-DD` form, or null. */
export function cleanIsoDate(v: unknown): string {
  if (typeof v !== "string") return "";
  const m = ISO_DATE.exec(v);
  if (!m) return "";
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  const ok = dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
  return ok ? v : "";
}

function cleanTime(v: unknown): string {
  return typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : "";
}

function cleanInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number.parseInt(v, 10) : Number.NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function cleanList(v: unknown): string[] {
  const raw = Array.isArray(v) ? v.map(String) : typeof v === "string" ? v.split(",") : [];
  const seen = new Set<string>();
  for (const item of raw) {
    const t = item.trim().toLowerCase().slice(0, 40);
    if (t) seen.add(t);
    if (seen.size >= 12) break;
  }
  return [...seen];
}

function cleanText(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Whole nights between two ISO dates; 0 when either is missing or the order is wrong. */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = cleanIsoDate(checkIn);
  const b = cleanIsoDate(checkOut);
  if (!a || !b) return 0;
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return ms > 0 ? Math.round(ms / 86_400_000) : 0;
}

/** True when the range is usable: both dates real and check-out after check-in. */
export function isValidRange(checkIn: string, checkOut: string): boolean {
  return nightsBetween(checkIn, checkOut) > 0;
}

/** Turn anything in the URL (or a hand-edited link) into a valid search. */
export function parseSearch(raw: Record<string, unknown> = {}): HospitalitySearch {
  const checkIn = cleanIsoDate(raw.in);
  let checkOut = cleanIsoDate(raw.out);
  if (!checkIn || !isValidRange(checkIn, checkOut)) checkOut = "";
  const sort = SORTS.includes(raw.sort as SortId) ? (raw.sort as SortId) : "featured";
  return {
    kind: raw.kind === "dining" ? "dining" : "stays",
    dest: cleanText(raw.dest, 40).toLowerCase(),
    q: cleanText(raw.q, 80),
    checkIn,
    checkOut,
    adults: cleanInt(raw.adults, 1, 12, DEFAULT_SEARCH.adults),
    children: cleanInt(raw.kids, 0, 8, 0),
    types: cleanList(raw.types),
    amenities: cleanList(raw.amenities),
    date: cleanIsoDate(raw.date),
    time: cleanTime(raw.time),
    party: cleanInt(raw.party, 1, 20, DEFAULT_SEARCH.party),
    cuisines: cleanList(raw.cuisines),
    styles: cleanList(raw.styles),
    features: cleanList(raw.features),
    sort,
  };
}

/** The URL form of a search: only what differs from the defaults. */
export function toUrlSearch(s: HospitalitySearch): UrlSearch {
  const out: UrlSearch = {};
  if (s.kind !== "stays") out.kind = s.kind;
  if (s.dest) out.dest = s.dest;
  if (s.q) out.q = s.q;
  if (s.checkIn) out.in = s.checkIn;
  if (s.checkOut) out.out = s.checkOut;
  if (s.adults !== DEFAULT_SEARCH.adults) out.adults = s.adults;
  if (s.children) out.kids = s.children;
  if (s.types.length) out.types = s.types.join(",");
  if (s.amenities.length) out.amenities = s.amenities.join(",");
  if (s.date) out.date = s.date;
  if (s.time) out.time = s.time;
  if (s.party !== DEFAULT_SEARCH.party) out.party = s.party;
  if (s.cuisines.length) out.cuisines = s.cuisines.join(",");
  if (s.styles.length) out.styles = s.styles.join(",");
  if (s.features.length) out.features = s.features.join(",");
  if (s.sort !== "featured") out.sort = s.sort;
  return out;
}

/** How many narrowing choices are active (dates, guests and sort do not count). */
export function activeFilterCount(s: HospitalitySearch): number {
  const common = (s.dest ? 1 : 0) + (s.q ? 1 : 0);
  return s.kind === "stays"
    ? common + s.types.length + s.amenities.length
    : common + s.cuisines.length + s.styles.length + s.features.length;
}

function tokens(q: string): string[] {
  return q.toLowerCase().split(/\s+/).filter(Boolean);
}

function matchesText(haystack: string[], q: string): boolean {
  const text = haystack.join(" ").toLowerCase();
  return tokens(q).every((t) => text.includes(t));
}

function anyOf(selected: string[], value: string | string[]): boolean {
  if (selected.length === 0) return true;
  const values = (Array.isArray(value) ? value : [value]).map((v) => v.toLowerCase());
  return selected.some((s) => values.includes(s));
}

function allOf(selected: string[], value: string[]): boolean {
  const values = value.map((v) => v.toLowerCase());
  return selected.every((s) => values.includes(s));
}

export function filterStays(stays: readonly Stay[], s: HospitalitySearch, dests: readonly DestinationOption[]): Stay[] {
  const destName = (id: string) => dests.find((d) => d.id === id)?.name ?? id;
  return stays.filter(
    (x) =>
      (!s.dest || x.destination === s.dest) &&
      (!s.q || matchesText([x.name, x.area ?? "", destName(x.destination), x.type, x.summary], s.q)) &&
      anyOf(s.types, x.type) &&
      allOf(s.amenities, x.amenities),
  );
}

export function filterDining(rows: readonly Restaurant[], s: HospitalitySearch, dests: readonly DestinationOption[]): Restaurant[] {
  const destName = (id: string) => dests.find((d) => d.id === id)?.name ?? id;
  return rows.filter(
    (x) =>
      (!s.dest || x.destination === s.dest) &&
      (!s.q || matchesText([x.name, x.area ?? "", destName(x.destination), x.cuisines.join(" "), x.summary], s.q)) &&
      anyOf(s.cuisines, x.cuisines) &&
      anyOf(s.styles, x.style) &&
      allOf(s.features, x.features),
  );
}

function byName(a: { name: string }, b: { name: string }) {
  return a.name.localeCompare(b.name);
}

export function sortStays(items: readonly Stay[], sort: SortId): Stay[] {
  const list = [...items];
  switch (sort) {
    case "name-asc":
      return list.sort(byName);
    case "name-desc":
      return list.sort((a, b) => byName(b, a));
    case "price-asc":
      return list.sort((a, b) => (a.price?.amount ?? Infinity) - (b.price?.amount ?? Infinity) || byName(a, b));
    case "rating-desc":
      return list.sort((a, b) => (b.rating?.value ?? -1) - (a.rating?.value ?? -1) || byName(a, b));
    default:
      return list.sort((a, b) => Number(b.featured) - Number(a.featured));
  }
}

export function sortDining(items: readonly Restaurant[], sort: SortId): Restaurant[] {
  const list = [...items];
  switch (sort) {
    case "name-asc":
      return list.sort(byName);
    case "name-desc":
      return list.sort((a, b) => byName(b, a));
    case "rating-desc":
      return list.sort((a, b) => (b.rating?.value ?? -1) - (a.rating?.value ?? -1) || byName(a, b));
    default:
      return list.sort((a, b) => Number(b.featured) - Number(a.featured));
  }
}

/** Sort choices worth offering: price and rating only when some listing has them. */
export function availableSorts(items: readonly (Stay | Restaurant)[], kind: Kind): { id: SortId; label: string }[] {
  const out: { id: SortId; label: string }[] = [
    { id: "featured", label: "Featured first" },
    { id: "name-asc", label: "Name A to Z" },
    { id: "name-desc", label: "Name Z to A" },
  ];
  if (kind === "stays" && (items as Stay[]).some((i) => i.price)) out.push({ id: "price-asc", label: "Price, low to high" });
  if (items.some((i) => i.rating)) out.push({ id: "rating-desc", label: "Rating, high to low" });
  return out;
}

/** Destinations matching typed text, by name or keyword; all of them for an empty query. */
export function searchDestinations(options: readonly DestinationOption[], query: string): DestinationOption[] {
  const t = tokens(query);
  if (t.length === 0) return [...options];
  return options.filter((o) => {
    const text = [o.name, ...(o.keywords ?? [])].join(" ").toLowerCase();
    return t.every((x) => text.includes(x));
  });
}

/** Count how many listings carry each option, for filter labels. */
export function countBy<T>(items: readonly T[], read: (item: T) => string | readonly string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const item of items) {
    const v = read(item);
    for (const key of (Array.isArray(v) ? v : [v]) as string[]) {
      const k = key.toLowerCase();
      m.set(k, (m.get(k) ?? 0) + 1);
    }
  }
  return m;
}

/** "Places to stay in Freetown", "Places to dine", and so on. */
export function resultsHeading(s: HospitalitySearch, dests: readonly DestinationOption[]): string {
  const name = dests.find((d) => d.id === s.dest)?.name;
  const base = s.kind === "stays" ? "Places to stay" : "Places to dine";
  return name ? `${base} in ${name}` : `${base} across Sierra Leone`;
}
