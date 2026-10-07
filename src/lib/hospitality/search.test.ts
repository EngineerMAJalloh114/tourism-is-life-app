import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DESTINATION_OPTIONS, HERO_SLIDES, SAMPLE_DINING, SAMPLE_STAYS } from "../../data/hospitality.ts";
import {
  DEFAULT_SEARCH,
  availableSorts,
  cleanIsoDate,
  filterDining,
  filterStays,
  isValidRange,
  nightsBetween,
  parseSearch,
  resultsHeading,
  searchDestinations,
  sortStays,
  toUrlSearch,
} from "./search.ts";

describe("hospitality dates", () => {
  it("accepts only real calendar dates", () => {
    assert.equal(cleanIsoDate("2026-10-05"), "2026-10-05");
    assert.equal(cleanIsoDate("2026-02-30"), "");
    assert.equal(cleanIsoDate("05/10/2026"), "");
    assert.equal(cleanIsoDate(undefined), "");
  });

  it("counts nights and rejects a check-out that is not after check-in", () => {
    assert.equal(nightsBetween("2026-10-05", "2026-10-08"), 3);
    assert.equal(nightsBetween("2026-10-05", "2026-10-05"), 0);
    assert.equal(nightsBetween("2026-10-08", "2026-10-05"), 0);
    assert.equal(isValidRange("2026-10-05", "2026-10-06"), true);
    assert.equal(isValidRange("", "2026-10-06"), false);
  });
});

describe("parseSearch", () => {
  it("returns the defaults for an empty URL", () => {
    assert.deepEqual(parseSearch({}), DEFAULT_SEARCH);
  });

  it("drops a check-out that precedes check-in, from a hand-edited link", () => {
    const s = parseSearch({ in: "2026-10-10", out: "2026-10-01" });
    assert.equal(s.checkIn, "2026-10-10");
    assert.equal(s.checkOut, "");
  });

  it("clamps guest counts and ignores junk", () => {
    const s = parseSearch({ adults: 999, kids: -4, party: "abc", sort: "nonsense", kind: "x" });
    assert.equal(s.adults, 12);
    assert.equal(s.children, 0);
    assert.equal(s.party, DEFAULT_SEARCH.party);
    assert.equal(s.sort, "featured");
    assert.equal(s.kind, "stays");
  });

  it("splits comma lists, lowercases and de-duplicates", () => {
    assert.deepEqual(parseSearch({ types: "Hotel, lodge,hotel,," }).types, ["hotel", "lodge"]);
  });

  it("round-trips through the URL form without defaults", () => {
    assert.deepEqual(toUrlSearch(DEFAULT_SEARCH), {});
    const s = parseSearch({ kind: "dining", dest: "freetown", cuisines: "seafood", party: 4 });
    assert.deepEqual(parseSearch(toUrlSearch(s) as Record<string, unknown>), s);
  });
});

describe("stays filtering", () => {
  it("filters by destination", () => {
    const r = filterStays(SAMPLE_STAYS, parseSearch({ dest: "freetown" }), DESTINATION_OPTIONS);
    assert.ok(r.length > 0);
    assert.ok(r.every((x) => x.destination === "freetown"));
  });

  it("requires every selected amenity, but any selected type", () => {
    const both = filterStays(SAMPLE_STAYS, parseSearch({ amenities: "wifi,pool" }), DESTINATION_OPTIONS);
    assert.ok(both.every((x) => x.amenities.includes("wifi") && x.amenities.includes("pool")));
    const types = filterStays(SAMPLE_STAYS, parseSearch({ types: "lodge,villa" }), DESTINATION_OPTIONS);
    assert.ok(types.length > 0 && types.every((x) => x.type === "lodge" || x.type === "villa"));
  });

  it("matches free text against the destination name and keywords", () => {
    const r = filterStays(SAMPLE_STAYS, parseSearch({ q: "tokeh" }), DESTINATION_OPTIONS);
    assert.ok(r.some((x) => x.area === "Tokeh"));
    assert.equal(filterStays(SAMPLE_STAYS, parseSearch({ q: "zzzz" }), DESTINATION_OPTIONS).length, 0);
  });

  it("does not offer price or rating sorting when no listing has either", () => {
    const ids = availableSorts(SAMPLE_STAYS, "stays").map((s) => s.id);
    assert.ok(!ids.includes("price-asc"));
    assert.ok(!ids.includes("rating-desc"));
  });

  it("puts featured listings first by default", () => {
    const sorted = sortStays(SAMPLE_STAYS, "featured");
    const firstNonFeatured = sorted.findIndex((x) => !x.featured);
    assert.ok(sorted.slice(firstNonFeatured).every((x) => !x.featured));
  });
});

describe("dining filtering", () => {
  it("filters by cuisine and style", () => {
    const r = filterDining(SAMPLE_DINING, parseSearch({ kind: "dining", cuisines: "seafood", styles: "beachfront" }), DESTINATION_OPTIONS);
    assert.ok(r.length > 0);
    assert.ok(r.every((x) => x.style === "beachfront" && x.cuisines.map((c) => c.toLowerCase()).includes("seafood")));
  });
});

describe("destinations and headings", () => {
  it("finds a destination by name or keyword", () => {
    assert.equal(searchDestinations(DESTINATION_OPTIONS, "lumley")[0]?.id, "freetown");
    assert.equal(searchDestinations(DESTINATION_OPTIONS, "").length, DESTINATION_OPTIONS.length);
  });

  it("titles results by destination", () => {
    assert.equal(resultsHeading(parseSearch({ dest: "freetown" }), DESTINATION_OPTIONS), "Places to stay in Freetown");
    assert.equal(resultsHeading(parseSearch({ kind: "dining" }), DESTINATION_OPTIONS), "Places to dine across Sierra Leone");
  });
});

describe("sample data honesty", () => {
  it("never carries a price, rating, review or live availability", () => {
    for (const x of [...SAMPLE_STAYS, ...SAMPLE_DINING]) {
      assert.equal(x.rating, null, x.name);
      assert.equal(x.status, "sample", x.name);
    }
    for (const x of SAMPLE_STAYS) assert.equal(x.price, null, x.name);
    for (const x of SAMPLE_DINING) assert.equal(x.priceRange, null, x.name);
  });

  it("gives every listing at least one image and unique slugs", () => {
    const slugs = new Set<string>();
    for (const x of [...SAMPLE_STAYS, ...SAMPLE_DINING]) {
      assert.ok(x.images.length >= 1, x.name);
      assert.ok(!slugs.has(x.slug), `duplicate slug ${x.slug}`);
      slugs.add(x.slug);
    }
  });

  it("points every listing at a known destination", () => {
    const ids = new Set(DESTINATION_OPTIONS.map((d) => d.id));
    for (const x of [...SAMPLE_STAYS, ...SAMPLE_DINING]) assert.ok(ids.has(x.destination), x.name);
  });

  it("has at least three hero states for each mode", () => {
    assert.ok(HERO_SLIDES.filter((s) => s.kind === "stays").length >= 3);
    assert.ok(HERO_SLIDES.filter((s) => s.kind === "dining").length >= 3);
  });
});
