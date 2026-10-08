import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { checkBuiltAssets, findAssetRefs, findServerSecrets, missingAssets } from "./check-built-assets.mjs";

describe("findAssetRefs", () => {
  it("finds distinct stylesheet and script references", () => {
    const text = `x"/assets/styles-Abc12.css" y '/assets/main-9x.js' "/assets/styles-Abc12.css" "/assets/pic.jpg"`;
    assert.deepEqual(findAssetRefs(text), ["/assets/main-9x.js", "/assets/styles-Abc12.css"]);
  });

  it("ignores bundler region comments that name server chunks", () => {
    const text = "//#region node_modules/.nitro/vite/services/ssr/assets/about-NwFm6SQg.js\nconst a = 1;";
    assert.deepEqual(findAssetRefs(text), []);
  });
});

describe("missingAssets", () => {
  it("reports references with no emitted file (the PERF-1 case)", () => {
    const refs = ["/assets/styles-SERVER.css", "/assets/main.js"];
    assert.deepEqual(missingAssets(refs, ["styles-CLIENT.css", "main.js"]), ["/assets/styles-SERVER.css"]);
  });
  it("passes when every reference was emitted", () => {
    assert.deepEqual(missingAssets(["/assets/a.css"], ["a.css"]), []);
  });
});

describe("checkBuiltAssets", () => {
  function fixture(serverText, emitted) {
    const dir = mkdtempSync(join(tmpdir(), "assets-check-"));
    mkdirSync(join(dir, "static", "assets"), { recursive: true });
    mkdirSync(join(dir, "functions", "__server.func"), { recursive: true });
    for (const f of emitted) writeFileSync(join(dir, "static", "assets", f), "");
    writeFileSync(join(dir, "functions", "__server.func", "index.mjs"), serverText);
    return dir;
  }

  it("fails on a stylesheet hash mismatch between server and client builds", () => {
    const dir = fixture('const css="/assets/styles-SERVER.css"', ["styles-CLIENT.css"]);
    try {
      const r = checkBuiltAssets(dir);
      assert.equal(r.ok, false);
      assert.deepEqual(r.missing, ["/assets/styles-SERVER.css"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("passes when the referenced stylesheet exists", () => {
    const dir = fixture('const css="/assets/styles-SAME.css"', ["styles-SAME.css"]);
    try {
      assert.equal(checkBuiltAssets(dir).ok, true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("fails when the server bundle references no stylesheet at all", () => {
    const dir = fixture('const js="/assets/main.js"', ["main.js"]);
    try {
      assert.equal(checkBuiltAssets(dir).ok, false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("fails when a browser file names the Supabase service key or holds a secret key", () => {
    for (const leak of ["const k = process.env.SUPABASE_SERVICE_KEY", "apikey:\"sb_secret_abc\""]) {
      const dir = fixture('const css="/assets/styles-SAME.css"', ["styles-SAME.css"]);
      try {
        writeFileSync(join(dir, "static", "assets", "admin-XYZ.js"), leak);
        const r = checkBuiltAssets(dir);
        assert.equal(r.ok, false, leak);
        assert.equal(r.leaks.length, 1);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it("does not flag the server bundle, which may read the key", () => {
    const dir = fixture('const css="/assets/styles-SAME.css"; process.env.SUPABASE_SERVICE_KEY', ["styles-SAME.css"]);
    try {
      assert.equal(checkBuiltAssets(dir).ok, true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("reports a missing build instead of passing", () => {
    const r = checkBuiltAssets(join(tmpdir(), "definitely-not-a-build-dir-xyz"));
    assert.equal(r.ok, false);
    assert.match(r.error, /No build output/);
  });
});

describe("findServerSecrets", () => {
  it("finds the service key name and the secret key shape, nothing else", () => {
    assert.deepEqual(findServerSecrets("SUPABASE_URL SUPABASE_PUBLIC_BUCKET"), []);
    assert.deepEqual(findServerSecrets("x SUPABASE_SERVICE_KEY y sb_secret_123"), ["SUPABASE_SERVICE_KEY", "sb_secret_"]);
  });
});
