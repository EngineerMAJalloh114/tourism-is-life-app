/**
 * Which storage the media library uses, decided once per server instance.
 *
 *   - Supabase Storage when SUPABASE_URL, SUPABASE_SERVICE_KEY,
 *     SUPABASE_PUBLIC_BUCKET and SUPABASE_INCOMING_BUCKET are all set.
 *   - The local file driver (`.local-media/`) only when `npm run dev:local`
 *     started the app on in-memory PGLite and it is not running on Vercel.
 *   - Otherwise none: uploads are switched off with a message naming what is
 *     missing, and the library still lists the photos that ship with the site.
 *
 * The service key is read here and passed only to the Supabase driver; it is
 * never returned to a caller or sent to the browser.
 */
import { randomBytes } from "node:crypto";
import { getRequest } from "@tanstack/react-start/server";
import { dbSource } from "@/lib/db";
import { env } from "@/lib/env.server";
import { log } from "@/lib/server/logger";
import { localFileStorage, LOCAL_MEDIA_DIR } from "@/lib/server/media/local-storage";
import { UPLOADS_OFF_MESSAGE, type MediaDeps } from "@/lib/server/media/library";
import type { MediaStorage } from "@/lib/server/media/storage";
import { supabaseStorage } from "@/lib/server/media/supabase-storage";

const SUPABASE_VARS = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "SUPABASE_PUBLIC_BUCKET", "SUPABASE_INCOMING_BUCKET"] as const;

function ticketSecret(): string {
  const configured = env("BETTER_AUTH_SECRET");
  if (configured) return configured;
  // Local and preview builds only (deployments require BETTER_AUTH_SECRET):
  // stable for this process, so a ticket made before a hot reload still works.
  const g = globalThis as { __tilMediaSecret?: string };
  g.__tilMediaSecret ??= randomBytes(32).toString("hex");
  return g.__tilMediaSecret;
}

function decide(): { storage: MediaStorage | null; offReason: string | null } {
  const values = Object.fromEntries(SUPABASE_VARS.map((k) => [k, env(k)?.trim() || ""])) as Record<(typeof SUPABASE_VARS)[number], string>;
  const set = SUPABASE_VARS.filter((k) => values[k]);
  if (set.length === SUPABASE_VARS.length) {
    if (!/^https:\/\//.test(values.SUPABASE_URL)) {
      return { storage: null, offReason: "Uploads are switched off: SUPABASE_URL must start with https://." };
    }
    return {
      storage: supabaseStorage({
        url: values.SUPABASE_URL,
        serviceKey: values.SUPABASE_SERVICE_KEY,
        publicBucket: values.SUPABASE_PUBLIC_BUCKET,
        incomingBucket: values.SUPABASE_INCOMING_BUCKET,
      }),
      offReason: null,
    };
  }
  if (set.length > 0) {
    const missing = SUPABASE_VARS.filter((k) => !values[k]);
    return { storage: null, offReason: `Uploads are switched off: ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} not set.` };
  }
  if (process.env.TIL_LOCAL_SEED === "1" && dbSource === "pglite" && !process.env.VERCEL) {
    return {
      storage: localFileStorage({
        root: LOCAL_MEDIA_DIR,
        secret: ticketSecret(),
        origin: () => {
          const request = getRequest();
          return request ? new URL(request.url).origin : "http://localhost:8080";
        },
      }),
      offReason: null,
    };
  }
  return { storage: null, offReason: UPLOADS_OFF_MESSAGE };
}

let decided: ReturnType<typeof decide> | null = null;

export function mediaDeps(): MediaDeps {
  if (!decided) {
    decided = decide();
    log.info("media.storage", { driver: decided.storage?.name ?? "off" });
  }
  return { storage: decided.storage, offReason: decided.offReason, secret: ticketSecret() };
}
