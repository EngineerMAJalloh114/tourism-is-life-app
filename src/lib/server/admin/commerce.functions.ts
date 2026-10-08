import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { listAvailability, listBookings, listReviews, moderateReview } from "@/lib/server/commerce-admin";
import { staffMiddleware } from "@/lib/server/staff-middleware";

export const adminListBookings = createServerFn({ method: "GET" })
  .middleware([staffMiddleware])
  .handler(async ({ context }) => listBookings(await getSql(), context.actor, undefined));

export const adminListAvailability = createServerFn({ method: "GET" })
  .middleware([staffMiddleware])
  .handler(async ({ context }) => listAvailability(await getSql(), context.actor, undefined));

export const adminListReviews = createServerFn({ method: "GET" })
  .middleware([staffMiddleware])
  .handler(async ({ context }) => listReviews(await getSql(), context.actor, undefined));

export const adminModerateReview = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ id: z.string().min(1).max(40), status: z.enum(["approved", "rejected"]) }).parse(d))
  .handler(async ({ data, context }) => moderateReview(await getSql(), context.actor, data));
