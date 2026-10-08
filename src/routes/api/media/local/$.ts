import { createFileRoute } from "@tanstack/react-router";
import { MAX_UPLOAD_BYTES } from "@/lib/server/media/image";
import type { LocalStorage } from "@/lib/server/media/local-storage";
import { mediaDeps } from "@/lib/server/media/storage.server";

/**
 * The local file driver's two endpoints (`npm run dev:local` only):
 *   PUT /api/media/local/upload?key&expires&signature  receives an upload slot's file
 *   GET /api/media/local/file/<key>                    serves a public variant
 * On any other setup the storage is not the local driver and both answer 404,
 * so this route does nothing on a deployment.
 */
function localStorage(): LocalStorage | null {
  const storage = mediaDeps().storage;
  return storage?.name === "local" ? (storage as LocalStorage) : null;
}

const TYPES: Record<string, string> = { webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };
const notFound = () => new Response("Not found", { status: 404 });

export const Route = createFileRoute("/api/media/local/$")({
  server: {
    handlers: {
      PUT: async ({ request, params }) => {
        const storage = localStorage();
        if (!storage || params._splat !== "upload") return notFound();
        const url = new URL(request.url);
        const key = storage.verifyUploadSlot(
          url.searchParams.get("key") ?? "",
          url.searchParams.get("expires") ?? "",
          url.searchParams.get("signature") ?? "",
        );
        if (!key) return new Response("This upload slot is not valid.", { status: 403 });
        const declared = Number(request.headers.get("content-length") ?? "0");
        if (declared > MAX_UPLOAD_BYTES) return new Response("Too large.", { status: 413 });
        const body = new Uint8Array(await request.arrayBuffer());
        if (body.byteLength > MAX_UPLOAD_BYTES) return new Response("Too large.", { status: 413 });
        await storage.put("incoming", key, body, request.headers.get("content-type") ?? "application/octet-stream");
        return Response.json({ key });
      },
      GET: async ({ params }) => {
        const storage = localStorage();
        const splat = params._splat ?? "";
        if (!storage || !splat.startsWith("file/")) return notFound();
        const key = splat.slice("file/".length);
        let body: Uint8Array | null;
        try {
          body = await storage.readPublic(key);
        } catch {
          return notFound();
        }
        if (!body) return notFound();
        const type = TYPES[key.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";
        return new Response(body as unknown as BodyInit, { headers: { "Content-Type": type, "Cache-Control": "no-cache" } });
      },
    },
  },
});
