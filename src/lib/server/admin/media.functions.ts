import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { staffMiddleware } from "@/lib/server/staff-middleware";
import {
  createUploadTicket,
  deleteMedia,
  finishUpload,
  getMedia,
  listMedia,
  mediaPreviews,
  replaceFile,
  setMediaPublished,
  updateMedia,
} from "@/lib/server/media/library";
import { mediaDeps } from "@/lib/server/media/storage.server";

const text = (max: number) => z.string().max(max).optional();
const provenance = z
  .object({
    source: text(500),
    sourceUrl: text(500),
    license: text(500),
    author: text(500),
    location: text(500),
    subject: text(500),
    notes: text(500),
  })
  .strict()
  .optional();
const mediaId = z.string().min(1).max(64);

export const adminListMedia = createServerFn({ method: "GET" })
  .middleware([staffMiddleware])
  .validator((d) =>
    z
      .object({
        q: z.string().max(100).optional(),
        filter: z.enum(["all", "uploads", "repository", "incomplete", "published"]).optional(),
        offset: z.number().int().min(0).max(100_000).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      })
      .optional()
      .parse(d),
  )
  .handler(async ({ data, context }) => listMedia(await getSql(), context.actor, data, mediaDeps()));

export const adminMediaPreviews = createServerFn({ method: "GET" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ ids: z.array(mediaId).max(100) }).parse(d))
  .handler(async ({ data, context }) => mediaPreviews(await getSql(), context.actor, data, mediaDeps()));

export const adminGetMedia = createServerFn({ method: "GET" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ mediaId }).parse(d))
  .handler(async ({ data, context }) => getMedia(await getSql(), context.actor, data, mediaDeps()));

export const adminCreateUploadTicket = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) =>
    z
      .object({
        filename: z.string().min(1).max(255),
        contentType: z.string().max(100),
        bytes: z.number().int().min(0),
        replaceId: mediaId.optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => createUploadTicket(await getSql(), context.actor, data, mediaDeps()));

export const adminFinishUpload = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) =>
    z.object({ token: z.string().min(1).max(2000), filename: z.string().max(255).optional(), alt: text(300), provenance }).parse(d),
  )
  .handler(async ({ data, context }) => finishUpload(await getSql(), context.actor, data, mediaDeps()));

export const adminReplaceMediaFile = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ mediaId, token: z.string().min(1).max(2000), filename: z.string().max(255).optional() }).parse(d))
  .handler(async ({ data, context }) => replaceFile(await getSql(), context.actor, data, mediaDeps()));

export const adminUpdateMedia = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ mediaId, alt: text(300), provenance }).parse(d))
  .handler(async ({ data, context }) => updateMedia(await getSql(), context.actor, data));

export const adminSetMediaPublished = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ mediaId, published: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => setMediaPublished(await getSql(), context.actor, data));

export const adminDeleteMedia = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ mediaId }).parse(d))
  .handler(async ({ data, context }) => deleteMedia(await getSql(), context.actor, data, mediaDeps()));
