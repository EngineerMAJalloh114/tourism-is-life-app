#!/usr/bin/env node
// @ts-check
/**
 * The content seed generator (task A7, docs/CUSTOMIZATION_PLAN.md section 11).
 * Seeds are generated from the code's own constants, never typed by hand, and
 * written between marker lines in their migration:
 *
 *   npm run content:seed            print every seed block
 *   npm run content:seed -- --write replace the blocks in their migrations
 *
 * `npm run content:seed` runs node with `--experimental-strip-types` and the
 * `@/` alias, because the defaults are TypeScript modules under src/.
 * Tests import `seedBlocks()` and compare it with the migrations byte for byte.
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const sqlText = (/** @type {string} */ v) => `'${v.replace(/'/g, "''")}'`;

/** The site settings seed: the defaults as the draft and as published version 1. */
export async function siteSettingsSeed() {
  const { DEFAULT_SETTINGS } = await import("../../src/content/defaults/settings.ts");
  const { parseSettings } = await import("../../src/lib/settings/schema.ts");
  parseSettings(DEFAULT_SETTINGS); // the seed must pass the same checks a save does
  const json = sqlText(JSON.stringify(DEFAULT_SETTINGS));
  return {
    file: join(ROOT, "migrations", "0009_site_settings.sql"),
    begin: "-- BEGIN GENERATED SITE SETTINGS SEED (scripts/content/generate-seed.mjs; do not edit by hand)",
    end: "-- END GENERATED SITE SETTINGS SEED",
    body: [
      "insert into site_settings (id, draft, rev, published_version_id)",
      `values ('site', ${json}::jsonb, 1, 'ssv_seed')`,
      "on conflict (id) do nothing;",
      "insert into site_settings_versions (id, settings_id, version, data, published_by)",
      `values ('ssv_seed', 'site', 1, ${json}::jsonb, null)`,
      "on conflict (id) do nothing;",
    ].join("\n"),
  };
}

/**
 * Collection seed rows: each record published as version 1 (or left a draft
 * when the record says so), with its references (record to record in
 * content_refs, record to photo in media_usage) for each state it has. Ids are
 * UUID v5.
 */
/** @param {import("../../src/content/defaults/collections.ts").SeedRecordII[]} records */
async function collectionRows(records) {
  const { COLLECTIONS, referencesOf } = await import("../../src/lib/collections/registry.ts");
  const { collectionItemId, uuidV5 } = await import("../../src/lib/server/content-ids.ts");
  const items = [];
  const versions = [];
  const refs = [];
  const usage = [];
  for (const r of records) {
    const parsed = COLLECTIONS[r.collection].schema.safeParse(r.data);
    if (!parsed.success) throw new Error(`${r.collection}/${r.key}: ${parsed.error.issues[0].message}`);
    const draftOnly = r.status === "draft";
    const id = collectionItemId(r.collection, r.key);
    const versionId = uuidV5(`collection-version:${id}:1`);
    const json = sqlText(JSON.stringify(r.data));
    items.push(
      `  (${sqlText(id)}, ${sqlText(r.collection)}, ${sqlText(r.key)}, ${r.position}, ${draftOnly ? "'draft'" : "'published'"}, ${json}::jsonb, 1, ${draftOnly ? "null" : sqlText(versionId)})`,
    );
    if (!draftOnly) versions.push(`  (${sqlText(versionId)}, ${sqlText(id)}, 1, ${json}::jsonb)`);
    const out = referencesOf(r.collection, r.data);
    for (const state of draftOnly ? ["draft"] : ["draft", "published"]) {
      for (const ref of out.items) {
        const to = collectionItemId(ref.collection, ref.key);
        refs.push(`  (${sqlText(uuidV5(`ref:${id}:${state}:${ref.field}`))}, 'collection_item', ${sqlText(id)}, '${state}', 'collection_item', ${sqlText(to)}, ${sqlText(ref.field)})`);
      }
      for (const m of out.media) {
        usage.push(`  (${sqlText(uuidV5(`media-usage:${id}:${state}:${m.field}`))}, ${sqlText(m.id)}, 'collection_item', ${sqlText(id)}, '${state}', ${sqlText(m.field)})`);
      }
    }
  }
  const insert = (/** @type {string} */ head, /** @type {string[]} */ rows) => (rows.length ? [head, rows.join(",\n"), "on conflict (id) do nothing;"] : []);
  return [
    ...insert("insert into collection_items (id, collection, key, position, status, draft, rev, published_version_id) values", items),
    ...insert("insert into collection_item_versions (id, item_id, version, data) values", versions),
    ...insert("insert into content_refs (id, from_kind, from_id, from_state, to_kind, to_id, field) values", refs),
    ...insert("insert into media_usage (id, media_id, owner_kind, owner_id, owner_state, field) values", usage),
  ].join("\n");
}

/** Circuits, destinations, tours and the shared tour questions (task A8). */
export async function collectionsSeed() {
  const { collectionDefaults } = await import("../../src/content/defaults/collections.ts");
  return {
    file: join(ROOT, "migrations", "0010_collections.sql"),
    begin: "-- BEGIN GENERATED COLLECTIONS SEED (scripts/content/generate-seed.mjs; do not edit by hand)",
    end: "-- END GENERATED COLLECTIONS SEED",
    body: await collectionRows(collectionDefaults()),
  };
}

/** Services, journal, cruise, vehicles, the testimonial, team profiles and the Stay & Dine samples (task A9). */
export async function collectionsSeedII() {
  const { collectionDefaultsII } = await import("../../src/content/defaults/collections.ts");
  return {
    file: join(ROOT, "migrations", "0011_collections_seed.sql"),
    begin: "-- BEGIN GENERATED COLLECTIONS II SEED (scripts/content/generate-seed.mjs; do not edit by hand)",
    end: "-- END GENERATED COLLECTIONS II SEED",
    body: await collectionRows(collectionDefaultsII()),
  };
}

/** Rates and ratings (task A10), every one a draft. */
export async function ratesSeed() {
  const { rateDefaults } = await import("../../src/content/defaults/rates.ts");
  const { collectionItemId, uuidV5 } = await import("../../src/lib/server/content-ids.ts");
  const { rates, ratings } = rateDefaults();
  const rateRows = rates.map(
    (r) =>
      `  (${sqlText(uuidV5(`rate:${r.subjectCollection}:${r.subjectKey}:${r.label}`))}, ${sqlText(r.subjectCollection)}, ` +
      `${sqlText(collectionItemId(r.subjectCollection, r.subjectKey))}, ${sqlText(r.label)}, ${sqlText(r.currency)}, ${r.amountMinor}, ` +
      `${sqlText(r.unit)}, ${sqlText(r.sourceNote)}, 'draft')`,
  );
  const ratingRows = ratings.map(
    (r) => `  (${sqlText(uuidV5(`rating:${r.tourKey}`))}, ${sqlText(collectionItemId("tours", r.tourKey))}, ${r.valueTenths}, ${r.reviewCount}, 'draft')`,
  );
  return {
    file: join(ROOT, "migrations", "0012_rates.sql"),
    begin: "-- BEGIN GENERATED RATES SEED (scripts/content/generate-seed.mjs; do not edit by hand)",
    end: "-- END GENERATED RATES SEED",
    body: [
      "insert into rates (id, subject_collection, subject_id, label, currency, amount_minor, unit, source_note, status) values",
      rateRows.join(",\n"),
      "on conflict (id) do nothing;",
      "insert into ratings (id, tour_id, value_tenths, review_count, status) values",
      ratingRows.join(",\n"),
      "on conflict (id) do nothing;",
    ].join("\n"),
  };
}

export async function seedBlocks() {
  return [await siteSettingsSeed(), await collectionsSeed(), await collectionsSeedII(), await ratesSeed()].map((s) => ({ ...s, block: `${s.begin}\n${s.body}\n${s.end}` }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  for (const seed of await seedBlocks()) {
    if (process.argv.includes("--write")) {
      const text = await readFile(seed.file, "utf8");
      const start = text.indexOf(seed.begin);
      const end = text.indexOf(seed.end);
      if (start < 0 || end < 0) throw new Error(`markers not found in ${seed.file}`);
      await writeFile(seed.file, text.slice(0, start) + seed.block + text.slice(end + seed.end.length));
      console.log(`[content-seed] wrote ${seed.file}`);
    } else {
      console.log(seed.block);
    }
  }
}
