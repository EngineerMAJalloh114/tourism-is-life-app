/**
 * Public server functions for the team sign-in pages that are not Better Auth
 * endpoints. They never reveal whether an address has an account: every call
 * gets the same answer.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { bootstrapEmailAllowed, isDeployedRuntime } from "@/lib/server/config";
import { env } from "@/lib/env.server";
import { TooManyRequestsError } from "@/lib/server/errors";
import { consumeTeamLimits } from "@/lib/server/team/rate-limit";
import { setupOpen } from "@/lib/server/team/setup";
import { logAttempt } from "@/lib/server/team/sign-in-log";

/** Whether the first-time setup form should show (no team account and no claim yet). */
export const getTeamSetupState = createServerFn({ method: "GET" }).handler(async () => {
  const open = await setupOpen(await getSql());
  // On a real deployment the setup also needs BOOTSTRAP_ADMIN_EMAIL to be set.
  const configured = !isDeployedRuntime() || Boolean(env("BOOTSTRAP_ADMIN_EMAIL"));
  return { open: open && configured };
});

export const requestTeamSetup = createServerFn({ method: "POST" })
  .validator((d) =>
    z.object({ email: z.string().trim().toLowerCase().email().max(254), name: z.string().trim().min(1).max(120) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
    const { requestIp } = await import("@/lib/server/actor.server");
    const { getRequest, setResponseStatus } = await import("@tanstack/react-start/server");
    assertSameSiteRequest();
    const sql = await getSql();
    const ip = requestIp() ?? "unknown";
    const userAgent = getRequest()?.headers.get("user-agent") ?? null;
    const { allowed } = await consumeTeamLimits(sql, "setup", { email: data.email, ip });
    if (!allowed) {
      await logAttempt(sql, { kind: "setup", outcome: "rate-limited", email: data.email, ip, userAgent });
      setResponseStatus(429);
      throw new TooManyRequestsError();
    }
    if ((await setupOpen(sql)) && bootstrapEmailAllowed(data.email)) {
      const { auth } = await import("@/lib/auth/server");
      const ctx = await auth.$context;
      const existing = await ctx.internalAdapter.findUserByEmail(data.email);
      if (!existing) await ctx.internalAdapter.createUser({ email: data.email, name: data.name, emailVerified: false });
      await auth.api.requestPasswordReset({
        body: { email: data.email, redirectTo: "/team/reset-password" },
        headers: getRequest()?.headers,
      });
      await logAttempt(sql, { kind: "setup", outcome: "sent", email: data.email, ip, userAgent });
    } else {
      await logAttempt(sql, { kind: "setup", outcome: "refused", email: data.email, ip, userAgent });
    }
    return { ok: true as const };
  });
