import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canTransition,
  hasCapacity,
  isHoldExpired,
  remainingSeats,
} from "./booking-state.ts";

describe("booking state machine", () => {
  it("allows hold to payment to confirmed", () => {
    assert.equal(canTransition("HOLD", "PENDING_PAYMENT"), true);
    assert.equal(canTransition("PENDING_PAYMENT", "CONFIRMED"), true);
    assert.equal(canTransition("CONFIRMED", "HOLD"), false);
    assert.equal(canTransition("EXPIRED", "CONFIRMED"), false);
  });

  it("rejects double-booking when seats are gone", () => {
    assert.equal(hasCapacity(10, 8, 2, 1), false);
    assert.equal(hasCapacity(10, 6, 2, 2), true);
    assert.equal(hasCapacity(8, 0, 0, 8), true);
    assert.equal(hasCapacity(8, 0, 0, 9), false);
    assert.equal(remainingSeats(12, 4, 3), 5);
  });

  it("expires holds after the deadline", () => {
    const now = new Date("2026-09-06T12:00:00Z");
    assert.equal(isHoldExpired("2026-09-06T11:59:00Z", now), true);
    assert.equal(isHoldExpired("2026-09-06T12:15:00Z", now), false);
    assert.equal(isHoldExpired(null, now), false);
  });
});
