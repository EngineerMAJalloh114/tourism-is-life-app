/**
 * The "set your password" and "reset your password" links a SUPER_ADMIN sends
 * from the team page (task A5).
 *
 * The link is the one Better Auth's own reset flow uses: a verification row
 * `reset-password:<token>` holding the user id, and the URL
 * `<auth base>/reset-password/<token>?callbackURL=...`, which redirects to
 * `/team/reset-password?token=...`. Building it here rather than calling
 * `requestPasswordReset` lets the desk say whether the email actually went,
 * and skips the public rate limit, which is meant for visitors, not for a
 * SUPER_ADMIN acting on the team list. `src/lib/server/team/accounts.test.ts` pins the format
 * to the installed version: a link made here sets a password through
 * `resetPassword` and the member can then sign in.
 *
 * The base URL is passed in rather than read from Better Auth's context:
 * outside a request handled by Better Auth itself, a dynamic base URL (local
 * and preview builds) has not been resolved yet and the link would come out
 * relative. Deployments set BETTER_AUTH_URL, so the base is fixed there.
 *
 * No server-only imports: the auth context, base URL and mail sender are passed in.
 */
import { randomToken } from "@/lib/server/crypto";
import { buildPasswordEmail, type TeamEmail } from "@/lib/auth/team-emails";
import { RESET_TOKEN_SECONDS } from "@/lib/auth/team-auth";

export type PasswordLinkKind = "invite" | "reset";

export type PasswordLinkUser = { id: string; email: string; name: string | null };

export type PasswordLinks = {
  send(user: PasswordLinkUser, kind: PasswordLinkKind): Promise<{ sent: boolean }>;
};

/** The part of Better Auth's context this needs. */
export type ResetLinkContext = {
  internalAdapter: {
    createVerificationValue(data: { identifier: string; value: string; expiresAt: Date }): Promise<unknown>;
  };
};

export const TEAM_RESET_PATH = "/team/reset-password";

export function passwordLinkSender(opts: {
  context: () => Promise<ResetLinkContext>;
  /** Better Auth's absolute base, origin plus `/api/auth`. */
  authBaseURL: () => string;
  sendEmail: (message: { to: string } & TeamEmail) => Promise<{ sent: boolean }>;
  /** Local PGLite only: log a link that could not be emailed. */
  onUndeliveredLink?: (email: string, url: string) => void;
}): PasswordLinks {
  return {
    async send(user, kind) {
      const ctx = await opts.context();
      const token = randomToken(24);
      await ctx.internalAdapter.createVerificationValue({
        identifier: `reset-password:${token}`,
        value: user.id,
        expiresAt: new Date(Date.now() + RESET_TOKEN_SECONDS * 1000),
      });
      const url = `${opts.authBaseURL()}/reset-password/${token}?callbackURL=${encodeURIComponent(TEAM_RESET_PATH)}`;
      const email = buildPasswordEmail({ kind, name: user.name, url, minutes: RESET_TOKEN_SECONDS / 60 });
      let sent = false;
      try {
        sent = (await opts.sendEmail({ to: user.email, ...email })).sent;
      } catch {
        sent = false;
      }
      if (!sent) opts.onUndeliveredLink?.(user.email, url);
      return { sent };
    },
  };
}
