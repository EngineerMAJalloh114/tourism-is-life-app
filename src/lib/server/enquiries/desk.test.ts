import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { csvCell, toCsv } from "@/lib/csv";
import type { Actor } from "@/lib/server/access";
import {
  addEnquiryNote,
  assignEnquiry,
  exportEnquiries,
  getEnquiry,
  listAssignees,
  listEnquiries,
  parsePayload,
  replyLinks,
  setEnquiryStatus,
} from "@/lib/server/enquiries/desk";
import { createTestDb, insertStaff, type TestDb } from "@/lib/server/testing/test-db";

function rejectsWith(status: number, code?: string) {
  return (err: unknown) => {
    const e = err as { status?: number; code?: string };
    assert.equal(e.status, status, `expected HTTP ${status}, got ${e.status} (${String(err)})`);
    if (code) assert.equal(e.code, code);
    return true;
  };
}

describe("CSV (A12)", () => {
  it("neutralises cells a spreadsheet would run as a formula", () => {
    for (const start of ["=", "+", "-", "@", "\t", "\r"]) {
      assert.equal(csvCell(`${start}HYPERLINK("https://evil.example")`).startsWith(`"'${start}`), true, JSON.stringify(start));
    }
    assert.equal(csvCell("Plain text"), '"Plain text"');
    assert.equal(csvCell('He said "hi"'), '"He said ""hi"""');
    assert.equal(csvCell(null), '""');
    assert.equal(toCsv(["a", "b"], [["1", "=2+2"]]), '"a","b"\r\n"1","\'=2+2"\r\n');
  });
});

describe("enquiry desk (A12)", () => {
  let db: TestDb;
  let desk: Actor;
  let admin: Actor;

  beforeEach(async () => {
    db = await createTestDb();
    desk = await insertStaff(db.sql, "desk", "BOOKING_MANAGER");
    admin = await insertStaff(db.sql, "dev", "ADMIN");
  });
  afterEach(async () => {
    await db.close();
  });

  async function enquiry(id: string, minutesAgo: number, payload: Record<string, string>, type = "B2C") {
    await db.sql`
      insert into enquiries (id, type, payload, status, guest_email, guest_name, created_at)
      values (${id}, ${type}, ${JSON.stringify(payload)}, 'open', ${payload.email ?? null}, ${payload.name ?? null},
        now() - make_interval(mins => ${minutesAgo}))
    `;
  }

  it("parses the form fields and builds the reply links", async () => {
    await enquiry("ENQ-A1", 5, { name: "Aminata", email: "aminata@example.test", phone: "+232 76 000 000", message: "Two people, March", travelers: "2" });
    const d = await getEnquiry(db.sql, desk, { id: "ENQ-A1" });
    assert.deepEqual(d.fields.map((f) => f.label), ["Name", "Email", "Phone", "Message", "Travellers"]);
    assert.equal(d.status, "open");
    assert.equal(d.reply.email, "mailto:aminata@example.test?subject=Re%3A+ENQ-A1");
    assert.equal(d.reply.whatsapp, "https://wa.me/23276000000?text=Re%3A+ENQ-A1");
    assert.deepEqual(replyLinks("ENQ-X", "a@example.test", null).whatsapp, null, "no phone, no WhatsApp link");
    assert.deepEqual(replyLinks("ENQ-X", "a@example.test", "n/a").whatsapp, null);
    assert.deepEqual(parsePayload("not json"), { message: "not json" });
  });

  it("moves through New, in progress, quoted and closed, each audited", async () => {
    await enquiry("ENQ-S1", 1, { email: "s@example.test", message: "Hi" });
    for (const status of ["in_progress", "quoted", "closed", "open"] as const) await setEnquiryStatus(db.sql, desk, { id: "ENQ-S1", status });
    const audit = await db.sql<{ before: { status: string }; after: { status: string } }>`
      select before, after from audit_logs where entity_id = 'ENQ-S1' and action = 'enquiry.status' order by created_at, id
    `;
    assert.deepEqual(audit.map((a) => `${a.before.status}>${a.after.status}`), ["open>in_progress", "in_progress>quoted", "quoted>closed", "closed>open"]);
    await assert.rejects(setEnquiryStatus(db.sql, desk, { id: "ENQ-S1", status: "booked" as never }), rejectsWith(400, "BAD_STATUS"));
    await assert.rejects(db.sql`update enquiries set status = 'booked' where id = 'ENQ-S1'`, /enquiries_status_check/);
  });

  it("assigns to team members who can read enquiries, and adds append-only notes", async () => {
    await enquiry("ENQ-N1", 1, { email: "n@example.test", message: "Hello" });
    const editor = await insertStaff(db.sql, "editor", "CONTENT_MANAGER");
    const assignees = await listAssignees(db.sql, desk, undefined);
    assert.deepEqual(assignees.map((a) => a.id).sort(), ["desk", "dev"], "a content manager cannot read enquiries, so is not offered");
    await assert.rejects(assignEnquiry(db.sql, desk, { id: "ENQ-N1", assigneeId: editor.userId }), rejectsWith(400, "BAD_ASSIGNEE"));
    await assignEnquiry(db.sql, desk, { id: "ENQ-N1", assigneeId: "desk" });
    await addEnquiryNote(db.sql, desk, { id: "ENQ-N1", body: "Called back, sending options." });
    await assert.rejects(addEnquiryNote(db.sql, desk, { id: "ENQ-N1", body: "   " }), rejectsWith(400, "BAD_NOTE"));
    const d = await getEnquiry(db.sql, desk, { id: "ENQ-N1" });
    assert.equal(d.assigneeEmail, "desk@example.test");
    assert.deepEqual(d.notes.map((n) => [n.body, n.author]), [["Called back, sending options.", "desk@example.test"]]);
    const mine = await listEnquiries(db.sql, desk, { assignee: "me" });
    assert.deepEqual(mine.rows.map((r) => r.id), ["ENQ-N1"]);
    assert.equal((await listEnquiries(db.sql, desk, { assignee: "none" })).rows.length, 0);
    const actions = await db.sql<{ action: string }>`select action from audit_logs where entity_id = 'ENQ-N1' order by created_at, id`;
    assert.deepEqual(actions.map((a) => a.action), ["enquiry.assign", "enquiry.note"]);
  });

  it("searches and filters", async () => {
    await enquiry("ENQ-F1", 3, { name: "Kadiatu", email: "kadiatu@example.test", message: "Tiwai Island in April" });
    await enquiry("ENQ-F2", 2, { company: "Lines", contact: "Omar", email: "omar@example.test", message: "Partner rates" }, "B2B");
    await enquiry("ENQ-F3", 1, { email: "ship@example.test", ship: "MV Example", message: "Call in May" }, "CRUISE");
    await setEnquiryStatus(db.sql, desk, { id: "ENQ-F3", status: "quoted" });
    const ids = async (f: Parameters<typeof listEnquiries>[2]) => (await listEnquiries(db.sql, desk, f)).rows.map((r) => r.id);
    assert.deepEqual(await ids({ q: "tiwai" }), ["ENQ-F1"], "message text");
    assert.deepEqual(await ids({ q: "OMAR@" }), ["ENQ-F2"], "email, any case");
    assert.deepEqual(await ids({ q: "enq-f3" }), ["ENQ-F3"], "reference");
    assert.deepEqual(await ids({ type: "B2B" }), ["ENQ-F2"]);
    assert.deepEqual(await ids({ status: "quoted" }), ["ENQ-F3"]);
    assert.deepEqual(await ids({ status: "open" }), ["ENQ-F2", "ENQ-F1"]);
    assert.deepEqual(await ids({ q: "%" }), [], "a % is searched for, not treated as a wildcard");
  });

  it("pages newest first with a keyset cursor that stays stable when new enquiries arrive", async () => {
    for (let i = 1; i <= 7; i++) await enquiry(`ENQ-P${i}`, 100 - i, { email: `p${i}@example.test`, message: `m${i}` });
    const first = await listEnquiries(db.sql, desk, { limit: 3 });
    assert.deepEqual(first.rows.map((r) => r.id), ["ENQ-P7", "ENQ-P6", "ENQ-P5"]);
    await enquiry("ENQ-NEW", 0, { email: "new@example.test", message: "arrived meanwhile" });
    const second = await listEnquiries(db.sql, desk, { limit: 3, cursor: first.nextCursor! });
    assert.deepEqual(second.rows.map((r) => r.id), ["ENQ-P4", "ENQ-P3", "ENQ-P2"]);
    const third = await listEnquiries(db.sql, desk, { limit: 3, cursor: second.nextCursor! });
    assert.deepEqual(third.rows.map((r) => r.id), ["ENQ-P1"]);
    assert.equal(third.nextCursor, null);
    await assert.rejects(listEnquiries(db.sql, desk, { cursor: "bm90IGEgY3Vyc29y" }), rejectsWith(400, "BAD_CURSOR"));
  });

  it("exports formula-safe CSV, audited with the filters and count only", async () => {
    await enquiry("ENQ-X1", 2, { name: "=cmd()", email: "x@example.test", phone: "+232 79 000 000", message: "@SUM(A1:A9)", dates: "-5 days" });
    await enquiry("ENQ-X2", 1, { name: "Plain", email: "y@example.test", message: "Hello" }, "B2B");
    const out = await exportEnquiries(db.sql, admin, { type: "B2C" });
    assert.equal(out.count, 1);
    const [header, row] = out.csv.trimEnd().split("\r\n");
    assert.match(header, /^"Reference","Received","Type","Status","Name","Email","Phone"/);
    assert.match(row, /"'=cmd\(\)"/);
    assert.match(row, /"'@SUM\(A1:A9\)"/);
    assert.match(row, /"Dates: -5 days"/, "a later cell may contain a minus; only a leading one is neutralised");
    assert.doesNotMatch(out.csv, /(^|,)"[=+\-@]/m);
    const [audit] = await db.sql<{ actor_id: string; after: { filters: { type: string }; count: number } }>`
      select actor_id, after from audit_logs where action = 'enquiry.export'
    `;
    assert.equal(audit.actor_id, "dev");
    assert.deepEqual(audit.after, { filters: { q: null, status: null, type: "B2C", assignee: null }, count: 1 });
    assert.doesNotMatch(JSON.stringify(audit.after), /example\.test/, "the audit row holds no personal data");
  });

  it("CONTENT_MANAGER and STAFF get 403 on every personal-data endpoint; BOOKING_MANAGER cannot export", async () => {
    await enquiry("ENQ-C1", 1, { email: "c@example.test", message: "Hi" });
    for (const role of ["CONTENT_MANAGER", "STAFF"] as const) {
      const actor = await insertStaff(db.sql, `as-${role}`, role);
      await assert.rejects(listEnquiries(db.sql, actor, undefined), rejectsWith(403));
      await assert.rejects(getEnquiry(db.sql, actor, { id: "ENQ-C1" }), rejectsWith(403));
      await assert.rejects(listAssignees(db.sql, actor, undefined), rejectsWith(403));
      await assert.rejects(exportEnquiries(db.sql, actor, undefined), rejectsWith(403));
      await assert.rejects(setEnquiryStatus(db.sql, actor, { id: "ENQ-C1", status: "closed" }), rejectsWith(403));
      await assert.rejects(assignEnquiry(db.sql, actor, { id: "ENQ-C1", assigneeId: null }), rejectsWith(403));
      await assert.rejects(addEnquiryNote(db.sql, actor, { id: "ENQ-C1", body: "x" }), rejectsWith(403));
    }
    await assert.rejects(exportEnquiries(db.sql, desk, undefined), rejectsWith(403));
  });
});
