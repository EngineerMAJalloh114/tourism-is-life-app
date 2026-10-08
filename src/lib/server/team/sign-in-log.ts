/**
 * Every team sign-in, two-factor, password reset and first-time setup attempt,
 * successful or not. Readable by `audit.view` (ADMIN and SUPER_ADMIN).
 */
import type { Sql } from "@/lib/sql";
import { adminOperation } from "@/lib/server/access";
import { publicId } from "@/lib/server/crypto";
import { normaliseEmail } from "@/lib/server/team/rate-limit";

export type AttemptKind = "password" | "two-factor" | "recovery-code" | "reset-request" | "reset" | "setup";

export type AttemptOutcome =
  | "signed-in"
  | "password-ok"
  | "two-factor-ok"
  | "bad-credentials"
  | "bad-code"
  | "refused"
  | "rate-limited"
  | "sent"
  | "failed";

export type Attempt = {
  kind: AttemptKind;
  outcome: AttemptOutcome;
  email?: string | null;
  userId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};

export async function logAttempt(sql: Sql, attempt: Attempt): Promise<void> {
  await sql`
    insert into sign_in_attempts (id, kind, email, user_id, ip, user_agent, outcome)
    values (
      ${publicId()},
      ${attempt.kind},
      ${normaliseEmail(attempt.email)},
      ${attempt.userId ?? null},
      ${attempt.ip?.slice(0, 64) ?? null},
      ${attempt.userAgent?.slice(0, 200) ?? null},
      ${attempt.outcome}
    )
  `;
}

export type AttemptRow = {
  id: string;
  created_at: string;
  kind: string;
  email: string | null;
  user_id: string | null;
  ip: string | null;
  user_agent: string | null;
  outcome: string;
};

export const listSignInAttempts = adminOperation(
  "audit.view",
  async (sql, _actor, input: { email?: string; limit?: number } | undefined): Promise<AttemptRow[]> => {
    const limit = Math.min(Math.max(input?.limit ?? 100, 1), 200);
    const email = normaliseEmail(input?.email);
    if (email) {
      return sql<AttemptRow>`
        select id, created_at, kind, email, user_id, ip, user_agent, outcome
        from sign_in_attempts where email = ${email}
        order by created_at desc limit ${limit}
      `;
    }
    return sql<AttemptRow>`
      select id, created_at, kind, email, user_id, ip, user_agent, outcome
      from sign_in_attempts order by created_at desc limit ${limit}
    `;
  },
);
