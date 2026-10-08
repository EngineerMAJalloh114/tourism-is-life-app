import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { listAudit } from "@/lib/server/audit-log";
import { staffMiddleware } from "@/lib/server/staff-middleware";

export const adminListAudit = createServerFn({ method: "GET" })
  .middleware([staffMiddleware])
  .handler(async ({ context }) => listAudit(await getSql(), context.actor, undefined));
