import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { articleCategories, articles, services, team, testimonial } from "@/data/catalog";
import { cruiseDestinations, cruiseOverview, excursions } from "@/data/cruise";
import { SAMPLE_DINING, SAMPLE_STAYS } from "@/data/hospitality";
import { vehicleCategories, vehicles } from "@/data/vehicle-rental";
import { isClaim, type Claim, type CollectionId } from "@/lib/collections/registry";
import { claimText, teamPhoto, testimonialShown, visibleLines } from "@/lib/collections/render";
import type { Actor } from "@/lib/server/access";
import { collectionItemId } from "@/lib/server/content-ids";
import { getItem, listItems, publishedItems, publishItem, saveItemDraft, trashItem } from "@/lib/server/collections/items";
import { createTestDb, insertStaff, type TestDb } from "@/lib/server/testing/test-db";
import { seedBlocks } from "../../../../scripts/content/generate-seed.mjs";

type Data = Record<string, unknown>;
type Img = { media: string; alt: string; position?: string };

function rejectsWith(status: number, code?: string) {
  return (err: unknown) => {
    const e = err as { status?: number; code?: string };
    assert.equal(e.status, status, `expected HTTP ${status}, got ${e.status} (${String(err)})`);
    if (code) assert.equal(e.code, code);
    return true;
  };
}

const id = (collection: CollectionId, key: string) => collectionItemId(collection, key);

describe("collections II seed (0011)", () => {
  let db: TestDb;
  let paths: Map<string, string>;
  before(async () => {
    db = await createTestDb();
    paths = new Map((await db.sql<{ id: string; repo_path: string }>`select id, repo_path from media where origin = 'repository'`).map((m) => [m.id, m.repo_path]));
  });
  after(async () => {
    await db.close();
  });
  const src = (img: Img) => paths.get(img.media);
  const flat = (img: Img | null, srcKey = "image", altKey = "imageAlt") => (img ? { [srcKey]: src(img), [altKey]: img.alt } : {});
  const text = (v: unknown) => (isClaim(v) ? v.claim : v);
  const live = (c: CollectionId) => publishedItems(db.sql, c);

  it("is exactly what the generator makes from the data files", async () => {
    const seed = (await seedBlocks()).find((s) => s.file.endsWith("0011_collections_seed.sql"))!;
    const t = readFileSync(seed.file, "utf8").replace(/\r\n/g, "\n");
    assert.equal(t.slice(t.indexOf(seed.begin), t.indexOf(seed.end) + seed.end.length), seed.block);
  });

  it("services, journal and cruise records equal their constants", async () => {
    assert.deepEqual(
      (await live("services")).map(({ image, benefits, ...s }) => ({ ...s, benefits: (benefits as unknown[]).map(text), ...flat(image as Img | null) })),
      services.map((s) => ({ ...s })),
    );
    assert.deepEqual(await live("journal-categories"), articleCategories.map((c) => ({ ...c })));
    const labels = new Map(articleCategories.map((c) => [c.slug as string, c.label as string]));
    assert.deepEqual(
      (await live("journal-posts")).map(({ image, ...a }) => ({ ...a, categoryLabel: labels.get(a.category as string), ...flat(image as Img) })),
      articles.map((a) => ({ ...a })),
    );
    assert.deepEqual((await live("cruise-overview")).map(({ image, ...c }) => ({ ...c, ...flat(image as Img) })), cruiseOverview.map((c) => ({ ...c })));
    assert.deepEqual(
      (await live("cruise-excursions")).map(({ image, ...e }) => ({ ...e, ...flat(image as Img) })),
      excursions.map(({ priceUsdPerPerson: _p, ...e }) => ({ ...e })),
    );
    assert.deepEqual((await live("cruise-destinations")).map(({ image, ...d }) => ({ ...d, ...flat(image as Img) })), cruiseDestinations.map((d) => ({ ...d })));
  });

  it("vehicles, the testimonial, team profiles and Stay & Dine samples equal their constants", async () => {
    assert.deepEqual(
      (await live("vehicle-categories")).map(({ image, startingPrice, ...c }) => ({ ...c, startingPrice: (startingPrice as Claim).claim, ...flat(image as Img) })),
      vehicleCategories.map((c) => ({ ...c })),
    );
    assert.deepEqual(
      (await live("vehicles")).map(({ image, gallery, ...v }) => ({ ...v, ...flat(image as Img), gallery: (gallery as Img[]).map((g) => ({ src: src(g), alt: g.alt })) })),
      vehicles.map(({ pricing: _p, ...v }) => ({ ...v })),
    );
    // The testimonial has no source, so it is seeded as an unpublished draft.
    assert.deepEqual(await live("testimonials"), []);
    const draft = (await getItem(db.sql, await insertStaff(db.sql, "reader", "ADMIN"), { id: id("testimonials", "jorg-ehrlich") })).draft;
    assert.deepEqual({ name: draft.name, handle: draft.handle, quote: draft.quote }, testimonial);
    assert.deepEqual(
      (await live("team-profiles")).map(({ photo, photoConsent, ...m }) => {
        assert.deepEqual(photoConsent, { recordedBy: "", recordedAt: "", note: "" });
        return { ...m, ...flat(photo as Img | null) };
      }),
      team.map((m) => ({ ...m })),
    );
    const back = (imgs: Img[]) => imgs.map((p) => (p.position === undefined ? { src: src(p), alt: p.alt } : { src: src(p), alt: p.alt, position: p.position }));
    assert.deepEqual((await live("stays")).map((s) => ({ ...s, images: back(s.images as Img[]) })), SAMPLE_STAYS.map((s) => ({ ...s })));
    assert.deepEqual((await live("dining")).map((d) => ({ ...d, images: back(d.images as Img[]) })), SAMPLE_DINING.map((d) => ({ ...d })));
  });

  it("stores the unsourced claims as claim fields", async () => {
    const tours = (await live("services")).find((s) => s.slug === "tours-excursions")!;
    assert.ok((tours.benefits as unknown[]).some((b) => isClaim(b) && b.claim === "Licensed guides" && b.sourceUrl === ""));
    for (const c of await live("vehicle-categories")) assert.equal((c.startingPrice as Claim).sourceUrl, "", String(c.slug));
  });
});

describe("render rules (A9)", () => {
  const unsourced: Claim = { claim: "Licensed guides", sourceUrl: "", sourceDate: "", fallback: "" };
  const sourced: Claim = { ...unsourced, sourceUrl: "https://example.org/licence", sourceDate: "2026-09-01" };

  it("never returns a team photo without recorded consent", () => {
    const photo = { media: "img_x", alt: "A person" };
    assert.equal(teamPhoto({ photo, photoConsent: { recordedBy: "", recordedAt: "", note: "" } }), null);
    assert.equal(teamPhoto({ photo, photoConsent: { recordedBy: "Owner", recordedAt: "", note: "" } }), null);
    assert.equal(teamPhoto({ photo, photoConsent: { recordedBy: "", recordedAt: "2026-09-01", note: "" } }), null);
    assert.equal(teamPhoto({ photo, photoConsent: { recordedBy: "Owner", recordedAt: "yesterday", note: "" } }), null);
    assert.equal(teamPhoto({ photo: null, photoConsent: { recordedBy: "Owner", recordedAt: "2026-09-01", note: "" } }), null);
    assert.deepEqual(teamPhoto({ photo, photoConsent: { recordedBy: "Owner", recordedAt: "2026-09-01", note: "Asked in person" } }), photo);
  });

  it("shows a claim only with its source, otherwise its fallback or nothing", () => {
    assert.equal(claimText(unsourced), null);
    assert.equal(claimText({ ...unsourced, fallback: "Rate on request" }), "Rate on request");
    assert.equal(claimText(sourced), "Licensed guides");
    assert.deepEqual(visibleLines(["Half-day options", unsourced, "Private groups"]), ["Half-day options", "Private groups"]);
    assert.deepEqual(visibleLines(["Half-day options", sourced]), ["Half-day options", "Licensed guides"]);
  });

  it("shows a testimonial only with a source link and date", () => {
    assert.equal(testimonialShown({ sourceUrl: "", sourceDate: "" }), false);
    assert.equal(testimonialShown({ sourceUrl: "https://example.org/review", sourceDate: "" }), false);
    assert.equal(testimonialShown({ sourceUrl: "https://example.org/review", sourceDate: "2026-09-01" }), true);
  });
});

describe("collections II rules (A9)", () => {
  let db: TestDb;
  let editor: Actor;
  let admin: Actor;
  beforeEach(async () => {
    db = await createTestDb();
    editor = await insertStaff(db.sql, "editor", "CONTENT_MANAGER");
    admin = await insertStaff(db.sql, "dev", "ADMIN");
  });
  afterEach(async () => {
    await db.close();
  });

  async function edit(itemId: string, change: (d: Data) => void, actor = editor) {
    const item = await getItem(db.sql, actor, { id: itemId });
    const data = structuredClone(item.draft) as Data;
    change(data);
    return saveItemDraft(db.sql, actor, { id: itemId, rev: item.rev, data });
  }
  async function publish(itemId: string, actor = editor) {
    const item = await getItem(db.sql, actor, { id: itemId });
    return publishItem(db.sql, actor, { id: itemId, rev: item.rev });
  }

  it("a testimonial without a source cannot publish; only claims.source records one", async () => {
    const t = id("testimonials", "jorg-ehrlich");
    await assert.rejects(publish(t), rejectsWith(409, "NOT_READY"));
    await assert.rejects(edit(t, (d) => ((d.sourceUrl = "https://example.org/review"), (d.sourceDate = "2026-09-01"))), rejectsWith(403, "CLAIM_SOURCE"));
    await edit(t, (d) => ((d.sourceUrl = "https://example.org/review"), (d.sourceDate = "2026-09-01")), admin);
    await publish(t);
    assert.equal((await publishedItems(db.sql, "testimonials")).length, 1);
  });

  it("the sample status, and the empty price and rating, cannot change", async () => {
    const stay = id("stays", "atlantic-lumley-hotel");
    await assert.rejects(edit(stay, (d) => (d.status = "verified")), rejectsWith(400, "RECORD_INVALID"));
    await assert.rejects(edit(stay, (d) => (d.price = { amount: 100, currency: "USD" })), rejectsWith(400, "RECORD_INVALID"));
    await assert.rejects(edit(stay, (d) => (d.rating = { value: 4.5, count: 10 })), rejectsWith(400, "RECORD_INVALID"));
    const dining = (await listItems(db.sql, editor, { collection: "dining" }))[0];
    await assert.rejects(edit(dining.id, (d) => (d.status = "verified")), rejectsWith(400, "RECORD_INVALID"));
    await assert.rejects(edit(dining.id, (d) => (d.menuUrl = "https://example.org/menu")), rejectsWith(400, "RECORD_INVALID"));
    // Ordinary edits still work.
    await edit(stay, (d) => (d.summary = "A hotel building on the road at Lumley. Sample listing."));
  });

  it("team profiles need team.profiles: CONTENT_MANAGER is refused, ADMIN may edit", async () => {
    const profile = id("team-profiles", "isha-bangura");
    await assert.rejects(listItems(db.sql, editor, { collection: "team-profiles" }), rejectsWith(403));
    await assert.rejects(getItem(db.sql, editor, { id: profile }), rejectsWith(403));
    await assert.rejects(saveItemDraft(db.sql, editor, { id: profile, rev: 1, data: {} }), rejectsWith(403));
    await edit(profile, (d) => ((d.photoConsent as Data).recordedBy = "Owner"), admin);
    const item = await getItem(db.sql, admin, { id: profile });
    assert.equal(teamPhoto(item.draft as never), null, "consent date still missing");
  });

  it("a journal post's slug change redirects both of its addresses", async () => {
    const post = id("journal-posts", "tacugama-krio");
    await edit(post, (d) => (d.slug = "tacugama-and-krio-heritage"));
    const result = await publish(post);
    assert.deepEqual(result.redirects, [
      { from: "/journal/tacugama-krio", to: "/journal/tacugama-and-krio-heritage" },
      { from: "/journal/wildlife/tacugama-krio", to: "/journal/wildlife/tacugama-and-krio-heritage" },
    ]);
  });

  it("a journal category used by posts and a vehicle category used by vehicles cannot be deleted", async () => {
    await assert.rejects(trashItem(db.sql, admin, { id: id("journal-categories", "wildlife") }), rejectsWith(409, "IN_USE"));
    await assert.rejects(trashItem(db.sql, admin, { id: id("vehicle-categories", "economy") }), rejectsWith(409, "IN_USE"));
    // An unused category can go.
    await trashItem(db.sql, admin, { id: id("journal-categories", "adventure") });
  });

  it("a vehicle keeps its availability field and has no price; vehicle categories are fixed", async () => {
    const vehicle = id("vehicles", "toyota-corolla-economy");
    const item = await getItem(db.sql, editor, { id: vehicle });
    assert.equal(item.draft.availability, "available");
    assert.equal("pricing" in item.draft, false);
    await assert.rejects(edit(vehicle, (d) => delete d.availability), rejectsWith(400, "RECORD_INVALID"));
    await assert.rejects(edit(vehicle, (d) => (d.pricing = { type: "per-day", dailyRateCents: 3500, currency: "USD" })), rejectsWith(400, "RECORD_INVALID"));
    await assert.rejects(edit(id("vehicle-categories", "economy"), (d) => (d.slug = "budget")), rejectsWith(400, "RECORD_INVALID"));
    await assert.rejects(edit(id("vehicle-categories", "economy"), (d) => (d.slug = "sedan")), rejectsWith(409, "FIXED_KEY"));
  });

  it("a shore excursion has no price in its record", async () => {
    const [first] = await publishedItems(db.sql, "cruise-excursions");
    assert.equal("priceUsdPerPerson" in first, false);
  });
});
