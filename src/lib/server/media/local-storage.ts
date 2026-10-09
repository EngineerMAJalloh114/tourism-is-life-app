/**
 * The local file driver for `npm run dev:local`: objects are files under
 * `.local-media/` (gitignored), the upload slot is a signed URL on this app's
 * own `/api/media/local/upload` route, and public objects are served by
 * `/api/media/local/file/...`. `storage.server.ts` selects it only when the
 * app was started by dev:local on in-memory PGLite and not on Vercel, so it
 * can never answer on a deployment.
 */
import { createHmac } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { STORAGE_TIMEOUT_MS, StorageError, assertSafeKey, withTimeout, type MediaStorage, type StorageArea } from "@/lib/server/media/storage";
import { safeEqual } from "@/lib/server/crypto";

export const LOCAL_MEDIA_ROUTE = "/api/media/local";
const TICKET_SECONDS = 30 * 60;

export type LocalStorage = MediaStorage & {
  /** For the upload route: the key a signed slot points at, or null when the slot is bad or expired. */
  verifyUploadSlot(key: string, expires: string, signature: string): string | null;
  /** For the file route: a public object's bytes. */
  readPublic(key: string): Promise<Uint8Array | null>;
};

export function localFileStorage(opts: { root: string; secret: string; origin: () => string; timeoutMs?: number }): LocalStorage {
  const root = resolve(opts.root);
  const timeoutMs = opts.timeoutMs ?? STORAGE_TIMEOUT_MS;
  const path = (area: StorageArea, key: string) => {
    assertSafeKey(key);
    const full = resolve(root, area, ...key.split("/"));
    if (!full.startsWith(resolve(root, area) + sep)) throw new StorageError("FAILED", "Refused an unsafe storage key.");
    return full;
  };
  const sign = (key: string, expires: string) => createHmac("sha256", opts.secret).update(`${key}|${expires}`).digest("hex");
  const guard = <T>(what: string, work: Promise<T>) =>
    withTimeout(
      work.catch((e) => {
        if (e instanceof StorageError) throw e;
        if ((e as { code?: string }).code === "ENOENT") return null as T;
        throw new StorageError("FAILED", `Local storage failed (${what}).`);
      }),
      timeoutMs,
      what,
    );

  return {
    name: "local",
    async createUploadTicket(key, contentType) {
      assertSafeKey(key);
      const expires = String(Math.floor(Date.now() / 1000) + TICKET_SECONDS);
      const url = new URL(`${LOCAL_MEDIA_ROUTE}/upload`, opts.origin());
      url.searchParams.set("key", key);
      url.searchParams.set("expires", expires);
      url.searchParams.set("signature", sign(key, expires));
      return { url: url.toString(), method: "PUT", headers: { "Content-Type": contentType } };
    },
    verifyUploadSlot(key, expires, signature) {
      try {
        assertSafeKey(key);
      } catch {
        return null;
      }
      if (!/^\d+$/.test(expires) || Number(expires) < Date.now() / 1000) return null;
      return safeEqual(sign(key, expires), signature) ? key : null;
    },
    head(area, key) {
      return guard("head", stat(path(area, key)).then((s) => ({ bytes: s.size, contentType: null })));
    },
    get(area, key) {
      return guard("download", readFile(path(area, key)).then((b) => new Uint8Array(b)));
    },
    getRange(area, key, start, end) {
      return guard("download", readFile(path(area, key)).then((b) => new Uint8Array(b.subarray(start, end + 1))));
    },
    put(area, key, body) {
      const file = path(area, key);
      return guard("upload", mkdir(dirname(file), { recursive: true }).then(() => writeFile(file, body))).then(() => undefined);
    },
    delete(area, keys) {
      return guard("delete", Promise.all(keys.map((k) => rm(path(area, k), { force: true })))).then(() => undefined);
    },
    publicUrl(key) {
      return `${LOCAL_MEDIA_ROUTE}/file/${key}`;
    },
    readPublic(key) {
      return guard("download", readFile(path("public", key)).then((b) => new Uint8Array(b)));
    },
  };
}

export const LOCAL_MEDIA_DIR = join(".local-media");
