import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { isWorkspacePreview, vercelEnv } from "./env.server.ts";

const KEYS = ["GROK_PROJECT_ID", "VERCEL_ENV", "VERCEL", "BETTER_AUTH_URL"] as const;

/** Snapshot + clear the runtime-classification env vars, restore after each test. */
function clearAll() {
  for (const k of KEYS) delete process.env[k];
}

describe("isWorkspacePreview — Step 2.4C runtime-detection fix", () => {
  afterEach(clearAll);

  it("local development (nothing set) is treated as workspace preview", () => {
    clearAll();
    assert.equal(isWorkspacePreview(), true);
  });

  it("unknown/ambiguous deployed host (no recognized signal at all) still defaults to preview, same as local dev", () => {
    // Documented tradeoff: an unrecognized host is indistinguishable from
    // local dev without a positive signal, so it gets the same permissive
    // default rather than a guessed-strict one. See the function's doc
    // comment. Demo payments etc. are gated on THIS predicate, so this test
    // pins the (intentional) behavior rather than letting it drift silently.
    clearAll();
    process.env.SOME_RANDOM_HOST_VAR = "1";
    delete process.env.SOME_RANDOM_HOST_VAR;
    assert.equal(isWorkspacePreview(), true);
  });

  it("Grok deploy (GROK_PROJECT_ID set) is never workspace preview, regardless of Vercel vars", () => {
    clearAll();
    process.env.GROK_PROJECT_ID = "proj-123";
    assert.equal(isWorkspacePreview(), false);
  });

  it("Vercel production (VERCEL_ENV=production exposed) is NOT workspace preview", () => {
    clearAll();
    process.env.VERCEL_ENV = "production";
    assert.equal(vercelEnv(), "production");
    assert.equal(isWorkspacePreview(), false);
  });

  it("Vercel preview (VERCEL_ENV=preview exposed) IS workspace preview — not treated as production", () => {
    clearAll();
    process.env.VERCEL_ENV = "preview";
    assert.equal(isWorkspacePreview(), true);
  });

  it("Vercel development (VERCEL_ENV=development exposed) IS workspace preview — not treated as production", () => {
    clearAll();
    process.env.VERCEL_ENV = "development";
    assert.equal(isWorkspacePreview(), true);
  });

  it("Vercel production with VERCEL_ENV NOT exposed to the runtime (the incident) still resolves via BETTER_AUTH_URL", () => {
    // Reproduces the exact failure found in Step 2.4B: the platform did not
    // expose VERCEL_ENV to this function, yet the deployment IS the real
    // production one (it has BETTER_AUTH_URL, which this app only ever
    // configures in the Production environment).
    clearAll();
    process.env.BETTER_AUTH_URL = "https://tourism-is-life-app-bdza.vercel.app";
    assert.equal(vercelEnv(), undefined);
    assert.equal(isWorkspacePreview(), false);
  });

  it("VERCEL_ENV, when present, always wins over the BETTER_AUTH_URL fallback", () => {
    clearAll();
    process.env.VERCEL_ENV = "preview";
    process.env.BETTER_AUTH_URL = "https://some-preview-alias.vercel.app";
    assert.equal(isWorkspacePreview(), true);
  });

  it("stale plain VERCEL=1 (no VERCEL_ENV) no longer has any effect on its own", () => {
    // Guards against silently reintroducing the disproven assumption that
    // the bare VERCEL flag is a sufficient production signal.
    clearAll();
    process.env.VERCEL = "1";
    assert.equal(isWorkspacePreview(), true);
  });
});
