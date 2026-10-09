/**
 * The real Better Auth, configured with the team rules, on an in-memory PGLite
 * database. Shared by the sign-in tests (A3) and the team account tests (A5).
 */
import assert from "node:assert/strict";
import { betterAuth } from "better-auth";
import { pgliteDialect } from "@/lib/auth/pglite-dialect";
import { teamAuthOptions } from "@/lib/auth/team-auth";
import type { TestDb } from "@/lib/server/testing/test-db";
import { totpFromUri } from "@/lib/server/testing/totp";

export const SECRET = "test-secret-for-team-auth-0123456789abcdef";
export const PASSWORD = "correct horse battery staple";

export type Sent = { to: string; subject: string; text: string };

export function buildAuth(db: TestDb, sent: Sent[], allowedBootstrap: string | null = null) {
  const team = teamAuthOptions({
    getSql: async () => db.sql,
    sendEmail: async (m) => {
      sent.push({ to: m.to, subject: m.subject, text: m.text });
      return { sent: true };
    },
    secret: SECRET,
    bootstrapEmailAllowed: (email) => Boolean(allowedBootstrap && email?.toLowerCase() === allowedBootstrap),
  });
  return betterAuth({
    baseURL: "http://localhost:3000",
    secret: SECRET,
    database: { dialect: pgliteDialect(() => db.pg), type: "postgres" },
    emailAndPassword: team.emailAndPassword,
    session: team.session,
    databaseHooks: team.databaseHooks,
    hooks: team.hooks,
    plugins: [team.twoFactorPlugin],
    rateLimit: { enabled: false },
  });
}

export type Auth = ReturnType<typeof buildAuth>;

export function headersFor(ip: string, cookie?: string): Headers {
  const h = new Headers({ "x-forwarded-for": ip, "user-agent": "team-auth-test" });
  if (cookie) h.set("cookie", cookie);
  return h;
}

/** Merge Set-Cookie headers into a Cookie header value (latest wins, deleted ones dropped). */
export function cookieJar(previous: string | undefined, response: Headers): string {
  const jar = new Map<string, string>();
  for (const part of (previous ?? "").split("; ").filter(Boolean)) {
    const i = part.indexOf("=");
    jar.set(part.slice(0, i), part.slice(i + 1));
  }
  for (const set of response.getSetCookie()) {
    const [pair, ...attrs] = set.split(";");
    const i = pair.indexOf("=");
    const name = pair.slice(0, i).trim();
    const value = pair.slice(i + 1).trim();
    const expired = attrs.some((a) => /max-age=0/i.test(a)) || value === "";
    if (expired) jar.delete(name);
    else jar.set(name, value);
  }
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

export function errorMessage(err: unknown): string {
  const e = err as { body?: { message?: string }; message?: string };
  return e.body?.message ?? e.message ?? String(err);
}

export function statusOf(err: unknown): number | undefined {
  return (err as { statusCode?: number }).statusCode;
}

export async function signIn(auth: Auth, email: string, password: string, ip = "198.51.100.1", cookie?: string) {
  const { headers, response } = await auth.api.signInEmail({
    body: { email, password },
    headers: headersFor(ip, cookie),
    returnHeaders: true,
  });
  return { response: response as Record<string, unknown>, cookie: cookieJar(cookie, headers) };
}

/** Sign in and finish enrolment; returns the authenticator URI and the recovery codes. */
export async function enrol(auth: Auth, email: string, password = PASSWORD) {
  const first = await signIn(auth, email, password);
  assert.ok(first.response.token, "an unenrolled member gets a session to enrol with");
  const enabled = (await auth.api.enableTwoFactor({
    body: { password },
    headers: headersFor("198.51.100.1", first.cookie),
  })) as { totpURI: string; backupCodes: string[] };
  const verified = await auth.api.verifyTOTP({
    body: { code: totpFromUri(enabled.totpURI) },
    headers: headersFor("198.51.100.1", first.cookie),
    returnHeaders: true,
  });
  return { ...enabled, cookie: cookieJar(first.cookie, verified.headers) };
}
