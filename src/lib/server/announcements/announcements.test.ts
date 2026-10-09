import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { Actor } from "@/lib/server/access";
import {
  activeAnnouncement,
  createAnnouncement,
  listAnnouncements,
  safeLink,
  setAnnouncementStatus,
  updateAnnouncement,
} from "@/lib/server/announcements/announcements";
import { createTestDb, insertStaff, type TestDb } from "@/lib/server/testing/test-db";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");

function rejectsWith(status: number, code?: string) {
  return (err: unknown) => {
    const e = err as { status?: number; code?: string };
    assert.equal(e.status, status, `expected HTTP ${status}, got ${e.status} (${String(err)})`);
    if (code) assert.equal(e.code, code);
    return true;
  };
}

const at = (s: string) => new Date(`2026-11-${s}:00.000Z`);

describe("announcements (A11)", () => {
  let db: TestDb;
  let editor: Actor;
  beforeEach(async () => {
    db = await createTestDb();
    editor = await insertStaff(db.sql, "editor", "CONTENT_MANAGER");
  });
  afterEach(async () => {
    await db.close();
  });

  async function published(message: string, startsAt: string, endsAt: string | null) {
    const { id } = await createAnnouncement(db.sql, editor, { message, startsAt, endsAt });
    await setAnnouncementStatus(db.sql, editor, { id, status: "published" });
    return id;
  }

  it("shows only one: published, inside its window, the latest start (fixed clock)", async () => {
    await published("Harmattan season notes", "2026-11-01T00:00:00Z", "2026-11-30T00:00:00Z");
    await published("Office closed on the 10th", "2026-11-09T00:00:00Z", "2026-11-11T00:00:00Z");
    await published("Open-ended note", "2026-11-20T00:00:00Z", null);
    const draft = await createAnnouncement(db.sql, editor, { message: "Draft only", startsAt: "2026-11-01T00:00:00Z" });
    assert.ok(draft.id);
    assert.equal(await activeAnnouncement(db.sql, at("01T00:00")).then((a) => a?.message), "Harmattan season notes");
    assert.equal(await activeAnnouncement(db.sql, at("10T12:00")).then((a) => a?.message), "Office closed on the 10th", "the latest start wins");
    assert.equal(await activeAnnouncement(db.sql, at("11T00:00")).then((a) => a?.message), "Harmattan season notes", "the end is exclusive");
    assert.equal(await activeAnnouncement(db.sql, at("25T00:00")).then((a) => a?.message), "Open-ended note");
    assert.equal(await activeAnnouncement(db.sql, new Date("2026-10-31T23:59:00Z")), null, "nothing before the first start");
  });

  it("an unpublished or archived announcement never shows", async () => {
    const id = await published("Short note", "2026-11-01T00:00:00Z", null);
    await setAnnouncementStatus(db.sql, editor, { id, status: "draft" });
    assert.equal(await activeAnnouncement(db.sql, at("05T00:00")), null);
    await setAnnouncementStatus(db.sql, editor, { id, status: "published" });
    await setAnnouncementStatus(db.sql, editor, { id, status: "archived" });
    assert.equal(await activeAnnouncement(db.sql, at("05T00:00")), null);
    await assert.rejects(setAnnouncementStatus(db.sql, editor, { id, status: "published" }), rejectsWith(409, "ARCHIVED"));
    await assert.rejects(updateAnnouncement(db.sql, editor, { id, message: "x", startsAt: "2026-11-01T00:00:00Z" }), rejectsWith(409, "ARCHIVED"));
  });

  it("keeps the message plain text of at most 200 characters, and checks links and dates", async () => {
    const { id } = await createAnnouncement(db.sql, editor, { message: "  Line one\nline <b>two</b>  ", startsAt: "2026-11-01T00:00:00Z" });
    const [row] = (await listAnnouncements(db.sql, editor, undefined)).filter((a) => a.id === id);
    assert.equal(row.message, "Line one line <b>two</b>", "stored as typed (spaces folded); the bar renders it as text");
    const base = { startsAt: "2026-11-01T00:00:00Z" };
    await assert.rejects(createAnnouncement(db.sql, editor, { ...base, message: "x".repeat(201) }), rejectsWith(400, "MESSAGE_TOO_LONG"));
    await assert.rejects(createAnnouncement(db.sql, editor, { ...base, message: "  " }), rejectsWith(400, "EMPTY_MESSAGE"));
    await assert.rejects(createAnnouncement(db.sql, editor, { ...base, message: "x", link: "javascript:alert(1)", linkLabel: "Go" }), rejectsWith(400, "BAD_LINK"));
    await assert.rejects(createAnnouncement(db.sql, editor, { ...base, message: "x", link: "//evil.example", linkLabel: "Go" }), rejectsWith(400, "BAD_LINK"));
    await assert.rejects(createAnnouncement(db.sql, editor, { ...base, message: "x", link: "/tours" }), rejectsWith(400, "LINK_LABEL"));
    await assert.rejects(createAnnouncement(db.sql, editor, { message: "x", startsAt: "2026-11-02T00:00:00Z", endsAt: "2026-11-01T00:00:00Z" }), rejectsWith(400, "BAD_END"));
    await assert.rejects(createAnnouncement(db.sql, editor, { message: "x", startsAt: "soon" }), rejectsWith(400, "BAD_START"));
    // The database refuses an unsafe link even if the checks were bypassed.
    await assert.rejects(db.sql`update announcements set link = 'javascript:alert(1)'`, /announcements_link_check/);
    for (const ok of ["", "/tours", "/contact?x=1", "https://tourismislife.com/tours"]) assert.equal(safeLink(ok), true, ok);
    for (const bad of ["http://example.org", "javascript:alert(1)", "//evil", "mailto:a@b.c", "tours"]) assert.equal(safeLink(bad), false, bad);
  });

  it("writes an audit row for every change", async () => {
    const { id } = await createAnnouncement(db.sql, editor, { message: "Hello", startsAt: "2026-11-01T00:00:00Z" });
    await updateAnnouncement(db.sql, editor, { id, message: "Hello again", startsAt: "2026-11-01T00:00:00Z" });
    await setAnnouncementStatus(db.sql, editor, { id, status: "published" });
    await setAnnouncementStatus(db.sql, editor, { id, status: "draft" });
    await setAnnouncementStatus(db.sql, editor, { id, status: "archived" });
    const rows = await db.sql<{ action: string }>`select action from audit_logs where entity_id = ${id} order by created_at, id`;
    assert.deepEqual(rows.map((r) => r.action), ["announcement.create", "announcement.update", "announcement.publish", "announcement.unpublish", "announcement.archive"]);
  });

  it("STAFF and BOOKING_MANAGER cannot edit announcements", async () => {
    for (const role of ["STAFF", "BOOKING_MANAGER"] as const) {
      const actor = await insertStaff(db.sql, `as-${role}`, role);
      await assert.rejects(listAnnouncements(db.sql, actor, undefined), rejectsWith(403));
      await assert.rejects(createAnnouncement(db.sql, actor, { message: "x", startsAt: "2026-11-01T00:00:00Z" }), rejectsWith(403));
    }
  });

  it("the bar renders the message as text, never as markup", () => {
    const source = readFileSync(join(ROOT, "src", "components", "announcement-bar.tsx"), "utf8");
    assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML/);
    assert.match(source, /<span>\{message\}<\/span>/);
  });
});
