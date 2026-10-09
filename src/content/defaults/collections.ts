/**
 * Circuits, destinations, tours and the shared tour questions as records
 * (task A8), built from `src/data/catalog.ts`. The seed in
 * `0010_collections` is these records serialised by
 * `scripts/content/generate-seed.mjs`.
 *
 * What changes shape on the way, and why:
 *   - Photos become `{ media, alt }`, pointing at the photo's row in the media
 *     library (every path here is a seeded repository photo).
 *   - The four questions every tour shares become one FAQ group the tours
 *     point at; a tour's own questions stay on the tour (none today).
 *   - "Licensed guide" in an inclusion list is a claim with no source yet
 *     (inventory M8), so the site leaves it out until a source is recorded.
 *   - `rating`, `reviewCount`, `priceCents`, `currency` and `bookable` are not
 *     records' fields: ratings and rates live in their own tables (A10), no
 *     tour has a price, and booking stays out of the admin.
 *
 * Server only (it computes media ids with node:crypto).
 */
import { articleCategories, articles, circuits, destinations, services, team, testimonial, tours, type Tour } from "@/data/catalog";
import { cruiseDestinations, cruiseOverview, excursions } from "@/data/cruise";
import { SAMPLE_DINING, SAMPLE_STAYS } from "@/data/hospitality";
import { vehicleCategories, vehicles } from "@/data/vehicle-rental";
import type { Claim, CollectionId } from "@/lib/collections/registry";
import { repositoryMediaId } from "@/lib/server/content-ids";

export const SHARED_TOUR_FAQ_GROUP = "tour-shared";

/** Inclusion lines that are claims needing a source (inventory M8). */
export const CLAIMED_INCLUSIONS = ["Licensed guide"];

const image = (src: string, alt: string) => ({ media: repositoryMediaId(src), alt });

function asClaim(text: string): string | Claim {
  return CLAIMED_INCLUSIONS.includes(text) ? { claim: text, sourceUrl: "", sourceDate: "", fallback: "" } : text;
}

const sharedFaqs = tours[0].faqs;

export type SeedRecord = { collection: CollectionId; key: string; position: number; data: Record<string, unknown> };

export function collectionDefaults(): SeedRecord[] {
  const out: SeedRecord[] = [];
  circuits.forEach((c, i) =>
    out.push({
      collection: "circuits",
      key: c.id,
      position: i,
      data: { id: c.id, name: c.name, region: c.region, bestTime: c.bestTime, summary: c.summary, image: image(c.image, c.imageAlt), highlights: [...c.highlights] },
    }),
  );
  destinations.forEach((d, i) =>
    out.push({
      collection: "destinations",
      key: d.slug,
      position: i,
      data: { slug: d.slug, name: d.name, circuit: d.circuit, country: d.country, summary: d.summary, image: image(d.image, d.imageAlt) },
    }),
  );
  out.push({
    collection: "faq-groups",
    key: SHARED_TOUR_FAQ_GROUP,
    position: 0,
    data: { key: SHARED_TOUR_FAQ_GROUP, name: "Questions every tour shows", items: sharedFaqs.map((f) => ({ q: f.q, a: f.a })) },
  });
  tours.forEach((t: Tour, i) => {
    const shared = JSON.stringify(t.faqs.slice(0, sharedFaqs.length)) === JSON.stringify(sharedFaqs);
    out.push({
      collection: "tours",
      key: t.slug,
      position: i,
      data: {
        slug: t.slug,
        title: t.title,
        country: t.country,
        circuit: t.circuit,
        destinationSlug: t.destinationSlug,
        duration: t.duration,
        durationDays: t.durationDays,
        category: t.category,
        difficulty: t.difficulty,
        groupMin: t.groupMin,
        groupMax: t.groupMax,
        languages: [...t.languages],
        summary: t.summary,
        highlights: [...t.highlights],
        inclusions: t.inclusions.map(asClaim),
        exclusions: [...t.exclusions],
        requirements: t.requirements,
        meetingPoint: t.meetingPoint,
        image: image(t.image, t.imageAlt),
        gallery: t.gallery.map((g) => image(g.src, g.alt)),
        itinerary: t.itinerary.map((d) => ({ day: d.day, title: d.title, description: d.description })),
        faqGroup: shared ? SHARED_TOUR_FAQ_GROUP : "",
        faqs: (shared ? t.faqs.slice(sharedFaqs.length) : t.faqs).map((f) => ({ q: f.q, a: f.a })),
      },
    });
  });
  return out;
}

/** Fields of a catalogue tour that are deliberately not part of the record. */
export const TOUR_FIELDS_NOT_IN_RECORDS = ["bookable", "rating", "reviewCount", "priceCents", "currency"] as const;

// ---------------------------------------------------------------- task A9

/** Service benefit lines that are claims needing a source (inventory M8). */
export const CLAIMED_BENEFITS = ["Licensed guides"];

/** Shown instead of an unsourced vehicle-category starting price. */
export const PRICE_FALLBACK = "Rate on request";

/** Fields of a vehicle or shore excursion that are rates (task A10), not part of the record. */
export const VEHICLE_FIELDS_NOT_IN_RECORDS = ["pricing"] as const;
export const EXCURSION_FIELDS_NOT_IN_RECORDS = ["priceUsdPerPerson"] as const;

const claimIf = (text: string, claimed: string[]): string | Claim =>
  claimed.includes(text) ? { claim: text, sourceUrl: "", sourceDate: "", fallback: "" } : text;

const photo = (p: { src: string; alt: string; position?: string }) =>
  p.position === undefined ? image(p.src, p.alt) : { ...image(p.src, p.alt), position: p.position };

/** Records whose seed is a draft, not published (the testimonial has no source, rule 2). */
export type SeedRecordII = SeedRecord & { status?: "draft" };

/**
 * Services, journal, cruise, vehicles, the testimonial, team profiles and the
 * Stay & Dine samples as records (task A9), from their data files. What
 * changes shape: photos become media references (keeping `position`); prices
 * leave the records for the rates table (A10); "Licensed guides" and each
 * vehicle category's starting price are claims with no source; a team photo
 * is kept with its consent empty; the testimonial is seeded unpublished.
 */
export function collectionDefaultsII(): SeedRecordII[] {
  const out: SeedRecordII[] = [];
  const push = (collection: CollectionId, key: string, position: number, data: Record<string, unknown>, status?: "draft") =>
    out.push({ collection, key, position, data, ...(status ? { status } : {}) });

  services.forEach((s, i) =>
    push("services", s.slug, i, {
      slug: s.slug,
      name: s.name,
      summary: s.summary,
      benefits: s.benefits.map((b) => claimIf(b, CLAIMED_BENEFITS)),
      process: [...s.process],
      image: s.image ? image(s.image, s.imageAlt ?? "") : null,
    }),
  );
  articleCategories.forEach((c, i) => push("journal-categories", c.slug, i, { slug: c.slug, label: c.label }));
  articles.forEach((a, i) =>
    push("journal-posts", a.slug, i, {
      slug: a.slug,
      category: a.category,
      title: a.title,
      date: a.date,
      excerpt: a.excerpt,
      body: a.body,
      image: image(a.image, a.imageAlt),
    }),
  );
  cruiseOverview.forEach((c, i) => push("cruise-overview", c.id, i, { id: c.id, title: c.title, body: c.body, image: image(c.image, c.imageAlt) }));
  excursions.forEach((e, i) => {
    const { priceUsdPerPerson: _price, image: src, imageAlt, ...rest } = e;
    push("cruise-excursions", e.id, i, {
      ...rest,
      activities: [...e.activities],
      experienceTags: [...e.experienceTags],
      inclusions: [...e.inclusions],
      image: image(src, imageAlt),
    });
  });
  cruiseDestinations.forEach((d, i) => push("cruise-destinations", d.id, i, { id: d.id, name: d.name, summary: d.summary, image: image(d.image, d.imageAlt) }));
  vehicleCategories.forEach((c, i) =>
    push("vehicle-categories", c.slug, i, {
      slug: c.slug,
      label: c.label,
      description: c.description,
      image: image(c.image, c.imageAlt),
      seats: c.seats,
      luggage: c.luggage,
      transmission: c.transmission,
      startingPrice: { claim: c.startingPrice, sourceUrl: "", sourceDate: "", fallback: PRICE_FALLBACK },
    }),
  );
  vehicles.forEach((v, i) => {
    const { pricing: _pricing, image: src, imageAlt, gallery, ...rest } = v;
    push("vehicles", v.id, i, {
      ...rest,
      destinations: [...v.destinations],
      features: [...v.features],
      rentalConditions: [...v.rentalConditions],
      image: image(src, imageAlt),
      gallery: gallery.map((g) => image(g.src, g.alt)),
    });
  });
  push(
    "testimonials",
    "jorg-ehrlich",
    0,
    { key: "jorg-ehrlich", name: testimonial.name, handle: testimonial.handle, quote: testimonial.quote, sourceUrl: "", sourceDate: "", consentNote: "" },
    "draft",
  );
  team.forEach((m, i) =>
    push("team-profiles", m.slug, i, {
      slug: m.slug,
      name: m.name,
      role: m.role,
      bio: m.bio,
      photo: m.image ? image(m.image, m.imageAlt ?? "") : null,
      photoConsent: { recordedBy: "", recordedAt: "", note: "" },
    }),
  );
  SAMPLE_STAYS.forEach((s, i) => push("stays", s.slug, i, { ...s, amenities: [...s.amenities], images: s.images.map(photo) }));
  SAMPLE_DINING.forEach((d, i) =>
    push("dining", d.slug, i, { ...d, cuisines: [...d.cuisines], features: [...d.features], images: d.images.map(photo) }),
  );
  return out;
}
