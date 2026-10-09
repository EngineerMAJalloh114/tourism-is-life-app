import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { DATABASE_ENV_KEYS, LOCAL_SEED_FLAG, withLocalDatabase } from "./local-db.mjs";

const script = join(dirname(fileURLToPath(import.meta.url)), "local-db.mjs");

describe("withLocalDatabase", () => {
  it("blanks every database variable and keeps the rest", () => {
    const env = withLocalDatabase({ DATABASE_URL: "postgres://prod", DATABASE_URL_UNPOOLED: "postgres://prod2", KEEP: "1" });
    for (const key of DATABASE_ENV_KEYS) assert.equal(env[key], "");
    assert.equal(env.KEEP, "1");
  });

  it("sets the local-seed flag, which only this script sets", () => {
    assert.equal(withLocalDatabase({})[LOCAL_SEED_FLAG], "1");
  });

  it("does not mutate its input", () => {
    const input = { DATABASE_URL: "postgres://prod" };
    withLocalDatabase(input);
    assert.equal(input.DATABASE_URL, "postgres://prod");
  });
});

describe("local-db.mjs end to end", () => {
  it("hands the child process a blank DATABASE_URL even when the parent has one", () => {
    const r = spawnSync(
      process.execPath,
      [script, "node", "-e", "process.stdout.write(JSON.stringify(process.env.DATABASE_URL))"],
      { env: { ...process.env, DATABASE_URL: "postgres://should-not-leak" }, encoding: "utf8" },
    );
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /""$/);
    assert.doesNotMatch(r.stdout, /should-not-leak/);
  });
});
