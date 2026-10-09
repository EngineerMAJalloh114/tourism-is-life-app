import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { dashboardSnapshot } from "@/lib/server/dashboard";
import { staffMiddleware } from "@/lib/server/staff-middleware";

export const adminSnapshot = createServerFn({ method: "GET" })
  .middleware([staffMiddleware])
  .handler(async ({ context }) => dashboardSnapshot(await getSql(), context.actor, undefined));
