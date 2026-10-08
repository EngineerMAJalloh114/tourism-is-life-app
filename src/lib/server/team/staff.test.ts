import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Sql } from "@/lib/sql";
import { createTestDb, insertStaff, insertUser, type TestDb } from "@/lib/server/testing/test-db";
import { changeRole, listTeam, loadStaffProfile, setStaffStatus, STAFF_CHANGE_LOCK_KEY } from "./staff.ts";

function rejectsWith(status: number, code?: string) {
  return (err: unknown) => {
    const e = err as { status?: number; code?: string };
    assert.equal(e.status, status, `expected HTTP ${status}, got ${e.status} (${String(err)})`);
    if (code) assert.equal(e.code, code);
    return true;
  };
}

/** Wrap an Sql so every statement text is recorded, including inside transactions. */
function recording(sql: Sql, log: string[]): Sql {
  const wrap = (inner: Sql): Sql => {
    const fn = ((strings: TemplateStringsArray, ...values: unknown[]) => {
      log.push(strings.join("?"));
      return inner(strings, ...values);
    }) as Sql;
    fn.query = (text, params) => {
      log.push(text);
      return inner.query(text, params);
    };
    fn.transaction = (cb) => inner.transaction((tx) => cb(wrap(tx)));
    return fn;
  };
  return wrap(sql);
}

describe("team accounts (SEC-6)", () => {
  let db: TestDb;
  beforeEach(async () => {
    db = await createTestDb();
  });
  afterEach(async () => {
    await db.close();
  });

  it("a SUPER_ADMIN changes another account's role and the change is audited", async () => {
    const owner = await insertStaff(db.sql, "owner", "SUPER_ADMIN");
    await insertStaff(db.sql, "dev", "STAFF");
    const result = await changeRole(db.sql, owner, { userId: "dev", role: "ADMIN" });
    assert.equal(result.previousRole, "STAFF");
    assert.equal((await loadStaffProfile(db.sql, "dev"))?.role, "ADMIN");
    const audit = await db.sql<{ action: string; actor_id: string }>`select action, actor_id from audit_logs where entity_id = 'dev'`;
    assert.deepEqual(audit, [{ action: "staff.role", actor_id: "owner" }]);
  });

  it("a plain account cannot be given a role directly; only createTeamAccount makes a team account", async () => {
    const owner = await insertStaff(db.sql, "owner", "SUPER_ADMIN");
    await insertUser(db.sql, "newbie");
    await assert.rejects(changeRole(db.sql, owner, { userId: "newbie", role: "CONTENT_MANAGER" }), rejectsWith(404));
    assert.equal(await loadStaffProfile(db.sql, "newbie"), null);
  });

  it("removing an account deletes its password, two-factor, sessions and open links, and is final", async () => {
    const owner = await insertStaff(db.sql, "owner", "SUPER_ADMIN");
    await insertStaff(db.sql, "desk", "STAFF");
    await db.sql`insert into "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
      values ('a1', 'desk', 'credential', 'desk', 'hash', now(), now())`;
    await db.sql`insert into "twoFactor" (id, secret, "backupCodes", "userId") values ('t1', 'secret', '[]', 'desk')`;
    await db.sql`update "user" set "twoFactorEnabled" = true where id = 'desk'`;
    await db.sql`insert into "session" (id, "expiresAt", token, "createdAt", "updatedAt", "userId")
      values ('s1', now() + interval '1 day', 't1', now(), now(), 'desk')`;
    await db.sql`insert into "verification" (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
      values ('v1', 'reset-password:abc', 'desk', now() + interval '1 hour', now(), now())`;
    await setStaffStatus(db.sql, owner, { userId: "desk", status: "removed" });
    for (const [table, column] of [["account", "userId"], ["twoFactor", "userId"], ["session", "userId"], ["verification", "value"]]) {
      const rows = await db.sql.query(`select 1 from "${table}" where "${column}" = $1`, ["desk"]);
      assert.equal(rows.length, 0, `${table} still has a row`);
    }
    const user = await db.sql<{ enabled: boolean }>`select "twoFactorEnabled" as enabled from "user" where id = 'desk'`;
    assert.equal(user[0].enabled, false);
    await assert.rejects(setStaffStatus(db.sql, owner, { userId: "desk", status: "active" }), rejectsWith(409, "REMOVED"));
    await assert.rejects(changeRole(db.sql, owner, { userId: "desk", role: "ADMIN" }), rejectsWith(409, "REMOVED"));
  });

  it("disabling ends open password links as well as sessions", async () => {
    const owner = await insertStaff(db.sql, "owner", "SUPER_ADMIN");
    await insertStaff(db.sql, "desk", "STAFF");
    await db.sql`insert into "verification" (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
      values ('v1', 'reset-password:abc', 'desk', now() + interval '1 hour', now(), now()),
             ('v2', 'something-else', 'desk', now() + interval '1 hour', now(), now())`;
    await setStaffStatus(db.sql, owner, { userId: "desk", status: "disabled" });
    const left = await db.sql<{ identifier: string }>`select identifier from "verification" where value = 'desk'`;
    assert.deepEqual(left.map((r) => r.identifier), ["something-else"]);
  });

  it("an ADMIN is refused (403) on every account change, including demoting a SUPER_ADMIN", async () => {
    await insertStaff(db.sql, "owner", "SUPER_ADMIN");
    await insertStaff(db.sql, "owner2", "SUPER_ADMIN");
    const admin = await insertStaff(db.sql, "dev", "ADMIN");
    await insertStaff(db.sql, "desk", "STAFF");
    await assert.rejects(changeRole(db.sql, admin, { userId: "owner", role: "STAFF" }), rejectsWith(403));
    await assert.rejects(changeRole(db.sql, admin, { userId: "desk", role: "ADMIN" }), rejectsWith(403));
    await assert.rejects(setStaffStatus(db.sql, admin, { userId: "owner", status: "disabled" }), rejectsWith(403));
    await assert.rejects(setStaffStatus(db.sql, admin, { userId: "desk", status: "removed" }), rejectsWith(403));
    assert.equal((await loadStaffProfile(db.sql, "owner"))?.role, "SUPER_ADMIN");
    assert.equal((await loadStaffProfile(db.sql, "desk"))?.status, "active");
  });

  it("every other role is refused with 403 and a signed-out caller with 401", async () => {
    await insertStaff(db.sql, "owner", "SUPER_ADMIN");
    await insertStaff(db.sql, "desk", "STAFF");
    for (const role of ["STAFF", "BOOKING_MANAGER", "CONTENT_MANAGER"] as const) {
      const actor = await insertStaff(db.sql, `as-${role}`, role);
      await assert.rejects(changeRole(db.sql, actor, { userId: "desk", role: "ADMIN" }), rejectsWith(403));
      await assert.rejects(setStaffStatus(db.sql, actor, { userId: "desk", status: "disabled" }), rejectsWith(403));
    }
    await assert.rejects(changeRole(db.sql, null, { userId: "desk", role: "ADMIN" }), rejectsWith(401));
    await assert.rejects(setStaffStatus(db.sql, null, { userId: "desk", status: "disabled" }), rejectsWith(401));
  });

  it("nobody changes their own role, or disables or removes themselves", async () => {
    const owner = await insertStaff(db.sql, "owner", "SUPER_ADMIN");
    await insertStaff(db.sql, "owner2", "SUPER_ADMIN");
    await assert.rejects(changeRole(db.sql, owner, { userId: "owner", role: "ADMIN" }), rejectsWith(409, "SELF_CHANGE"));
    await assert.rejects(setStaffStatus(db.sql, owner, { userId: "owner", status: "disabled" }), rejectsWith(409, "SELF_CHANGE"));
    await assert.rejects(setStaffStatus(db.sql, owner, { userId: "owner", status: "removed" }), rejectsWith(409, "SELF_CHANGE"));
  });

  it("the last active SUPER_ADMIN cannot be demoted, disabled or removed", async () => {
    const owner = await insertStaff(db.sql, "owner", "SUPER_ADMIN");
    await insertStaff(db.sql, "owner2", "SUPER_ADMIN");
    // With two active SUPER_ADMINs, one may be demoted.
    await changeRole(db.sql, owner, { userId: "owner2", role: "ADMIN" });
    // A disabled SUPER_ADMIN does not count as another active one.
    await insertStaff(db.sql, "dormant", "SUPER_ADMIN", "disabled");
    // Another SUPER_ADMIN session (not in the table) tries every way to remove the last one.
    const other = { userId: "other", email: null, role: "SUPER_ADMIN" as const };
    await assert.rejects(changeRole(db.sql, other, { userId: "owner", role: "ADMIN" }), rejectsWith(409, "LAST_SUPER_ADMIN"));
    await assert.rejects(setStaffStatus(db.sql, other, { userId: "owner", status: "disabled" }), rejectsWith(409, "LAST_SUPER_ADMIN"));
    await assert.rejects(setStaffStatus(db.sql, other, { userId: "owner", status: "removed" }), rejectsWith(409, "LAST_SUPER_ADMIN"));
    let active = await db.sql<{ n: number }>`select count(*)::int as n from staff_profiles where role = 'SUPER_ADMIN' and status = 'active'`;
    assert.equal(active[0].n, 1);
    // Once a second active SUPER_ADMIN exists, the first may be disabled.
    const third = await insertStaff(db.sql, "third", "SUPER_ADMIN");
    await setStaffStatus(db.sql, third, { userId: "owner", status: "disabled" });
    active = await db.sql<{ n: number }>`select count(*)::int as n from staff_profiles where role = 'SUPER_ADMIN' and status = 'active'`;
    assert.equal(active[0].n, 1);
    // And now third is the last one.
    await assert.rejects(setStaffStatus(db.sql, other, { userId: "third", status: "removed" }), rejectsWith(409, "LAST_SUPER_ADMIN"));
  });

  it("disabling an account deletes its sessions in the same transaction", async () => {
    const owner = await insertStaff(db.sql, "owner", "SUPER_ADMIN");
    await insertStaff(db.sql, "desk", "STAFF");
    await db.sql`
      insert into "session" (id, "expiresAt", token, "createdAt", "updatedAt", "userId")
      values ('s1', now() + interval '1 day', 't1', now(), now(), 'desk')
    `;
    await setStaffStatus(db.sql, owner, { userId: "desk", status: "disabled" });
    const sessions = await db.sql`select id from "session" where "userId" = 'desk'`;
    assert.equal(sessions.length, 0);
    assert.equal((await loadStaffProfile(db.sql, "desk"))?.status, "disabled");
  });

  it("a refused change leaves no audit row and changes nothing", async () => {
    const owner = await insertStaff(db.sql, "owner", "SUPER_ADMIN");
    await assert.rejects(changeRole(db.sql, owner, { userId: "owner", role: "STAFF" }));
    await assert.rejects(changeRole(db.sql, { userId: "ghost", email: null, role: "SUPER_ADMIN" }, { userId: "owner", role: "STAFF" }));
    const audit = await db.sql`select id from audit_logs`;
    assert.equal(audit.length, 0);
  });

  it("unknown accounts are 404 and unknown roles are 400", async () => {
    const owner = await insertStaff(db.sql, "owner", "SUPER_ADMIN");
    await assert.rejects(changeRole(db.sql, owner, { userId: "nobody", role: "STAFF" }), rejectsWith(404));
    await assert.rejects(setStaffStatus(db.sql, owner, { userId: "nobody", status: "disabled" }), rejectsWith(404));
    await assert.rejects(changeRole(db.sql, owner, { userId: "nobody", role: "CUSTOMER" as never }), rejectsWith(400));
  });

  it("takes the advisory lock and locks the SUPER_ADMIN rows before reading or writing", async () => {
    const owner = await insertStaff(db.sql, "owner", "SUPER_ADMIN");
    await insertStaff(db.sql, "desk", "STAFF");
    const log: string[] = [];
    await changeRole(recording(db.sql, log), owner, { userId: "desk", role: "ADMIN" });
    assert.match(log[0], /pg_advisory_xact_lock/);
    assert.match(log[1], /for update/);
    assert.equal(STAFF_CHANGE_LOCK_KEY, 7_214_001);
  });

  it("an ADMIN may view the team list; BOOKING_MANAGER and below may not", async () => {
    await insertStaff(db.sql, "owner", "SUPER_ADMIN");
    const admin = await insertStaff(db.sql, "dev", "ADMIN");
    const bm = await insertStaff(db.sql, "bm", "BOOKING_MANAGER");
    const team = await listTeam(db.sql, admin, undefined);
    assert.deepEqual(team.map((m) => m.userId), ["owner", "dev", "bm"]);
    await assert.rejects(listTeam(db.sql, bm, undefined), rejectsWith(403));
  });
});
