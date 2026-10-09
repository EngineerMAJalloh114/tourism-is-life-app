/** The starting values of a new record's form. Empty fields must be filled before the first save. */
import type { CollectionId } from "@/lib/collections/registry";

const image = { media: "", alt: "" };

export const BLANK_RECORDS: Record<CollectionId, Record<string, unknown>> = {
  circuits: {},
  destinations: { slug: "", name: "", circuit: "western-circuit", country: "sierra-leone", summary: "", image },
  tours: {
    slug: "",
    title: "",
    country: "sierra-leone",
    circuit: "western-circuit",
    destinationSlug: "freetown",
    duration: "",
    durationDays: 1,
    category: "culture",
    difficulty: "easy",
    groupMin: 0,
    groupMax: 0,
    languages: ["English"],
    summary: "",
    highlights: [],
    inclusions: [],
    exclusions: [],
    requirements: "",
    meetingPoint: "",
    image,
    gallery: [],
    itinerary: [{ day: 1, title: "", description: "" }],
    faqGroup: "tour-shared",
    faqs: [],
  },
  "faq-groups": { key: "", name: "", items: [{ q: "", a: "" }] },
};
