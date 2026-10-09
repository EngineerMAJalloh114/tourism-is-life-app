import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { staffMiddleware } from "@/lib/server/staff-middleware";
import {
  createAnnouncement,
  listAnnouncements,
  setAnnouncementStatus,
  updateAnnouncement,
} from "@/lib/server/announcements/announcements";

const fields = {
  message: z.string().max(1000),
  linkLabel: z.string().max(100).optional(),
  link: z.string().max(500).optional(),
  startsAt: z.string().max(40),
  endsAt: z.string().max(40).nullable().optional(),
};

export const adminListAnnouncements = createServerFn({ method: "GET" })
  .middleware([staffMiddleware])
  .handler(async ({ context }) => listAnnouncements(await getSql(), context.actor, undefined));

export const adminCreateAnnouncement = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object(fields).parse(d))
  .handler(async ({ data, context }) => createAnnouncement(await getSql(), context.actor, data));

export const adminUpdateAnnouncement = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ id: z.string().min(1).max(64), ...fields }).parse(d))
  .handler(async ({ data, context }) => updateAnnouncement(await getSql(), context.actor, data));

export const adminSetAnnouncementStatus = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ id: z.string().min(1).max(64), status: z.enum(["draft", "published", "archived"]) }).parse(d))
  .handler(async ({ data, context }) => setAnnouncementStatus(await getSql(), context.actor, data));
