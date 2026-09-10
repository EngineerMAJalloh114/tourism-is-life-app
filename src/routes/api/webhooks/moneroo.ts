import { createFileRoute } from "@tanstack/react-router";
import { getPaymentMode, verifyHmacSha256 } from "@/lib/server/payments";
import { applyVerifiedPaymentEvent } from "@/lib/server/webhooks";

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
  let parsed: { id?: string; event?: string; data?: { bookingId?: string; reference?: string } };
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }
  const bookingId = String(parsed.data?.bookingId ?? parsed.data?.reference ?? "");
  if (!parsed.id || !bookingId) {
    return new Response(JSON.stringify({ error: "Missing booking reference" }), { status: 400 });
  }
  const success = (parsed.event ?? "").toLowerCase().includes("success") || parsed.event === "payment.succeeded";
  const result = await applyVerifiedPaymentEvent({
    provider: "moneroo",
    eventId: parsed.id,
    bookingId,
    success,
  });
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/webhooks/moneroo")({
  server: { handlers: { POST } },
});
