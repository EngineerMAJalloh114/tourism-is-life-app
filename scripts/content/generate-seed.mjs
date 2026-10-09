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
 * The collections seed (task A8): every record published as version 1, with
 * its references (record to record in content_refs, record to photo in
 * media_usage) for both the draft and the published copy. Ids are UUID v5.
 */
export async function collectionsSeed() {
  const { collectionDefaults } = await import("../../src/content/defaults/collections.ts");
  const { COLLECTIONS, referencesOf } = await import("../../src/lib/collections/registry.ts");
  const { collectionItemId, uuidV5 } = await import("../../src/lib/server/content-ids.ts");
  const records = collectionDefaults();
  const items = [];
  const versions = [];
  const refs = [];
  const usage = [];
  for (const r of records) {
    const parsed = COLLECTIONS[r.collection].schema.safeParse(r.data);
    if (!parsed.success) throw new Error(`${r.collection}/${r.key}: ${parsed.error.issues[0].message}`);
    const id = collectionItemId(r.collection, r.key);
    const versionId = uuidV5(`collection-version:${id}:1`);
    const json = sqlText(JSON.stringify(r.data));
    items.push(`  (${sqlText(id)}, ${sqlText(r.collection)}, ${sqlText(r.key)}, ${r.position}, 'published', ${json}::jsonb, 1, ${sqlText(versionId)})`);
    versions.push(`  (${sqlText(versionId)}, ${sqlText(id)}, 1, ${json}::jsonb)`);
    const out = referencesOf(r.collection, r.data);
    for (const state of ["draft", "published"]) {
      for (const ref of out.items) {
        const to = collectionItemId(ref.collection, ref.key);
        refs.push(`  (${sqlText(uuidV5(`ref:${id}:${state}:${ref.field}`))}, 'collection_item', ${sqlText(id)}, '${state}', 'collection_item', ${sqlText(to)}, ${sqlText(ref.field)})`);
      }
      for (const m of out.media) {
        usage.push(`  (${sqlText(uuidV5(`media-usage:${id}:${state}:${m.field}`))}, ${sqlText(m.id)}, 'collection_item', ${sqlText(id)}, '${state}', ${sqlText(m.field)})`);
      }
    }
  }
  return {
    file: join(ROOT, "migrations", "0010_collections.sql"),
    begin: "-- BEGIN GENERATED COLLECTIONS SEED (scripts/content/generate-seed.mjs; do not edit by hand)",
    end: "-- END GENERATED COLLECTIONS SEED",
    body: [
      "insert into collection_items (id, collection, key, position, status, draft, rev, published_version_id) values",
      items.join(",\n"),
      "on conflict (id) do nothing;",
      "insert into collection_item_versions (id, item_id, version, data) values",
      versions.join(",\n"),
      "on conflict (id) do nothing;",
      "insert into content_refs (id, from_kind, from_id, from_state, to_kind, to_id, field) values",
      refs.join(",\n"),
      "on conflict (id) do nothing;",
      "insert into media_usage (id, media_id, owner_kind, owner_id, owner_state, field) values",
      usage.join(",\n"),
      "on conflict (id) do nothing;",
    ].join("\n"),
  };
}

export async function seedBlocks() {
  return [await siteSettingsSeed(), await collectionsSeed()].map((s) => ({ ...s, block: `${s.begin}\n${s.body}\n${s.end}` }));
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
