import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { activePaymentProvider, paymentMode } from "./payments.ts";

describe("payment provider abstraction", () => {
  it("selects the demo adapter without live secrets", () => {
    const provider = activePaymentProvider();
    assert.equal(provider.id, "demo");
    assert.equal(provider.configured(), true);
  });

  it("reports demo mode when Stripe and Moneroo are unset", () => {
    const mode = paymentMode();
    assert.equal(mode.provider, "demo");
    assert.equal(mode.live, false);
  });

  it("demo initiate does not invent a live redirect", async () => {
    const started = await activePaymentProvider().initiate({
      id: "TIL-TEST",
      amountCents: 0,
      currency: "USD",
    });
    assert.equal(started.demo, true);
    assert.equal(started.redirectUrl, undefined);
  });
});
