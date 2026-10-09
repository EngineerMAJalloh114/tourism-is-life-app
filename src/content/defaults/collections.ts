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
import { circuits, destinations, tours, type Tour } from "@/data/catalog";
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
