#!/usr/bin/env node
/**
 * Post-build guard for PERF-1: every /assets/* URL the server can put into an
 * HTML response must exist in the static output.
 *
 * The HTML is rendered at request time, so there is no built HTML file to read.
 * Instead this reads the server bundle, where TanStack Start embeds the asset
 * manifest (stylesheet and script URLs) as string literals, and checks each one
 * against the files Vite actually emitted. A mismatch is exactly the PERF-1
 * failure: the server and client builds hashed the stylesheet differently, so
 * every page linked a CSS file that returned 404 and rendered unstyled.
 *
 * It also fails if any file the browser can download (static/) names a
 * server-only secret: the Supabase service key variable, or a value shaped
 * like a Supabase secret key (task A6, docs/CUSTOMIZATION_PLAN.md section 13).
 *
 * Usage: node scripts/check-built-assets.mjs [outputDir]   (default .vercel/output)
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// A URL the server can emit is a quoted string that starts with /assets/. The
// lookbehind skips bundler comments such as "//#region .../ssr/assets/x.js",
// which name server chunks, not public URLs.
const ASSET_REF = /(?<=["'`])\/assets\/[A-Za-z0-9_.-]+\.(?:css|js|mjs)\b/g;
const TEXT_FILE = /\.(?:m?js|cjs|json|html)$/;

/** Every distinct /assets/*.css|js reference found in the given text. */
export function findAssetRefs(text) {
  return [...new Set(text.match(ASSET_REF) ?? [])].sort();
}

/** Names and value shapes that must never appear in a file served to browsers. */
export const SERVER_ONLY_MARKERS = ["SUPABASE_SERVICE_KEY", "sb_secret_"];

/** The server-only markers found in client text. Pure, for tests. */
export function findServerSecrets(text) {
  return SERVER_ONLY_MARKERS.filter((m) => text.includes(m));
}

/** References whose file is not in the emitted set. Pure, for tests. */
export function missingAssets(refs, emitted) {
  const have = new Set(emitted);
  return refs.filter((ref) => !have.has(ref.replace(/^\/assets\//, "")));
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (TEXT_FILE.test(name)) out.push(p);
  }
  return out;
}

export function checkBuiltAssets(outputDir) {
  const staticAssets = join(outputDir, "static", "assets");
  const functionsDir = join(outputDir, "functions");
  if (!existsSync(staticAssets) || !existsSync(functionsDir)) {
    return { ok: false, error: `No build output at ${outputDir} (expected static/assets and functions). Run npm run build:dev first.` };
  }
  const emitted = readdirSync(staticAssets);
  const refs = new Set();
  const where = new Map();
  for (const file of walk(functionsDir)) {
    for (const ref of findAssetRefs(readFileSync(file, "utf8"))) {
      refs.add(ref);
      if (!where.has(ref)) where.set(ref, relative(outputDir, file));
    }
  }
  const all = [...refs].sort();
  const missing = missingAssets(all, emitted);
  const cssRefs = all.filter((r) => r.endsWith(".css"));
  const leaks = [];
  for (const file of walk(join(outputDir, "static"))) {
    for (const marker of findServerSecrets(readFileSync(file, "utf8"))) leaks.push({ marker, file: relative(outputDir, file) });
  }
  return {
    ok: missing.length === 0 && cssRefs.length > 0 && leaks.length === 0,
    refs: all,
    cssRefs,
    missing,
    leaks,
    where,
    emittedCount: emitted.length,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const dir = process.argv[2] ?? ".vercel/output";
  const r = checkBuiltAssets(dir);
  if (r.error) {
    console.error(`[check-built-assets] ${r.error}`);
    process.exit(1);
  }
  if (r.cssRefs.length === 0) {
    console.error("[check-built-assets] The server bundle references no stylesheet at all; the check cannot vouch for styling.");
    process.exit(1);
  }
  if (r.missing.length > 0) {
    console.error(`[check-built-assets] ${r.missing.length} asset(s) referenced by the server bundle were not emitted:`);
    for (const m of r.missing) console.error(`  ${m}  (referenced in ${r.where.get(m)})`);
    process.exit(1);
  }
  if (r.leaks.length > 0) {
    console.error(`[check-built-assets] ${r.leaks.length} browser file(s) name a server-only secret:`);
    for (const l of r.leaks) console.error(`  ${l.marker} in ${l.file}`);
    process.exit(1);
  }
  console.log(`[check-built-assets] OK: no server-only secret in browser files; ${r.refs.length} referenced assets (${r.cssRefs.length} stylesheets) all exist among ${r.emittedCount} emitted files.`);
}
