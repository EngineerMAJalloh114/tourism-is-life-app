/**
 * Team sign-in rules for Better Auth (task A3, docs/CUSTOMIZATION_PLAN.md section 9).
 *
 * Built as a function of its dependencies so the exact same rules run in the
 * app (`src/lib/auth/server.ts`) and in the PGLite tests (`team-auth.test.ts`):
 *
 *   - Public sign-up is closed. Accounts are created by a SUPER_ADMIN or by the
 *     single first-time setup, and get a "set your password" email.
 *   - Only an active team account may hold a session. The one exception is the
 *     owner before the SUPER_ADMIN claim (no team accounts yet, the allowed
 *     bootstrap address, and a verified email).
 *   - TOTP two-factor through the installed plugin; recovery codes stored hashed;
 *     "trust this device" is never honoured; members cannot switch two-factor off.
 *   - Rate limits in Postgres: 5 attempts per email and IP, 20 per IP, per 15
 *     minutes, on sign-in, two-factor checks and reset requests. Every attempt is
 *     logged. A failed sign-in always gets the same message.
 *   - Sessions end 12 hours after sign-in; a password reset ends all sessions.
 */
import type { BetterAuthOptions } from "better-auth";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { twoFactor } from "better-auth/plugins/two-factor";
import type { Sql } from "@/lib/sql";
import { hashRecoveryCode, normaliseRecoveryCode, recoveryCodeStorage } from "@/lib/auth/recovery-codes";
import { buildPasswordEmail } from "@/lib/auth/team-emails";
import { consumeTeamLimits, normaliseEmail, type LimitScope } from "@/lib/server/team/rate-limit";
import { logAttempt, type AttemptKind, type AttemptOutcome } from "@/lib/server/team/sign-in-log";

export const TEAM_SESSION_SECONDS = 12 * 60 * 60;
export const RESET_TOKEN_SECONDS = 60 * 60;
export const MIN_PASSWORD_LENGTH = 12;
export const TOTP_ISSUER = "Tourism Is Life";

export const GENERIC_SIGN_IN_ERROR = "Email or password is incorrect.";
export const BAD_CODE_ERROR = "That code did not work. Check the time on your phone and try again.";
export const RATE_LIMITED_ERROR = "Too many attempts. Wait 15 minutes, then try again.";

export type TeamAuthDeps = {
  getSql: () => Promise<Sql>;
  sendEmail: (opts: { to: string; subject: string; html: string; text: string }) => Promise<{ sent: boolean }>;
  /** Signs the recovery-code hashes; the same secret Better Auth signs sessions with. */
  secret: string;
  /** Whether `email` may make the single SUPER_ADMIN claim (see `bootstrapEmailAllowed`). */
  bootstrapEmailAllowed: (email: string | null) => boolean;
  /** Called with a reset or setup link that could not be emailed (local PGLite only). */
  onUndeliveredLink?: (email: string, url: string) => void;
};

/** The client IP as Vercel's edge sets it (first `x-forwarded-for` entry), or "unknown". */
export function clientIp(headers?: Headers | null): string {
  const forwarded = headers?.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = headers?.get("x-real-ip")?.trim();
  return (forwarded || real || "unknown").slice(0, 64);
}

const LOGGED_PATHS: Record<string, { kind: AttemptKind; scope: LimitScope }> = {
  "/sign-in/email": { kind: "password", scope: "sign-in" },
  "/two-factor/verify-totp": { kind: "two-factor", scope: "two-factor" },
  "/two-factor/verify-backup-code": { kind: "recovery-code", scope: "two-factor" },
  "/request-password-reset": { kind: "reset-request", scope: "reset" },
};

/**
 * Whether `userId` may hold a session: an active team account, or the owner
 * before the claim. Used by the `session.create.before` database hook, so it
 * also covers the session the two-factor step creates.
 */
export async function maySignIn(
  sql: Sql,
  userId: string,
  bootstrapEmailAllowed: (email: string | null) => boolean,
): Promise<boolean> {
  const rows = await sql<{ email: string; email_verified: boolean; status: string | null }>`
    select u.email, u."emailVerified" as email_verified, s.status
    from "user" u left join staff_profiles s on s.user_id = u.id
    where u.id = ${userId}
    limit 1
  `;
  const row = rows[0];
  if (!row) return false;
  if (row.status === "active") return true;
  if (row.status) return false; // disabled or removed
  const open = await sql<{ staff: number; claimed: number }>`
    select (select count(*)::int from staff_profiles) as staff, (select count(*)::int from bootstrap_lock) as claimed
  `;
  const bootstrapOpen = open[0]?.staff === 0 && open[0]?.claimed === 0;
  return bootstrapOpen && row.email_verified === true && bootstrapEmailAllowed(row.email);
}

/** Read the pending two-factor challenge's user (for per-email limits on the code step). */
async function pendingTwoFactorEmail(ctx: any, sql: Sql): Promise<string | null> {
  try {
    const cookie = ctx.context.createAuthCookie("two_factor");
    const identifier = await ctx.getSignedCookie(cookie.name, ctx.context.secret);
    if (!identifier) return null;
    const rows = await sql<{ email: string }>`
      select u.email from verification v join "user" u on u.id = v.value
      where v.identifier = ${identifier} limit 1
    `;
    return rows[0]?.email ?? null;
  } catch {
    return null;
  }
}

async function safeLog(deps: TeamAuthDeps, attempt: Parameters<typeof logAttempt>[1]) {
  try {
    await logAttempt(await deps.getSql(), attempt);
  } catch {
    // Logging must never decide whether someone can sign in.
  }
}

export function teamAuthOptions(deps: TeamAuthDeps) {
  const emailAndPassword: NonNullable<BetterAuthOptions["emailAndPassword"]> = {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: RESET_TOKEN_SECONDS,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const sql = await deps.getSql();
      // Only team accounts (and the owner before the claim) get a link; for any
      // other address the response is the same and nothing is sent.
      const staff = await sql<{ status: string }>`select status from staff_profiles where user_id = ${user.id} limit 1`;
      const open = await sql<{ n: number }>`
        select (select count(*)::int from staff_profiles) + (select count(*)::int from bootstrap_lock) as n
      `;
      const eligible =
        staff[0]?.status === "active" || (open[0]?.n === 0 && deps.bootstrapEmailAllowed(user.email));
      if (!eligible) return;
      const hasPassword = await sql`
        select 1 from "account" where "userId" = ${user.id} and "providerId" = 'credential' limit 1
      `;
      const email = buildPasswordEmail({
        kind: hasPassword.length ? "reset" : "invite",
        name: user.name || null,
        url,
        minutes: RESET_TOKEN_SECONDS / 60,
      });
      const result = await deps.sendEmail({ to: user.email, ...email });
      if (!result.sent) deps.onUndeliveredLink?.(user.email, url);
    },
    onPasswordReset: async ({ user }) => {
      // Following the emailed link proves the mailbox.
      const sql = await deps.getSql();
      await sql`update "user" set "emailVerified" = true, "updatedAt" = now() where id = ${user.id}`;
    },
  };

  const session: NonNullable<BetterAuthOptions["session"]> = {
    // Absolute: a team session ends 12 hours after sign-in and is never extended.
    expiresIn: TEAM_SESSION_SECONDS,
    updateAge: TEAM_SESSION_SECONDS,
    cookieCache: { enabled: true, maxAge: 300 },
  };

  const databaseHooks: NonNullable<BetterAuthOptions["databaseHooks"]> = {
    session: {
      create: {
        before: async (s) => {
          const sql = await deps.getSql();
          return (await maySignIn(sql, s.userId, deps.bootstrapEmailAllowed)) ? undefined : false;
        },
      },
    },
  };

  const before = createAuthMiddleware(async (ctx) => {
    const path = ctx.path ?? "";
    if (path === "/two-factor/disable" || path === "/two-factor/view-backup-codes") {
      throw new APIError("FORBIDDEN", {
        message: "Two-factor sign-in is required for team accounts. A SUPER_ADMIN can reset it.",
      });
    }
    if (path === "/two-factor/enable") {
      const current = await getSessionFromCtx(ctx);
      if ((current?.user as { twoFactorEnabled?: boolean } | undefined)?.twoFactorEnabled) {
        throw new APIError("FORBIDDEN", {
          message: "Two-factor sign-in is already set up. A SUPER_ADMIN can reset it if you lost your phone.",
        });
      }
      return;
    }
    const logged = LOGGED_PATHS[path];
    if (!logged) return;
    const sql = await deps.getSql();
    const ip = clientIp(ctx.headers ?? ctx.request?.headers);
    const userAgent = (ctx.headers ?? ctx.request?.headers)?.get("user-agent") ?? null;
    const body = (ctx.body ?? {}) as Record<string, unknown>;
    const email =
      logged.scope === "two-factor" ? await pendingTwoFactorEmail(ctx, sql) : normaliseEmail(String(body.email ?? ""));
    const { allowed } = await consumeTeamLimits(sql, logged.scope, { email, ip });
    if (!allowed) {
      await safeLog(deps, { kind: logged.kind, outcome: "rate-limited", email, ip, userAgent });
      throw new APIError("TOO_MANY_REQUESTS", { message: RATE_LIMITED_ERROR });
    }
    if (logged.scope === "two-factor") {
      const next: Record<string, unknown> = { ...body, trustDevice: false };
      if (path === "/two-factor/verify-backup-code" && typeof body.code === "string") {
        next.code = hashRecoveryCode(deps.secret, normaliseRecoveryCode(body.code));
      }
      return { context: { body: next } };
    }
  });

  const after = createAuthMiddleware(async (ctx) => {
    const path = ctx.path ?? "";
    const logged = LOGGED_PATHS[path];
    if (!logged && path !== "/reset-password") return;
    const headers = ctx.headers ?? ctx.request?.headers;
    const ip = clientIp(headers);
    const userAgent = headers?.get("user-agent") ?? null;
    const returned = ctx.context.returned as unknown;
    const failed = returned instanceof APIError || (returned instanceof Error && "statusCode" in returned);
    const newSession = ctx.context.newSession as
      | { user: { id: string; email: string; twoFactorEnabled?: boolean } }
      | null
      | undefined;
    const body = (ctx.body ?? {}) as Record<string, unknown>;

    if (path === "/reset-password") {
      await safeLog(deps, { kind: "reset", outcome: failed ? "failed" : "sent", ip, userAgent });
      return;
    }
    if (logged.kind === "reset-request") {
      await safeLog(deps, { kind: "reset-request", outcome: "sent", email: String(body.email ?? ""), ip, userAgent });
      return;
    }
    if (logged.kind === "password") {
      let outcome: AttemptOutcome;
      if (failed) {
        const err = returned as { statusCode?: number; body?: { code?: string } };
        // FAILED_TO_CREATE_SESSION is the session hook refusing a non-team or
        // disabled account after a correct password.
        outcome = err.statusCode === 401 && err.body?.code !== "FAILED_TO_CREATE_SESSION" ? "bad-credentials" : "refused";
      } else {
        outcome = newSession?.user.twoFactorEnabled ? "password-ok" : "signed-in";
      }
      await safeLog(deps, {
        kind: "password",
        outcome,
        email: String(body.email ?? ""),
        userId: newSession?.user.id ?? null,
        ip,
        userAgent,
      });
      // One message for every failed sign-in: unknown email, wrong password,
      // disabled account, or an account that is not a team account.
      if (failed) throw new APIError("UNAUTHORIZED", { message: GENERIC_SIGN_IN_ERROR });
      return;
    }
    // Two-factor and recovery-code checks.
    await safeLog(deps, {
      kind: logged.kind,
      outcome: failed ? "bad-code" : "two-factor-ok",
      email: newSession?.user.email ?? null,
      userId: newSession?.user.id ?? null,
      ip,
      userAgent,
    });
    if (failed) {
      const status = (returned as { statusCode?: number }).statusCode;
      if (status === 429) return; // the plugin's own lock already speaks for itself
      throw new APIError("UNAUTHORIZED", { message: BAD_CODE_ERROR });
    }
  });

  const twoFactorPlugin = twoFactor({
    issuer: TOTP_ISSUER,
    skipVerificationOnEnable: false,
    // Never honoured (the `before` hook forces trustDevice: false), but keep any
    // cookie that somehow exists short-lived.
    trustDeviceMaxAge: 60,
    backupCodeOptions: { amount: 10, length: 10, storeBackupCodes: recoveryCodeStorage(deps.secret) },
  });

  return { emailAndPassword, session, databaseHooks, hooks: { before, after }, twoFactorPlugin };
}
