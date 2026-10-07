import { createFileRoute } from "@tanstack/react-router";
import { getPaymentMode, verifyHmacSha256 } from "@/lib/server/payments";
import { applyVerifiedPaymentEvent } from "@/lib/server/webhooks";
import { moneroo } from "@/services/payments";

async function POST({ request }: { request: Request }) {
  const raw = await request.text();
  const mode = getPaymentMode();
  const secret = process.env.MONEROO_WEBHOOK_SECRET?.trim();
  if (!secret || mode.provider !== "moneroo") {
    return new Response(JSON.stringify({ error: "Moneroo is not configured" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }
  const header = request.headers.get("x-moneroo-signature") ?? request.headers.get("x-signature");
  if (!header || !verifyHmacSha256(raw, secret, header)) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  let event;
  try {
    event = moneroo.parseWebhook(raw, header);
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

export const Route = createFileRoute("/api/webhooks/moneroo")({
  server: { handlers: { POST } },
});
