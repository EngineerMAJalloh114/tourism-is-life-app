import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, it } from "node:test";
import { evaluatePaymentEvent } from "@/lib/server/evaluate-payment";
import { moneroo, stripe } from "@/services/payments";

/**
 * Regression: the live webhook routes used to parse the body themselves and
 * hand `applyVerifiedPaymentEvent` an event with no amount or currency, so
 * `evaluatePaymentEvent` rejected every real payment as `missing_or_zero_amount`.
 * The routes now go through each adapter's `parseWebhook`; these tests pin
 * that the parsed event carries the paid amount and currency all the way to
 * a "confirm" decision.
 */
const booking = { status: "PENDING_PAYMENT", amountCents: 25000, currency: "USD" };

describe("live webhook events reach settlement with amount and currency", () => {
  const saved = { ...process.env };
  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    process.env.MONEROO_WEBHOOK_SECRET = "moneroo_test";
  });
  afterEach(() => {
    process.env = { ...saved };
  });

  it("stripe: a signed paid checkout confirms the booking", () => {
    const body = JSON.stringify({
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: "bk_1",
          amount_total: 25000,
          currency: "usd",
          payment_status: "paid",
        },
      },
    });
    const t = Math.floor(Date.now() / 1000);
    const v1 = createHmac("sha256", "whsec_test").update(`${t}.${body}`).digest("hex");
    const event = stripe.parseWebhook(body, `t=${t},v1=${v1}`);
    assert.ok(event);
    assert.equal(event.amountCents, 25000);
    assert.equal(event.currency, "USD");
    assert.deepEqual(evaluatePaymentEvent(booking, event, false), { action: "confirm" });
  });

  it("stripe: a paid amount that differs from the booking is rejected", () => {
    const body = JSON.stringify({
      id: "evt_2",
      type: "checkout.session.completed",
      data: { object: { client_reference_id: "bk_1", amount_total: 100, currency: "usd" } },
    });
    const t = Math.floor(Date.now() / 1000);
    const v1 = createHmac("sha256", "whsec_test").update(`${t}.${body}`).digest("hex");
    const event = stripe.parseWebhook(body, `t=${t},v1=${v1}`);
    assert.ok(event);
    assert.deepEqual(evaluatePaymentEvent(booking, event, false), {
      action: "reject",
      reason: "amount_mismatch",
    });
  });

  it("moneroo: a signed successful payment confirms the booking", () => {
    const body = JSON.stringify({
      id: "evt_m1",
      event: "payment.success",
      data: { metadata: { bookingId: "bk_1" }, amount: 25000, currency: "usd", status: "success" },
    });
    const sig = createHmac("sha256", "moneroo_test").update(body).digest("hex");
    const event = moneroo.parseWebhook(body, sig);
    assert.ok(event);
    assert.equal(event.amountCents, 25000);
    assert.equal(event.currency, "USD");
    assert.deepEqual(evaluatePaymentEvent(booking, event, false), { action: "confirm" });
  });

  it("an unsigned payload never produces an event", () => {
    assert.equal(stripe.parseWebhook("{}", "t=1,v1=bad"), null);
    assert.equal(moneroo.parseWebhook("{}", null), null);
  });
});
