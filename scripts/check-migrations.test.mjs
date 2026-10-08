import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkFresh, checkRerun, checkUpgrade, listMigrations, MAIN_SCHEMA_MIGRATIONS } from "./migration-check.mjs";

describe("migrations", () => {
  it("starts with the four files that are live on main", async () => {
    const names = await listMigrations();
    assert.deepEqual(names.slice(0, 4), MAIN_SCHEMA_MIGRATIONS);
  });

  it("apply in order to an empty database", async () => {
    const { applied } = await checkFresh();
    assert.ok(applied.length >= MAIN_SCHEMA_MIGRATIONS.length);
  });

  it("apply on top of main's schema with live-shaped data and keep every row", async () => {
    await checkUpgrade();
  });

  it("are idempotent: running every file a second time changes no table", async () => {
    await checkRerun();
  });
});
