import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { localSeedDecision } from "./local-seed.ts";

const OK = {
  LOCAL_SUPER_ADMIN_EMAIL: "Owner@Example.test",
  LOCAL_SUPER_ADMIN_PASSWORD: "a long local password",
  TIL_LOCAL_SEED: "1",
  DATABASE_URL: "",
  DATABASE_URL_UNPOOLED: "",
};

describe("local test SUPER_ADMIN seed", () => {
  it("seeds only under dev:local on PGLite with both keys set", () => {
    assert.deepEqual(localSeedDecision(OK, "pglite"), { seed: true, email: "owner@example.test", password: OK.LOCAL_SUPER_ADMIN_PASSWORD });
  });

  it("refuses when DATABASE_URL is set, even with the flag", () => {
    const d = localSeedDecision({ ...OK, DATABASE_URL: "postgres://prod" }, "pglite");
    assert.equal(d.seed, false);
    assert.match((d as { reason: string }).reason, /database URL is set/);
  });

  it("refuses when DATABASE_URL_UNPOOLED is set", () => {
    assert.equal(localSeedDecision({ ...OK, DATABASE_URL_UNPOOLED: "postgres://prod" }, "pglite").seed, false);
  });

  it("refuses on a real database backend", () => {
    assert.equal(localSeedDecision(OK, "neon").seed, false);
  });

  it("refuses when not started by npm run dev:local", () => {
    assert.equal(localSeedDecision({ ...OK, TIL_LOCAL_SEED: undefined }, "pglite").seed, false);
  });

  it("does nothing when the keys are absent, and refuses a short password", () => {
    assert.equal(localSeedDecision({ TIL_LOCAL_SEED: "1" }, "pglite").seed, false);
    assert.equal(localSeedDecision({ ...OK, LOCAL_SUPER_ADMIN_PASSWORD: "short" }, "pglite").seed, false);
  });
});
