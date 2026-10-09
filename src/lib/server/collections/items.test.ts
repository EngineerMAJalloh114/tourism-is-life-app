import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { circuits, destinations, tours } from "@/data/catalog";
import { TOUR_FIELDS_NOT_IN_RECORDS } from "@/content/defaults/collections";
import { isClaim } from "@/lib/collections/registry";
import type { Actor } from "@/lib/server/access";
import { collectionItemId } from "@/lib/server/content-ids";
import {
  createItem,
  getItem,
  KEEP_VERSIONS,
  listItems,
  publishedItems,
  publishItem,
  reorderItems,
  restoreItem,
  saveItemDraft,
  setItemHidden,
  trashItem,
} from "@/lib/server/collections/items";
import { createTestDb, insertStaff, type TestDb } from "@/lib/server/testing/test-db";
import { seedBlocks } from "../../../../scripts/content/generate-seed.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
type Data = Record<string, unknown>;

function rejectsWith(status: number, code?: string) {
  return (err: unknown) => {
    const e = err as { status?: number; code?: string };
    assert.equal(e.status, status, `expected HTTP ${status}, got ${e.status} (${String(err)})`);
    if (code) assert.equal(e.code, code);
    return true;
  };
}

const id = (collection: string, key: string) => collectionItemId(collection, key);

describe("collections seed (0010)", () => {
  let db: TestDb;
  before(async () => {
    db = await createTestDb();
  });
  after(async () => {
    await db.close();
  });

  it("is exactly what the generator makes from catalog.ts", async () => {
    const seed = (await seedBlocks()).find((s) => s.file.endsWith("0010_collections.sql"))!;
    const text = readFileSync(seed.file, "utf8").replace(/\r\n/g, "\n");
    assert.equal(text.slice(text.indexOf(seed.begin), text.indexOf(seed.end) + seed.end.length), seed.block);
  });

  it("applied to a database, every circuit, destination and tour equals catalog.ts", async () => {
    const media = new Map(
      (await db.sql<{ id: string; repo_path: string }>`select id, repo_path from media where origin = 'repository'`).map((m) => [m.id, m.repo_path]),
    );
    const path = (img: unknown) => media.get((img as { media: string }).media);
    const text = (v: unknown) => (isClaim(v) ? v.claim : v);

    const liveCircuits = await publishedItems(db.sql, "circuits");
    assert.deepEqual(
      liveCircuits.map((c) => ({ ...c, image: path(c.image), imageAlt: (c.image as { alt: string }).alt })),
      circuits.map((c) => ({ ...c })),
    );
    const liveDestinations = await publishedItems(db.sql, "destinations");
    assert.deepEqual(
      liveDestinations.map((d) => ({ ...d, image: path(d.image), imageAlt: (d.image as { alt: string }).alt })),
      destinations.map((d) => ({ ...d })),
    );
    const groups = new Map((await publishedItems(db.sql, "faq-groups")).map((g) => [g.key as string, g.items as { q: string; a: string }[]]));
    const liveTours = await publishedItems(db.sql, "tours");
    assert.equal(liveTours.length, tours.length);
    liveTours.forEach((t, i) => {
      const { faqGroup, faqs, ...rest } = t as Data & { faqGroup: string; faqs: { q: string; a: string }[] };
      const rebuilt = {
        ...rest,
        inclusions: (t.inclusions as unknown[]).map(text),
        image: path(t.image),
        imageAlt: (t.image as { alt: string }).alt,
        gallery: (t.gallery as { media: string; alt: string }[]).map((g) => ({ src: path(g), alt: g.alt })),
        faqs: [...(groups.get(faqGroup) ?? []), ...faqs],
      };
      const expected: Data = { ...tours[i] };
      for (const f of TOUR_FIELDS_NOT_IN_RECORDS) delete expected[f];
      assert.deepEqual(rebuilt, expected, tours[i].slug);
    });
  });

  it("stores the one unsourced claim as a claim field, not as plain text", async () => {
    const [freetown] = (await publishedItems(db.sql, "tours")).filter((t) => t.slug === "freetown-city-tour");
    assert.deepEqual((freetown.inclusions as unknown[])[0], { claim: "Licensed guide", sourceUrl: "", sourceDate: "", fallback: "" });
  });

  it("seeds references: tours to destinations, circuits and the shared questions; records to their photos", async () => {
    const refs = await db.sql<{ n: number }>`select count(*)::int as n from content_refs where to_id = ${id("destinations", "freetown")}`;
    assert.ok(refs[0].n >= 2, "the Freetown tours point at the Freetown destination");
    const usage = await db.sql<{ n: number }>`select count(*)::int as n from media_usage where owner_kind = 'collection_item'`;
    assert.ok(usage[0].n > 0);
  });

  it("running the seed twice changes nothing", async () => {
    const snapshot = async () => [
      await db.sql`select * from collection_items order by id`,
      await db.sql`select * from collection_item_versions order by id`,
      await db.sql`select * from content_refs order by id`,
    ];
    const before = await snapshot();
    await db.pg.exec(readFileSync(join(ROOT, "migrations", "0010_collections.sql"), "utf8"));
    assert.deepEqual(await snapshot(), before);
  });
});

describe("collections (A8)", () => {
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

  it("a hidden tour leaves published reads and comes back when shown", async () => {
    const tour = id("tours", "freetown-city-tour");
    await setItemHidden(db.sql, editor, { id: tour, hidden: true });
    assert.ok(!(await publishedItems(db.sql, "tours")).some((t) => t.slug === "freetown-city-tour"));
    await setItemHidden(db.sql, editor, { id: tour, hidden: false });
    assert.ok((await publishedItems(db.sql, "tours")).some((t) => t.slug === "freetown-city-tour"));
  });

  it("a draft change is not live until published", async () => {
    const tour = id("tours", "freetown-city-tour");
    await edit(tour, (d) => (d.summary = "A new summary for the city tour."));
    assert.notEqual((await publishedItems(db.sql, "tours")).find((t) => t.slug === "freetown-city-tour")!.summary, "A new summary for the city tour.");
    await publish(tour);
    assert.equal((await publishedItems(db.sql, "tours")).find((t) => t.slug === "freetown-city-tour")!.summary, "A new summary for the city tour.");
    const actions = await db.sql<{ action: string }>`select action from audit_logs where entity_id = ${tour} order by created_at, id`;
    assert.deepEqual(actions.map((a) => a.action), ["collection.save", "collection.publish"]);
  });

  it("a slug change writes a 301 redirect, with no chains and no loops", async () => {
    const tour = id("tours", "freetown-city-tour");
    await edit(tour, (d) => (d.slug = "freetown-walking-tour"));
    const first = await publish(tour);
    assert.deepEqual(first.redirect, { from: "/tours/freetown-city-tour", to: "/tours/freetown-walking-tour" });
    await edit(tour, (d) => (d.slug = "freetown-heritage-tour"));
    await publish(tour);
    const redirects = async () =>
      (await db.sql<{ from_path: string; to_path: string; status_code: number }>`select from_path, to_path, status_code from redirects order by from_path`).map(
        (r) => `${r.from_path} -> ${r.to_path} (${r.status_code})`,
      );
    assert.deepEqual(await redirects(), [
      "/tours/freetown-city-tour -> /tours/freetown-heritage-tour (301)",
      "/tours/freetown-walking-tour -> /tours/freetown-heritage-tour (301)",
    ]);
    await edit(tour, (d) => (d.slug = "freetown-city-tour"));
    await publish(tour);
    assert.deepEqual(await redirects(), [
      "/tours/freetown-heritage-tour -> /tours/freetown-city-tour (301)",
      "/tours/freetown-walking-tour -> /tours/freetown-city-tour (301)",
    ]);
  });

  it("refuses a key change on a record other records point at", async () => {
    const dest = id("destinations", "freetown");
    await edit(dest, (d) => (d.slug = "freetown-city"));
    await assert.rejects(publish(dest), rejectsWith(409, "KEY_IN_USE"));
  });

  it("refuses to delete a referenced destination, and a tour that dormant rows name", async () => {
    await assert.rejects(trashItem(db.sql, admin, { id: id("destinations", "freetown") }), rejectsWith(409, "IN_USE"));
    await db.sql`insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") values ('cust', 'c', 'c@example.test', true, now(), now())`;
    await db.sql`insert into saved_tours (user_id, tour_slug) values ('cust', 'freetown-city-tour')`;
    await assert.rejects(trashItem(db.sql, admin, { id: id("tours", "freetown-city-tour") }), rejectsWith(409, "IN_USE"));
  });

  it("trash and restore, and a restore refused when what it uses is gone", async () => {
    const tour = id("tours", "tacugama-chimpanzee-sanctuary");
    await trashItem(db.sql, admin, { id: tour });
    assert.ok(!(await publishedItems(db.sql, "tours")).some((t) => t.slug === "tacugama-chimpanzee-sanctuary"));
    assert.ok((await listItems(db.sql, admin, { collection: "tours", trash: true })).some((t) => t.id === tour));
    // With its only tour in the trash, the destination can go too, and then the tour cannot come back.
    const otherTours = (await publishedItems(db.sql, "tours")).filter((t) => t.destinationSlug === "tacugama");
    assert.equal(otherTours.length, 0);
    await trashItem(db.sql, admin, { id: id("destinations", "tacugama") });
    await assert.rejects(restoreItem(db.sql, admin, { id: tour }), rejectsWith(409, "MISSING_TARGET"));
    await restoreItem(db.sql, admin, { id: id("destinations", "tacugama") });
    await restoreItem(db.sql, admin, { id: tour });
    assert.ok((await publishedItems(db.sql, "tours")).some((t) => t.slug === "tacugama-chimpanzee-sanctuary"));
  });

  it("purges records that have been in the trash for more than 30 days", async () => {
    const tour = id("tours", "tacugama-chimpanzee-sanctuary");
    await trashItem(db.sql, admin, { id: tour });
    await db.sql`update collection_items set deleted_at = now() - interval '31 days' where id = ${tour}`;
    const trash = await listItems(db.sql, admin, { collection: "tours", trash: true });
    assert.ok(!trash.some((t) => t.id === tour));
    assert.equal((await db.sql`select 1 from collection_items where id = ${tour}`).length, 0);
    assert.equal((await db.sql`select 1 from content_refs where from_id = ${tour}`).length, 0);
    assert.equal((await db.sql`select 1 from audit_logs where action = 'collection.purge'`).length, 1);
  });

  it("CONTENT_MANAGER edits and publishes but cannot delete; STAFF and BOOKING_MANAGER get 403", async () => {
    const tour = id("tours", "freetown-city-tour");
    await edit(tour, (d) => (d.summary = "Edited by the content team."));
    await publish(tour);
    await assert.rejects(trashItem(db.sql, editor, { id: tour }), rejectsWith(403));
    await assert.rejects(restoreItem(db.sql, editor, { id: tour }), rejectsWith(403));
    for (const role of ["STAFF", "BOOKING_MANAGER"] as const) {
      const actor = await insertStaff(db.sql, `as-${role}`, role);
      await assert.rejects(listItems(db.sql, actor, { collection: "tours" }), rejectsWith(403));
      await assert.rejects(getItem(db.sql, actor, { id: tour }), rejectsWith(403));
      await assert.rejects(saveItemDraft(db.sql, actor, { id: tour, rev: 1, data: {} }), rejectsWith(403));
      await assert.rejects(publishItem(db.sql, actor, { id: tour, rev: 1 }), rejectsWith(403));
      await assert.rejects(setItemHidden(db.sql, actor, { id: tour, hidden: true }), rejectsWith(403));
      await assert.rejects(trashItem(db.sql, actor, { id: tour }), rejectsWith(403));
    }
  });

  it("only claims.source records a claim's source", async () => {
    const tour = id("tours", "freetown-city-tour");
    const source = (d: Data) => ((d.inclusions as Data[])[0] = { claim: "Licensed guide", sourceUrl: "https://example.org/licence", sourceDate: "2026-09-01", fallback: "" });
    await assert.rejects(edit(tour, source), rejectsWith(403, "CLAIM_SOURCE"));
    await edit(tour, source, admin);
    // Editing other fields afterwards keeps the recorded source and is allowed.
    await edit(tour, (d) => (d.summary = "Still a city tour."));
  });

  it("a newly placed photo must be published; the photos already on a record stay allowed", async () => {
    const tour = id("tours", "freetown-city-tour");
    const unpublished = await db.sql<{ id: string }>`select id from media where published = false limit 1`;
    await assert.rejects(edit(tour, (d) => ((d.image as Data).media = unpublished[0].id)), rejectsWith(409, "MEDIA_NOT_PUBLISHED"));
    // Seeded tours use photos whose provenance is incomplete today; saving them unchanged still works.
    await edit(tour, (d) => (d.summary = "Same photos."));
    const published = await db.sql<{ id: string }>`select id from media where published = true limit 1`;
    await edit(tour, (d) => ((d.image as Data).media = published[0].id));
  });

  it("checks the records a draft points at, and publishes only after they are published", async () => {
    const created = await createItem(db.sql, editor, {
      collection: "destinations",
      data: { slug: "lungi", name: "Lungi", circuit: "western-circuit", country: "sierra-leone", summary: "The airport side of the estuary.", image: (await getItem(db.sql, editor, { id: id("destinations", "freetown") })).draft.image },
    });
    const tour = id("tours", "freetown-city-tour");
    await assert.rejects(edit(tour, (d) => (d.destinationSlug = "nowhere")), rejectsWith(400, "MISSING_TARGET"));
    await edit(tour, (d) => (d.destinationSlug = "lungi"));
    await assert.rejects(publish(tour), rejectsWith(409, "TARGET_NOT_PUBLISHED"));
    await publish(created.id);
    await publish(tour);
  });

  it("refuses a stale save, an invalid record, a circuit id change and a new circuit", async () => {
    const tour = id("tours", "freetown-city-tour");
    const item = await getItem(db.sql, editor, { id: tour });
    await saveItemDraft(db.sql, editor, { id: tour, rev: item.rev, data: item.draft });
    await assert.rejects(saveItemDraft(db.sql, editor, { id: tour, rev: item.rev, data: item.draft }), rejectsWith(409, "STALE"));
    await assert.rejects(edit(tour, (d) => (d.durationDays = 0)), rejectsWith(400, "RECORD_INVALID"));
    await assert.rejects(edit(tour, (d) => (d.bookable = true)), rejectsWith(400, "RECORD_INVALID"), "booking fields are not part of a record");
    await assert.rejects(edit(tour, (d) => (d.rating = 5)), rejectsWith(400, "RECORD_INVALID"), "ratings live in their own table");
    await assert.rejects(edit(id("circuits", "western-circuit"), (d) => (d.id = "eastern-circuit")), rejectsWith(409));
    await assert.rejects(createItem(db.sql, editor, { collection: "circuits", data: {} }), rejectsWith(409, "NO_CREATE"));
  });

  it("reorders a collection and refuses an order built from a stale list", async () => {
    const list = await listItems(db.sql, editor, { collection: "circuits" });
    const reversed = list.map((c) => c.id).reverse();
    await reorderItems(db.sql, editor, { collection: "circuits", ids: reversed });
    assert.deepEqual((await listItems(db.sql, editor, { collection: "circuits" })).map((c) => c.id), reversed);
    assert.deepEqual((await publishedItems(db.sql, "circuits")).map((c) => c.id), (await listItems(db.sql, editor, { collection: "circuits" })).map((c) => c.key));
    await assert.rejects(reorderItems(db.sql, editor, { collection: "circuits", ids: reversed.slice(1) }), rejectsWith(409, "STALE_ORDER"));
  });

  it(`keeps the newest ${KEEP_VERSIONS} published versions`, async () => {
    const circuit = id("circuits", "western-circuit");
    for (let i = 0; i < KEEP_VERSIONS + 2; i++) await publish(circuit);
    const item = await getItem(db.sql, editor, { id: circuit });
    assert.equal(item.versions.length, KEEP_VERSIONS);
    assert.ok(item.versions[0].current);
  });
});
