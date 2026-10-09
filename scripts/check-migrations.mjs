#!/usr/bin/env node
// @ts-check
/**
 * `npm run check:migrations` — the migration gate (see scripts/migration-check.mjs).
 * Runs entirely on in-memory PGLite; it never reads DATABASE_URL.
 */
import { checkFresh, checkRerun, checkUpgrade } from "./migration-check.mjs";

async function main() {
  const fresh = await checkFresh();
  console.log(`[check-migrations] fresh: applied ${fresh.applied.length} files`);
  const upgrade = await checkUpgrade();
  console.log(`[check-migrations] upgrade from main's schema with data: applied ${upgrade.applied.length} newer files, every fixture row intact`);
  const rerun = await checkRerun();
  console.log(`[check-migrations] rerun: executed all ${rerun.rerun.length} files a second time, no table changed`);
}

main().catch((err) => {
  console.error("[check-migrations] FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
