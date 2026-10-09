/**
 * Supabase Storage over plain `fetch` (no SDK). Request shapes confirmed on
 * 8 October 2026 against Supabase's own client (`storage-js`
 * `StorageFileApi.ts` and `lib/common/fetch.ts`) and the API keys guide:
 *
 *   signed upload URL  POST   {url}/storage/v1/object/upload/sign/{bucket}/{key}   -> { url: "/object/upload/sign/...?token=..." }
 *   browser upload     PUT    {url}/storage/v1/object/upload/sign/{bucket}/{key}?token=...  (raw body, Content-Type, x-upsert)
 *   upload             POST   {url}/storage/v1/object/{bucket}/{key}   (raw body, content-type, cache-control, x-upsert)
 *   download           GET    {url}/storage/v1/object/{bucket}/{key}   (Range header for part of it)
 *   head               HEAD   {url}/storage/v1/object/{bucket}/{key}
 *   delete             DELETE {url}/storage/v1/object/{bucket}   body { "prefixes": [keys] }
 *   public URL         {url}/storage/v1/object/public/{bucket}/{key}   (no request)
 *
 * The key goes in the `apikey` header. New secret keys (`sb_secret_...`) are
 * not JWTs and must not be sent as `Authorization: Bearer`; a legacy
 * `service_role` key is a JWT and is sent in both, as the client does.
 *
 * Server only: the key is read from the environment by `storage.server.ts`
 * and never leaves the server. The signed upload URL holds a short-lived
 * token for one object path, not the key.
 */
import { STORAGE_TIMEOUT_MS, StorageError, assertSafeKey, type MediaStorage, type StorageArea } from "@/lib/server/media/storage";

export type SupabaseStorageConfig = {
  url: string;
  serviceKey: string;
  publicBucket: string;
  incomingBucket: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
};

function encodeKey(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/");
}

function looksLikeJwt(key: string): boolean {
  return /^eyJ[\w-]*\.[\w-]+\.[\w-]+$/.test(key);
}

export function supabaseStorage(config: SupabaseStorageConfig): MediaStorage {
  const base = `${config.url.replace(/\/+$/, "")}/storage/v1`;
  const timeoutMs = config.timeoutMs ?? STORAGE_TIMEOUT_MS;
  const doFetch = config.fetch ?? fetch;
  const auth: Record<string, string> = { apikey: config.serviceKey };
  if (looksLikeJwt(config.serviceKey)) auth.Authorization = `Bearer ${config.serviceKey}`;
  const bucket = (area: StorageArea) => (area === "public" ? config.publicBucket : config.incomingBucket);

  async function call(what: string, url: string, init: RequestInit): Promise<Response> {
    try {
      return await doFetch(url, {
        ...init,
        headers: { ...auth, ...(init.headers as Record<string, string> | undefined) },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (e) {
      const name = (e as { name?: string }).name;
      if (name === "TimeoutError" || name === "AbortError") {
        throw new StorageError("TIMEOUT", `Storage did not answer in time (${what}).`);
      }
      throw new StorageError("FAILED", `Storage could not be reached (${what}).`);
    }
  }

  async function fail(what: string, res: Response): Promise<never> {
    // Supabase answers 540 while a free-plan project is paused.
    const paused = res.status === 540 ? " The storage project is paused." : "";
    throw new StorageError("FAILED", `Storage refused the ${what} (HTTP ${res.status}).${paused}`);
  }

  const objectUrl = (area: StorageArea, key: string) => `${base}/object/${bucket(area)}/${encodeKey(key)}`;

  return {
    name: "supabase",
    async createUploadTicket(key, contentType) {
      assertSafeKey(key);
      const res = await call("upload ticket", `${base}/object/upload/sign/${config.incomingBucket}/${encodeKey(key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!res.ok) await fail("upload ticket", res);
      const data = (await res.json()) as { url?: string };
      const signed = data.url ? new URL(base + data.url) : null;
      if (!signed?.searchParams.get("token")) throw new StorageError("FAILED", "Storage returned no upload token.");
      return { url: signed.toString(), method: "PUT", headers: { "x-upsert": "false", "Content-Type": contentType } };
    },
    async head(area, key) {
      const res = await call("head", objectUrl(area, key), { method: "HEAD" });
      if (res.status === 400 || res.status === 404) return null;
      if (!res.ok) await fail("head", res);
      const length = Number(res.headers.get("content-length"));
      return { bytes: Number.isFinite(length) ? length : -1, contentType: res.headers.get("content-type") };
    },
    async get(area, key) {
      const res = await call("download", objectUrl(area, key), { method: "GET" });
      if (res.status === 400 || res.status === 404) return null;
      if (!res.ok) await fail("download", res);
      return new Uint8Array(await res.arrayBuffer());
    },
    async getRange(area, key, start, end) {
      const res = await call("download", objectUrl(area, key), { method: "GET", headers: { Range: `bytes=${start}-${end}` } });
      if (res.status === 400 || res.status === 404) return null;
      if (!res.ok) await fail("download", res);
      // A server that ignores Range sends the whole object; keep only the part asked for.
      const bytes = new Uint8Array(await res.arrayBuffer());
      return res.status === 206 ? bytes : bytes.slice(start, end + 1);
    },
    async put(area, key, body, contentType) {
      assertSafeKey(key);
      const res = await call("upload", objectUrl(area, key), {
        method: "POST",
        headers: {
          "content-type": contentType,
          "cache-control": area === "public" ? "max-age=31536000" : "no-store",
          "x-upsert": "false",
        },
        body: body as unknown as BodyInit,
      });
      if (!res.ok) await fail("upload", res);
    },
    async delete(area, keys) {
      if (keys.length === 0) return;
      keys.forEach(assertSafeKey);
      const res = await call("delete", `${base}/object/${bucket(area)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefixes: keys }),
      });
      if (!res.ok && res.status !== 404) await fail("delete", res);
    },
    publicUrl(key) {
      return `${base}/object/public/${config.publicBucket}/${encodeKey(key)}`;
    },
  };
}
