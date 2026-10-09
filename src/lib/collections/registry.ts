/**
 * Collections (tasks A8 and A9): one table, a `collection` column, and a Zod
 * schema per collection here. The admin form is built from `fields`, the
 * server validates with `schema`, and `path` says where a published record
 * lives on the public site, so a key change can write a redirect.
 *
 * No server imports: the admin pages import this file.
 *
 * Values a source rule covers are stored as claim fields (docs/CUSTOMIZATION_PLAN.md
 * section 11): a whole list item such as the "Licensed guide" inclusion is a
 * `Claim` with an empty source, shown only once a source link and date exist.
 * Ratings, prices and the dormant `bookable` flag are not part of any record:
 * ratings and rates live in their own tables (task A10) and booking stays out
 * of the admin.
 */
import { z } from "zod";

export const claimSchema = z
  .object({
    claim: z.string().trim().min(1).max(300),
    sourceUrl: z.union([z.literal(""), z.string().trim().max(500).url().startsWith("https://")]),
    sourceDate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")]),
    /** Shown instead when unsourced; empty leaves the item out. */
    fallback: z.string().trim().max(300),
  })
  .strict();
export type Claim = z.infer<typeof claimSchema>;

export const isClaim = (v: unknown): v is Claim => typeof v === "object" && v !== null && "claim" in v;

/** A claim is shown only when both its source link and date are recorded. */
export const claimSourced = (c: Claim) => c.sourceUrl !== "" && c.sourceDate !== "";

export const imageSchema = z
  .object({ media: z.string().min(1, "Choose a photo.").max(64), alt: z.string().trim().min(1, "Write the alt text.").max(300) })
  .strict();
export type ImageRef = z.infer<typeof imageSchema>;

const text = (max: number) => z.string().trim().min(1, "Fill this in.").max(max, `Keep it to ${max} characters.`);
const optionalText = (max: number) => z.string().trim().max(max, `Keep it to ${max} characters.`);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lower-case letters, numbers and hyphens.").max(80);
const list = (max: number, itemMax = 200) => z.array(text(itemMax)).max(max);

export const CIRCUIT_IDS = ["eastern-circuit", "northern-circuit", "southern-circuit", "western-circuit"] as const;
export const COUNTRIES = ["sierra-leone", "guinea", "liberia", "west-africa"] as const;
export const CATEGORIES = ["wildlife", "beaches", "culture", "adventure"] as const;
export const DIFFICULTIES = ["easy", "moderate", "challenging"] as const;

export const circuitSchema = z
  .object({
    id: z.enum(CIRCUIT_IDS),
    name: text(80),
    region: text(160),
    bestTime: text(80),
    summary: text(600),
    image: imageSchema,
    highlights: list(12, 120),
  })
  .strict();

export const destinationSchema = z
  .object({
    slug,
    name: text(120),
    circuit: z.enum(CIRCUIT_IDS),
    country: z.enum(COUNTRIES),
    summary: text(600),
    image: imageSchema,
  })
  .strict();

export const tourSchema = z
  .object({
    slug,
    title: text(160),
    country: z.enum(COUNTRIES),
    circuit: z.enum(CIRCUIT_IDS),
    destinationSlug: slug,
    duration: text(60),
    durationDays: z.number().int().min(1).max(60),
    category: z.enum(CATEGORIES),
    difficulty: z.enum(DIFFICULTIES),
    // 0 and 0 mean "not documented"; the site says "On request" (CLAUDE.md rule 2).
    groupMin: z.number().int().min(0).max(500),
    groupMax: z.number().int().min(0).max(500),
    languages: list(10, 40),
    summary: text(600),
    highlights: list(20),
    inclusions: z.array(z.union([text(200), claimSchema])).max(30),
    exclusions: list(30),
    requirements: optionalText(1000),
    meetingPoint: optionalText(300),
    image: imageSchema,
    gallery: z.array(imageSchema).max(20),
    itinerary: z
      .array(z.object({ day: z.number().int().min(1).max(60), title: text(160), description: text(2000) }).strict())
      .max(60),
    /** The shared question set shown on the page, then the tour's own questions. */
    faqGroup: z.union([slug, z.literal("")]),
    faqs: z.array(z.object({ q: text(300), a: text(2000) }).strict()).max(30),
  })
  .strict()
  .refine((t) => t.groupMax === 0 || t.groupMax >= t.groupMin, { message: "The largest group cannot be smaller than the smallest.", path: ["groupMax"] });

export const faqGroupSchema = z
  .object({
    key: slug,
    name: text(120),
    items: z.array(z.object({ q: text(300), a: text(2000) }).strict()).min(1).max(40),
  })
  .strict();

/** What the admin form shows for each field. */
export type FieldDef =
  | { kind: "text"; name: string; label: string; max: number; multiline?: boolean; help?: string; optional?: boolean }
  | { kind: "number"; name: string; label: string; min: number; max: number; help?: string }
  | { kind: "select"; name: string; label: string; options: readonly string[] }
  | { kind: "ref"; name: string; label: string; collection: CollectionId; allowEmpty?: boolean }
  | { kind: "textList"; name: string; label: string; claims?: boolean; help?: string }
  | { kind: "image"; name: string; label: string }
  | { kind: "gallery"; name: string; label: string }
  | { kind: "objectList"; name: string; label: string; fields: FieldDef[]; itemLabel: string };

export type CollectionDef = {
  id: CollectionId;
  label: string;
  singular: string;
  /** The field that is the record's key (slug or id). */
  keyField: string;
  titleField: string;
  /** True when the key cannot change (the code relies on it). */
  fixedKey: boolean;
  /** False when new records cannot be created here. */
  canCreate: boolean;
  schema: z.ZodType<Record<string, unknown>>;
  fields: FieldDef[];
  /** Where the published record is on the public site, or null when it has no page. */
  path: (data: Record<string, unknown>) => string | null;
};

export const COLLECTION_IDS = ["circuits", "destinations", "tours", "faq-groups"] as const;
export type CollectionId = (typeof COLLECTION_IDS)[number];

export const COLLECTIONS: Record<CollectionId, CollectionDef> = {
  circuits: {
    id: "circuits",
    label: "Circuits",
    singular: "circuit",
    keyField: "id",
    titleField: "name",
    fixedKey: true,
    canCreate: false,
    schema: circuitSchema as unknown as z.ZodType<Record<string, unknown>>,
    path: (d) => `/destinations/${d.id}`,
    fields: [
      { kind: "text", name: "name", label: "Name", max: 80 },
      { kind: "text", name: "region", label: "Region", max: 160 },
      { kind: "text", name: "bestTime", label: "Best time to go", max: 80 },
      { kind: "text", name: "summary", label: "Summary", max: 600, multiline: true },
      { kind: "image", name: "image", label: "Photo" },
      { kind: "textList", name: "highlights", label: "Highlights" },
    ],
  },
  destinations: {
    id: "destinations",
    label: "Destinations",
    singular: "destination",
    keyField: "slug",
    titleField: "name",
    fixedKey: false,
    canCreate: true,
    schema: destinationSchema as unknown as z.ZodType<Record<string, unknown>>,
    path: (d) => `/destinations/${d.circuit}/${d.slug}`,
    fields: [
      { kind: "text", name: "name", label: "Name", max: 120 },
      { kind: "text", name: "slug", label: "Address (slug)", max: 80, help: "Changing it on a published destination adds a redirect from the old address." },
      { kind: "select", name: "circuit", label: "Circuit", options: CIRCUIT_IDS },
      { kind: "select", name: "country", label: "Country", options: COUNTRIES },
      { kind: "text", name: "summary", label: "Summary", max: 600, multiline: true },
      { kind: "image", name: "image", label: "Photo" },
    ],
  },
  tours: {
    id: "tours",
    label: "Tours",
    singular: "tour",
    keyField: "slug",
    titleField: "title",
    fixedKey: false,
    canCreate: true,
    schema: tourSchema as unknown as z.ZodType<Record<string, unknown>>,
    path: (d) => `/tours/${d.slug}`,
    fields: [
      { kind: "text", name: "title", label: "Title", max: 160 },
      { kind: "text", name: "slug", label: "Address (slug)", max: 80, help: "Changing it on a published tour adds a redirect from the old address." },
      { kind: "select", name: "country", label: "Country", options: COUNTRIES },
      { kind: "select", name: "circuit", label: "Circuit", options: CIRCUIT_IDS },
      { kind: "ref", name: "destinationSlug", label: "Destination", collection: "destinations" },
      { kind: "text", name: "duration", label: "Duration as shown", max: 60 },
      { kind: "number", name: "durationDays", label: "Days", min: 1, max: 60 },
      { kind: "select", name: "category", label: "Category", options: CATEGORIES },
      { kind: "select", name: "difficulty", label: "Difficulty", options: DIFFICULTIES },
      { kind: "number", name: "groupMin", label: "Smallest group", min: 0, max: 500, help: "0 and 0 mean not documented; the site shows On request." },
      { kind: "number", name: "groupMax", label: "Largest group", min: 0, max: 500 },
      { kind: "textList", name: "languages", label: "Languages" },
      { kind: "text", name: "summary", label: "Summary", max: 600, multiline: true },
      { kind: "textList", name: "highlights", label: "Highlights" },
      { kind: "textList", name: "inclusions", label: "Included", claims: true, help: "A claim needs a source link and date before the site shows it." },
      { kind: "textList", name: "exclusions", label: "Not included" },
      { kind: "text", name: "requirements", label: "What to bring and know", max: 1000, multiline: true, optional: true },
      { kind: "text", name: "meetingPoint", label: "Meeting point", max: 300, optional: true },
      { kind: "image", name: "image", label: "Main photo" },
      { kind: "gallery", name: "gallery", label: "Gallery" },
      {
        kind: "objectList",
        name: "itinerary",
        label: "Itinerary",
        itemLabel: "Day",
        fields: [
          { kind: "number", name: "day", label: "Day", min: 1, max: 60 },
          { kind: "text", name: "title", label: "Title", max: 160 },
          { kind: "text", name: "description", label: "Description", max: 2000, multiline: true },
        ],
      },
      { kind: "ref", name: "faqGroup", label: "Shared questions", collection: "faq-groups", allowEmpty: true },
      {
        kind: "objectList",
        name: "faqs",
        label: "This tour's own questions",
        itemLabel: "Question",
        fields: [
          { kind: "text", name: "q", label: "Question", max: 300 },
          { kind: "text", name: "a", label: "Answer", max: 2000, multiline: true },
        ],
      },
    ],
  },
  "faq-groups": {
    id: "faq-groups",
    label: "FAQ groups",
    singular: "FAQ group",
    keyField: "key",
    titleField: "name",
    fixedKey: false,
    canCreate: true,
    schema: faqGroupSchema as unknown as z.ZodType<Record<string, unknown>>,
    path: () => null,
    fields: [
      { kind: "text", name: "name", label: "Name", max: 120 },
      { kind: "text", name: "key", label: "Key", max: 80 },
      {
        kind: "objectList",
        name: "items",
        label: "Questions",
        itemLabel: "Question",
        fields: [
          { kind: "text", name: "q", label: "Question", max: 300 },
          { kind: "text", name: "a", label: "Answer", max: 2000, multiline: true },
        ],
      },
    ],
  },
};

export function isCollectionId(value: string): value is CollectionId {
  return (COLLECTION_IDS as readonly string[]).includes(value);
}

/** Every record and media id one record points at, for references and "delete refused while used". */
export function referencesOf(collection: CollectionId, data: Record<string, unknown>) {
  const items: { collection: CollectionId; key: string; field: string }[] = [];
  const media: { id: string; field: string }[] = [];
  const img = (v: unknown, field: string) => {
    if (v && typeof v === "object" && "media" in v) media.push({ id: String((v as ImageRef).media), field });
  };
  if (collection === "destinations") items.push({ collection: "circuits", key: String(data.circuit), field: "circuit" });
  if (collection === "tours") {
    items.push({ collection: "circuits", key: String(data.circuit), field: "circuit" });
    items.push({ collection: "destinations", key: String(data.destinationSlug), field: "destinationSlug" });
    if (data.faqGroup) items.push({ collection: "faq-groups", key: String(data.faqGroup), field: "faqGroup" });
    ((data.gallery as unknown[]) ?? []).forEach((g, i) => img(g, `gallery.${i}`));
  }
  img(data.image, "image");
  return { items, media };
}
