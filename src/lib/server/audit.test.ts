import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { inTransaction } from "@/lib/sql";
import { audit } from "@/lib/server/audit";
import { listAudit } from "@/lib/server/audit-log";
import { setEnquiryStatus } from "@/lib/server/enquiries/desk";
import { changeRole, setStaffStatus } from "@/lib/server/team/staff";
import { createTestDb, insertStaff, type TestDb } from "@/lib/server/testing/test-db";
import type { Actor } from "@/lib/server/access";

type AuditRecord = { action: string; entity: string; entity_id: string; actor_id: string; actor_role: string | null; before: unknown; after: unknown };

describe("audit log (A2)", () => {
  let db: TestDb;
  let owner: Actor;
  before(async () => {
    db = await createTestDb();
    owner = { ...(await insertStaff(db.sql, "owner", "SUPER_ADMIN")), ip: "203.0.113.7" };
  });
  after(async () => {
    await db.close();
  });

  async function rowsFor(entityId: string): Promise<AuditRecord[]> {
    return db.sql<AuditRecord>`
      select action, entity, entity_id, actor_id, actor_role, before, after
      from audit_logs where entity_id = ${entityId} order by created_at, id
    `;
  }

  it("refuses UPDATE, DELETE and TRUNCATE on audit_logs", async () => {
    await inTransaction(db.sql, (tx) =>
      audit(tx, { actor: owner, action: "test.seed", entity: "test", entityId: "t1", before: null, after: { a: 1 } }),
    );
    await assert.rejects(db.sql`update audit_logs set action = 'tampered' where entity_id = 't1'`, /append-only/);
    await assert.rejects(db.sql`delete from audit_logs where entity_id = 't1'`, /append-only/);
    await assert.rejects(db.sql.query("truncate audit_logs"), /append-only/);
    const rows = await rowsFor("t1");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].action, "test.seed");
  });

  it("an audit row written in a transaction that fails is rolled back with it", async () => {
    await assert.rejects(
      inTransaction(db.sql, async (tx) => {
        await audit(tx, { actor: owner, action: "test.rollback", entity: "test", entityId: "t2" });
        throw new Error("the change failed after the audit row was written");
      }),
    );
    assert.equal((await rowsFor("t2")).length, 0);
  });

  it("a role change records who, before and after", async () => {
    await insertStaff(db.sql, "desk", "STAFF");
    await changeRole(db.sql, owner, { userId: "desk", role: "BOOKING_MANAGER" });
    const [row] = await rowsFor("desk");
    assert.equal(row.action, "staff.role");
    assert.equal(row.actor_id, "owner");
    assert.equal(row.actor_role, "SUPER_ADMIN");
    assert.deepEqual(row.before, { role: "STAFF", status: "active" });
    assert.deepEqual(row.after, { role: "BOOKING_MANAGER", status: "active" });
    const ip = await db.sql<{ ip: string }>`select ip from audit_logs where entity_id = 'desk'`;
    assert.equal(ip[0].ip, "203.0.113.7");
  });

  it("disabling records the status change and that sessions ended", async () => {
    await insertStaff(db.sql, "temp", "CONTENT_MANAGER");
    await setStaffStatus(db.sql, owner, { userId: "temp", status: "disabled" });
    const [row] = await rowsFor("temp");
    assert.equal(row.action, "staff.disabled");
    assert.deepEqual(row.before, { role: "CONTENT_MANAGER", status: "active" });
    assert.deepEqual(row.after, { role: "CONTENT_MANAGER", status: "disabled", sessionsEnded: true });
  });

  it("an enquiry status change records before and after; a missing enquiry writes nothing", async () => {
    await db.sql`
      insert into enquiries (id, type, payload, status, guest_email) values ('ENQ-T1', 'B2C', '{}', 'open', 'g@example.test')
    `;
    await setEnquiryStatus(db.sql, owner, { id: "ENQ-T1", status: "closed" });
    const [row] = await rowsFor("ENQ-T1");
    assert.equal(row.entity, "enquiries");
    assert.deepEqual(row.before, { status: "open" });
    assert.deepEqual(row.after, { status: "closed" });
    await assert.rejects(setEnquiryStatus(db.sql, owner, { id: "ENQ-NONE", status: "closed" }), (e: { status?: number }) => e.status === 404);
    assert.equal((await rowsFor("ENQ-NONE")).length, 0);
  });

  it("lists newest first, filters by area and action, and pages with a cursor", async () => {
    for (let i = 0; i < 5; i += 1) {
      await inTransaction(db.sql, (tx) => audit(tx, { actor: owner, action: "page.test", entity: "paging", entityId: `p${i}` }));
    }
    const first = await listAudit(db.sql, owner, { entity: "paging", limit: 2 });
    assert.equal(first.rows.length, 2);
    assert.ok(first.nextCursor);
    const second = await listAudit(db.sql, owner, { entity: "paging", limit: 2, cursor: first.nextCursor ?? undefined });
    const third = await listAudit(db.sql, owner, { entity: "paging", limit: 2, cursor: second.nextCursor ?? undefined });
    const ids = [...first.rows, ...second.rows, ...third.rows].map((r) => r.entity_id);
    assert.equal(new Set(ids).size, 5);
    assert.equal(third.nextCursor, null);
    const byAction = await listAudit(db.sql, owner, { action: "staff." });
    assert.ok(byAction.rows.length >= 2);
    assert.ok(byAction.rows.every((r) => r.action.startsWith("staff.")));
    assert.equal(byAction.rows[0].actor_email, "owner@example.test");
    await assert.rejects(listAudit(db.sql, owner, { cursor: "not-a-cursor" }), (e: { status?: number }) => e.status === 400);
  });
});

describe("bootstrap claim audit", () => {
  it("audits the first claim once; a repeat by the same account is a no-op; anyone else is refused", async () => {
    const { claimBootstrap } = await import("@/lib/server/team/bootstrap");
    const { insertUser } = await import("@/lib/server/testing/test-db");
    const db = await createTestDb();
    try {
      await insertUser(db.sql, "first");
      await insertUser(db.sql, "second");
      assert.equal((await claimBootstrap(db.sql, { userId: "first" })).newlyClaimed, true);
      assert.equal((await claimBootstrap(db.sql, { userId: "first" })).newlyClaimed, false);
      await assert.rejects(claimBootstrap(db.sql, { userId: "second" }), (e: { status?: number }) => e.status === 409);
      const rows = await db.sql`select id from audit_logs where action = 'staff.bootstrap'`;
      assert.equal(rows.length, 1);
      const staff = await db.sql<{ user_id: string }>`select user_id from staff_profiles`;
      assert.deepEqual(staff.map((s) => s.user_id), ["first"]);
    } finally {
      await db.close();
    }
  });
});
