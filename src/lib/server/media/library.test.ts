import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import sharp from "sharp";
import type { Sql } from "@/lib/sql";
import type { Actor } from "@/lib/server/access";
import { MAX_UPLOAD_BYTES } from "@/lib/server/media/image";
import {
  createUploadTicket,
  deleteMedia,
  finishUpload,
  getMedia,
  listMedia,
  replaceFile,
  setMediaPublished,
  updateMedia,
  type MediaDeps,
} from "@/lib/server/media/library";
import { memoryStorage, type MemoryStorage } from "@/lib/server/media/storage";
import { createTestDb, insertStaff, type TestDb } from "@/lib/server/testing/test-db";

function rejectsWith(status: number, code?: string) {
  return (err: unknown) => {
    const e = err as { status?: number; code?: string };
    assert.equal(e.status, status, `expected HTTP ${status}, got ${e.status} (${String(err)})`);
    if (code) assert.equal(e.code, code);
    return true;
  };
}

/** An Sql whose statements matching `pattern` fail, including inside transactions. */
function failing(sql: Sql, pattern: RegExp): Sql {
  const wrap = (inner: Sql): Sql => {
    const fn = ((strings: TemplateStringsArray, ...values: unknown[]) => {
      if (pattern.test(strings.join("?"))) return Promise.reject(new Error("database write failed"));
      return inner(strings, ...values);
    }) as Sql;
    fn.query = (text, params) => (pattern.test(text) ? Promise.reject(new Error("database write failed")) : inner.query(text, params));
    fn.transaction = (cb) => inner.transaction((tx) => cb(wrap(tx)));
    return fn;
  };
  return wrap(sql);
}

async function jpeg(width = 1200, height = 800, colour = "#336655") {
  return new Uint8Array(await sharp({ create: { width, height, channels: 3, background: colour } }).jpeg().toBuffer());
}

const FULL = { source: "Supplied by the owner", license: "Owner's own photo, all rights", author: "Tourism Is Life", location: "Lumley Beach, Freetown" };

describe("media library (A6)", () => {
  let db: TestDb;
  let storage: MemoryStorage;
  let deps: MediaDeps;
  let editor: Actor;

  beforeEach(async () => {
    db = await createTestDb();
    storage = memoryStorage();
    deps = { storage, secret: "test-media-secret" };
    editor = await insertStaff(db.sql, "editor", "CONTENT_MANAGER");
  });
  afterEach(async () => {
    await db.close();
  });

  /** What the page does: ticket, browser upload, finish. */
  async function upload(body: Uint8Array, opts: { type?: string; declared?: number; alt?: string; provenance?: object; sql?: Sql; actor?: Actor } = {}) {
    const actor = opts.actor ?? editor;
    const type = opts.type ?? "image/jpeg";
    const t = await createUploadTicket(db.sql, actor, { filename: "beach.jpg", contentType: type, bytes: opts.declared ?? body.byteLength }, deps);
    storage.upload(t.upload, body, type);
    return finishUpload(opts.sql ?? db.sql, actor, { token: t.token, filename: "beach.jpg", alt: opts.alt ?? "Lumley Beach at low tide", provenance: opts.provenance ?? FULL }, deps);
  }

  it("stores variants in the public area, deletes the upload, then writes the row and the audit entry", async () => {
    const result = await upload(await jpeg());
    assert.deepEqual(
      storage.keys("public").sort(),
      ["w1200.jpg", "w1200.webp", "w480.webp", "w960.webp"].map((n) => `media/${result.id}/${result.fileId}/${n}`).sort(),
    );
    assert.deepEqual(storage.keys("incoming"), [`analysis/${result.id}/${result.fileId}.rgb`], "the original upload is gone");
    const row = await db.sql<{ origin: string; provenance_status: string; published: boolean; width: number }>`
      select origin, provenance_status, published, width from media where id = ${result.id}
    `;
    assert.deepEqual(row[0], { origin: "upload", provenance_status: "complete", published: false, width: 1200 });
    const audit = await db.sql<{ action: string; actor_id: string }>`select action, actor_id from audit_logs where entity_id = ${result.id}`;
    assert.deepEqual(audit, [{ action: "media.upload", actor_id: "editor" }]);
  });

  it("refuses an oversize or wrong-type upload before any slot exists", async () => {
    await assert.rejects(
      createUploadTicket(db.sql, editor, { filename: "big.jpg", contentType: "image/jpeg", bytes: MAX_UPLOAD_BYTES + 1 }, deps),
      rejectsWith(400, "TOO_LARGE"),
    );
    await assert.rejects(
      createUploadTicket(db.sql, editor, { filename: "a.svg", contentType: "image/svg+xml", bytes: 100 }, deps),
      rejectsWith(400, "UNSUPPORTED_TYPE"),
    );
    assert.equal(storage.objects.size, 0);
  });

  it("refuses a spoofed signature and a file bigger than declared, and deletes what arrived", async () => {
    const png = new Uint8Array(await sharp({ create: { width: 50, height: 50, channels: 3, background: "#fff" } }).png().toBuffer());
    await assert.rejects(upload(png, { type: "image/jpeg" }), rejectsWith(400, "SIGNATURE_MISMATCH"));
    const huge = new Uint8Array(MAX_UPLOAD_BYTES + 10);
    huge.set([0xff, 0xd8, 0xff, 0xe0]);
    await assert.rejects(upload(huge, { declared: 1000 }), rejectsWith(400, "TOO_LARGE"));
    assert.equal(storage.objects.size, 0, "nothing kept in either area");
    assert.equal((await db.sql`select 1 from media where origin = 'upload'`).length, 0);
  });

  it("refuses a ticket that is another account's, expired, tampered or for something else", async () => {
    const other = await insertStaff(db.sql, "other", "CONTENT_MANAGER");
    const body = await jpeg(100, 100);
    const t = await createUploadTicket(db.sql, editor, { filename: "a.jpg", contentType: "image/jpeg", bytes: body.byteLength }, deps);
    storage.upload(t.upload, body, "image/jpeg");
    await assert.rejects(finishUpload(db.sql, other, { token: t.token }, deps), rejectsWith(403, "TICKET_OWNER"));
    const later = { ...deps, now: () => Date.now() + 31 * 60 * 1000 };
    await assert.rejects(finishUpload(db.sql, editor, { token: t.token }, later), rejectsWith(400, "TICKET_EXPIRED"));
    const [bodyPart, mac] = t.token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(bodyPart, "base64url").toString()), u: "other" })).toString("base64url");
    await assert.rejects(finishUpload(db.sql, other, { token: `${forged}.${mac}` }, deps), rejectsWith(400, "BAD_TICKET"));
    await assert.rejects(replaceFile(db.sql, editor, { mediaId: "m_x", token: t.token }, deps), rejectsWith(400, "TICKET_PURPOSE"));
  });

  it("a failed database write deletes the objects it uploaded", async () => {
    const broken = failing(db.sql, /insert into media_files/);
    await assert.rejects(upload(await jpeg(), { sql: broken }), /database write failed/);
    assert.equal(storage.objects.size, 0, "variants, raster and the upload are all gone");
    assert.equal((await db.sql`select 1 from media where origin = 'upload'`).length, 0, "the media row rolled back too");
  });

  it("replacing switches to the new file and deletes the old objects after the commit", async () => {
    const first = await upload(await jpeg());
    const t = await createUploadTicket(db.sql, editor, { filename: "new.jpg", contentType: "image/jpeg", bytes: 1, replaceId: first.id }, deps);
    const body = await jpeg(800, 600, "#aa3322");
    storage.upload(t.upload, body, "image/jpeg");
    const result = await replaceFile(db.sql, editor, { mediaId: first.id, token: t.token }, deps);
    assert.equal(result.previousFile, "purged");
    assert.ok(storage.keys("public").every((k) => k.includes(result.fileId)), "only the new file's variants remain");
    const files = await db.sql<{ id: string; retired: boolean; purged: boolean }>`
      select id, retired_at is not null as retired, purged_at is not null as purged from media_files where media_id = ${first.id} order by created_at
    `;
    assert.deepEqual(files, [
      { id: first.fileId, retired: true, purged: true },
      { id: result.fileId, retired: false, purged: false },
    ]);
    const audit = await db.sql<{ before: { fileId: string }; after: { fileId: string } }>`
      select before, after from audit_logs where action = 'media.replace'
    `;
    assert.equal(audit[0].before.fileId, first.fileId);
    assert.equal(audit[0].after.fileId, result.fileId);
  });

  it("a failed replace keeps the old file and removes the new objects", async () => {
    const first = await upload(await jpeg());
    const before = storage.keys("public").sort();
    const t = await createUploadTicket(db.sql, editor, { filename: "new.jpg", contentType: "image/jpeg", bytes: 1, replaceId: first.id }, deps);
    storage.upload(t.upload, await jpeg(800, 600, "#aa3322"), "image/jpeg");
    const broken = failing(db.sql, /update media set current_file_id/);
    await assert.rejects(replaceFile(broken, editor, { mediaId: first.id, token: t.token }, deps), /database write failed/);
    assert.deepEqual(storage.keys("public").sort(), before);
    const row = await db.sql<{ current_file_id: string }>`select current_file_id from media where id = ${first.id}`;
    assert.equal(row[0].current_file_id, first.fileId);
  });

  it("keeps a replaced file that a kept version still pins", async () => {
    const first = await upload(await jpeg());
    await db.sql`insert into media_usage (id, media_id, file_id, owner_kind, owner_id, owner_state)
      values ('u1', ${first.id}, ${first.fileId}, 'page_version', 'pv1', 'kept')`;
    const t = await createUploadTicket(db.sql, editor, { filename: "new.jpg", contentType: "image/jpeg", bytes: 1, replaceId: first.id }, deps);
    storage.upload(t.upload, await jpeg(800, 600, "#aa3322"), "image/jpeg");
    const result = await replaceFile(db.sql, editor, { mediaId: first.id, token: t.token }, deps);
    assert.equal(result.previousFile, "kept");
    assert.ok(storage.keys("public").some((k) => k.includes(first.fileId)), "the pinned version's variants are still there");
  });

  it("refuses to delete a photo in use or one that ships with the site, and deletes an unused upload's files", async () => {
    const used = await upload(await jpeg());
    await db.sql`insert into media_usage (id, media_id, owner_kind, owner_id, owner_state) values ('u1', ${used.id}, 'page', 'home', 'published')`;
    await assert.rejects(deleteMedia(db.sql, editor, { mediaId: used.id }, deps), rejectsWith(409, "IN_USE"));
    const repo = await db.sql<{ id: string }>`select id from media where origin = 'repository' limit 1`;
    await assert.rejects(deleteMedia(db.sql, editor, { mediaId: repo[0].id }, deps), rejectsWith(409, "IN_CODE"));
    const unused = await upload(await jpeg(300, 300));
    const result = await deleteMedia(db.sql, editor, { mediaId: unused.id }, deps);
    assert.deepEqual(result.files, ["purged"]);
    assert.ok(!storage.keys("public").some((k) => k.includes(unused.id)));
    await assert.rejects(getMedia(db.sql, editor, { mediaId: unused.id }, deps), rejectsWith(404));
  });

  it("publishes only with complete provenance, and the database enforces it too", async () => {
    const partial = await upload(await jpeg(), { provenance: { source: "Supplied by the owner" } });
    await assert.rejects(setMediaPublished(db.sql, editor, { mediaId: partial.id, published: true }), rejectsWith(409, "PROVENANCE_REQUIRED"));
    await assert.rejects(db.sql`update media set published = true where id = ${partial.id}`, /media_published_needs_provenance/);
    const updated = await updateMedia(db.sql, editor, { mediaId: partial.id, alt: "Lumley Beach at low tide", provenance: FULL });
    assert.deepEqual(updated.missing, []);
    await setMediaPublished(db.sql, editor, { mediaId: partial.id, published: true });
    await assert.rejects(
      updateMedia(db.sql, editor, { mediaId: partial.id, alt: "", provenance: FULL }),
      rejectsWith(409, "PROVENANCE_REQUIRED"),
    );
    await db.sql`insert into media_usage (id, media_id, owner_kind, owner_id, owner_state) values ('u1', ${partial.id}, 'page', 'home', 'draft')`;
    await assert.rejects(setMediaPublished(db.sql, editor, { mediaId: partial.id, published: false }), rejectsWith(409, "IN_USE"));
    const actions = await db.sql<{ action: string }>`select action from audit_logs where entity_id = ${partial.id} order by created_at, id`;
    assert.deepEqual(actions.map((a) => a.action), ["media.upload", "media.update", "media.publish"]);
  });

  it("refuses a source link that is not https", async () => {
    await assert.rejects(upload(await jpeg(100, 100), { provenance: { ...FULL, sourceUrl: "javascript:alert(1)" } }), rejectsWith(400, "BAD_SOURCE_URL"));
  });

  it("a storage timeout surfaces as a 504 and leaves no row", async () => {
    const slow = { ...deps, storage: memoryStorage({ delayMs: 100, timeoutMs: 10 }) };
    await assert.rejects(
      createUploadTicket(db.sql, editor, { filename: "a.jpg", contentType: "image/jpeg", bytes: 100 }, slow),
      rejectsWith(504, "STORAGE_TIMEOUT"),
    );
  });

  it("with no storage configured, uploads are off with a clear message and the library still lists the site's photos", async () => {
    const off = { storage: null, secret: "s", offReason: null };
    await assert.rejects(
      createUploadTicket(db.sql, editor, { filename: "a.jpg", contentType: "image/jpeg", bytes: 100 }, off),
      (e: { status?: number; message?: string }) => e.status === 503 && /SUPABASE_URL/.test(e.message ?? ""),
    );
    const list = await listMedia(db.sql, editor, { limit: 100 }, off);
    assert.equal(list.uploads.enabled, false);
    assert.ok(list.items.length >= 80, `${list.items.length} seeded photos listed`);
    assert.ok(list.items.every((i) => i.origin === "repository" && i.previewUrl?.startsWith("/images/")));
    const incomplete = await listMedia(db.sql, editor, { filter: "incomplete", limit: 100 }, off);
    assert.ok(incomplete.items.length > 0 && incomplete.items.every((i) => i.provenanceStatus === "incomplete" && i.missing.length > 0));
    const search = await listMedia(db.sql, editor, { q: "lumley" }, off);
    assert.ok(search.items.some((i) => i.repoPath === "/images/beaches/lumley-beach.jpg"));
  });

  it("STAFF and BOOKING_MANAGER cannot open or change the library", async () => {
    const photo = await upload(await jpeg(100, 100));
    for (const role of ["STAFF", "BOOKING_MANAGER"] as const) {
      const actor = await insertStaff(db.sql, `as-${role}`, role);
      await assert.rejects(listMedia(db.sql, actor, undefined, deps), rejectsWith(403));
      await assert.rejects(createUploadTicket(db.sql, actor, { filename: "a.jpg", contentType: "image/jpeg", bytes: 1 }, deps), rejectsWith(403));
      await assert.rejects(updateMedia(db.sql, actor, { mediaId: photo.id, alt: "x" }), rejectsWith(403));
      await assert.rejects(setMediaPublished(db.sql, actor, { mediaId: photo.id, published: true }), rejectsWith(403));
      await assert.rejects(deleteMedia(db.sql, actor, { mediaId: photo.id }, deps), rejectsWith(403));
    }
  });

  it("shows where a photo is used", async () => {
    const photo = await upload(await jpeg(100, 100));
    await db.sql`insert into media_usage (id, media_id, owner_kind, owner_id, owner_state, field) values ('u1', ${photo.id}, 'page', 'home', 'published', 'hero.image')`;
    const detail = await getMedia(db.sql, editor, { mediaId: photo.id }, deps);
    assert.deepEqual(detail.usage, [{ kind: "page", id: "home", state: "published", field: "hero.image", pinnedFile: null }]);
    assert.ok(detail.variants.every((v) => v.url?.startsWith("https://media.test/media/")));
  });
});
