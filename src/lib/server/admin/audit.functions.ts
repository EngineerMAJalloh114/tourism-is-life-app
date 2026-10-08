import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { listAudit, listAuditEntities } from "@/lib/server/audit-log";
import { staffMiddleware } from "@/lib/server/staff-middleware";

const auditQuery = z
  .object({
    entity: z.string().max(60).optional(),
    action: z.string().max(60).optional(),
    actorId: z.string().max(100).optional(),
    cursor: z.string().max(400).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  })
  .optional();

export const adminListAudit = createServerFn({ method: "GET" })
  .middleware([staffMiddleware])
  .validator((d) => auditQuery.parse(d))
  .handler(async ({ data, context }) => listAudit(await getSql(), context.actor, data));

export const adminListAuditEntities = createServerFn({ method: "GET" })
  .middleware([staffMiddleware])
  .handler(async ({ context }) => listAuditEntities(await getSql(), context.actor, undefined));
