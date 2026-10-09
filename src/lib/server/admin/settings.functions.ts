import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { staffMiddleware } from "@/lib/server/staff-middleware";
import {
  getSiteSettings,
  publishSiteSettings,
  restoreSiteSettingsVersion,
  saveSiteSettingsDraft,
} from "@/lib/server/settings/site-settings";

const rev = z.number().int().min(1);

export const adminGetSiteSettings = createServerFn({ method: "GET" })
  .middleware([staffMiddleware])
  .handler(async ({ context }) => getSiteSettings(await getSql(), context.actor, undefined));

// `data` is checked in full by the operation (siteSettingsSchema plus the retired-number rule).
export const adminSaveSiteSettings = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ rev, data: z.record(z.string(), z.unknown()) }).parse(d))
  .handler(async ({ data, context }) => saveSiteSettingsDraft(await getSql(), context.actor, data));

export const adminPublishSiteSettings = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ rev }).parse(d))
  .handler(async ({ data, context }) => publishSiteSettings(await getSql(), context.actor, data));

export const adminRestoreSiteSettings = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ rev, versionId: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data, context }) => restoreSiteSettingsVersion(await getSql(), context.actor, data));
