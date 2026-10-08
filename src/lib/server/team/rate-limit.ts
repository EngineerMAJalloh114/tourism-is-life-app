/**
 * Fixed-window rate limits stored in Postgres, so every serverless instance
 * shares the same counters (the old limiter lived in one instance's memory).
 *
 * Team sign-in, two-factor checks and reset requests all use the same rule:
 * at most 5 attempts per email and IP, and 20 per IP, in any 15-minute window.
 */
import type { Sql } from "@/lib/sql";

export const SIGN_IN_WINDOW_MS = 15 * 60 * 1000;
export const PER_EMAIL_AND_IP = 5;
export const PER_IP = 20;

export type LimitScope = "sign-in" | "two-factor" | "reset" | "setup";

function windowStart(now: Date, windowMs: number): Date {
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

/** Count one attempt against `key` and report whether it is still within `limit`. */
export async function consume(
  sql: Sql,
  key: string,
  limit: number,
  windowMs: number,
  now: Date = new Date(),
): Promise<{ allowed: boolean; count: number }> {
  const start = windowStart(now, windowMs).toISOString();
  const rows = await sql<{ count: number }>`
    insert into rate_limit_counters (key, window_start, count)
    values (${key}, ${start}, 1)
    on conflict (key, window_start) do update set count = rate_limit_counters.count + 1
    returning count
  `;
  const count = rows[0]?.count ?? 1;
  if (count === 1) {
    // A new window just opened for this key: drop windows older than a day.
    await sql`delete from rate_limit_counters where window_start < ${new Date(now.getTime() - 86_400_000).toISOString()}`;
  }
  return { allowed: count <= limit, count };
}

/** Normalise the email part of a key: trimmed, lower-case, bounded. */
export function normaliseEmail(email: string | null | undefined): string | null {
  const e = email?.trim().toLowerCase();
  return e ? e.slice(0, 254) : null;
}

/**
 * Count one attempt against both rules. Both counters always advance, so an
 * attacker cannot avoid the per-IP counter by rotating email addresses.
 */
export async function consumeTeamLimits(
  sql: Sql,
  scope: LimitScope,
  who: { email: string | null; ip: string },
  now: Date = new Date(),
): Promise<{ allowed: boolean }> {
  const perIp = await consume(sql, `${scope}:ip:${who.ip}`, PER_IP, SIGN_IN_WINDOW_MS, now);
  let perPair = { allowed: true };
  const email = normaliseEmail(who.email);
  if (email) perPair = await consume(sql, `${scope}:email-ip:${email}|${who.ip}`, PER_EMAIL_AND_IP, SIGN_IN_WINDOW_MS, now);
  return { allowed: perIp.allowed && perPair.allowed };
}
