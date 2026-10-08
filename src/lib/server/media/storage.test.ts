import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { localFileStorage } from "@/lib/server/media/local-storage";
import { StorageError, memoryStorage } from "@/lib/server/media/storage";
import { supabaseStorage } from "@/lib/server/media/supabase-storage";

type Seen = { method: string; url: string; headers: Record<string, string>; body: unknown };

/** A fetch that records each request and answers from `reply`. */
function fakeFetch(reply: (req: Seen) => Response | Promise<Response>) {
  const seen: Seen[] = [];
  const f = (async (input: string | URL, init?: RequestInit) => {
    const headers = Object.fromEntries(Object.entries((init?.headers ?? {}) as Record<string, string>).map(([k, v]) => [k.toLowerCase(), v]));
    const req = { method: init?.method ?? "GET", url: String(input), headers, body: init?.body };
    seen.push(req);
    return reply(req);
  }) as unknown as typeof fetch;
  return { fetch: f, seen };
}

const SECRET_KEY = "sb_secret_abcdefghijklmnopqrstuvwxyz012345";
const config = { url: "https://proj.supabase.co/", serviceKey: SECRET_KEY, publicBucket: "media-public", incomingBucket: "media-incoming" };

describe("storage: timeouts", () => {
  it("a call slower than its timeout fails with a TIMEOUT StorageError", async () => {
    const slow = memoryStorage({ delayMs: 200, timeoutMs: 20 });
    await assert.rejects(slow.get("incoming", "a.jpg"), (e) => e instanceof StorageError && e.code === "TIMEOUT");
    await assert.rejects(slow.put("public", "a.webp", new Uint8Array([1]), "image/webp"), (e) => e instanceof StorageError && e.code === "TIMEOUT");
  });

  it("the Supabase driver aborts a request that does not answer", async () => {
    const hanging = ((_: unknown, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal!.reason));
      })) as unknown as typeof fetch;
    const s = supabaseStorage({ ...config, timeoutMs: 30, fetch: hanging });
    await assert.rejects(s.head("public", "a.webp"), (e) => e instanceof StorageError && e.code === "TIMEOUT");
  });

  it("refuses keys that could climb out of their folder", async () => {
    const m = memoryStorage();
    for (const key of ["../etc/passwd", "a//b", "/abs", "a/../../b", "spaces are bad"]) {
      await assert.rejects(m.put("public", key, new Uint8Array([1]), "image/webp"), StorageError, key);
    }
  });
});

describe("storage: Supabase requests (shapes from storage-js, 8 October 2026)", () => {
  it("creates a signed upload URL for one object in the incoming bucket", async () => {
    const { fetch, seen } = fakeFetch(() => Response.json({ url: "/object/upload/sign/media-incoming/uploads/a.jpg?token=tok123" }));
    const ticket = await supabaseStorage({ ...config, fetch }).createUploadTicket("uploads/a.jpg", "image/jpeg");
    assert.equal(seen[0].method, "POST");
    assert.equal(seen[0].url, "https://proj.supabase.co/storage/v1/object/upload/sign/media-incoming/uploads/a.jpg");
    assert.equal(seen[0].headers.apikey, SECRET_KEY);
    assert.equal(seen[0].headers.authorization, undefined, "a new secret key is not a JWT and never goes in Authorization");
    assert.deepEqual(ticket, {
      url: "https://proj.supabase.co/storage/v1/object/upload/sign/media-incoming/uploads/a.jpg?token=tok123",
      method: "PUT",
      headers: { "x-upsert": "false", "Content-Type": "image/jpeg" },
    });
    assert.ok(!JSON.stringify(ticket).includes(SECRET_KEY), "the ticket the browser gets holds no key");
  });

  it("refuses a signed URL answer without a token", async () => {
    const { fetch } = fakeFetch(() => Response.json({ url: "/object/upload/sign/media-incoming/a.jpg" }));
    await assert.rejects(supabaseStorage({ ...config, fetch }).createUploadTicket("a.jpg", "image/jpeg"), StorageError);
  });

  it("sends a legacy service_role JWT in both headers", async () => {
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.c2lnbmF0dXJl";
    const { fetch, seen } = fakeFetch(() => new Response(null, { status: 404 }));
    await supabaseStorage({ ...config, serviceKey: jwt, fetch }).head("public", "x.webp");
    assert.equal(seen[0].headers.apikey, jwt);
    assert.equal(seen[0].headers.authorization, `Bearer ${jwt}`);
  });

  it("uploads, reads, reads a range, heads and deletes with the documented requests", async () => {
    const { fetch, seen } = fakeFetch((req) => {
      if (req.method === "HEAD") return new Response(null, { status: 200, headers: { "content-length": "1234", "content-type": "image/jpeg" } });
      if (req.method === "GET" && req.headers.range) return new Response(new Uint8Array([1, 2]), { status: 206 });
      if (req.method === "GET") return new Response(new Uint8Array([9, 8, 7]));
      return Response.json({ Key: "ok" });
    });
    const s = supabaseStorage({ ...config, fetch });
    await s.put("public", "media/m1/f1/w480.webp", new Uint8Array([1, 2, 3]), "image/webp");
    assert.deepEqual(await s.head("incoming", "uploads/a.jpg"), { bytes: 1234, contentType: "image/jpeg" });
    assert.deepEqual([...(await s.get("incoming", "uploads/a.jpg"))!], [9, 8, 7]);
    assert.deepEqual([...(await s.getRange("incoming", "uploads/a.jpg", 0, 15))!], [1, 2]);
    await s.delete("public", ["media/m1/f1/w480.webp", "media/m1/f1/w960.webp"]);
    assert.deepEqual(
      seen.map((r) => `${r.method} ${r.url}`),
      [
        "POST https://proj.supabase.co/storage/v1/object/media-public/media/m1/f1/w480.webp",
        "HEAD https://proj.supabase.co/storage/v1/object/media-incoming/uploads/a.jpg",
        "GET https://proj.supabase.co/storage/v1/object/media-incoming/uploads/a.jpg",
        "GET https://proj.supabase.co/storage/v1/object/media-incoming/uploads/a.jpg",
        "DELETE https://proj.supabase.co/storage/v1/object/media-public",
      ],
    );
    assert.equal(seen[0].headers["content-type"], "image/webp");
    assert.equal(seen[0].headers["x-upsert"], "false");
    assert.equal(seen[0].headers["cache-control"], "max-age=31536000");
    assert.equal(seen[3].headers.range, "bytes=0-15");
    assert.deepEqual(JSON.parse(String(seen[4].body)), { prefixes: ["media/m1/f1/w480.webp", "media/m1/f1/w960.webp"] });
    assert.equal(s.publicUrl("media/m1/f1/w480.webp"), "https://proj.supabase.co/storage/v1/object/public/media-public/media/m1/f1/w480.webp");
  });

  it("treats a missing object as null and a paused project (540) as a failure that says so", async () => {
    const missing = supabaseStorage({ ...config, fetch: fakeFetch(() => new Response("{}", { status: 404 })).fetch });
    assert.equal(await missing.get("incoming", "nope.jpg"), null);
    const paused = supabaseStorage({ ...config, fetch: fakeFetch(() => new Response("paused", { status: 540 })).fetch });
    await assert.rejects(paused.put("public", "a.webp", new Uint8Array([1]), "image/webp"), /paused/);
  });
});

describe("storage: local file driver", () => {
  it("round-trips files, signs upload slots, and refuses a bad or expired slot", async () => {
    const root = await mkdtemp(join(tmpdir(), "til-media-"));
    try {
      const s = localFileStorage({ root, secret: "local-secret", origin: () => "http://127.0.0.1:8080" });
      const ticket = await s.createUploadTicket("uploads/a.jpg", "image/jpeg");
      const url = new URL(ticket.url);
      assert.equal(url.origin + url.pathname, "http://127.0.0.1:8080/api/media/local/upload");
      const [key, expires, signature] = ["key", "expires", "signature"].map((k) => url.searchParams.get(k) ?? "");
      assert.equal(s.verifyUploadSlot(key, expires, signature), "uploads/a.jpg");
      assert.equal(s.verifyUploadSlot("uploads/b.jpg", expires, signature), null, "the signature covers the key");
      assert.equal(s.verifyUploadSlot(key, "1", signature), null, "an expired slot");
      await s.put("incoming", "uploads/a.jpg", new Uint8Array([1, 2, 3, 4]), "image/jpeg");
      assert.deepEqual(await s.head("incoming", "uploads/a.jpg"), { bytes: 4, contentType: null });
      assert.deepEqual([...(await s.getRange("incoming", "uploads/a.jpg", 1, 2))!], [2, 3]);
      await s.delete("incoming", ["uploads/a.jpg", "uploads/never-there.jpg"]);
      assert.equal(await s.get("incoming", "uploads/a.jpg"), null);
      await s.put("public", "media/m/f/w480.webp", new Uint8Array([5]), "image/webp");
      assert.deepEqual([...(await s.readPublic("media/m/f/w480.webp"))!], [5]);
      assert.equal(s.publicUrl("media/m/f/w480.webp"), "/api/media/local/file/media/m/f/w480.webp");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
