import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { STAFF_ROLES } from "@/lib/capabilities";
import { getSql } from "@/lib/db";
import { staffMiddleware } from "@/lib/server/staff-middleware";
import { changeRole, listTeam, setStaffStatus, STAFF_STATUSES } from "@/lib/server/team/staff";

export const adminListTeam = createServerFn({ method: "GET" })
  .middleware([staffMiddleware])
  .handler(async ({ context }) => listTeam(await getSql(), context.actor, undefined));

export const adminChangeRole = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ userId: z.string().min(1).max(100), role: z.enum(STAFF_ROLES) }).parse(d))
  .handler(async ({ data, context }) => changeRole(await getSql(), context.actor, data));

export const adminSetStaffStatus = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ userId: z.string().min(1).max(100), status: z.enum(STAFF_STATUSES) }).parse(d))
  .handler(async ({ data, context }) => setStaffStatus(await getSql(), context.actor, data));
