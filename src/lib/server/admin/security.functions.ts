import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { listSignInAttempts } from "@/lib/server/team/sign-in-log";
import { staffMiddleware } from "@/lib/server/staff-middleware";

export const adminListSignInAttempts = createServerFn({ method: "GET" })
  .middleware([staffMiddleware])
  .validator((d) => z.object({ email: z.string().max(254).optional(), limit: z.number().int().min(1).max(200).optional() }).optional().parse(d))
  .handler(async ({ data, context }) => listSignInAttempts(await getSql(), context.actor, data));
