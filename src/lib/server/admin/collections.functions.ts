import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { COLLECTION_IDS } from "@/lib/collections/registry";
import { getSql } from "@/lib/db";
import { staffMiddleware } from "@/lib/server/staff-middleware";
import {
  createItem,
  getItem,
  listItems,
  publishItem,
  reorderItems,
  restoreItem,
  saveItemDraft,
  setItemHidden,
  trashItem,
} from "@/lib/server/collections/items";

const collection = z.enum(COLLECTION_IDS);
const id = z.string().min(1).max(64);
const rev = z.number().int().min(1);
// `data` is checked in full by the operation, against the collection's own schema.
const data = z.record(z.string(), z.unknown());

export const adminListCollectionItems = createServerFn({ method: "GET" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ collection, q: z.string().max(100).optional(), trash: z.boolean().optional() }).parse(d))
  .handler(async ({ data: input, context }) => listItems(await getSql(), context.actor, input));

export const adminGetCollectionItem = createServerFn({ method: "GET" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ id }).parse(d))
  .handler(async ({ data: input, context }) => getItem(await getSql(), context.actor, input));

export const adminCreateCollectionItem = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ collection, data }).parse(d))
  .handler(async ({ data: input, context }) => createItem(await getSql(), context.actor, input));

export const adminSaveCollectionItem = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ id, rev, data }).parse(d))
  .handler(async ({ data: input, context }) => saveItemDraft(await getSql(), context.actor, input));

export const adminPublishCollectionItem = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ id, rev }).parse(d))
  .handler(async ({ data: input, context }) => publishItem(await getSql(), context.actor, input));

export const adminSetCollectionItemHidden = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ id, hidden: z.boolean() }).parse(d))
  .handler(async ({ data: input, context }) => setItemHidden(await getSql(), context.actor, input));

export const adminReorderCollection = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ collection, ids: z.array(id).max(500) }).parse(d))
  .handler(async ({ data: input, context }) => reorderItems(await getSql(), context.actor, input));

export const adminTrashCollectionItem = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ id }).parse(d))
  .handler(async ({ data: input, context }) => trashItem(await getSql(), context.actor, input));

export const adminRestoreCollectionItem = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ id }).parse(d))
  .handler(async ({ data: input, context }) => restoreItem(await getSql(), context.actor, input));
