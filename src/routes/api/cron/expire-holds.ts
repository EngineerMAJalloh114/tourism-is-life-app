import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { expireHolds } from "@/lib/server/booking-engine";
import { cronAuthorized } from "@/lib/server/config";
import { log } from "@/lib/server/logger";

/**
 * Releases seats held by bookings whose 15-minute hold has lapsed. Expiry also
 * runs lazily on the next booking/webhook request; this route lets a scheduler
 * (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`) clear them on time
 * even when nobody is booking. Safe to call repeatedly — it is idempotent.
 */
async function handler({ request }: { request: Request }) {
  if (!cronAuthorized(request.headers.get("authorization"))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  const sql = await getSql();
  const expired = await sql.transaction((tx) => expireHolds(tx));
  log.info("cron.expire_holds", { expired });
  return new Response(JSON.stringify({ ok: true, expired }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/cron/expire-holds")({
  server: { handlers: { GET: handler, POST: handler } },
});
