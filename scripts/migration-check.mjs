// @ts-check
/**
 * Migration safety checks run on an in-memory PGLite (never a real database).
 *
 * Merging to `main` runs `db:migrate` against production, so every migration
 * must be additive, idempotent and safe on the live schema with live data.
 * These checks prove that before a migration ships:
 *
 *   1. fresh    — every file applies, in order, to an empty database.
 *   2. upgrade  — the schema as it is on `main` today (0001-0004) is loaded
 *                 with representative rows (accounts, a SUPER_ADMIN, an orphan
 *                 staff row, enquiries, bookings, subscribers, audit rows), then
 *                 the newer files apply on top and every fixture row survives.
 *   3. rerun    — after everything is applied, every file is executed a second
 *                 time and no table changes ("seed twice").
 *
 * Used by `npm run check:migrations` (scripts/check-migrations.mjs) and by
 * scripts/check-migrations.test.mjs, so `npm test` and CI run it too.
 */
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pendingMigrations } from "./migration-plan.mjs";

export const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

/** The migrations that exist on `main` before the admin work (the live schema). */
export const MAIN_SCHEMA_MIGRATIONS = [
  "0001_auth.sql",
  "0002_dmc.sql",
  "0003_ops.sql",
  "0004_booking_amounts_bootstrap.sql",
];

/** Migration file names in apply order. */
export async function listMigrations(dir = MIGRATIONS_DIR) {
  const entries = await readdir(dir);
  return pendingMigrations(entries, []).map((m) => m.name);
}

/** A fresh in-memory PGLite with the same type parsers the app uses. */
export async function createPglite() {
  const { PGlite } = await import("@electric-sql/pglite");
  const identity = (/** @type {string} */ v) => v;
  const pg = new PGlite({ parsers: { 20: Number, 1082: identity, 1186: identity } });
  await pg.waitReady;
  await pg.exec(
    "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  return pg;
}

/**
 * Apply `names` (in order) the way both appliers do: one transaction per file,
 * recorded in `_migrations`.
 * @param {any} pg
 * @param {string[]} names
 */
export async function applyMigrations(pg, names, dir = MIGRATIONS_DIR) {
  for (const name of names) {
    const text = await readFile(join(dir, name), "utf8");
    await pg.transaction(async (/** @type {any} */ tx) => {
      await tx.exec(text);
      await tx.query("insert into _migrations (name) values ($1)", [name]);
    });
  }
}

/** Representative rows for the live schema (0001-0004). Ids are fixed for assertions. */
export const MAIN_SCHEMA_FIXTURES = `
insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") values
  ('fx-super', 'Owner', 'owner@example.test', true, now(), now()),
  ('fx-staff', 'Desk', 'desk@example.test', false, now(), now()),
  ('fx-customer', 'Visitor', 'visitor@example.test', false, now(), now());
insert into "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt") values
  ('fx-acc-super', 'fx-super', 'credential', 'fx-super', 'hash', now(), now());
insert into "session" (id, "expiresAt", token, "createdAt", "updatedAt", "userId") values
  ('fx-sess-super', now() + interval '1 day', 'fx-token-super', now(), now(), 'fx-super');
insert into staff_profiles (user_id, role) values
  ('fx-super', 'SUPER_ADMIN'),
  ('fx-staff', 'STAFF'),
  ('fx-orphan', 'ADMIN');
insert into bootstrap_lock (id, user_id) values (1, 'fx-super');
insert into enquiries (id, user_id, type, payload, status, guest_email, guest_name) values
  ('ENQ-FX0001', null, 'B2C', '{"name":"Guest","message":"Hello"}', 'open', 'guest@example.test', 'Guest'),
  ('ENQ-FX0002', 'fx-customer', 'B2B', '{"company":"Operator"}', 'closed', 'op@example.test', 'Operator');
insert into bookings (id, user_id, tour_slug, travel_date, guests, status, guest_name, guest_email) values
  ('BK-FX0001', null, 'banana-island', '2026-12-01', 2, 'HOLD', 'Guest', 'guest@example.test');
insert into availability (tour_slug, travel_date, max_capacity) values ('banana-island', '2026-12-01', 10);
insert into saved_tours (user_id, tour_slug) values ('fx-customer', 'banana-island');
insert into reviews (id, booking_id, tour_slug, rating, body) values ('RV-FX0001', 'BK-FX0001', 'banana-island', 5, 'Good');
insert into newsletter_subscribers (email, source) values ('reader@example.test', 'site');
insert into audit_logs (id, actor_id, action, entity, entity_id, detail) values
  ('AU-FX0001', 'fx-super', 'staff.bootstrap', 'staff_profiles', 'fx-super', null);
`;

/** Every fixture row, identified by table and key, that must survive later migrations. */
export const FIXTURE_KEYS = [
  ['"user"', "id", ["fx-super", "fx-staff", "fx-customer"]],
  ['"account"', "id", ["fx-acc-super"]],
  ['"session"', "id", ["fx-sess-super"]],
  ["staff_profiles", "user_id", ["fx-super", "fx-staff", "fx-orphan"]],
  ["bootstrap_lock", "user_id", ["fx-super"]],
  ["enquiries", "id", ["ENQ-FX0001", "ENQ-FX0002"]],
  ["bookings", "id", ["BK-FX0001"]],
  ["saved_tours", "user_id", ["fx-customer"]],
  ["reviews", "id", ["RV-FX0001"]],
  ["newsletter_subscribers", "email", ["reader@example.test"]],
  ["audit_logs", "id", ["AU-FX0001"]],
];

/**
 * A comparable dump of every row in every public table (except `_migrations`).
 * @param {any} pg
 */
export async function snapshot(pg) {
  const tables = await pg.query(
    "select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' and table_name <> '_migrations' order by table_name",
  );
  /** @type {Record<string, string>} */
  const out = {};
  for (const { table_name } of tables.rows) {
    const rows = await pg.query(`select * from "${table_name}"`);
    const serialised = rows.rows.map((/** @type {unknown} */ r) => JSON.stringify(r)).sort();
    out[table_name] = serialised.join("\n");
  }
  return out;
}

/** 1. fresh */
export async function checkFresh(dir = MIGRATIONS_DIR) {
  const pg = await createPglite();
  try {
    const names = await listMigrations(dir);
    await applyMigrations(pg, names, dir);
    return { applied: names };
  } finally {
    await pg.close();
  }
}

/** 2. upgrade from the live schema with data */
export async function checkUpgrade(dir = MIGRATIONS_DIR) {
  const pg = await createPglite();
  try {
    const names = await listMigrations(dir);
    const base = names.filter((n) => MAIN_SCHEMA_MIGRATIONS.includes(n));
    const rest = names.filter((n) => !MAIN_SCHEMA_MIGRATIONS.includes(n));
    await applyMigrations(pg, base, dir);
    await pg.exec(MAIN_SCHEMA_FIXTURES);
    await applyMigrations(pg, rest, dir);
    /** @type {string[]} */
    const missing = [];
    for (const [table, column, ids] of FIXTURE_KEYS) {
      for (const id of /** @type {string[]} */ (ids)) {
        const r = await pg.query(`select 1 from ${table} where ${column} = $1`, [id]);
        if (r.rows.length !== 1) missing.push(`${table}.${column}=${id}`);
      }
    }
    if (missing.length) throw new Error(`fixture rows lost after upgrade: ${missing.join(", ")}`);
    return { applied: rest };
  } finally {
    await pg.close();
  }
}

/** 3. rerun every file and prove nothing changed */
export async function checkRerun(dir = MIGRATIONS_DIR) {
  const pg = await createPglite();
  try {
    const names = await listMigrations(dir);
    const base = names.filter((n) => MAIN_SCHEMA_MIGRATIONS.includes(n));
    const rest = names.filter((n) => !MAIN_SCHEMA_MIGRATIONS.includes(n));
    await applyMigrations(pg, base, dir);
    await pg.exec(MAIN_SCHEMA_FIXTURES);
    await applyMigrations(pg, rest, dir);
    const before = await snapshot(pg);
    for (const name of names) {
      const text = await readFile(join(dir, name), "utf8");
      await pg.exec(text);
    }
    const after = await snapshot(pg);
    /** @type {string[]} */
    const changed = [];
    for (const table of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if (before[table] !== after[table]) changed.push(table);
    }
    if (changed.length) throw new Error(`re-running the migrations changed: ${changed.join(", ")}`);
    return { rerun: names };
  } finally {
    await pg.close();
  }
}
