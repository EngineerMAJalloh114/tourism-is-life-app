import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createHmac } from "node:crypto";
import { getPaymentMode, parseDemoEvent, verifyHmacSha256, verifyStripeSignature } from "./payments.ts";

describe("payment adapters", () => {
  it("defaults to labelled demo mode without secrets", () => {
    const mode = getPaymentMode();
    assert.equal(mode.provider, "demo");
    assert.equal(mode.live, false);
    assert.match(mode.label, /not a card charge/i);
  });

  it("rejects unsigned stripe payloads", () => {
    assert.equal(verifyStripeSignature("{}", null, "whsec_test"), false);
    assert.equal(verifyStripeSignature("{}", "t=1,v1=deadbeef", "whsec_test"), false);
  });

  it("accepts a valid stripe-style signature", () => {
    const secret = "whsec_test";
    const body = "{\"ok\":true}";
    const t = String(Math.floor(Date.now() / 1000));
    const v1 = createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
    assert.equal(verifyStripeSignature(body, `t=${t},v1=${v1}`, secret), true);
  });

  it("verifies generic hmac signatures", () => {
    const secret = "moneroo_test";
    const payload = "{\"id\":\"evt_1\"}";
    const sig = createHmac("sha256", secret).update(payload).digest("hex");
    assert.equal(verifyHmacSha256(payload, secret, sig), true);
    assert.equal(verifyHmacSha256(payload, secret, "00"), false);
  });

  it("parses demo events strictly", () => {
    assert.equal(parseDemoEvent({ bookingId: "TIL-1", eventId: "evt" })?.success, true);
    assert.equal(parseDemoEvent({ bookingId: "TIL-1" }), null);
  });
});
