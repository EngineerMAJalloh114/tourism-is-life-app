import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { GENERIC_SIGN_IN_ERROR } from "@/lib/auth/team-auth";
import { passwordLinkSender, type PasswordLinkKind, type PasswordLinks } from "@/lib/auth/team-links";
import type { Actor } from "@/lib/server/access";
import { createTeamAccount, resetTwoFactor, sendPasswordLink } from "@/lib/server/team/accounts";
import { loadStaffProfile, setStaffStatus } from "@/lib/server/team/staff";
import { createTestDb, insertStaff, insertUser, type TestDb } from "@/lib/server/testing/test-db";
import {
  buildAuth,
  enrol,
  errorMessage,
  headersFor,
  PASSWORD,
  signIn,
  type Auth,
  type Sent,
} from "@/lib/server/testing/team-auth-harness";

function rejectsWith(status: number, code?: string) {
  return (err: unknown) => {
    const e = err as { status?: number; code?: string };
    assert.equal(e.status, status, `expected HTTP ${status}, got ${e.status} (${String(err)})`);
    if (code) assert.equal(e.code, code);
    return true;
  };
}

type Call = { userId: string; email: string; kind: PasswordLinkKind };

function fakeLinks(delivered = true, onSend?: (call: Call) => Promise<void>): PasswordLinks & { calls: Call[] } {
  const calls: Call[] = [];
  return {
    calls,
    async send(user, kind) {
      const call = { userId: user.id, email: user.email, kind };
      await onSend?.(call);
      calls.push(call);
      return { sent: delivered };
    },
  };
}

async function auditActions(db: TestDb, entityId: string) {
  const rows = await db.sql<{ action: string; after_data: unknown }>`
    select action, after as after_data from audit_logs where entity_id = ${entityId} order by created_at, id
  `;
  return rows.map((r) => ({ action: r.action, after: typeof r.after_data === "string" ? JSON.parse(r.after_data) : r.after_data }));
}

describe("team accounts (A5): operations", () => {
  let db: TestDb;
  let owner: Actor;
  beforeEach(async () => {
    db = await createTestDb();
    owner = await insertStaff(db.sql, "owner", "SUPER_ADMIN");
  });
  afterEach(async () => {
    await db.close();
  });

  it("a SUPER_ADMIN creates an account with no password, and the link goes out after the commit", { timeout: 15000 }, async () => {
    // A query from outside the transaction would wait forever if the email
    // were sent inside it (PGLite has one connection), so this also proves the order.
    const links = fakeLinks(true, async (call) => {
      const seen = await db.sql<{ status: string }>`select status from staff_profiles where user_id = ${call.userId}`;
      assert.equal(seen[0]?.status, "active");
    });
    const result = await createTeamAccount(db.sql, owner, { name: " Aminata ", email: " Aminata@Example.TEST ", role: "CONTENT_MANAGER" }, links);
    assert.equal(result.linkSent, true);
    assert.deepEqual(links.calls, [{ userId: result.userId, email: "aminata@example.test", kind: "invite" }]);
    const user = await db.sql<{ name: string; email: string; verified: boolean }>`
      select name, email, "emailVerified" as verified from "user" where id = ${result.userId}
    `;
    assert.deepEqual(user[0], { name: "Aminata", email: "aminata@example.test", verified: false });
    assert.equal((await db.sql`select 1 from "account" where "userId" = ${result.userId}`).length, 0);
    assert.deepEqual(await loadStaffProfile(db.sql, result.userId), {
      userId: result.userId,
      role: "CONTENT_MANAGER",
      status: "active",
    });
    const audit = await auditActions(db, result.userId);
    assert.deepEqual(audit.map((a) => a.action), ["staff.create", "staff.password_link"]);
    assert.deepEqual(audit[1].after, { kind: "invite", delivered: true });
  });

  it("an undelivered email still creates the account and says so", async () => {
    const result = await createTeamAccount(db.sql, owner, { name: "Desk", email: "desk@example.test", role: "STAFF" }, fakeLinks(false));
    assert.equal(result.linkSent, false);
    assert.equal((await loadStaffProfile(db.sql, result.userId))?.status, "active");
    const audit = await auditActions(db, result.userId);
    assert.deepEqual(audit[1].after, { kind: "invite", delivered: false });
  });

  it("refuses an address that already has an active or disabled team account, and sends nothing", async () => {
    await insertStaff(db.sql, "desk", "STAFF");
    await insertStaff(db.sql, "gone", "STAFF", "disabled");
    const links = fakeLinks();
    for (const email of ["desk@example.test", "GONE@example.test"]) {
      await assert.rejects(createTeamAccount(db.sql, owner, { name: "X", email, role: "STAFF" }, links), rejectsWith(409, "ACCOUNT_EXISTS"));
    }
    assert.equal(links.calls.length, 0);
  });

  it("takes over an old customer account only after deleting its password and sessions", async () => {
    await insertUser(db.sql, "cust", "cust@example.test", "Old name");
    await db.sql`insert into "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
      values ('a1', 'cust', 'credential', 'cust', 'someone elses hash', now(), now())`;
    await db.sql`insert into "session" (id, "expiresAt", token, "createdAt", "updatedAt", "userId")
      values ('s1', now() + interval '1 day', 't1', now(), now(), 'cust')`;
    const result = await createTeamAccount(db.sql, owner, { name: "New name", email: "cust@example.test", role: "BOOKING_MANAGER" }, fakeLinks());
    assert.equal(result.userId, "cust");
    assert.equal((await db.sql`select 1 from "account" where "userId" = 'cust'`).length, 0);
    assert.equal((await db.sql`select 1 from "session" where "userId" = 'cust'`).length, 0);
    const user = await db.sql<{ name: string; verified: boolean }>`select name, "emailVerified" as verified from "user" where id = 'cust'`;
    assert.deepEqual(user[0], { name: "New name", verified: false });
    assert.equal((await loadStaffProfile(db.sql, "cust"))?.role, "BOOKING_MANAGER");
  });

  it("invites a removed member again as a fresh account", async () => {
    await insertStaff(db.sql, "back", "ADMIN");
    await setStaffStatus(db.sql, owner, { userId: "back", status: "removed" });
    const links = fakeLinks();
    const result = await createTeamAccount(db.sql, owner, { name: "Back", email: "back@example.test", role: "STAFF" }, links);
    assert.equal(result.userId, "back");
    assert.deepEqual(await loadStaffProfile(db.sql, "back"), { userId: "back", role: "STAFF", status: "active" });
    assert.equal(links.calls[0].kind, "invite");
  });

  it("checks the name and email", async () => {
    const links = fakeLinks();
    await assert.rejects(createTeamAccount(db.sql, owner, { name: "  ", email: "a@example.test", role: "STAFF" }, links), rejectsWith(400));
    await assert.rejects(createTeamAccount(db.sql, owner, { name: "A", email: "not an email", role: "STAFF" }, links), rejectsWith(400));
    await assert.rejects(createTeamAccount(db.sql, owner, { name: "A", email: "a@example.test", role: "CUSTOMER" as never }, links), rejectsWith(400));
    assert.equal(links.calls.length, 0);
  });

  it("refuses to run without a link sender rather than create an account nobody can open", async () => {
    await assert.rejects(createTeamAccount(db.sql, owner, { name: "A", email: "a@example.test", role: "STAFF" }), rejectsWith(500, "LINKS_UNCONFIGURED"));
    assert.equal((await db.sql`select 1 from "user" where email = 'a@example.test'`).length, 0);
  });

  it("ADMIN and every lower role get 403 on create, send link and two-factor reset", async () => {
    await insertStaff(db.sql, "desk", "STAFF");
    const links = fakeLinks();
    for (const role of ["ADMIN", "CONTENT_MANAGER", "BOOKING_MANAGER", "STAFF"] as const) {
      const actor = await insertStaff(db.sql, `as-${role}`, role);
      await assert.rejects(createTeamAccount(db.sql, actor, { name: "A", email: "a@example.test", role: "STAFF" }, links), rejectsWith(403));
      await assert.rejects(sendPasswordLink(db.sql, actor, { userId: "desk" }, links), rejectsWith(403));
      await assert.rejects(resetTwoFactor(db.sql, actor, { userId: "desk" }), rejectsWith(403));
    }
    assert.equal(links.calls.length, 0);
  });

  it("nobody sends themselves a link or resets their own two-factor here", async () => {
    await assert.rejects(sendPasswordLink(db.sql, owner, { userId: "owner" }, fakeLinks()), rejectsWith(409, "SELF_CHANGE"));
    await assert.rejects(resetTwoFactor(db.sql, owner, { userId: "owner" }), rejectsWith(409, "SELF_CHANGE"));
  });

  it("sends 'set your password' before a password exists and 'reset' after; never to a disabled account", async () => {
    await insertStaff(db.sql, "desk", "STAFF");
    const links = fakeLinks();
    assert.equal((await sendPasswordLink(db.sql, owner, { userId: "desk" }, links)).kind, "invite");
    await db.sql`insert into "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
      values ('a1', 'desk', 'credential', 'desk', 'hash', now(), now())`;
    assert.equal((await sendPasswordLink(db.sql, owner, { userId: "desk" }, links)).kind, "reset");
    await setStaffStatus(db.sql, owner, { userId: "desk", status: "disabled" });
    await assert.rejects(sendPasswordLink(db.sql, owner, { userId: "desk" }, links), rejectsWith(409, "NOT_ACTIVE"));
    await assert.rejects(sendPasswordLink(db.sql, owner, { userId: "nobody" }, links), rejectsWith(404));
    assert.equal(links.calls.length, 2);
  });

  it("a two-factor reset deletes the authenticator and sessions and is audited", async () => {
    await insertStaff(db.sql, "desk", "STAFF");
    await db.sql`insert into "twoFactor" (id, secret, "backupCodes", "userId") values ('t1', 'secret', '[]', 'desk')`;
    await db.sql`update "user" set "twoFactorEnabled" = true where id = 'desk'`;
    await db.sql`insert into "session" (id, "expiresAt", token, "createdAt", "updatedAt", "userId")
      values ('s1', now() + interval '1 day', 't1', now(), now(), 'desk')`;
    await resetTwoFactor(db.sql, owner, { userId: "desk" });
    assert.equal((await db.sql`select 1 from "twoFactor" where "userId" = 'desk'`).length, 0);
    assert.equal((await db.sql`select 1 from "session" where "userId" = 'desk'`).length, 0);
    const user = await db.sql<{ enabled: boolean }>`select "twoFactorEnabled" as enabled from "user" where id = 'desk'`;
    assert.equal(user[0].enabled, false);
    const rows = await db.sql<{ before_data: unknown }>`select before as before_data from audit_logs where action = 'staff.reset_two_factor'`;
    const before = typeof rows[0].before_data === "string" ? JSON.parse(rows[0].before_data) : rows[0].before_data;
    assert.deepEqual(before, { twoFactorEnabled: true });
    await assert.rejects(resetTwoFactor(db.sql, owner, { userId: "nobody" }), rejectsWith(404));
  });
});

describe("team accounts (A5): with the real sign-in", () => {
  let db: TestDb;
  let sent: Sent[];
  let auth: Auth;
  let links: PasswordLinks;
  let owner: Actor;

  beforeEach(async () => {
    db = await createTestDb();
    sent = [];
    auth = buildAuth(db, sent);
    links = passwordLinkSender({
      context: () => auth.$context,
      authBaseURL: () => "http://localhost:3000/api/auth",
      sendEmail: async (m) => {
        sent.push({ to: m.to, subject: m.subject, text: m.text });
        return { sent: true };
      },
    });
    owner = await insertStaff(db.sql, "owner", "SUPER_ADMIN");
  });
  afterEach(async () => {
    await db.close();
  });

  /** Create a member from the desk, follow the emailed link, enrol two-factor. */
  async function onboard(email: string, role: "STAFF" | "CONTENT_MANAGER" = "STAFF") {
    const { userId, linkSent } = await createTeamAccount(db.sql, owner, { name: "Member", email, role }, links);
    assert.equal(linkSent, true);
    const mail = sent.find((m) => m.to === email);
    assert.ok(mail, "the invitation was emailed");
    assert.match(mail.subject, /Set your password/);
    // An absolute link: a relative one would not open from an email.
    const token = /^http:\/\/localhost:3000\/api\/auth\/reset-password\/([^?\s]+)\?callbackURL=%2Fteam%2Freset-password$/m.exec(
      mail.text,
    )?.[1];
    assert.ok(token, "the email holds the absolute team reset link");
    await auth.api.resetPassword({ body: { newPassword: PASSWORD, token } });
    return { userId, ...(await enrol(auth, email)) };
  }

  async function session(cookie: string) {
    return auth.api.getSession({ headers: headersFor("198.51.100.1", cookie), query: { disableCookieCache: true } });
  }

  it("the emailed link sets the password, proves the mailbox, and the member enrols two-factor", async () => {
    const { userId, cookie } = await onboard("new@example.test");
    const s = await session(cookie);
    assert.equal(s?.user.id, userId);
    assert.equal((s?.user as { twoFactorEnabled?: boolean }).twoFactorEnabled, true);
    const user = await db.sql<{ verified: boolean }>`select "emailVerified" as verified from "user" where id = ${userId}`;
    assert.equal(user[0].verified, true);
  });

  it("a disabled member's next request is signed out and they cannot sign in", async () => {
    const { userId, cookie } = await onboard("off@example.test");
    assert.ok(await session(cookie));
    await setStaffStatus(db.sql, owner, { userId, status: "disabled" });
    assert.equal(await session(cookie), null);
    await assert.rejects(signIn(auth, "off@example.test", PASSWORD), (e) => errorMessage(e) === GENERIC_SIGN_IN_ERROR);
  });

  it("after a two-factor reset the member must enrol again", async () => {
    const { userId, cookie } = await onboard("phone@example.test");
    await resetTwoFactor(db.sql, owner, { userId });
    assert.equal(await session(cookie), null, "the old session ended");
    const again = await signIn(auth, "phone@example.test", PASSWORD);
    assert.ok(again.response.token, "password alone gives an enrolment session, not the code step");
    assert.equal(again.response.twoFactorRedirect, undefined);
    const s = await session(again.cookie);
    assert.equal((s?.user as { twoFactorEnabled?: boolean }).twoFactorEnabled, false);
    // Enrolling again works (the plugin refuses re-enrolment only while two-factor is on).
    await db.sql`delete from "session" where "userId" = ${userId}`;
    const enrolled = await enrol(auth, "phone@example.test");
    assert.equal(enrolled.backupCodes.length, 10);
  });

  it("a removed member's old password no longer works", async () => {
    const { userId } = await onboard("bye@example.test");
    await setStaffStatus(db.sql, owner, { userId, status: "removed" });
    await assert.rejects(signIn(auth, "bye@example.test", PASSWORD), (e) => errorMessage(e) === GENERIC_SIGN_IN_ERROR);
    assert.equal((await db.sql`select 1 from "account" where "userId" = ${userId}`).length, 0);
  });

  it("a reset link from the desk replaces the password", async () => {
    const { userId } = await onboard("forgot@example.test");
    sent.length = 0;
    const { kind, linkSent } = await sendPasswordLink(db.sql, owner, { userId }, links);
    assert.deepEqual({ kind, linkSent }, { kind: "reset", linkSent: true });
    assert.match(sent[0].subject, /Reset your/);
    const token = /reset-password\/([^?\s]+)/.exec(sent[0].text)?.[1];
    await auth.api.resetPassword({ body: { newPassword: "a brand new long password", token: token! } });
    await assert.rejects(signIn(auth, "forgot@example.test", PASSWORD), (e) => errorMessage(e) === GENERIC_SIGN_IN_ERROR);
    const ok = await signIn(auth, "forgot@example.test", "a brand new long password");
    assert.equal(ok.response.twoFactorRedirect, true);
  });
});
