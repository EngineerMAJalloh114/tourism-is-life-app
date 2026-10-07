import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { cronAuthorized } from "@/lib/server/config";

describe("cronAuthorized", () => {
  const saved = { ...process.env };
  beforeEach(() => {
    process.env.CRON_SECRET = "s3cret-value";
  });
  afterEach(() => {
    process.env = { ...saved };
  });

  it("accepts the exact bearer secret", () => {
    assert.equal(cronAuthorized("Bearer s3cret-value"), true);
  });
  it("rejects a missing header", () => {
    assert.equal(cronAuthorized(null), false);
  });
  it("rejects a wrong secret and a bare secret without the Bearer prefix", () => {
    assert.equal(cronAuthorized("Bearer nope"), false);
    assert.equal(cronAuthorized("s3cret-value"), false);
  });
});
