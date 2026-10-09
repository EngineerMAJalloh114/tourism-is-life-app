#!/usr/bin/env node
/**
 * Run a command with the database URLs blanked, so the app uses the embedded
 * PGLite database and can never reach a real one (QA-OPS-1).
 *
 * Why this exists: `.env.local` holds the PRODUCTION DATABASE_URL, and Vite's
 * env loading copies every `.env.local` key into process.env. So a plain
 * `npm run dev` talks to the live database. A variable that is already set in
 * process.env wins over `.env.local`, and the app treats a blank DATABASE_URL
 * as unset, so blanking it here forces PGLite.
 *
 * It is a Node script rather than `DATABASE_URL= npm run dev` because that
 * shell syntax does not exist in PowerShell or cmd.exe, and in PowerShell
 * `$env:DATABASE_URL = ""` deletes the variable, which lets `.env.local` win.
 *
 * Usage: node scripts/local-db.mjs <command> [args...]
 *   npm run dev:local    dev server on 127.0.0.1:8080, PGLite only
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/** The database variables the app or the migrator read. */
export const DATABASE_ENV_KEYS = ["DATABASE_URL", "DATABASE_URL_UNPOOLED"];

/**
 * Set only by this script. It tells the app it may seed the local test
 * SUPER_ADMIN from LOCAL_SUPER_ADMIN_EMAIL / LOCAL_SUPER_ADMIN_PASSWORD
 * (src/lib/auth/local-seed.ts), which still refuses if a database URL is set.
 */
export const LOCAL_SEED_FLAG = "TIL_LOCAL_SEED";

/** A copy of `env` with every database variable blanked and the local-seed flag set. Pure, for tests. */
export function withLocalDatabase(env) {
  const out = { ...env };
  for (const key of DATABASE_ENV_KEYS) out[key] = "";
  out[LOCAL_SEED_FLAG] = "1";
  return out;
}

function main(argv) {
  if (argv.length === 0) {
    console.error("usage: node scripts/local-db.mjs <command> [args...]");
    process.exit(2);
  }
  const wrapper = join(dirname(fileURLToPath(import.meta.url)), "with-app-env.mjs");
  console.log("[local-db] DATABASE_URL blanked: this process uses PGLite, never a real database.");
  const child = spawn(process.execPath, [wrapper, ...argv], {
    stdio: "inherit",
    env: withLocalDatabase(process.env),
  });
  child.on("exit", (code, signal) => process.exit(signal ? 1 : (code ?? 1)));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main(process.argv.slice(2));
}
