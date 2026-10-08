#!/usr/bin/env node
// @ts-check
/**
 * Generates the media seed in migrations/0008_media.sql: one row per image file
 * in public/images, carrying that file's record from image-sources.json
 * verbatim as its provenance (a file with no record gets an empty one, so it
 * shows as incomplete). Width, height and size come from the file itself.
 *
 *   node scripts/content/generate-media-seed.mjs          print the block
 *   node scripts/content/generate-media-seed.mjs --write  replace the block in the migration
 *
 * The block is generated, never edited by hand; `media-seed.test.ts` fails if
 * it differs from what this prints.
 */
import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const IMAGES = join(ROOT, "public", "images");
export const MIGRATION = join(ROOT, "migrations", "0008_media.sql");
export const BEGIN = "-- BEGIN GENERATED MEDIA SEED (scripts/content/generate-media-seed.mjs; do not edit by hand)";
export const END = "-- END GENERATED MEDIA SEED";
const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

/** @param {string} dir @returns {Promise<string[]>} */
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

/** The same rule as src/lib/media-provenance.ts (checked by media-seed.test.ts). */
function provenanceStatus(/** @type {Record<string, unknown>} */ p, /** @type {string} */ alt) {
  const filled = (/** @type {unknown} */ v) => typeof v === "string" && v.trim().length > 0;
  if (!filled(alt)) return "incomplete";
  if (!(filled(p.source) || filled(p.sourceUrl) || filled(p.page))) return "incomplete";
  if (!filled(p.license) || p.license === "license_verification_required") return "incomplete";
  if (!filled(p.location) || /^unconfirmed/i.test(String(p.location).trim())) return "incomplete";
  return "complete";
}

export function repositoryMediaId(/** @type {string} */ repoPath) {
  return `img_${createHash("sha256").update(repoPath).digest("hex").slice(0, 16)}`;
}

const sqlText = (/** @type {string | null} */ v) => (v === null ? "null" : `'${v.replace(/'/g, "''")}'`);

/** Every row the seed inserts, sorted by path. */
export async function mediaSeedRows() {
  const { default: sharp } = await import("sharp");
  /** @type {Array<Record<string, unknown> & { filename: string }>} */
  const records = JSON.parse(await readFile(join(IMAGES, "image-sources.json"), "utf8"));
  const byPath = new Map(records.map((r) => [r.filename, r]));
  const files = (await walk(IMAGES)).filter((f) => IMAGE_EXT.test(f));
  const rows = [];
  for (const file of files) {
    const repoPath = "/" + relative(join(ROOT, "public"), file).split(sep).join("/");
    const meta = await sharp(file).metadata();
    const turned = (meta.orientation ?? 1) >= 5;
    const record = byPath.get(repoPath) ?? null;
    const provenance = record ?? {};
    const alt = typeof record?.alt === "string" ? record.alt : "";
    const status = provenanceStatus(provenance, alt);
    rows.push({
      id: repositoryMediaId(repoPath),
      repoPath,
      width: turned ? meta.height : meta.width,
      height: turned ? meta.width : meta.height,
      bytes: (await stat(file)).size,
      alt,
      provenance,
      status,
    });
  }
  rows.sort((a, b) => (a.repoPath < b.repoPath ? -1 : a.repoPath > b.repoPath ? 1 : 0));
  return { rows, recordsWithoutFile: records.filter((r) => !files.some((f) => f.endsWith(r.filename.split("/").join(sep)))).map((r) => r.filename) };
}

export async function mediaSeedSql() {
  const { rows } = await mediaSeedRows();
  const values = rows.map(
    (r) =>
      `  (${sqlText(r.id)}, 'repository', ${sqlText(r.repoPath)}, ${r.width}, ${r.height}, ${r.bytes}, ${sqlText(r.alt)}, ` +
      `${sqlText(JSON.stringify(r.provenance))}::jsonb, ${sqlText(r.status)}, ${r.status === "complete"})`,
  );
  return [
    BEGIN,
    "insert into media (id, origin, repo_path, width, height, bytes, alt, provenance, provenance_status, published) values",
    values.join(",\n"),
    "on conflict (id) do nothing;",
    END,
  ].join("\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const block = await mediaSeedSql();
  if (process.argv.includes("--write")) {
    const text = await readFile(MIGRATION, "utf8");
    const start = text.indexOf(BEGIN);
    const end = text.indexOf(END);
    if (start < 0 || end < 0) throw new Error(`markers not found in ${MIGRATION}`);
    await writeFile(MIGRATION, text.slice(0, start) + block + text.slice(end + END.length));
    console.log(`[media-seed] wrote ${MIGRATION}`);
  } else {
    console.log(block);
  }
}
