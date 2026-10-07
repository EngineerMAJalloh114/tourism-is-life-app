import { createFileRoute } from "@tanstack/react-router";
import { getPaymentMode, verifyStripeSignature } from "@/lib/server/payments";
import { applyVerifiedPaymentEvent } from "@/lib/server/webhooks";
import { stripe } from "@/services/payments";

async function POST({ request }: { request: Request }) {
  const raw = await request.text();
  const mode = getPaymentMode();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret || mode.provider !== "stripe") {
    return new Response(JSON.stringify({ error: "Stripe is not configured" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }
  const header = request.headers.get("stripe-signature");
  if (!verifyStripeSignature(raw, header, secret)) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  // The adapter re-verifies the signature and extracts the paid amount and
  // currency — the settlement check in `evaluatePaymentEvent` rejects any live
  // success that arrives without them.
  let event;
  try {
    event = stripe.parseWebhook(raw, header);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }
  if (!event) {
    return new Response(JSON.stringify({ error: "Missing booking reference" }), { status: 400 });
  }
  const result = await applyVerifiedPaymentEvent(event);
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/webhooks/stripe")({
  server: { handlers: { POST } },
});
