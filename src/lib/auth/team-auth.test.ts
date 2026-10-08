import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import { betterAuth } from "better-auth";
import { pgliteDialect } from "@/lib/auth/pglite-dialect";
import {
  BAD_CODE_ERROR,
  GENERIC_SIGN_IN_ERROR,
  RATE_LIMITED_ERROR,
  TEAM_SESSION_SECONDS,
  teamAuthOptions,
} from "@/lib/auth/team-auth";
import { createTestDb, insertUser, type TestDb } from "@/lib/server/testing/test-db";
import { totpFromUri } from "@/lib/server/testing/totp";

const SECRET = "test-secret-for-team-auth-0123456789abcdef";
const PASSWORD = "correct horse battery staple";

type Sent = { to: string; subject: string; text: string };

function buildAuth(db: TestDb, sent: Sent[], allowedBootstrap: string | null = null) {
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

type Auth = ReturnType<typeof buildAuth>;

function headersFor(ip: string, cookie?: string): Headers {
  const h = new Headers({ "x-forwarded-for": ip, "user-agent": "team-auth-test" });
  if (cookie) h.set("cookie", cookie);
  return h;
}

/** Merge Set-Cookie headers into a Cookie header value (latest wins, deleted ones dropped). */
function cookieJar(previous: string | undefined, response: Headers): string {
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

function errorMessage(err: unknown): string {
  const e = err as { body?: { message?: string }; message?: string };
  return e.body?.message ?? e.message ?? String(err);
}

function statusOf(err: unknown): number | undefined {
  return (err as { statusCode?: number }).statusCode;
}

/** Create a team member the way the admin will: user row, staff profile, then the emailed link. */
async function inviteMember(auth: Auth, db: TestDb, sent: Sent[], id: string, role = "CONTENT_MANAGER") {
  await insertUser(db.sql, id);
  await db.sql`update "user" set "emailVerified" = false where id = ${id}`;
  await db.sql`insert into staff_profiles (user_id, role) values (${id}, ${role})`;
  await auth.api.requestPasswordReset({ body: { email: `${id}@example.test`, redirectTo: "/team/reset-password" } });
  const mail = [...sent].reverse().find((m) => m.to === `${id}@example.test`);
  assert.ok(mail, "an invitation email was sent");
  const token = /reset-password\/([^?\s]+)/.exec(mail.text)?.[1];
  assert.ok(token, "the email holds a reset link");
  await auth.api.resetPassword({ body: { newPassword: PASSWORD, token } });
  return { email: `${id}@example.test`, mail };
}

async function signIn(auth: Auth, email: string, password: string, ip = "198.51.100.1", cookie?: string) {
  const { headers, response } = await auth.api.signInEmail({
    body: { email, password },
    headers: headersFor(ip, cookie),
    returnHeaders: true,
  });
  return { response: response as Record<string, unknown>, cookie: cookieJar(cookie, headers) };
}

/** Sign in and finish enrolment; returns the authenticator URI and the recovery codes. */
async function enrol(auth: Auth, email: string) {
  const first = await signIn(auth, email, PASSWORD);
  assert.ok(first.response.token, "an unenrolled member gets a session to enrol with");
  const enabled = (await auth.api.enableTwoFactor({
    body: { password: PASSWORD },
    headers: headersFor("198.51.100.1", first.cookie),
  })) as { totpURI: string; backupCodes: string[] };
  const verified = await auth.api.verifyTOTP({
    body: { code: totpFromUri(enabled.totpURI) },
    headers: headersFor("198.51.100.1", first.cookie),
    returnHeaders: true,
  });
  return { ...enabled, cookie: cookieJar(first.cookie, verified.headers) };
}

describe("team sign-in (A3)", () => {
  let db: TestDb;
  let sent: Sent[];
  let auth: Auth;

  before(async () => {
    db = await createTestDb();
  });
  after(async () => {
    await db.close();
  });
  beforeEach(async () => {
    sent = [];
    auth = buildAuth(db, sent);
    await db.sql`delete from rate_limit_counters`;
  });

  it("refuses public sign-up", async () => {
    await assert.rejects(
      auth.api.signUpEmail({ body: { email: "new@example.test", password: PASSWORD, name: "New" } }),
      (e) => statusOf(e) !== undefined && statusOf(e)! >= 400,
    );
    const rows = await db.sql`select id from "user" where email = 'new@example.test'`;
    assert.equal(rows.length, 0);
  });

  it("an invited member sets a password from the emailed link, which also verifies the email", async () => {
    const { mail } = await inviteMember(auth, db, sent, "inv1");
    assert.match(mail.subject, /Set your password/);
    const row = await db.sql<{ v: boolean }>`select "emailVerified" as v from "user" where id = 'inv1'`;
    assert.equal(row[0].v, true);
    const account = await db.sql`select id from "account" where "userId" = 'inv1' and "providerId" = 'credential'`;
    assert.equal(account.length, 1);
  });

  it("requires TOTP after enrolment; the authenticator code signs in", async () => {
    const { email } = await inviteMember(auth, db, sent, "tot1");
    const { totpURI } = await enrol(auth, email);
    assert.match(totpURI, /^otpauth:\/\/totp\/Tourism%20Is%20Life:tot1%40example\.test\?/);
    const first = await signIn(auth, email, PASSWORD);
    assert.equal(first.response.twoFactorRedirect, true);
    assert.equal(first.response.token, undefined, "no session before the second step");
    const verified = (await auth.api.verifyTOTP({
      body: { code: totpFromUri(totpURI) },
      headers: headersFor("198.51.100.1", first.cookie),
    })) as { token?: string };
    assert.ok(verified.token, "the code completes sign-in");
  });

  it("a wrong code is refused with a plain message", async () => {
    const { email } = await inviteMember(auth, db, sent, "tot2");
    const { totpURI } = await enrol(auth, email);
    const first = await signIn(auth, email, PASSWORD);
    const wrong = totpFromUri(totpURI) === "000000" ? "111111" : "000000";
    await assert.rejects(
      auth.api.verifyTOTP({ body: { code: wrong }, headers: headersFor("198.51.100.1", first.cookie) }),
      (e) => errorMessage(e) === BAD_CODE_ERROR,
    );
  });

  it("stores recovery codes hashed; a code works once", async () => {
    const { email } = await inviteMember(auth, db, sent, "rc1");
    const { backupCodes } = await enrol(auth, email);
    assert.equal(backupCodes.length, 10);
    const stored = await db.sql<{ codes: string }>`
      select "backupCodes" as codes from "twoFactor" where "userId" = 'rc1'
    `;
    for (const code of backupCodes) assert.ok(!stored[0].codes.includes(code), "a plain code is stored");
    assert.ok(stored[0].codes.includes("h1:"), "codes are stored as hashes");

    const first = await signIn(auth, email, PASSWORD);
    const ok = (await auth.api.verifyBackupCode({
      body: { code: backupCodes[0] },
      headers: headersFor("198.51.100.1", first.cookie),
    })) as { token?: string };
    assert.ok(ok.token);

    const again = await signIn(auth, email, PASSWORD);
    await assert.rejects(
      auth.api.verifyBackupCode({ body: { code: backupCodes[0] }, headers: headersFor("198.51.100.1", again.cookie) }),
      (e) => errorMessage(e) === BAD_CODE_ERROR,
    );
    // A different unused code still works, typed without the dash.
    const third = await signIn(auth, email, PASSWORD);
    const ok2 = (await auth.api.verifyBackupCode({
      body: { code: backupCodes[1].replace("-", "") },
      headers: headersFor("198.51.100.1", third.cookie),
    })) as { token?: string };
    assert.ok(ok2.token);
  });

  it("members cannot switch two-factor off or re-enrol over it", async () => {
    const { email } = await inviteMember(auth, db, sent, "off1");
    const { cookie } = await enrol(auth, email);
    await assert.rejects(
      auth.api.disableTwoFactor({ body: { password: PASSWORD }, headers: headersFor("198.51.100.1", cookie) }),
      (e) => statusOf(e) === 403,
    );
    await assert.rejects(
      auth.api.enableTwoFactor({ body: { password: PASSWORD }, headers: headersFor("198.51.100.1", cookie) }),
      (e) => statusOf(e) === 403,
    );
  });

  it("gives one message for an unknown email and a wrong password, and logs both", async () => {
    await inviteMember(auth, db, sent, "msg1");
    await assert.rejects(signIn(auth, "nobody@example.test", PASSWORD, "198.51.100.9"), (e) => errorMessage(e) === GENERIC_SIGN_IN_ERROR);
    await assert.rejects(signIn(auth, "msg1@example.test", "wrong password here", "198.51.100.9"), (e) => errorMessage(e) === GENERIC_SIGN_IN_ERROR);
    const log = await db.sql<{ email: string; outcome: string }>`
      select email, outcome from sign_in_attempts where ip = '198.51.100.9' order by created_at
    `;
    assert.deepEqual(log, [
      { email: "nobody@example.test", outcome: "bad-credentials" },
      { email: "msg1@example.test", outcome: "bad-credentials" },
    ]);
  });

  it("refuses the 6th attempt per email and IP in 15 minutes, with the same message for good and bad passwords", async () => {
    const { email } = await inviteMember(auth, db, sent, "rl1");
    for (let i = 0; i < 5; i += 1) {
      await assert.rejects(signIn(auth, email, "not the password", "203.0.113.5"));
    }
    await assert.rejects(signIn(auth, email, PASSWORD, "203.0.113.5"), (e) => errorMessage(e) === RATE_LIMITED_ERROR && statusOf(e) === 429);
    // Another IP is not blocked by this email's counter.
    const elsewhere = await signIn(auth, email, PASSWORD, "203.0.113.6");
    assert.ok(elsewhere.response.token);
    const limited = await db.sql`select id from sign_in_attempts where outcome = 'rate-limited' and email = ${email}`;
    assert.equal(limited.length, 1);
  });

  it("refuses the 21st attempt per IP in 15 minutes even across different emails", async () => {
    for (let i = 0; i < 20; i += 1) {
      await assert.rejects(signIn(auth, `spray${i}@example.test`, PASSWORD, "203.0.113.20"), (e) => errorMessage(e) === GENERIC_SIGN_IN_ERROR);
    }
    await assert.rejects(signIn(auth, "spray20@example.test", PASSWORD, "203.0.113.20"), (e) => errorMessage(e) === RATE_LIMITED_ERROR);
  });

  it("refuses a disabled account and an account that is not a team account, with the generic message", async () => {
    const { email } = await inviteMember(auth, db, sent, "dis1");
    await db.sql`update staff_profiles set status = 'disabled' where user_id = 'dis1'`;
    await assert.rejects(signIn(auth, email, PASSWORD, "198.51.100.30"), (e) => errorMessage(e) === GENERIC_SIGN_IN_ERROR);

    // A customer account with a password (from the old open sign-up).
    await insertUser(db.sql, "cust1");
    const ctx = await auth.$context;
    await ctx.internalAdapter.createAccount({
      userId: "cust1",
      providerId: "credential",
      accountId: "cust1",
      password: await ctx.password.hash(PASSWORD),
    });
    await assert.rejects(signIn(auth, "cust1@example.test", PASSWORD, "198.51.100.30"), (e) => errorMessage(e) === GENERIC_SIGN_IN_ERROR);
    const log = await db.sql<{ outcome: string }>`select outcome from sign_in_attempts where ip = '198.51.100.30' order by created_at`;
    assert.deepEqual(log.map((r) => r.outcome), ["refused", "refused"]);
  });

  it("team sessions last 12 hours and an expired one is refused", async () => {
    const { email } = await inviteMember(auth, db, sent, "ses1");
    const { cookie } = await enrol(auth, email);
    const rows = await db.sql<{ seconds: number }>`
      select extract(epoch from ("expiresAt" - "createdAt"))::int as seconds
      from "session" where "userId" = 'ses1' order by "createdAt" desc limit 1
    `;
    assert.ok(Math.abs(rows[0].seconds - TEAM_SESSION_SECONDS) <= 5, `session lasts ${rows[0].seconds} s`);
    // Twelve hours later.
    await db.sql`update "session" set "expiresAt" = now() - interval '1 second', "createdAt" = now() - interval '12 hours' where "userId" = 'ses1'`;
    const session = await auth.api.getSession({ headers: headersFor("198.51.100.1", cookie), query: { disableCookieCache: true } });
    assert.equal(session, null);
  });

  it("a password reset sends a link, sets the new password and ends every session", async () => {
    const { email } = await inviteMember(auth, db, sent, "rst1");
    await enrol(auth, email);
    const before = await db.sql`select id from "session" where "userId" = 'rst1'`;
    assert.ok(before.length > 0);
    await auth.api.requestPasswordReset({ body: { email, redirectTo: "/team/reset-password" }, headers: headersFor("198.51.100.40") });
    const mail = [...sent].reverse().find((m) => m.to === email);
    assert.ok(mail && /Reset your Tourism Is Life team password/.test(mail.subject));
    const token = /reset-password\/([^?\s]+)/.exec(mail.text)?.[1];
    await auth.api.resetPassword({ body: { newPassword: "a brand new long password", token } });
    const afterReset = await db.sql`select id from "session" where "userId" = 'rst1'`;
    assert.equal(afterReset.length, 0);
    const again = await signIn(auth, email, "a brand new long password", "198.51.100.41");
    assert.equal(again.response.twoFactorRedirect, true);
    await assert.rejects(signIn(auth, email, PASSWORD, "198.51.100.42"), (e) => errorMessage(e) === GENERIC_SIGN_IN_ERROR);
  });

  it("sends no reset email to an address that is not a team account, with the same response", async () => {
    await insertUser(db.sql, "cust2");
    const res = (await auth.api.requestPasswordReset({ body: { email: "cust2@example.test" } })) as { status: boolean };
    const unknown = (await auth.api.requestPasswordReset({ body: { email: "ghost@example.test" } })) as { status: boolean };
    assert.equal(res.status, true);
    assert.equal(unknown.status, true);
    assert.equal(sent.filter((m) => m.to === "cust2@example.test" || m.to === "ghost@example.test").length, 0);
  });

  it("lets the owner sign in before the claim only with a verified bootstrap address", async () => {
    const fresh = await createTestDb();
    try {
      const mails: Sent[] = [];
      const ownerAuth = buildAuth(fresh, mails, "owner@example.test");
      await insertUser(fresh.sql, "owner");
      await fresh.sql`update "user" set "emailVerified" = false where id = 'owner'`;
      // First-time setup: the owner gets a set-password link, which verifies the address.
      await ownerAuth.api.requestPasswordReset({ body: { email: "owner@example.test" } });
      const token = /reset-password\/([^?\s]+)/.exec(mails[0].text)?.[1];
      await ownerAuth.api.resetPassword({ body: { newPassword: PASSWORD, token } });
      const ok = await signIn(ownerAuth, "owner@example.test", PASSWORD);
      assert.ok(ok.response.token, "the owner can sign in to make the claim");
      // Another address cannot, even with a password.
      await insertUser(fresh.sql, "intruder");
      const ctx = await ownerAuth.$context;
      await ctx.internalAdapter.createAccount({
        userId: "intruder",
        providerId: "credential",
        accountId: "intruder",
        password: await ctx.password.hash(PASSWORD),
      });
      await assert.rejects(signIn(ownerAuth, "intruder@example.test", PASSWORD), (e) => errorMessage(e) === GENERIC_SIGN_IN_ERROR);
      // Once the claim exists, the exception is closed for everyone without a profile.
      await fresh.sql`insert into bootstrap_lock (id, user_id) values (1, 'owner')`;
      await fresh.sql`insert into staff_profiles (user_id, role) values ('owner', 'SUPER_ADMIN')`;
      await fresh.sql`update staff_profiles set status = 'removed' where user_id = 'owner'`;
      await assert.rejects(signIn(ownerAuth, "owner@example.test", PASSWORD), (e) => errorMessage(e) === GENERIC_SIGN_IN_ERROR);
    } finally {
      await fresh.close();
    }
  });
});
