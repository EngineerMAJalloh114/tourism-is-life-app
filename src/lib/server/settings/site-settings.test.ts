import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, it } from "node:test";
import { DEFAULT_SETTINGS } from "@/content/defaults/settings";
import { parseSettings, type SiteSettings } from "@/lib/settings/schema";
import { ENQUIRY_TEAM_EMAILS } from "@/lib/site";
import type { Sql } from "@/lib/sql";
import type { Actor } from "@/lib/server/access";
import {
  enquiryRecipients,
  getSiteSettings,
  KEEP_VERSIONS,
  publishSiteSettings,
  restoreSiteSettingsVersion,
  saveSiteSettingsDraft,
} from "@/lib/server/settings/site-settings";
import { createTestDb, insertStaff, type TestDb } from "@/lib/server/testing/test-db";
import { notifyEnquiryTeam } from "@/services/notify";
import { seedBlocks } from "../../../../scripts/content/generate-seed.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");

function rejectsWith(status: number, code?: string) {
  return (err: unknown) => {
    const e = err as { status?: number; code?: string };
    assert.equal(e.status, status, `expected HTTP ${status}, got ${e.status} (${String(err)})`);
    if (code) assert.equal(e.code, code);
    return true;
  };
}

const clone = (s: SiteSettings): SiteSettings => JSON.parse(JSON.stringify(s));

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.name === "node_modules" || e.name.startsWith(".") ? [] : e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
}

describe("site settings seed (0009)", () => {
  it("is exactly what the generator makes from the code constants", async () => {
    for (const seed of await seedBlocks()) {
      const text = readFileSync(seed.file, "utf8").replace(/\r\n/g, "\n");
      assert.equal(text.slice(text.indexOf(seed.begin), text.indexOf(seed.end) + seed.end.length), seed.block, seed.file);
    }
  });

  it("seeds the approved numbers and email only, and the retired number appears nowhere", () => {
    assert.deepEqual(
      DEFAULT_SETTINGS.contact.phones.map((p) => p.number),
      ["+232 76 568 335", "+232 79 616 668"],
    );
    assert.equal(DEFAULT_SETTINGS.contact.email, "info@tourismislife.com");
    const files = [...walk(join(ROOT, "src")), ...walk(join(ROOT, "migrations")), ...walk(join(ROOT, "public"))].filter((f) =>
      /\.(ts|tsx|sql|json|txt|xml|webmanifest|html)$/.test(f),
    );
    const retired = /80[\s.-]?343[\s.-]?826/;
    // schema.ts names the number in order to refuse it.
    const allowed = ["site-settings.test.ts", join("lib", "settings", "schema.ts")];
    const offenders = files.filter((f) => !allowed.some((a) => f.endsWith(a)) && retired.test(readFileSync(f, "utf8")));
    assert.deepEqual(offenders, []);
  });
});

describe("site settings (A7)", () => {
  let db: TestDb;
  let admin: Actor;

  beforeEach(async () => {
    db = await createTestDb();
    admin = await insertStaff(db.sql, "dev", "ADMIN");
  });
  afterEach(async () => {
    await db.close();
  });

  it("starts with the defaults as both the draft and published version 1", async () => {
    const view = await getSiteSettings(db.sql, admin, undefined);
    assert.deepEqual(view.draft, DEFAULT_SETTINGS);
    assert.deepEqual(view.published, DEFAULT_SETTINGS);
    assert.equal(view.publishedVersion, 1);
    assert.equal(view.draftDiffers, false);
    assert.deepEqual(parseSettings(view.draft), DEFAULT_SETTINGS);
  });

  it("running the seed twice changes nothing", async () => {
    const before = await db.sql`select * from site_settings_versions`;
    const migration = readFileSync(join(ROOT, "migrations", "0009_site_settings.sql"), "utf8");
    await db.pg.exec(migration);
    assert.deepEqual(await db.sql`select * from site_settings_versions`, before);
    assert.equal((await db.sql`select 1 from site_settings`).length, 1);
  });

  it("saves a draft with the loaded rev, audits it, and refuses a stale rev", async () => {
    const view = await getSiteSettings(db.sql, admin, undefined);
    const next = clone(view.draft);
    next.business.tagline = "Sierra Leone, planned by people who live here";
    const saved = await saveSiteSettingsDraft(db.sql, admin, { rev: view.rev, data: next });
    assert.equal(saved.rev, view.rev + 1);
    await assert.rejects(saveSiteSettingsDraft(db.sql, admin, { rev: view.rev, data: next }), rejectsWith(409, "STALE"));
    const audit = await db.sql<{ action: string; before: SiteSettings; after: SiteSettings }>`select action, before, after from audit_logs`;
    assert.equal(audit[0].action, "settings.save");
    assert.equal(audit[0].before.business.tagline, DEFAULT_SETTINGS.business.tagline);
    assert.equal(audit[0].after.business.tagline, next.business.tagline);
    // Saving does not publish.
    assert.deepEqual((await getSiteSettings(db.sql, admin, undefined)).published, DEFAULT_SETTINGS);
  });

  it("refuses an invalid email, phone or link, and the retired number anywhere", async () => {
    const { rev } = await getSiteSettings(db.sql, admin, undefined);
    const cases: [string, (s: SiteSettings) => void][] = [
      ["email", (s) => (s.contact.email = "not-an-email")],
      ["recipient", (s) => (s.enquiryRecipients = ["info@tourismislife.com", "nope"])],
      ["phone without country code", (s) => (s.contact.phones[0].number = "079 616 668")],
      ["http link", (s) => (s.business.website = "http://tourismislife.com")],
      ["javascript link", (s) => (s.social[0].url = "javascript:alert(1)")],
      ["policy link", (s) => (s.documents.sustainabilityPolicyUrl = "ftp://example.com/policy.pdf")],
      ["retired number as a phone", (s) => (s.contact.phones[1].number = "+232 80 343 826")],
      ["retired number in text", (s) => (s.contact.emergencyNote = "Call 080343826 at night")],
      ["shown social account without a link", (s) => (s.social[4].enabled = true)],
      ["duplicate recipient", (s) => (s.enquiryRecipients = ["info@tourismislife.com", "INFO@tourismislife.com"])],
      ["no recipients", (s) => (s.enquiryRecipients = [])],
      ["unknown field", (s) => ((s as unknown as Record<string, unknown>).extra = 1)],
    ];
    for (const [name, mutate] of cases) {
      const data = clone(DEFAULT_SETTINGS);
      mutate(data);
      await assert.rejects(saveSiteSettingsDraft(db.sql, admin, { rev, data }), rejectsWith(400, "SETTINGS_INVALID"), name);
    }
    assert.equal((await db.sql`select 1 from audit_logs`).length, 0, "a refused save writes nothing");
  });

  it("publishing makes the recipients drive the enquiry notification", async () => {
    let view = await getSiteSettings(db.sql, admin, undefined);
    const next = clone(view.draft);
    next.enquiryRecipients = ["desk@tourismislife.com"];
    await saveSiteSettingsDraft(db.sql, admin, { rev: view.rev, data: next });
    assert.deepEqual(await enquiryRecipients(db.sql), { recipients: [...ENQUIRY_TEAM_EMAILS], source: "settings" }, "a draft is not live");
    view = await getSiteSettings(db.sql, admin, undefined);
    const published = await publishSiteSettings(db.sql, admin, { rev: view.rev });
    assert.equal(published.version, 2);
    assert.deepEqual(await enquiryRecipients(db.sql), { recipients: ["desk@tourismislife.com"], source: "settings" });
    const actions = await db.sql<{ action: string }>`select action from audit_logs order by created_at, id`;
    assert.deepEqual(actions.map((a) => a.action), ["settings.save", "settings.publish"]);
  });

  it("falls back to the code's list when the settings cannot be read", async () => {
    const broken = (() => Promise.reject(new Error("db down"))) as unknown as Sql;
    assert.deepEqual(await enquiryRecipients(broken), { recipients: ENQUIRY_TEAM_EMAILS, source: "code" });
  });

  it("restoring publishes an older version again as a new one", async () => {
    let view = await getSiteSettings(db.sql, admin, undefined);
    const next = clone(view.draft);
    next.business.tagline = "Changed";
    await saveSiteSettingsDraft(db.sql, admin, { rev: view.rev, data: next });
    view = await getSiteSettings(db.sql, admin, undefined);
    await publishSiteSettings(db.sql, admin, { rev: view.rev });
    view = await getSiteSettings(db.sql, admin, undefined);
    const v1 = view.versions.find((v) => v.version === 1)!;
    const restored = await restoreSiteSettingsVersion(db.sql, admin, { rev: view.rev, versionId: v1.id });
    assert.equal(restored.version, 3);
    view = await getSiteSettings(db.sql, admin, undefined);
    assert.deepEqual(view.published, DEFAULT_SETTINGS);
    assert.deepEqual(view.draft, DEFAULT_SETTINGS);
    assert.equal(view.versions.find((v) => v.current)?.restoredFrom, v1.id);
  });

  it(`keeps the newest ${KEEP_VERSIONS} versions`, async () => {
    for (let i = 0; i < KEEP_VERSIONS + 3; i++) {
      const view = await getSiteSettings(db.sql, admin, undefined);
      await publishSiteSettings(db.sql, admin, { rev: view.rev });
    }
    const view = await getSiteSettings(db.sql, admin, undefined);
    assert.equal(view.versions.length, KEEP_VERSIONS);
    assert.ok(view.versions[0].current);
    assert.equal(view.versions.at(-1)!.version, KEEP_VERSIONS + 4 - KEEP_VERSIONS + 1);
  });

  it("is refused below ADMIN", async () => {
    const { rev } = await getSiteSettings(db.sql, admin, undefined);
    for (const role of ["STAFF", "BOOKING_MANAGER", "CONTENT_MANAGER"] as const) {
      const actor = await insertStaff(db.sql, `as-${role}`, role);
      await assert.rejects(getSiteSettings(db.sql, actor, undefined), rejectsWith(403));
      await assert.rejects(saveSiteSettingsDraft(db.sql, actor, { rev, data: DEFAULT_SETTINGS }), rejectsWith(403));
      await assert.rejects(publishSiteSettings(db.sql, actor, { rev }), rejectsWith(403));
      await assert.rejects(restoreSiteSettingsVersion(db.sql, actor, { rev, versionId: "ssv_seed" }), rejectsWith(403));
    }
  });
});

describe("enquiry notification recipients (mocked Resend)", () => {
  const ORIGINAL_FETCH = globalThis.fetch;
  const ORIGINAL_KEY = process.env.RESEND_API_KEY;
  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
    if (ORIGINAL_KEY === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = ORIGINAL_KEY;
  });

  async function sentTo(recipients?: readonly string[]) {
    process.env.RESEND_API_KEY = "re_test_key";
    let body: { to?: string[] } = {};
    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      body = JSON.parse(String(init?.body));
      return Response.json({ id: "email_1" });
    }) as unknown as typeof fetch;
    await notifyEnquiryTeam({ ref: "ENQ-1", type: "B2C", email: "visitor@example.com", payload: { message: "Hello" }, recipients });
    return body.to;
  }

  it("sends to the published list when given one", async () => {
    assert.deepEqual(await sentTo(["desk@tourismislife.com", "ops@tourismislife.com"]), ["desk@tourismislife.com", "ops@tourismislife.com"]);
  });

  it("sends to ENQUIRY_TEAM_EMAILS without one", async () => {
    assert.deepEqual(await sentTo(undefined), [...ENQUIRY_TEAM_EMAILS]);
    assert.deepEqual(await sentTo([]), [...ENQUIRY_TEAM_EMAILS]);
  });
});
