/**
 * Collection records (task A8): create, edit the draft, publish, hide,
 * reorder, delete to the trash and restore. One set of operations for every
 * collection in `src/lib/collections/registry.ts`.
 *
 * Rules kept here, not in the page:
 *   - Every save and publish carries the `rev` the editor loaded.
 *   - The draft is checked by the collection's schema; records it points at
 *     must exist, and must be published before this record is published.
 *   - A photo newly placed on a record must be published in the media library
 *     (complete provenance). Photos already on the record stay allowed.
 *   - Recording or changing a claim's source needs `claims.source`.
 *   - Publishing a changed public address writes a 301 redirect from the old
 *     one (and repoints older redirects, so there are no chains). A record
 *     other records point at by key cannot change its key.
 *   - Delete is refused while another record points at this one, and for a
 *     tour while any dormant booking, availability, saved-tour or review row
 *     uses its slug. Trash keeps a record 30 days; after that it is purged.
 *   - Hidden records leave every published read.
 */
import { can } from "@/lib/capabilities";
import type { JsonValue } from "@/lib/json";
import { COLLECTIONS, isClaim, isCollectionId, referencesOf, type CollectionDef, type CollectionId } from "@/lib/collections/registry";
import { inTransaction, type Sql, type TxSql } from "@/lib/sql";
import { adminOperation, type Actor } from "@/lib/server/access";
import { audit } from "@/lib/server/audit";
import { collectionItemId } from "@/lib/server/content-ids";
import { publicId } from "@/lib/server/crypto";
import { ConflictError, ForbiddenError, InvalidRequestError, NotFoundError } from "@/lib/server/errors";

export const KEEP_VERSIONS = 30;
export const TRASH_DAYS = 30;
export const STALE_MESSAGE = "Someone else saved this record. Reload to see their changes.";

type Data = Record<string, unknown>;
/** A record as it leaves a server function: checked JSON, so it can be serialised. */
type JsonRecord = { [key: string]: JsonValue };

type ItemRow = {
  id: string;
  collection: string;
  key: string;
  position: number;
  status: "draft" | "published" | "hidden";
  draft: unknown;
  rev: number;
  published_version_id: string | null;
  deleted_at: string | null;
};

const parseJson = <T>(v: unknown): T => (typeof v === "string" ? JSON.parse(v) : v) as T;

function defOf(collection: string): CollectionDef {
  if (!isCollectionId(collection)) throw new NotFoundError("There is no such collection.");
  return COLLECTIONS[collection];
}

function validate(def: CollectionDef, data: unknown): Data {
  const parsed = def.schema.safeParse(data);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new InvalidRequestError(`${first.path.join(" › ") || def.singular}: ${first.message}`, "RECORD_INVALID");
  }
  return parsed.data;
}

async function lockItem(tx: TxSql, id: string): Promise<ItemRow & { def: CollectionDef }> {
  const rows = await tx<ItemRow>`
    select id, collection, key, position, status, draft, rev, published_version_id, deleted_at::text as deleted_at
    from collection_items where id = ${id} for update
  `;
  const row = rows[0];
  if (!row) throw new NotFoundError("That record does not exist.");
  return { ...row, draft: parseJson<Data>(row.draft), def: defOf(row.collection) };
}

async function publishedData(sql: Sql, versionId: string | null): Promise<Data | null> {
  if (!versionId) return null;
  const rows = await sql<{ data: unknown }>`select data from collection_item_versions where id = ${versionId}`;
  return rows[0] ? parseJson<Data>(rows[0].data) : null;
}

/** Every claim's source, keyed by its text, to see whether a save changes one. */
function claimSources(value: unknown, out = new Map<string, string>()): Map<string, string> {
  if (Array.isArray(value)) value.forEach((v) => claimSources(v, out));
  else if (isClaim(value)) out.set(value.claim, `${value.sourceUrl}|${value.sourceDate}`);
  else if (value && typeof value === "object") Object.values(value).forEach((v) => claimSources(v, out));
  return out;
}

function assertClaimSources(actor: Actor, before: Data | null, after: Data) {
  if (can(actor.role, "claims.source")) return;
  const old = claimSources(before ?? {});
  for (const [text, source] of claimSources(after)) {
    if (source !== "|" && old.get(text) !== source) {
      throw new ForbiddenError("Recording a claim's source needs an ADMIN or SUPER_ADMIN.", "CLAIM_SOURCE");
    }
  }
}

async function keyToId(sql: Sql, collection: CollectionId, key: string) {
  const rows = await sql<{ id: string; status: string; deleted_at: string | null }>`
    select id, status, deleted_at::text as deleted_at from collection_items where collection = ${collection} and key = ${key}
  `;
  return rows[0] ?? null;
}

/** Records it points at exist (and are published, when `forPublish`); photos newly placed are published. */
async function checkTargets(sql: Sql, def: CollectionDef, data: Data, alreadyPlaced: Set<string>, forPublish: boolean) {
  const refs = referencesOf(def.id, data);
  for (const ref of refs.items) {
    const target = await keyToId(sql, ref.collection, ref.key);
    const label = COLLECTIONS[ref.collection].singular;
    if (!target || target.deleted_at) throw new InvalidRequestError(`There is no ${label} "${ref.key}".`, "MISSING_TARGET");
    if (forPublish && target.status !== "published") {
      throw new ConflictError(`Publish the ${label} "${ref.key}" first.`, "TARGET_NOT_PUBLISHED");
    }
  }
  for (const m of refs.media) {
    if (alreadyPlaced.has(m.id)) continue;
    const rows = await sql<{ published: boolean; deleted_at: string | null }>`
      select published, deleted_at::text as deleted_at from media where id = ${m.id}
    `;
    if (!rows[0] || rows[0].deleted_at) throw new InvalidRequestError("That photo is not in the media library.", "MISSING_MEDIA");
    if (!rows[0].published) {
      throw new ConflictError("Publish the photo in the media library (complete provenance) before placing it.", "MEDIA_NOT_PUBLISHED");
    }
  }
  return refs;
}

const mediaIds = (def: CollectionDef, data: Data | null) => new Set(data ? referencesOf(def.id, data).media.map((m) => m.id) : []);

/** Replace this record's references for one state (draft or published). */
async function writeRefs(tx: TxSql, id: string, def: CollectionDef, state: "draft" | "published", data: Data) {
  const refs = referencesOf(def.id, data);
  await tx`delete from content_refs where from_kind = 'collection_item' and from_id = ${id} and from_state = ${state}`;
  await tx`delete from media_usage where owner_kind = 'collection_item' and owner_id = ${id} and owner_state = ${state}`;
  for (const ref of refs.items) {
    const target = await keyToId(tx, ref.collection, ref.key);
    if (!target) continue;
    await tx`
      insert into content_refs (id, from_kind, from_id, from_state, to_kind, to_id, field)
      values (${publicId()}, 'collection_item', ${id}, ${state}, 'collection_item', ${target.id}, ${ref.field})
    `;
  }
  for (const m of refs.media) {
    await tx`
      insert into media_usage (id, media_id, owner_kind, owner_id, owner_state, field)
      values (${publicId()}, ${m.id}, 'collection_item', ${id}, ${state}, ${m.field})
    `;
  }
}

/** Who points at this record (records not in the trash). */
async function incomingRefs(sql: Sql, id: string, onlyPublished = false) {
  return sql<{ from_id: string; collection: string; key: string; from_state: string; field: string | null }>`
    select r.from_id, i.collection, i.key, r.from_state, r.field
    from content_refs r join collection_items i on i.id = r.from_id
    where r.to_kind = 'collection_item' and r.to_id = ${id} and r.from_id <> ${id} and i.deleted_at is null
      and (${!onlyPublished} or r.from_state = 'published')
    order by i.collection, i.key
  `;
}

function describeRefs(refs: { collection: string; key: string }[]) {
  const unique = [...new Set(refs.map((r) => `${COLLECTIONS[r.collection as CollectionId]?.singular ?? r.collection} ${r.key}`))];
  return unique.slice(0, 5).join(", ") + (unique.length > 5 ? ` and ${unique.length - 5} more` : "");
}

/** Dormant booking-era rows that still name a tour's slug. */
async function dormantUses(sql: Sql, slug: string): Promise<string[]> {
  const found: string[] = [];
  // One at a time: these run inside the delete's transaction.
  const checks: [string, () => Promise<unknown[]>][] = [
    ["bookings", () => sql`select 1 from bookings where tour_slug = ${slug} limit 1`],
    ["availability", () => sql`select 1 from availability where tour_slug = ${slug} limit 1`],
    ["saved tours", () => sql`select 1 from saved_tours where tour_slug = ${slug} limit 1`],
    ["reviews", () => sql`select 1 from reviews where tour_slug = ${slug} limit 1`],
  ];
  for (const [name, query] of checks) if ((await query()).length) found.push(name);
  return found;
}

async function addRedirect(tx: TxSql, actor: Actor, from: string, to: string, sourceId: string) {
  // The new address is live again if it was an old one: drop its redirect first,
  // then repoint older redirects to the new address so there are no chains.
  await tx`delete from redirects where from_path = ${to}`;
  await tx`update redirects set to_path = ${to} where to_path = ${from}`;
  await tx`
    insert into redirects (id, from_path, to_path, status_code, source_kind, source_id, created_by)
    values (${publicId()}, ${from}, ${to}, 301, 'collection_item', ${sourceId}, ${actor.userId})
    on conflict (from_path) do update set to_path = excluded.to_path, source_id = excluded.source_id
  `;
}

// ---------------------------------------------------------------- reads

export type ItemSummary = {
  id: string;
  key: string;
  title: string;
  status: "draft" | "published" | "hidden";
  position: number;
  draftDiffers: boolean;
  deletedAt: string | null;
};

/** Hard-delete records that have been in the trash longer than TRASH_DAYS. */
async function purgeTrash(sql: Sql, actor: Actor, collection: string) {
  const old = await sql<{ id: string; key: string }>`
    select id, key from collection_items
    where collection = ${collection} and deleted_at < now() - make_interval(days => ${TRASH_DAYS})
  `;
  for (const item of old) {
    await inTransaction(sql, async (tx) => {
      await tx`delete from content_refs where from_kind = 'collection_item' and from_id = ${item.id}`;
      await tx`delete from media_usage where owner_kind = 'collection_item' and owner_id = ${item.id}`;
      await tx`delete from collection_item_versions where item_id = ${item.id}`;
      await tx`delete from collection_items where id = ${item.id}`;
      await audit(tx, { actor, action: "collection.purge", entity: "collection_items", entityId: item.id, before: { collection, key: item.key }, after: null });
    });
  }
}

export const listItems = adminOperation(
  "collections.edit",
  async (sql, actor, input: { collection: string; q?: string; trash?: boolean }): Promise<ItemSummary[]> => {
    const def = defOf(input.collection);
    if (input.trash) await purgeTrash(sql, actor, def.id);
    const rows = await sql<ItemRow & { live: unknown; updated: string }>`
      select i.id, i.key, i.position, i.status, i.draft, i.deleted_at::text as deleted_at, v.data as live
      from collection_items i left join collection_item_versions v on v.id = i.published_version_id
      where i.collection = ${def.id} and (i.deleted_at is not null) = ${Boolean(input.trash)}
      order by i.position, i.key
    `;
    const q = input.q?.trim().toLowerCase();
    return rows
      .map((r) => {
        const draft = parseJson<Data>(r.draft);
        return {
          id: r.id,
          key: r.key,
          title: String(draft[def.titleField] ?? r.key),
          status: r.status,
          position: r.position,
          draftDiffers: JSON.stringify(draft) !== JSON.stringify(parseJson(r.live)),
          deletedAt: r.deleted_at,
        };
      })
      .filter((r) => !q || r.title.toLowerCase().includes(q) || r.key.includes(q));
  },
);

export const getItem = adminOperation("collections.edit", async (sql, _actor, input: { id: string }) => {
  const rows = await sql<ItemRow>`
    select id, collection, key, position, status, draft, rev, published_version_id, deleted_at::text as deleted_at
    from collection_items where id = ${input.id}
  `;
  const row = rows[0];
  if (!row) throw new NotFoundError("That record does not exist.");
  const def = defOf(row.collection);
  const draft = parseJson<Data>(row.draft);
  const live = await publishedData(sql, row.published_version_id);
  const versions = await sql<{ id: string; version: number; published_at: string; published_by: string | null }>`
    select id, version, published_at::text as published_at, published_by from collection_item_versions
    where item_id = ${row.id} order by version desc
  `;
  const usedBy = await incomingRefs(sql, row.id);
  const redirects = await sql<{ from_path: string; to_path: string }>`
    select from_path, to_path from redirects where source_id = ${row.id} order by created_at desc
  `;
  return {
    id: row.id,
    collection: def.id,
    key: row.key,
    status: row.status,
    rev: row.rev,
    deletedAt: row.deleted_at,
    draft: draft as JsonRecord,
    published: live as JsonRecord | null,
    draftDiffers: JSON.stringify(draft) !== JSON.stringify(live),
    livePath: live ? def.path(live) : null,
    draftPath: def.path(draft),
    versions: versions.map((v) => ({ id: v.id, version: v.version, publishedAt: v.published_at, current: v.id === row.published_version_id })),
    usedBy: usedBy.map((u) => ({ id: u.from_id, collection: u.collection, key: u.key, state: u.from_state, field: u.field })),
    redirects: redirects.map((r) => ({ from: r.from_path, to: r.to_path })),
  };
});

/** Published records of one collection, in order: what the site will read (task B5). Hidden and trashed are left out. */
export async function publishedItems(sql: Sql, collection: CollectionId): Promise<Data[]> {
  const rows = await sql<{ data: unknown }>`
    select v.data from collection_items i join collection_item_versions v on v.id = i.published_version_id
    where i.collection = ${collection} and i.status = 'published' and i.deleted_at is null
    order by i.position, i.key
  `;
  return rows.map((r) => parseJson<Data>(r.data));
}

// ---------------------------------------------------------------- writes

export const createItem = adminOperation(
  "collections.edit",
  async (sql, actor, input: { collection: string; data: unknown }) => {
    const def = defOf(input.collection);
    if (!def.canCreate) throw new ConflictError(`New ${def.label.toLowerCase()} cannot be added here.`, "NO_CREATE");
    const data = validate(def, input.data);
    assertClaimSources(actor, null, data);
    const key = String(data[def.keyField]);
    return inTransaction(sql, async (tx) => {
      if (await keyToId(tx, def.id, key)) throw new ConflictError(`"${key}" is already used (it may be in the trash).`, "KEY_TAKEN");
      await checkTargets(tx, def, data, new Set(), false);
      const id = collectionItemId(def.id, `${key}:${publicId(4)}`);
      const pos = await tx<{ p: number }>`select coalesce(max(position) + 1, 0)::int as p from collection_items where collection = ${def.id}`;
      await tx`
        insert into collection_items (id, collection, key, position, status, draft, rev, created_by, updated_by)
        values (${id}, ${def.id}, ${key}, ${pos[0].p}, 'draft', ${JSON.stringify(data)}::jsonb, 1, ${actor.userId}, ${actor.userId})
      `;
      await writeRefs(tx, id, def, "draft", data);
      await audit(tx, { actor, action: "collection.create", entity: "collection_items", entityId: id, before: null, after: { collection: def.id, key, data } });
      return { id, rev: 1 };
    });
  },
);

export const saveItemDraft = adminOperation(
  "collections.edit",
  async (sql, actor, input: { id: string; rev: number; data: unknown }) => {
    return inTransaction(sql, async (tx) => {
      const row = await lockItem(tx, input.id);
      if (row.deleted_at) throw new ConflictError("This record is in the trash. Restore it first.", "IN_TRASH");
      if (row.rev !== input.rev) throw new ConflictError(STALE_MESSAGE, "STALE");
      const data = validate(row.def, input.data);
      const draft = row.draft as Data;
      const newKey = String(data[row.def.keyField]);
      if (row.def.fixedKey && newKey !== row.key) throw new ConflictError(`A ${row.def.singular}'s id is fixed.`, "FIXED_KEY");
      if (newKey !== String(draft[row.def.keyField])) {
        const other = await keyToId(tx, row.def.id, newKey);
        if (other && other.id !== row.id) throw new ConflictError(`"${newKey}" is already used.`, "KEY_TAKEN");
      }
      assertClaimSources(actor, draft, data);
      const live = await publishedData(tx, row.published_version_id);
      await checkTargets(tx, row.def, data, new Set([...mediaIds(row.def, draft), ...mediaIds(row.def, live)]), false);
      // A record never published has no public address yet, so its key follows the draft.
      const key = row.published_version_id ? row.key : newKey;
      await tx`
        update collection_items set draft = ${JSON.stringify(data)}::jsonb, key = ${key}, rev = rev + 1,
          updated_at = now(), updated_by = ${actor.userId}
        where id = ${row.id}
      `;
      await writeRefs(tx, row.id, row.def, "draft", data);
      await audit(tx, { actor, action: "collection.save", entity: "collection_items", entityId: row.id, before: draft, after: data });
      return { rev: row.rev + 1 };
    });
  },
);

export const publishItem = adminOperation("collections.edit", async (sql, actor, input: { id: string; rev: number }) => {
  return inTransaction(sql, async (tx) => {
    const row = await lockItem(tx, input.id);
    if (row.deleted_at) throw new ConflictError("This record is in the trash. Restore it first.", "IN_TRASH");
    if (row.rev !== input.rev) throw new ConflictError(STALE_MESSAGE, "STALE");
    const data = validate(row.def, row.draft);
    const live = await publishedData(tx, row.published_version_id);
    await checkTargets(tx, row.def, data, mediaIds(row.def, live), true);
    const newKey = String(data[row.def.keyField]);
    if (newKey !== row.key) {
      const other = await keyToId(tx, row.def.id, newKey);
      if (other && other.id !== row.id) throw new ConflictError(`"${newKey}" is already used.`, "KEY_TAKEN");
      const used = await incomingRefs(tx, row.id);
      if (used.length && row.published_version_id) {
        throw new ConflictError(
          `Other records point at "${row.key}" (${describeRefs(used)}), so its key cannot change. Point them at another ${row.def.singular} first.`,
          "KEY_IN_USE",
        );
      }
    }
    const oldPath = live ? row.def.path(live) : null;
    const newPath = row.def.path(data);
    if (oldPath && newPath && oldPath !== newPath) await addRedirect(tx, actor, oldPath, newPath, row.id);
    const last = await tx<{ v: number }>`select coalesce(max(version), 0)::int as v from collection_item_versions where item_id = ${row.id}`;
    const version = last[0].v + 1;
    const versionId = publicId(12);
    await tx`
      insert into collection_item_versions (id, item_id, version, data, published_by)
      values (${versionId}, ${row.id}, ${version}, ${JSON.stringify(data)}::jsonb, ${actor.userId})
    `;
    await tx`delete from collection_item_versions where item_id = ${row.id} and version <= ${version - KEEP_VERSIONS}`;
    const status = row.status === "hidden" ? "hidden" : "published";
    await tx`
      update collection_items set published_version_id = ${versionId}, status = ${status}, key = ${newKey}, rev = rev + 1,
        updated_at = now(), updated_by = ${actor.userId}
      where id = ${row.id}
    `;
    await writeRefs(tx, row.id, row.def, "published", data);
    await audit(tx, {
      actor,
      action: "collection.publish",
      entity: "collection_items",
      entityId: row.id,
      before: live ? { version: version - 1, key: row.key, data: live } : null,
      after: { version, key: newKey, data, redirect: oldPath && newPath && oldPath !== newPath ? { from: oldPath, to: newPath } : null },
    });
    return { rev: row.rev + 1, version, redirect: oldPath && newPath && oldPath !== newPath ? { from: oldPath, to: newPath } : null };
  });
});

/** Hide a published record from the site, or show it again. */
export const setItemHidden = adminOperation("collections.edit", async (sql, actor, input: { id: string; hidden: boolean }) => {
  return inTransaction(sql, async (tx) => {
    const row = await lockItem(tx, input.id);
    if (row.deleted_at) throw new ConflictError("This record is in the trash.", "IN_TRASH");
    if (!row.published_version_id) throw new ConflictError("Publish this record before hiding or showing it.", "NOT_PUBLISHED");
    if (input.hidden) {
      const used = await incomingRefs(tx, row.id, true);
      if (used.length) throw new ConflictError(`Published records point at this one (${describeRefs(used)}).`, "IN_USE");
    }
    const status = input.hidden ? "hidden" : "published";
    await tx`update collection_items set status = ${status}, rev = rev + 1, updated_at = now(), updated_by = ${actor.userId} where id = ${row.id}`;
    await audit(tx, { actor, action: input.hidden ? "collection.hide" : "collection.show", entity: "collection_items", entityId: row.id, before: { status: row.status }, after: { status } });
    return { status, rev: row.rev + 1 };
  });
});

/** Set the order of every record in a collection (not in the trash). */
export const reorderItems = adminOperation("collections.edit", async (sql, actor, input: { collection: string; ids: string[] }) => {
  const def = defOf(input.collection);
  return inTransaction(sql, async (tx) => {
    const rows = await tx<{ id: string; key: string }>`
      select id, key from collection_items where collection = ${def.id} and deleted_at is null order by position, key for update
    `;
    const current = rows.map((r) => r.id);
    if (current.length !== input.ids.length || new Set(input.ids).size !== input.ids.length || !input.ids.every((id) => current.includes(id))) {
      throw new ConflictError("The list changed while you were ordering it. Reload and try again.", "STALE_ORDER");
    }
    for (const [i, id] of input.ids.entries()) await tx`update collection_items set position = ${i} where id = ${id}`;
    const keyOf = new Map(rows.map((r) => [r.id, r.key]));
    await audit(tx, {
      actor,
      action: "collection.reorder",
      entity: "collection_items",
      entityId: def.id,
      before: rows.map((r) => r.key),
      after: input.ids.map((id) => keyOf.get(id)),
    });
    return { ok: true as const };
  });
});

export const trashItem = adminOperation("collections.delete", async (sql, actor, input: { id: string }) => {
  return inTransaction(sql, async (tx) => {
    const row = await lockItem(tx, input.id);
    if (row.deleted_at) return { id: row.id, alreadyInTrash: true };
    const used = await incomingRefs(tx, row.id);
    if (used.length) throw new ConflictError(`Other records point at this one: ${describeRefs(used)}.`, "IN_USE");
    if (row.def.id === "tours") {
      const dormant = await dormantUses(tx, row.key);
      if (dormant.length) {
        throw new ConflictError(`Older ${dormant.join(", ")} records still name this tour, so it cannot be deleted. Hide it instead.`, "IN_USE");
      }
    }
    await tx`update collection_items set deleted_at = now(), deleted_by = ${actor.userId}, rev = rev + 1 where id = ${row.id}`;
    await audit(tx, { actor, action: "collection.trash", entity: "collection_items", entityId: row.id, before: { key: row.key, status: row.status }, after: { deleted: true } });
    return { id: row.id, alreadyInTrash: false };
  });
});

export const restoreItem = adminOperation("collections.delete", async (sql, actor, input: { id: string }) => {
  return inTransaction(sql, async (tx) => {
    const row = await lockItem(tx, input.id);
    if (!row.deleted_at) return { id: row.id };
    const draft = row.draft as Data;
    // Records it points at may have gone to the trash since.
    for (const ref of referencesOf(row.def.id, draft).items) {
      const target = await keyToId(tx, ref.collection, ref.key);
      if (!target || target.deleted_at) {
        throw new ConflictError(`The ${COLLECTIONS[ref.collection].singular} "${ref.key}" it uses is gone. Restore that first.`, "MISSING_TARGET");
      }
    }
    await tx`update collection_items set deleted_at = null, deleted_by = null, rev = rev + 1, updated_at = now(), updated_by = ${actor.userId} where id = ${row.id}`;
    await audit(tx, { actor, action: "collection.restore", entity: "collection_items", entityId: row.id, before: { deleted: true }, after: { key: row.key, status: row.status } });
    return { id: row.id };
  });
});
