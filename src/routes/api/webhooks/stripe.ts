import { createFileRoute } from "@tanstack/react-router";
import { getPaymentMode, verifyStripeSignature } from "@/lib/server/payments";
import { applyVerifiedPaymentEvent } from "@/lib/server/webhooks";

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
  let parsed: { id?: string; type?: string; data?: { object?: Record<string, unknown> } };
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }
  const obj = parsed.data?.object ?? {};
  const meta = obj.metadata as { bookingId?: string } | undefined;
  const bookingId = String(obj.client_reference_id ?? meta?.bookingId ?? "");
  if (!parsed.id || !bookingId) {
    return new Response(JSON.stringify({ error: "Missing booking reference" }), { status: 400 });
  }
  const success = parsed.type === "checkout.session.completed" || parsed.type === "payment_intent.succeeded";
  const result = await applyVerifiedPaymentEvent({
    provider: "stripe",
    eventId: parsed.id,
    bookingId,
    success,
  });
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/webhooks/stripe")({
  server: { handlers: { POST } },
});
