/**
 * The media library (task A6): upload, replace, edit provenance, publish,
 * delete, and the list with usage.
 *
 * The upload path is one path for every photo:
 *   1. `createUploadTicket` checks the declared size and type and asks storage
 *      for a one-object upload slot in the private incoming area. The browser
 *      sends the file straight there, so it never passes through a Vercel
 *      function. The ticket returned to the browser is signed and names the
 *      account, the object key, the type, the size and an expiry.
 *   2. `finishUpload` reads the object back, checks size and file signature
 *      before downloading all of it, decodes and cleans it (`image.ts`),
 *      writes the variants, and only then writes the database row. If the
 *      row cannot be written the variants are deleted again. The incoming
 *      object is always deleted at the end.
 *
 * Rules that live here, not in the page: no storage call inside a database
 * transaction; a replaced file is deleted only after the update commits and
 * only when no kept version pins it; a photo in use cannot be deleted or
 * unpublished; only a photo with complete provenance can be published; a
 * repository photo (it ships with the site code) is never deleted from here.
 */
import { createHmac } from "node:crypto";
import { can } from "@/lib/capabilities";
import { missingProvenance, provenanceStatus, type Provenance } from "@/lib/media-provenance";
import { inTransaction, type Sql } from "@/lib/sql";
import { adminOperation, type Actor } from "@/lib/server/access";
import { audit } from "@/lib/server/audit";
import { randomToken, safeEqual } from "@/lib/server/crypto";
import { ConflictError, ForbiddenError, HttpError, InvalidRequestError, NotFoundError } from "@/lib/server/errors";
import { IMAGE_TYPES, MAX_UPLOAD_BYTES, checkUpload, isImageMime, processImage, type ProcessedVariant } from "@/lib/server/media/image";
import { StorageError, type MediaStorage, type UploadTicket } from "@/lib/server/media/storage";

export type MediaDeps = {
  storage: MediaStorage | null;
  /** Why uploads are off, shown to the team when `storage` is null. */
  offReason?: string | null;
  /** Signs upload tickets. */
  secret: string;
  now?: () => number;
};

export const TICKET_SECONDS = 30 * 60;
export const UPLOADS_OFF_MESSAGE =
  "Uploads are switched off until the storage keys are set (SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_PUBLIC_BUCKET, SUPABASE_INCOMING_BUCKET).";

const EDITABLE_PROVENANCE = ["source", "sourceUrl", "license", "author", "location", "subject", "notes"] as const;
export type ProvenanceInput = Partial<Record<(typeof EDITABLE_PROVENANCE)[number], string>>;

function requireDeps(deps: MediaDeps | undefined): MediaDeps {
  if (!deps) throw new HttpError(500, "MEDIA_UNCONFIGURED", "The media library is not configured on this server.");
  return deps;
}

function requireStorage(deps: MediaDeps): MediaStorage {
  if (!deps.storage) throw new HttpError(503, "UPLOADS_OFF", deps.offReason || UPLOADS_OFF_MESSAGE);
  return deps.storage;
}

/** Turn a storage failure into a status the desk can show. */
async function storageCall<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (e) {
    if (e instanceof StorageError) {
      if (e.code === "TIMEOUT") throw new HttpError(504, "STORAGE_TIMEOUT", "Storage did not answer in time. Try again.");
      throw new HttpError(502, "STORAGE_FAILED", e.message);
    }
    throw e;
  }
}

/** Best effort: used on paths that are already failing or cleaning up. */
async function quietly(work: () => Promise<unknown>): Promise<boolean> {
  try {
    await work();
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- tickets

type TicketPayload = { k: string; u: string; t: string; b: number; e: number; p: string };

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64url");
const sign = (secret: string, body: string) => createHmac("sha256", secret).update(`media-ticket|${body}`).digest("base64url");

export function signTicket(secret: string, payload: TicketPayload): string {
  const body = b64(JSON.stringify(payload));
  return `${body}.${sign(secret, body)}`;
}

function readTicket(deps: MediaDeps, actor: Actor, token: string, purpose: string): TicketPayload {
  const [body, mac] = token.split(".");
  if (!body || !mac || !safeEqual(sign(deps.secret, body), mac)) {
    throw new InvalidRequestError("This upload is not valid. Start it again.", "BAD_TICKET");
  }
  let payload: TicketPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    throw new InvalidRequestError("This upload is not valid. Start it again.", "BAD_TICKET");
  }
  const now = Math.floor((deps.now?.() ?? Date.now()) / 1000);
  if (payload.u !== actor.userId) throw new ForbiddenError("This upload was started by another account.", "TICKET_OWNER");
  if (payload.e < now) throw new InvalidRequestError("This upload took too long. Start it again.", "TICKET_EXPIRED");
  if (payload.p !== purpose) throw new InvalidRequestError("This upload was started for something else.", "TICKET_PURPOSE");
  return payload;
}

// ---------------------------------------------------------------- helpers

function cleanProvenance(input: ProvenanceInput | undefined): Provenance {
  const out: Provenance = {};
  for (const key of EDITABLE_PROVENANCE) {
    const v = input?.[key];
    if (typeof v === "string" && v.trim()) out[key] = v.trim().slice(0, 500);
  }
  if (out.sourceUrl && !/^https:\/\/[^\s]+$/i.test(out.sourceUrl)) {
    throw new InvalidRequestError("The source link must start with https://", "BAD_SOURCE_URL");
  }
  return out;
}

function cleanAlt(alt: string | undefined): string {
  const a = (alt ?? "").trim();
  if (a.length > 300) throw new InvalidRequestError("Alt text can be up to 300 characters.", "ALT_TOO_LONG");
  return a;
}

type StoredVariant = Omit<ProcessedVariant, "body">;

type FileRow = { id: string; variants: StoredVariant[]; analysis_key: string };

async function writeObjects(storage: MediaStorage, variants: ProcessedVariant[], analysisKey: string, raster: Uint8Array) {
  const written: { public: string[]; incoming: string[] } = { public: [], incoming: [] };
  try {
    for (const v of variants) {
      await storage.put("public", v.key, v.body, v.format === "webp" ? "image/webp" : "image/jpeg");
      written.public.push(v.key);
    }
    await storage.put("incoming", analysisKey, raster, "application/octet-stream");
    written.incoming.push(analysisKey);
  } catch (e) {
    await removeObjects(storage, written);
    throw e;
  }
  return written;
}

async function removeObjects(storage: MediaStorage, keys: { public: string[]; incoming: string[] }) {
  const a = await quietly(() => storage.delete("public", keys.public));
  const b = await quietly(() => storage.delete("incoming", keys.incoming));
  return a && b;
}

function parseJson<T>(value: unknown): T {
  return (typeof value === "string" ? JSON.parse(value) : value) as T;
}

/** The incoming object, checked cheaply (size, signature) before it is all downloaded. */
async function readUpload(storage: MediaStorage, ticket: TicketPayload): Promise<Uint8Array> {
  const head = await storageCall(() => storage.head("incoming", ticket.k));
  if (!head) throw new InvalidRequestError("The upload did not arrive. Try again.", "NOT_UPLOADED");
  const size = head.bytes >= 0 ? head.bytes : ticket.b;
  const first = await storageCall(() => storage.getRange("incoming", ticket.k, 0, 15));
  checkUpload(ticket.t, size, first ?? new Uint8Array());
  const body = await storageCall(() => storage.get("incoming", ticket.k));
  if (!body) throw new InvalidRequestError("The upload did not arrive. Try again.", "NOT_UPLOADED");
  if (body.byteLength > MAX_UPLOAD_BYTES) throw new InvalidRequestError("The photo is larger than 15 MB.", "TOO_LARGE");
  return body;
}

/**
 * Delete a retired file's objects when nothing pins it, then mark it purged.
 * Runs after the change that retired it has committed. Returns what happened.
 */
async function purgeRetiredFile(sql: Sql, actor: Actor, storage: MediaStorage | null, fileId: string): Promise<"purged" | "kept" | "pending"> {
  const pinned = await sql`select 1 from media_usage where file_id = ${fileId} limit 1`;
  if (pinned.length) return "kept";
  const rows = await sql<FileRow & { media_id: string }>`
    select id, media_id, variants, analysis_key from media_files
    where id = ${fileId} and retired_at is not null and purged_at is null
  `;
  const file = rows[0];
  if (!file || !storage) return "pending";
  const variants = parseJson<StoredVariant[]>(file.variants);
  const removed = await removeObjects(storage, { public: variants.map((v) => v.key), incoming: [file.analysis_key] });
  if (!removed) return "pending";
  await inTransaction(sql, async (tx) => {
    await tx`update media_files set purged_at = now() where id = ${fileId} and purged_at is null`;
    await audit(tx, { actor, action: "media.file_purged", entity: "media", entityId: file.media_id, after: { fileId } });
  });
  return "purged";
}

async function loadMedia(sql: Sql, id: string) {
  const rows = await sql<{
    id: string;
    origin: "repository" | "upload";
    repo_path: string | null;
    current_file_id: string | null;
    alt: string;
    provenance: unknown;
    provenance_status: string;
    published: boolean;
    deleted_at: string | null;
  }>`
    select id, origin, repo_path, current_file_id, alt, provenance, provenance_status, published, deleted_at
    from media where id = ${id} limit 1
  `;
  const row = rows[0];
  if (!row || row.deleted_at) throw new NotFoundError("That photo is not in the library.");
  return { ...row, provenance: parseJson<Provenance>(row.provenance) ?? {} };
}

/** Places using a photo: live and draft ones, plus kept versions when `includeKept`. */
async function usageCount(sql: Sql, mediaId: string, includeKept: boolean) {
  const rows = await sql<{ n: number }>`
    select count(*)::int as n from media_usage
    where media_id = ${mediaId} and (owner_state in ('draft', 'published') or ${includeKept})
  `;
  return rows[0]?.n ?? 0;
}

// ---------------------------------------------------------------- operations

export type TicketInput = { filename: string; contentType: string; bytes: number; replaceId?: string };

/** Step 1 of an upload: an upload slot for one file. Writes nothing to the database. */
export const createUploadTicket = adminOperation(
  "media.upload",
  async (sql, actor, input: TicketInput, deps: MediaDeps | undefined) => {
    const d = requireDeps(deps);
    const storage = requireStorage(d);
    if (!isImageMime(input.contentType)) throw new InvalidRequestError("Upload a JPEG, PNG or WebP photo.", "UNSUPPORTED_TYPE");
    if (!Number.isInteger(input.bytes) || input.bytes <= 0) throw new InvalidRequestError("The file is empty.", "EMPTY_FILE");
    if (input.bytes > MAX_UPLOAD_BYTES) throw new InvalidRequestError("The photo is larger than 15 MB.", "TOO_LARGE");
    let purpose = "new";
    if (input.replaceId) {
      if (!can(actor.role, "media.publish")) throw new ForbiddenError();
      const media = await loadMedia(sql, input.replaceId);
      if (media.origin !== "upload") {
        throw new ConflictError("This photo ships with the site code. Upload a new photo instead.", "IN_CODE");
      }
      purpose = `replace:${media.id}`;
    }
    const key = `uploads/${randomToken(16)}.${IMAGE_TYPES[input.contentType] === "jpeg" ? "jpg" : IMAGE_TYPES[input.contentType]}`;
    const upload: UploadTicket = await storageCall(() => storage.createUploadTicket(key, input.contentType));
    const exp = Math.floor((d.now?.() ?? Date.now()) / 1000) + TICKET_SECONDS;
    const token = signTicket(d.secret, { k: key, u: actor.userId, t: input.contentType, b: input.bytes, e: exp, p: purpose });
    return { token, upload, maxBytes: MAX_UPLOAD_BYTES, filename: input.filename.slice(0, 200) };
  },
);

export type FinishInput = { token: string; filename?: string; alt?: string; provenance?: ProvenanceInput };

/** Step 2 of an upload: check, process, store, then record. */
export const finishUpload = adminOperation(
  "media.upload",
  async (sql, actor, input: FinishInput, deps: MediaDeps | undefined) => {
    const d = requireDeps(deps);
    const storage = requireStorage(d);
    const ticket = readTicket(d, actor, input.token, "new");
    const alt = cleanAlt(input.alt);
    const provenance = cleanProvenance(input.provenance);
    try {
      const body = await readUpload(storage, ticket);
      const mediaId = `m_${randomToken(10)}`;
      const fileId = `f_${randomToken(10)}`;
      const processed = await processImage(body, ticket.t, (name) => `media/${mediaId}/${fileId}/${name}`);
      const analysisKey = `analysis/${mediaId}/${fileId}.rgb`;
      const written = await storageCall(() => writeObjects(storage, processed.variants, analysisKey, processed.analysis.body));
      const status = provenanceStatus(provenance, alt);
      const variants: StoredVariant[] = processed.variants.map(({ body: _b, ...v }) => v);
      try {
        await inTransaction(sql, async (tx) => {
          await tx`
            insert into media (id, origin, current_file_id, original_filename, width, height, bytes, alt, provenance,
              provenance_status, published, created_by, updated_by)
            values (${mediaId}, 'upload', ${fileId}, ${input.filename?.slice(0, 200) ?? null}, ${processed.width},
              ${processed.height}, ${body.byteLength}, ${alt}, ${JSON.stringify(provenance)}::jsonb, ${status}, false,
              ${actor.userId}, ${actor.userId})
          `;
          await tx`
            insert into media_files (id, media_id, width, height, sha256, format, variants, analysis_key,
              analysis_width, analysis_height, created_by)
            values (${fileId}, ${mediaId}, ${processed.width}, ${processed.height}, ${processed.sha256},
              ${processed.format}, ${JSON.stringify(variants)}::jsonb, ${analysisKey}, ${processed.analysis.width},
              ${processed.analysis.height}, ${actor.userId})
          `;
          await audit(tx, {
            actor,
            action: "media.upload",
            entity: "media",
            entityId: mediaId,
            before: null,
            after: { fileId, width: processed.width, height: processed.height, alt, provenance, provenanceStatus: status },
          });
        });
      } catch (e) {
        // The row was not written, so nothing may keep the objects.
        await removeObjects(storage, written);
        throw e;
      }
      return { id: mediaId, fileId, width: processed.width, height: processed.height, provenanceStatus: status };
    } finally {
      await quietly(() => storage.delete("incoming", [ticket.k]));
    }
  },
);

/**
 * Replace an upload's file. The new objects are written first; the database
 * switches to them in one transaction; the old objects are deleted after that
 * commits, and only when no kept version pins them. A failed update leaves
 * the old file in place and deletes the new objects.
 */
export const replaceFile = adminOperation(
  "media.publish",
  async (sql, actor, input: { mediaId: string; token: string; filename?: string }, deps: MediaDeps | undefined) => {
    const d = requireDeps(deps);
    const storage = requireStorage(d);
    const ticket = readTicket(d, actor, input.token, `replace:${input.mediaId}`);
    try {
      const media = await loadMedia(sql, input.mediaId);
      if (media.origin !== "upload") throw new ConflictError("This photo ships with the site code.", "IN_CODE");
      const body = await readUpload(storage, ticket);
      const fileId = `f_${randomToken(10)}`;
      const processed = await processImage(body, ticket.t, (name) => `media/${media.id}/${fileId}/${name}`);
      const analysisKey = `analysis/${media.id}/${fileId}.rgb`;
      const written = await storageCall(() => writeObjects(storage, processed.variants, analysisKey, processed.analysis.body));
      const variants: StoredVariant[] = processed.variants.map(({ body: _b, ...v }) => v);
      let oldFileId: string | null;
      try {
        oldFileId = await inTransaction(sql, async (tx) => {
          const current = await tx<{ current_file_id: string | null; width: number; height: number; deleted_at: string | null }>`
            select current_file_id, width, height, deleted_at from media where id = ${media.id} for update
          `;
          if (!current[0] || current[0].deleted_at) throw new NotFoundError("That photo is not in the library.");
          const previous = current[0].current_file_id;
          await tx`
            insert into media_files (id, media_id, width, height, sha256, format, variants, analysis_key,
              analysis_width, analysis_height, created_by)
            values (${fileId}, ${media.id}, ${processed.width}, ${processed.height}, ${processed.sha256},
              ${processed.format}, ${JSON.stringify(variants)}::jsonb, ${analysisKey}, ${processed.analysis.width},
              ${processed.analysis.height}, ${actor.userId})
          `;
          await tx`
            update media set current_file_id = ${fileId}, width = ${processed.width}, height = ${processed.height},
              bytes = ${body.byteLength}, original_filename = coalesce(${input.filename?.slice(0, 200) ?? null}, original_filename),
              updated_at = now(), updated_by = ${actor.userId}
            where id = ${media.id}
          `;
          if (previous) await tx`update media_files set retired_at = now() where id = ${previous}`;
          await audit(tx, {
            actor,
            action: "media.replace",
            entity: "media",
            entityId: media.id,
            before: { fileId: previous, width: current[0].width, height: current[0].height },
            after: { fileId, width: processed.width, height: processed.height },
          });
          return previous;
        });
      } catch (e) {
        await removeObjects(storage, written);
        throw e;
      }
      const old = oldFileId ? await purgeRetiredFile(sql, actor, storage, oldFileId) : null;
      return { id: media.id, fileId, previousFile: old };
    } finally {
      await quietly(() => storage.delete("incoming", [ticket.k]));
    }
  },
);

/** Edit alt text and provenance. A published photo must stay complete. */
export const updateMedia = adminOperation(
  "media.upload",
  async (sql, actor, input: { mediaId: string; alt?: string; provenance?: ProvenanceInput }) => {
    const alt = cleanAlt(input.alt);
    const edits = cleanProvenance(input.provenance);
    return inTransaction(sql, async (tx) => {
      const media = await loadMedia(tx, input.mediaId);
      // Keep fields the form does not edit (a repository record's filename, section and purpose).
      const kept = Object.fromEntries(
        Object.entries(media.provenance).filter(([k]) => !(EDITABLE_PROVENANCE as readonly string[]).includes(k)),
      );
      const provenance: Provenance = { ...kept, ...edits };
      const status = provenanceStatus(provenance, alt);
      if (media.published && status !== "complete") {
        throw new ConflictError(
          `A published photo needs complete provenance. Missing: ${missingProvenance(provenance, alt).join(", ")}.`,
          "PROVENANCE_REQUIRED",
        );
      }
      await tx`
        update media set alt = ${alt}, provenance = ${JSON.stringify(provenance)}::jsonb, provenance_status = ${status},
          updated_at = now(), updated_by = ${actor.userId}
        where id = ${media.id}
      `;
      await audit(tx, {
        actor,
        action: "media.update",
        entity: "media",
        entityId: media.id,
        before: { alt: media.alt, provenance: media.provenance, provenanceStatus: media.provenance_status },
        after: { alt, provenance, provenanceStatus: status },
      });
      return { id: media.id, provenanceStatus: status, missing: missingProvenance(provenance, alt) };
    });
  },
);

/** Publish (may be placed on pages) or unpublish. */
export const setMediaPublished = adminOperation(
  "media.publish",
  async (sql, actor, input: { mediaId: string; published: boolean }) => {
    return inTransaction(sql, async (tx) => {
      const media = await loadMedia(tx, input.mediaId);
      if (input.published) {
        const missing = missingProvenance(media.provenance, media.alt);
        if (missing.length) {
          throw new ConflictError(`Complete the provenance before publishing. Missing: ${missing.join(", ")}.`, "PROVENANCE_REQUIRED");
        }
      } else if ((await usageCount(tx, media.id, false)) > 0) {
        throw new ConflictError("This photo is in use. Remove it from those places first.", "IN_USE");
      }
      await tx`update media set published = ${input.published}, updated_at = now(), updated_by = ${actor.userId} where id = ${media.id}`;
      await audit(tx, {
        actor,
        action: input.published ? "media.publish" : "media.unpublish",
        entity: "media",
        entityId: media.id,
        before: { published: media.published },
        after: { published: input.published },
      });
      return { id: media.id, published: input.published };
    });
  },
);

/** Delete an uploaded photo nothing uses. Its files go once the delete has committed. */
export const deleteMedia = adminOperation(
  "media.publish",
  async (sql, actor, input: { mediaId: string }, deps: MediaDeps | undefined) => {
    const d = requireDeps(deps);
    const fileIds = await inTransaction(sql, async (tx) => {
      await tx`select id from media where id = ${input.mediaId} for update`;
      const media = await loadMedia(tx, input.mediaId);
      if (media.origin === "repository") {
        throw new ConflictError("This photo ships with the site code and cannot be deleted here.", "IN_CODE");
      }
      const used = await usageCount(tx, media.id, true);
      if (used > 0) throw new ConflictError(`This photo is used in ${used} place${used === 1 ? "" : "s"}. Remove it there first.`, "IN_USE");
      await tx`
        update media set deleted_at = now(), deleted_by = ${actor.userId}, published = false, updated_at = now(),
          updated_by = ${actor.userId}
        where id = ${media.id}
      `;
      await tx`update media_files set retired_at = coalesce(retired_at, now()) where media_id = ${media.id}`;
      await audit(tx, {
        actor,
        action: "media.delete",
        entity: "media",
        entityId: media.id,
        before: { published: media.published, fileId: media.current_file_id },
        after: { deleted: true },
      });
      const files = await tx<{ id: string }>`select id from media_files where media_id = ${media.id} and purged_at is null`;
      return files.map((f) => f.id);
    });
    const results = [];
    for (const id of fileIds) results.push(await purgeRetiredFile(sql, actor, d.storage, id));
    return { id: input.mediaId, files: results };
  },
);

export type MediaListItem = {
  id: string;
  origin: "repository" | "upload";
  repoPath: string | null;
  previewUrl: string | null;
  width: number | null;
  height: number | null;
  alt: string;
  provenanceStatus: "complete" | "incomplete";
  missing: string[];
  published: boolean;
  filename: string | null;
  createdAt: string;
};

export type MediaFilter = "all" | "uploads" | "repository" | "incomplete" | "published";

function previewFor(storage: MediaStorage | null, row: { origin: string; repo_path: string | null; variants: unknown }): string | null {
  if (row.origin === "repository") return row.repo_path;
  const variants = parseJson<StoredVariant[] | null>(row.variants) ?? [];
  const small = variants.find((v) => v.format === "webp") ?? variants[0];
  return small && storage ? storage.publicUrl(small.key) : null;
}

/** The library, uploads first (newest first), then the repository photos by path. */
export const listMedia = adminOperation(
  "media.upload",
  async (sql, _actor, input: { q?: string; filter?: MediaFilter; offset?: number; limit?: number } | undefined, deps: MediaDeps | undefined) => {
    const limit = Math.min(Math.max(input?.limit ?? 48, 1), 100);
    const offset = Math.max(input?.offset ?? 0, 0);
    const filter = input?.filter ?? "all";
    const q = input?.q?.trim().toLowerCase().slice(0, 100) || null;
    const pattern = q ? `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null;
    const rows = await sql<{
      id: string;
      origin: "repository" | "upload";
      repo_path: string | null;
      width: number | null;
      height: number | null;
      alt: string;
      provenance: unknown;
      provenance_status: "complete" | "incomplete";
      published: boolean;
      original_filename: string | null;
      created_at: string;
      variants: unknown;
    }>`
      select m.id, m.origin, m.repo_path, m.width, m.height, m.alt, m.provenance, m.provenance_status, m.published,
        m.original_filename, m.created_at::text as created_at, f.variants
      from media m left join media_files f on f.id = m.current_file_id
      where m.deleted_at is null
        and (${filter}::text = 'all'
          or (${filter}::text = 'uploads' and m.origin = 'upload')
          or (${filter}::text = 'repository' and m.origin = 'repository')
          or (${filter}::text = 'incomplete' and m.provenance_status = 'incomplete')
          or (${filter}::text = 'published' and m.published))
        and (${pattern}::text is null or lower(m.alt) like ${pattern} or lower(coalesce(m.repo_path, '')) like ${pattern}
          or lower(coalesce(m.original_filename, '')) like ${pattern})
      order by (m.origin = 'upload') desc, m.created_at desc, m.repo_path asc, m.id asc
      limit ${limit + 1} offset ${offset}
    `;
    const storage = deps?.storage ?? null;
    const items: MediaListItem[] = rows.slice(0, limit).map((r) => {
      const provenance = parseJson<Provenance>(r.provenance) ?? {};
      return {
        id: r.id,
        origin: r.origin,
        repoPath: r.repo_path,
        previewUrl: previewFor(storage, r),
        width: r.width,
        height: r.height,
        alt: r.alt,
        provenanceStatus: r.provenance_status,
        missing: missingProvenance(provenance, r.alt),
        published: r.published,
        filename: r.original_filename,
        createdAt: r.created_at,
      };
    });
    return {
      items,
      nextOffset: rows.length > limit ? offset + limit : null,
      uploads: { enabled: Boolean(storage), reason: storage ? null : deps?.offReason || UPLOADS_OFF_MESSAGE },
    };
  },
);

/** Small previews for photos a record already uses (the collection editor). */
export const mediaPreviews = adminOperation(
  "media.upload",
  async (sql, _actor, input: { ids: string[] }, deps: MediaDeps | undefined) => {
    const ids = [...new Set(input.ids)].slice(0, 100);
    const out: Record<string, { url: string | null; alt: string; published: boolean }> = {};
    for (const id of ids) {
      const rows = await sql<{ origin: string; repo_path: string | null; alt: string; published: boolean; variants: unknown }>`
        select m.origin, m.repo_path, m.alt, m.published, f.variants
        from media m left join media_files f on f.id = m.current_file_id
        where m.id = ${id} and m.deleted_at is null
      `;
      if (rows[0]) out[id] = { url: previewFor(deps?.storage ?? null, rows[0]), alt: rows[0].alt, published: rows[0].published };
    }
    return out;
  },
);

/** One photo: details, provenance, variants, file history and where it is used. */
export const getMedia = adminOperation(
  "media.upload",
  async (sql, _actor, input: { mediaId: string }, deps: MediaDeps | undefined) => {
    const media = await loadMedia(sql, input.mediaId);
    const storage = deps?.storage ?? null;
    const files = await sql<{ id: string; variants: unknown; width: number; height: number; created_at: string; retired_at: string | null; purged_at: string | null }>`
      select id, variants, width, height, created_at::text as created_at, retired_at::text as retired_at, purged_at::text as purged_at
      from media_files where media_id = ${media.id} order by created_at desc
    `;
    const usage = await sql<{ owner_kind: string; owner_id: string; owner_state: string; field: string | null; file_id: string | null }>`
      select owner_kind, owner_id, owner_state, field, file_id from media_usage where media_id = ${media.id}
      order by owner_kind, owner_id
    `;
    const current = files.find((f) => f.id === media.current_file_id);
    const variants = current ? parseJson<StoredVariant[]>(current.variants) : [];
    return {
      id: media.id,
      origin: media.origin,
      repoPath: media.repo_path,
      alt: media.alt,
      provenance: media.provenance,
      provenanceStatus: media.provenance_status as "complete" | "incomplete",
      missing: missingProvenance(media.provenance, media.alt),
      published: media.published,
      previewUrl: media.origin === "repository" ? media.repo_path : variants[0] && storage ? storage.publicUrl(variants[variants.length > 1 ? 1 : 0].key) : null,
      variants: variants.map((v) => ({ ...v, url: storage ? storage.publicUrl(v.key) : null })),
      files: files.map((f) => ({ id: f.id, width: f.width, height: f.height, createdAt: f.created_at, retiredAt: f.retired_at, purgedAt: f.purged_at })),
      usage: usage.map((u) => ({ kind: u.owner_kind, id: u.owner_id, state: u.owner_state, field: u.field, pinnedFile: u.file_id })),
    };
  },
);
