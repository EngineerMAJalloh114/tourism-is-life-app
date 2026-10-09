import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { staffMiddleware } from "@/lib/server/staff-middleware";
import {
  archiveRate,
  archiveRating,
  createRate,
  createRating,
  listRates,
  listRatings,
  publishRate,
  publishRating,
  updateRate,
  updateRating,
} from "@/lib/server/rates/rates";

const id = z.object({ id: z.string().min(1).max(64) });
// Amounts arrive as text in major units; the operation parses them without floating point.
const rateFields = {
  label: z.string().max(80),
  currency: z.string().max(3),
  amount: z.string().max(40),
  unit: z.string().max(20),
  sourceNote: z.string().max(300).optional(),
  sourceDate: z.string().max(10).nullable().optional(),
};
const ratingFields = {
  value: z.string().max(5),
  reviewCount: z.number().int(),
  sourceUrl: z.string().max(500).optional(),
  sourceDate: z.string().max(10).nullable().optional(),
};

export const adminListRates = createServerFn({ method: "GET" })
  .middleware([staffMiddleware])
  .handler(async ({ context }) => listRates(await getSql(), context.actor, undefined));

export const adminCreateRate = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ subjectCollection: z.string().max(40), subjectId: z.string().min(1).max(64), ...rateFields }).parse(d))
  .handler(async ({ data, context }) => createRate(await getSql(), context.actor, data));

export const adminUpdateRate = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ id: z.string().min(1).max(64), ...rateFields }).parse(d))
  .handler(async ({ data, context }) => updateRate(await getSql(), context.actor, data));

export const adminPublishRate = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => id.parse(d))
  .handler(async ({ data, context }) => publishRate(await getSql(), context.actor, data));

export const adminArchiveRate = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => id.parse(d))
  .handler(async ({ data, context }) => archiveRate(await getSql(), context.actor, data));

export const adminListRatings = createServerFn({ method: "GET" })
  .middleware([staffMiddleware])
  .handler(async ({ context }) => listRatings(await getSql(), context.actor, undefined));

export const adminCreateRating = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ tourId: z.string().min(1).max(64), ...ratingFields }).parse(d))
  .handler(async ({ data, context }) => createRating(await getSql(), context.actor, data));

export const adminUpdateRating = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ id: z.string().min(1).max(64), ...ratingFields }).parse(d))
  .handler(async ({ data, context }) => updateRating(await getSql(), context.actor, data));

export const adminPublishRating = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => id.parse(d))
  .handler(async ({ data, context }) => publishRating(await getSql(), context.actor, data));

export const adminArchiveRating = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => id.parse(d))
  .handler(async ({ data, context }) => archiveRating(await getSql(), context.actor, data));
