import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { STAFF_ROLES } from "@/lib/capabilities";
import { getSql } from "@/lib/db";
import { teamPasswordLinks } from "@/lib/auth/server";
import { staffMiddleware } from "@/lib/server/staff-middleware";
import { changeRole, listTeam, setStaffStatus, STAFF_STATUSES } from "@/lib/server/team/staff";
import { createTeamAccount, resetTwoFactor, sendPasswordLink } from "@/lib/server/team/accounts";

const userIdSchema = z.object({ userId: z.string().min(1).max(100) });

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

export const adminCreateTeamAccount = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) =>
    z
      .object({
        name: z.string().trim().min(1).max(100),
        email: z.string().trim().toLowerCase().email().max(254),
        role: z.enum(STAFF_ROLES),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => createTeamAccount(await getSql(), context.actor, data, teamPasswordLinks));

export const adminSendPasswordLink = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => userIdSchema.parse(d))
  .handler(async ({ data, context }) => sendPasswordLink(await getSql(), context.actor, data, teamPasswordLinks));

export const adminResetTwoFactor = createServerFn({ method: "POST" })
  .middleware([staffMiddleware])
  .validator((d) => userIdSchema.parse(d))
  .handler(async ({ data, context }) => resetTwoFactor(await getSql(), context.actor, data));
