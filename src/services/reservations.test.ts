import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HOLD_SECONDS, reservationBackend } from "./reservations.ts";

describe("reservation backend", () => {
  it("falls back to postgres-only without Upstash credentials", () => {
    assert.equal(reservationBackend(), "postgres-only");
  });

  it("uses a 15-minute hold window", () => {
    assert.equal(HOLD_SECONDS, 15 * 60);
  });
});
