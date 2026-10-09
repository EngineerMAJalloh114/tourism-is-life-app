/**
 * Collections (tasks A8 and A9): one table, a `collection` column, and a Zod
 * schema per collection here. The admin form is built from `fields`, the
 * server validates with `schema`, and `paths` says where a published record
 * lives on the public site (some records have two pages), so a key change can
 * write a redirect for each.
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
import type { Capability } from "@/lib/capabilities";
import { HOSPITALITY_PREVIEW } from "@/data/hospitality";

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
  .object({
    media: z.string().min(1, "Choose a photo.").max(64),
    alt: z.string().trim().min(1, "Write the alt text.").max(300),
    /** CSS object-position as the site uses it today ("center 62%"). */
    position: z.string().regex(/^[a-z0-9% .-]{1,40}$/i).optional(),
  })
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

const textOrClaim = (max: number) => z.union([text(max), claimSchema]);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.");
const httpsOrEmpty = z.union([z.literal(""), z.string().trim().max(500).url().startsWith("https://")]);

export const serviceSchema = z
  .object({
    slug,
    name: text(120),
    summary: text(600),
    benefits: z.array(textOrClaim(200)).max(20),
    process: list(20),
    // Four services have no fitting photograph; the site shows an icon panel.
    image: imageSchema.nullable(),
  })
  .strict();

export const journalCategorySchema = z.object({ slug, label: text(80) }).strict();

export const journalPostSchema = z
  .object({ slug, category: slug, title: text(200), date: isoDate, excerpt: text(400), body: text(20000), image: imageSchema })
  .strict();

/**
 * A team member's photo is kept, but the site shows it only once consent is
 * recorded (who recorded it, when, and a note). Seeded with consent empty.
 */
export const teamProfileSchema = z
  .object({
    slug,
    name: text(120),
    role: text(120),
    bio: text(1000),
    photo: imageSchema.nullable(),
    photoConsent: z
      .object({ recordedBy: optionalText(120), recordedAt: z.union([z.literal(""), isoDate]), note: optionalText(500) })
      .strict(),
  })
  .strict();

/** Shown only with a source link and date, and published only then. */
export const testimonialSchema = z
  .object({
    key: slug,
    name: text(120),
    handle: optionalText(80),
    quote: text(1000),
    sourceUrl: httpsOrEmpty,
    sourceDate: z.union([z.literal(""), isoDate]),
    consentNote: optionalText(500),
  })
  .strict();

export const cruiseOverviewSchema = z.object({ id: slug, title: text(120), body: text(1000), image: imageSchema }).strict();

export const EXPERIENCE_TAGS = ["culture", "history", "wildlife", "beach", "adventure", "nature"] as const;

/** A shore excursion. Its per-person price is a rate (task A10), not part of the record. */
export const cruiseExcursionSchema = z
  .object({
    id: slug,
    name: text(160),
    destination: text(120),
    summary: text(1000),
    itineraryNotes: optionalText(2000).optional(),
    activities: list(20, 80),
    experienceTags: z.array(z.enum(EXPERIENCE_TAGS)).max(6),
    groupMin: z.number().int().min(0).max(5000),
    groupMax: z.number().int().min(0).max(5000),
    departure: text(200),
    inclusions: list(30),
    image: imageSchema,
  })
  .strict();

export const cruiseDestinationSchema = z.object({ id: slug, name: text(120), summary: text(1000), image: imageSchema }).strict();

export const VEHICLE_CATEGORIES = ["economy", "sedan", "suv", "4x4", "van", "minibus", "luxury", "bus"] as const;

/** "From $35/day" is a price without a source: a claim until a rate is recorded (A10). */
export const vehicleCategorySchema = z
  .object({
    slug: z.enum(VEHICLE_CATEGORIES),
    label: text(80),
    description: text(600),
    image: imageSchema,
    seats: text(40),
    luggage: text(40),
    transmission: text(40),
    startingPrice: claimSchema,
  })
  .strict();

/**
 * A vehicle. Rates are task A10, not part of the record. `availability` is
 * kept as the code has it, but never shown and not editable (enquiry only).
 */
export const vehicleSchema = z
  .object({
    id: slug,
    name: text(120),
    category: z.enum(VEHICLE_CATEGORIES),
    image: imageSchema,
    gallery: z.array(imageSchema).max(20),
    seats: z.number().int().min(1).max(100),
    doors: z.number().int().min(0).max(10),
    luggage: z.number().int().min(0).max(100),
    transmission: z.enum(["manual", "automatic"]),
    fuelType: z.enum(["petrol", "diesel", "hybrid", "electric"]),
    ac: z.boolean(),
    driverAvailable: z.boolean(),
    driverOption: z.enum(["self-drive", "with-driver", "both"]),
    location: text(120),
    destinations: z.array(slug).max(30),
    features: list(30, 80),
    availability: z.enum(["available", "limited", "booked"]),
    rentalConditions: list(30),
    description: text(2000),
    popular: z.boolean().optional(),
  })
  .strict();

/**
 * Stay & Dine records stay samples while HOSPITALITY_PREVIEW is on: the status
 * and the empty price, rating, hours and map pin cannot change.
 */
const sampleStatus = HOSPITALITY_PREVIEW ? z.literal("sample") : z.enum(["sample", "verified"]);
const STAY_TYPES = ["hotel", "resort", "villa", "guesthouse", "lodge", "apartment"] as const;
const AMENITIES = ["wifi", "restaurant", "parking", "air-conditioning", "room-service", "pool", "airport-transfer", "reception-24h", "beachfront", "generator"] as const;
const DINING_STYLES = ["casual", "cafe", "fine-dining", "beachfront", "street-food"] as const;
const DINING_FEATURES = ["outdoor-seating", "takeaway", "vegetarian-options", "parking", "wifi", "live-music"] as const;

export const staySchema = z
  .object({
    id: text(80),
    slug,
    name: text(160),
    type: z.enum(STAY_TYPES),
    destination: slug,
    area: optionalText(120).optional(),
    summary: text(600),
    description: text(2000),
    price: z.null(),
    rating: z.null(),
    images: z.array(imageSchema).min(1).max(20),
    amenities: z.array(z.enum(AMENITIES)).max(AMENITIES.length),
    coordinates: z.null(),
    availability: z.literal("on-request"),
    featured: z.boolean(),
    status: sampleStatus,
  })
  .strict();

export const diningSchema = z
  .object({
    id: text(80),
    slug,
    name: text(160),
    cuisines: list(10, 60),
    destination: slug,
    area: optionalText(120).optional(),
    summary: text(600),
    description: text(2000),
    priceRange: z.null(),
    rating: z.null(),
    images: z.array(imageSchema).min(1).max(20),
    style: z.enum(DINING_STYLES),
    features: z.array(z.enum(DINING_FEATURES)).max(DINING_FEATURES.length),
    hours: z.null(),
    menuUrl: z.null(),
    coordinates: z.null(),
    reservation: z.literal("on-request"),
    featured: z.boolean(),
    status: sampleStatus,
  })
  .strict();

/** What the admin form shows for each field. */
export type FieldDef =
  | { kind: "text"; name: string; label: string; max: number; multiline?: boolean; help?: string; optional?: boolean }
  | { kind: "number"; name: string; label: string; min: number; max: number; help?: string }
  | { kind: "select"; name: string; label: string; options: readonly string[] }
  | { kind: "ref"; name: string; label: string; collection: CollectionId; allowEmpty?: boolean }
  | { kind: "textList"; name: string; label: string; claims?: boolean; help?: string }
  | { kind: "image"; name: string; label: string; optional?: boolean }
  | { kind: "boolean"; name: string; label: string }
  | { kind: "checkboxes"; name: string; label: string; options: readonly string[] }
  | { kind: "claim"; name: string; label: string; help?: string }
  | { kind: "group"; name: string; label: string; fields: FieldDef[]; help?: string }
  | { kind: "readonly"; name: string; label: string; help?: string }
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
  /** Where the published record is on the public site; empty when it has no page. */
  paths: (data: Record<string, unknown>) => string[];
  /** A capability needed on top of the operation's own (team profiles need `team.profiles`). */
  editCapability?: Capability;
  /** Top-level fields only `claims.source` may change (a testimonial's source). */
  sourceFields?: readonly string[];
  /** Why this record cannot be published yet, or null. */
  publishCheck?: (data: Record<string, unknown>) => string | null;
};

export const COLLECTION_IDS = [
  "circuits",
  "destinations",
  "tours",
  "faq-groups",
  "services",
  "journal-posts",
  "journal-categories",
  "cruise-overview",
  "cruise-excursions",
  "cruise-destinations",
  "vehicles",
  "vehicle-categories",
  "testimonials",
  "team-profiles",
  "stays",
  "dining",
] as const;
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
    paths: (d) => [`/destinations/${d.id}`],
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
    paths: (d) => [`/destinations/${d.circuit}/${d.slug}`],
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
    paths: (d) => [`/tours/${d.slug}`],
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
    paths: () => [],
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
  services: {
    id: "services",
    label: "Services",
    singular: "service",
    keyField: "slug",
    titleField: "name",
    fixedKey: false,
    canCreate: true,
    schema: serviceSchema as unknown as z.ZodType<Record<string, unknown>>,
    paths: (d) => [`/services/${d.slug}`],
    fields: [
      { kind: "text", name: "name", label: "Name", max: 120 },
      { kind: "text", name: "slug", label: "Address (slug)", max: 80 },
      { kind: "text", name: "summary", label: "Summary", max: 600, multiline: true },
      { kind: "textList", name: "benefits", label: "Benefits", claims: true, help: "A claim needs a source link and date before the site shows it." },
      { kind: "textList", name: "process", label: "How it works" },
      { kind: "image", name: "image", label: "Photo", optional: true },
    ],
  },
  "journal-posts": {
    id: "journal-posts",
    label: "Journal posts",
    singular: "journal post",
    keyField: "slug",
    titleField: "title",
    fixedKey: false,
    canCreate: true,
    schema: journalPostSchema as unknown as z.ZodType<Record<string, unknown>>,
    paths: (d) => [`/journal/${d.slug}`, `/journal/${d.category}/${d.slug}`],
    fields: [
      { kind: "text", name: "title", label: "Title", max: 200 },
      { kind: "text", name: "slug", label: "Address (slug)", max: 80 },
      { kind: "ref", name: "category", label: "Category", collection: "journal-categories" },
      { kind: "text", name: "date", label: "Date (YYYY-MM-DD)", max: 10 },
      { kind: "text", name: "excerpt", label: "Excerpt", max: 400, multiline: true },
      { kind: "text", name: "body", label: "Text", max: 20000, multiline: true, help: "Leave an empty line between paragraphs." },
      { kind: "image", name: "image", label: "Photo" },
    ],
  },
  "journal-categories": {
    id: "journal-categories",
    label: "Journal categories",
    singular: "journal category",
    keyField: "slug",
    titleField: "label",
    fixedKey: false,
    canCreate: true,
    schema: journalCategorySchema as unknown as z.ZodType<Record<string, unknown>>,
    paths: (d) => [`/journal/category/${d.slug}`],
    fields: [
      { kind: "text", name: "label", label: "Name", max: 80 },
      { kind: "text", name: "slug", label: "Address (slug)", max: 80 },
    ],
  },
  "cruise-overview": {
    id: "cruise-overview",
    label: "Cruise services",
    singular: "cruise service",
    keyField: "id",
    titleField: "title",
    fixedKey: false,
    canCreate: true,
    schema: cruiseOverviewSchema as unknown as z.ZodType<Record<string, unknown>>,
    paths: () => [],
    fields: [
      { kind: "text", name: "title", label: "Title", max: 120 },
      { kind: "text", name: "id", label: "Key", max: 80 },
      { kind: "text", name: "body", label: "Text", max: 1000, multiline: true },
      { kind: "image", name: "image", label: "Photo" },
    ],
  },
  "cruise-excursions": {
    id: "cruise-excursions",
    label: "Shore excursions",
    singular: "shore excursion",
    keyField: "id",
    titleField: "name",
    fixedKey: false,
    canCreate: true,
    schema: cruiseExcursionSchema as unknown as z.ZodType<Record<string, unknown>>,
    paths: () => [],
    fields: [
      { kind: "text", name: "name", label: "Name", max: 160 },
      { kind: "text", name: "id", label: "Key", max: 80 },
      { kind: "text", name: "destination", label: "Destination", max: 120 },
      { kind: "text", name: "summary", label: "Summary", max: 1000, multiline: true },
      { kind: "text", name: "itineraryNotes", label: "Itinerary notes", max: 2000, multiline: true, optional: true },
      { kind: "textList", name: "activities", label: "Activities" },
      { kind: "checkboxes", name: "experienceTags", label: "Experience", options: EXPERIENCE_TAGS },
      { kind: "number", name: "groupMin", label: "Smallest group", min: 0, max: 5000 },
      { kind: "number", name: "groupMax", label: "Largest group", min: 0, max: 5000 },
      { kind: "text", name: "departure", label: "Departure point", max: 200 },
      { kind: "textList", name: "inclusions", label: "Included" },
      { kind: "image", name: "image", label: "Photo" },
    ],
  },
  "cruise-destinations": {
    id: "cruise-destinations",
    label: "Cruise destinations",
    singular: "cruise destination",
    keyField: "id",
    titleField: "name",
    fixedKey: false,
    canCreate: true,
    schema: cruiseDestinationSchema as unknown as z.ZodType<Record<string, unknown>>,
    paths: () => [],
    fields: [
      { kind: "text", name: "name", label: "Name", max: 120 },
      { kind: "text", name: "id", label: "Key", max: 80 },
      { kind: "text", name: "summary", label: "Summary", max: 1000, multiline: true },
      { kind: "image", name: "image", label: "Photo" },
    ],
  },
  vehicles: {
    id: "vehicles",
    label: "Vehicles",
    singular: "vehicle",
    keyField: "id",
    titleField: "name",
    fixedKey: false,
    canCreate: true,
    schema: vehicleSchema as unknown as z.ZodType<Record<string, unknown>>,
    paths: (d) => [`/services/vehicle-rental/vehicles/${d.id}`, `/services/vehicle-rental/book/${d.id}`],
    fields: [
      { kind: "text", name: "name", label: "Name", max: 120 },
      { kind: "text", name: "id", label: "Address (slug)", max: 80 },
      { kind: "ref", name: "category", label: "Category", collection: "vehicle-categories" },
      { kind: "text", name: "description", label: "Description", max: 2000, multiline: true },
      { kind: "image", name: "image", label: "Main photo" },
      { kind: "gallery", name: "gallery", label: "Gallery" },
      { kind: "number", name: "seats", label: "Seats", min: 1, max: 100 },
      { kind: "number", name: "doors", label: "Doors", min: 0, max: 10 },
      { kind: "number", name: "luggage", label: "Bags", min: 0, max: 100 },
      { kind: "select", name: "transmission", label: "Transmission", options: ["manual", "automatic"] },
      { kind: "select", name: "fuelType", label: "Fuel", options: ["petrol", "diesel", "hybrid", "electric"] },
      { kind: "boolean", name: "ac", label: "Air conditioning" },
      { kind: "boolean", name: "driverAvailable", label: "Driver available" },
      { kind: "select", name: "driverOption", label: "Driving", options: ["self-drive", "with-driver", "both"] },
      { kind: "text", name: "location", label: "Based in", max: 120 },
      { kind: "textList", name: "destinations", label: "Places it goes (keys)" },
      { kind: "textList", name: "features", label: "Features" },
      { kind: "textList", name: "rentalConditions", label: "Rental conditions" },
      { kind: "boolean", name: "popular", label: "Show among popular vehicles" },
      { kind: "readonly", name: "availability", label: "Availability (kept, never shown)", help: "The site takes enquiries only, so availability is neither shown nor edited." },
    ],
  },
  "vehicle-categories": {
    id: "vehicle-categories",
    label: "Vehicle categories",
    singular: "vehicle category",
    keyField: "slug",
    titleField: "label",
    fixedKey: true,
    canCreate: false,
    schema: vehicleCategorySchema as unknown as z.ZodType<Record<string, unknown>>,
    paths: () => [],
    fields: [
      { kind: "text", name: "label", label: "Name", max: 80 },
      { kind: "text", name: "description", label: "Description", max: 600, multiline: true },
      { kind: "image", name: "image", label: "Photo" },
      { kind: "text", name: "seats", label: "Seats as shown", max: 40 },
      { kind: "text", name: "luggage", label: "Bags as shown", max: 40 },
      { kind: "text", name: "transmission", label: "Transmission as shown", max: 40 },
      { kind: "claim", name: "startingPrice", label: "Starting price", help: "A price shows only with a source link and date." },
    ],
  },
  testimonials: {
    id: "testimonials",
    label: "Testimonials",
    singular: "testimonial",
    keyField: "key",
    titleField: "name",
    fixedKey: false,
    canCreate: true,
    schema: testimonialSchema as unknown as z.ZodType<Record<string, unknown>>,
    paths: () => [],
    sourceFields: ["sourceUrl", "sourceDate"],
    publishCheck: (d) =>
      d.sourceUrl && d.sourceDate ? null : "A testimonial is published only with a source link and date (an ADMIN or SUPER_ADMIN records them).",
    fields: [
      { kind: "text", name: "name", label: "Name", max: 120 },
      { kind: "text", name: "key", label: "Key", max: 80 },
      { kind: "text", name: "handle", label: "Handle", max: 80, optional: true },
      { kind: "text", name: "quote", label: "Quote", max: 1000, multiline: true },
      { kind: "text", name: "sourceUrl", label: "Source link", max: 500, optional: true, help: "Where the quote was published. Needed to publish." },
      { kind: "text", name: "sourceDate", label: "Source date (YYYY-MM-DD)", max: 10, optional: true },
      { kind: "text", name: "consentNote", label: "Consent note", max: 500, optional: true },
    ],
  },
  "team-profiles": {
    id: "team-profiles",
    label: "Team profiles",
    singular: "team profile",
    keyField: "slug",
    titleField: "name",
    fixedKey: false,
    canCreate: true,
    schema: teamProfileSchema as unknown as z.ZodType<Record<string, unknown>>,
    paths: () => [],
    editCapability: "team.profiles",
    fields: [
      { kind: "text", name: "name", label: "Name", max: 120 },
      { kind: "text", name: "slug", label: "Key", max: 80 },
      { kind: "text", name: "role", label: "Role", max: 120 },
      { kind: "text", name: "bio", label: "Bio", max: 1000, multiline: true },
      { kind: "image", name: "photo", label: "Photo", optional: true },
      {
        kind: "group",
        name: "photoConsent",
        label: "Photo consent",
        help: "The site shows the photo only once who recorded consent, and when, are filled in.",
        fields: [
          { kind: "text", name: "recordedBy", label: "Recorded by", max: 120, optional: true },
          { kind: "text", name: "recordedAt", label: "Recorded on (YYYY-MM-DD)", max: 10, optional: true },
          { kind: "text", name: "note", label: "Note", max: 500, multiline: true, optional: true },
        ],
      },
    ],
  },
  stays: {
    id: "stays",
    label: "Stay samples",
    singular: "sample stay",
    keyField: "slug",
    titleField: "name",
    fixedKey: false,
    canCreate: true,
    schema: staySchema as unknown as z.ZodType<Record<string, unknown>>,
    paths: (d) => [`/hospitality/stays/${d.slug}`],
    fields: [
      { kind: "readonly", name: "status", label: "Status", help: "Locked to sample while the Stay & Dine preview is on." },
      { kind: "text", name: "name", label: "Name", max: 160 },
      { kind: "text", name: "slug", label: "Address (slug)", max: 80 },
      { kind: "select", name: "type", label: "Type", options: STAY_TYPES },
      { kind: "text", name: "destination", label: "Destination key", max: 80 },
      { kind: "text", name: "area", label: "Area", max: 120, optional: true },
      { kind: "text", name: "summary", label: "Summary", max: 600, multiline: true },
      { kind: "text", name: "description", label: "Description", max: 2000, multiline: true },
      { kind: "gallery", name: "images", label: "Photos" },
      { kind: "checkboxes", name: "amenities", label: "Amenities", options: AMENITIES },
      { kind: "boolean", name: "featured", label: "Featured" },
    ],
  },
  dining: {
    id: "dining",
    label: "Dining samples",
    singular: "sample dining place",
    keyField: "slug",
    titleField: "name",
    fixedKey: false,
    canCreate: true,
    schema: diningSchema as unknown as z.ZodType<Record<string, unknown>>,
    paths: (d) => [`/hospitality/dining/${d.slug}`],
    fields: [
      { kind: "readonly", name: "status", label: "Status", help: "Locked to sample while the Stay & Dine preview is on." },
      { kind: "text", name: "name", label: "Name", max: 160 },
      { kind: "text", name: "slug", label: "Address (slug)", max: 80 },
      { kind: "textList", name: "cuisines", label: "Cuisines" },
      { kind: "text", name: "destination", label: "Destination key", max: 80 },
      { kind: "text", name: "area", label: "Area", max: 120, optional: true },
      { kind: "text", name: "summary", label: "Summary", max: 600, multiline: true },
      { kind: "text", name: "description", label: "Description", max: 2000, multiline: true },
      { kind: "gallery", name: "images", label: "Photos" },
      { kind: "select", name: "style", label: "Style", options: DINING_STYLES },
      { kind: "checkboxes", name: "features", label: "Features", options: DINING_FEATURES },
      { kind: "boolean", name: "featured", label: "Featured" },
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
  const isImage = (v: unknown): v is ImageRef =>
    typeof v === "object" && v !== null && "media" in v && typeof (v as ImageRef).media === "string";
  // Photo lists first, then single photos: the order the 0010 seed was generated in.
  for (const [field, value] of Object.entries(data)) {
    if (Array.isArray(value)) value.forEach((v, i) => isImage(v) && v.media && media.push({ id: v.media, field: `${field}.${i}` }));
  }
  for (const [field, value] of Object.entries(data)) {
    if (isImage(value) && value.media) media.push({ id: value.media, field });
  }
  if (collection === "destinations") items.push({ collection: "circuits", key: String(data.circuit), field: "circuit" });
  if (collection === "tours") {
    items.push({ collection: "circuits", key: String(data.circuit), field: "circuit" });
    items.push({ collection: "destinations", key: String(data.destinationSlug), field: "destinationSlug" });
    if (data.faqGroup) items.push({ collection: "faq-groups", key: String(data.faqGroup), field: "faqGroup" });
  }
  if (collection === "journal-posts") items.push({ collection: "journal-categories", key: String(data.category), field: "category" });
  if (collection === "vehicles") items.push({ collection: "vehicle-categories", key: String(data.category), field: "category" });
  return { items, media };
}
