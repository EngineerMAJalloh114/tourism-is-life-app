import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, it } from "node:test";
import { tours } from "@/data/catalog";
import { excursions } from "@/data/cruise";
import { vehicles } from "@/data/vehicle-rental";
import { addSameCurrency, formatMinor, MAX_MINOR, parseMajor, parseRating } from "@/lib/money";
import type { Actor } from "@/lib/server/access";
import { collectionItemId } from "@/lib/server/content-ids";
import { quoteForSlug } from "@/lib/server/pricing";
import {
  archiveRate,
  archiveRating,
  createRate,
  createRating,
  listRates,
  listRatings,
  publishedRates,
  publishRate,
  publishRating,
  updateRate,
  updateRating,
} from "@/lib/server/rates/rates";
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

describe("money parsing (A10)", () => {
  it("accepts major units and stores minor units exactly", () => {
    const ok: [string, number][] = [
      ["12.50", 1250],
      ["12.5", 1250],
      ["0.07", 7],
      ["1,000", 100000],
      ["1,000.5", 100050],
      [" 35 ", 3500],
      ["0", 0],
      ["007", 700],
      ["999,999,999.99", MAX_MINOR],
    ];
    for (const [text, minor] of ok) assert.deepEqual(parseMajor(text), { ok: true, minor }, text);
  });

  it("refuses negatives, three decimals, exponents, empty, junk and overflow", () => {
    for (const text of ["-1", "-0.5", "1.234", "1e3", "", "   ", "junk", "12,50", "1,00", "1.2.3", "$12", "12 USD", "1000000000", "1,000,000,000.00", "0x10", "Infinity", "NaN"]) {
      assert.equal(parseMajor(text).ok, false, `"${text}" should be refused`);
    }
  });

  it("formats from the digits", () => {
    assert.equal(formatMinor(125000, "USD"), "USD 1,250.00");
    assert.equal(formatMinor(7, "SLE"), "SLE 0.07");
    assert.equal(formatMinor(MAX_MINOR, "USD"), "USD 999,999,999.99");
    assert.throws(() => formatMinor(1.5, "USD"));
  });

  it("never adds amounts of different currencies", () => {
    assert.deepEqual(addSameCurrency({ minor: 100, currency: "USD" }, { minor: 250, currency: "USD" }), { minor: 350, currency: "USD" });
    assert.throws(() => addSameCurrency({ minor: 100, currency: "USD" }, { minor: 100, currency: "SLE" }), /Cannot add USD and SLE/);
    const source = readFileSync(join(ROOT, "src", "lib", "server", "rates", "rates.ts"), "utf8");
    assert.doesNotMatch(source, /\bsum\s*\(|minor\s*\+|\+\s*\w*[mM]inor/, "the rates module never sums amounts");
  });

  it("parses ratings to tenths", () => {
    assert.deepEqual(parseRating("4.1"), { ok: true, tenths: 41 });
    assert.deepEqual(parseRating("5"), { ok: true, tenths: 50 });
    for (const text of ["5.1", "4.12", "-1", "", "four", "10"]) assert.equal(parseRating(text).ok, false, text);
  });
});

describe("rates stay away from the booking code (A10)", () => {
  function walk(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
  }

  it("pricing, the booking engine, payments and webhooks never import rates or money", () => {
    const guarded = walk(join(ROOT, "src"))
      .map((f) => relative(ROOT, f).split(sep).join("/"))
      .filter((f) => /^src\/(lib\/server\/(pricing|booking-engine|booking-state|payments|webhooks)\.ts|services\/(payments|reservations|webhook-settlement)\.ts)$/.test(f));
    assert.ok(guarded.length >= 5, guarded.join(", "));
    for (const f of guarded) {
      const text = readFileSync(join(ROOT, f), "utf8");
      assert.doesNotMatch(text, /server\/rates|lib\/money|amount_minor|\brates\b/, f);
    }
  });

  it("quoteForTour still returns a quote for every tour", () => {
    for (const t of tours) assert.equal(quoteForSlug(t.slug, 2).kind, "quote", t.slug);
  });
});

describe("rates and ratings (A10)", () => {
  let db: TestDb;
  let admin: Actor;
  beforeEach(async () => {
    db = await createTestDb();
    admin = await insertStaff(db.sql, "dev", "ADMIN");
  });
  afterEach(async () => {
    await db.close();
  });

  it("seeds 6 cruise prices, 8 vehicle daily rates and 16 tour ratings, all drafts", async () => {
    const rates = await listRates(db.sql, admin, undefined);
    assert.equal(rates.length, 14);
    assert.ok(rates.every((r) => r.status === "draft" && r.sourceDate === null));
    const cruise = rates.filter((r) => r.subjectCollection === "cruise-excursions");
    assert.deepEqual(
      cruise.map((r) => [r.subjectKey, r.amountMinor, r.unit, r.sourceNote]).sort(),
      excursions.map((e) => [e.id, e.priceUsdPerPerson * 100, "per-person", "Cruiseship Proposal 2024"]).sort(),
    );
    assert.deepEqual(
      rates.filter((r) => r.subjectCollection === "vehicles").map((r) => [r.subjectKey, r.amountMinor, r.unit, r.sourceNote]).sort(),
      vehicles.map((v) => [v.id, v.pricing.dailyRateCents, "per-day", ""]).sort(),
    );
    const ratings = await listRatings(db.sql, admin, undefined);
    assert.equal(ratings.length, 16);
    assert.deepEqual(
      ratings.map((r) => [r.tourKey, r.value, r.reviewCount]).sort(),
      tours.filter((t) => t.rating > 0).map((t) => [t.slug, t.rating.toFixed(1), t.reviewCount]).sort(),
    );
    assert.ok(ratings.every((r) => r.status === "draft" && r.sourceUrl === ""));
  });

  it("the database refuses a published rate or rating without its source", async () => {
    await assert.rejects(db.sql`update rates set status = 'published'`, /rates_published_needs_source/);
    await assert.rejects(db.sql`update ratings set status = 'published'`, /ratings_published_needs_source/);
    await assert.rejects(db.sql`update ratings set status = 'published', source_url = 'http://example.org', source_date = '2026-09-01'`, /ratings_published_needs_source/);
  });

  it("publishes a rate only with a source note and date, and archives the earlier one", async () => {
    const [rate] = (await listRates(db.sql, admin, undefined)).filter((r) => r.subjectCollection === "cruise-excursions");
    await assert.rejects(publishRate(db.sql, admin, { id: rate.id }), rejectsWith(409, "SOURCE_REQUIRED"));
    const edits = { label: rate.label, currency: rate.currency, amount: "60.00", unit: rate.unit, sourceNote: rate.sourceNote };
    await updateRate(db.sql, admin, { id: rate.id, ...edits, sourceDate: "2024-03-01" });
    await publishRate(db.sql, admin, { id: rate.id });
    await assert.rejects(updateRate(db.sql, admin, { id: rate.id, ...edits, amount: "65" }), rejectsWith(409, "NOT_DRAFT"));
    const next = await createRate(db.sql, admin, { subjectCollection: rate.subjectCollection, subjectId: rate.subjectId, ...edits, amount: "65", sourceDate: "2026-09-01" });
    const result = await publishRate(db.sql, admin, { id: next.id });
    assert.deepEqual(result.archived, [rate.id]);
    assert.deepEqual((await publishedRates(db.sql, rate.subjectId)).map((r) => r.amount), ["USD 65.00"]);
    const audit = await db.sql<{ action: string }>`select action from audit_logs where entity = 'rates' order by created_at, id`;
    assert.deepEqual(audit.map((a) => a.action), ["rate.update", "rate.publish", "rate.create", "rate.publish"]);
  });

  it("refuses bad amounts, currencies and subjects when creating a rate", async () => {
    const tour = collectionItemId("tours", "freetown-city-tour");
    const base = { subjectCollection: "tours", subjectId: tour, label: "Per person", currency: "USD", amount: "45", unit: "per-person" };
    await assert.rejects(createRate(db.sql, admin, { ...base, amount: "1e3" }), rejectsWith(400, "BAD_AMOUNT"));
    await assert.rejects(createRate(db.sql, admin, { ...base, amount: "-5" }), rejectsWith(400, "BAD_AMOUNT"));
    await assert.rejects(createRate(db.sql, admin, { ...base, currency: "EUR" }), rejectsWith(400, "BAD_CURRENCY"));
    await assert.rejects(createRate(db.sql, admin, { ...base, unit: "per-hour" }), rejectsWith(400, "BAD_UNIT"));
    await assert.rejects(createRate(db.sql, admin, { ...base, subjectCollection: "stays" }), rejectsWith(400, "BAD_SUBJECT"));
    await assert.rejects(createRate(db.sql, admin, { ...base, sourceDate: "01/09/2026" }), rejectsWith(400, "BAD_DATE"));
    const created = await createRate(db.sql, admin, { ...base, currency: "SLE", amount: "1,250.5" });
    const row = (await listRates(db.sql, admin, undefined)).find((r) => r.id === created.id)!;
    assert.deepEqual([row.amountMinor, row.amount], [125050, "SLE 1,250.50"]);
  });

  it("publishes a rating only with an https source and date", async () => {
    const [rating] = await listRatings(db.sql, admin, undefined);
    await assert.rejects(publishRating(db.sql, admin, { id: rating.id }), rejectsWith(409, "SOURCE_REQUIRED"));
    await assert.rejects(updateRating(db.sql, admin, { id: rating.id, value: "4.1", reviewCount: 25, sourceUrl: "http://example.org" }), rejectsWith(400, "BAD_SOURCE_URL"));
    await updateRating(db.sql, admin, { id: rating.id, value: "4.1", reviewCount: 25, sourceUrl: "https://example.org/reviews", sourceDate: "2026-09-01" });
    await publishRating(db.sql, admin, { id: rating.id });
    const second = await createRating(db.sql, admin, { tourId: rating.tourId, value: "4.3", reviewCount: 30, sourceUrl: "https://example.org/reviews", sourceDate: "2026-10-01" });
    assert.deepEqual((await publishRating(db.sql, admin, { id: second.id })).archived, [rating.id]);
    await archiveRating(db.sql, admin, { id: second.id });
  });

  it("only rates.manage (ADMIN, SUPER_ADMIN) may see or change rates and ratings", async () => {
    const [rate] = await listRates(db.sql, admin, undefined);
    const [rating] = await listRatings(db.sql, admin, undefined);
    for (const role of ["CONTENT_MANAGER", "BOOKING_MANAGER", "STAFF"] as const) {
      const actor = await insertStaff(db.sql, `as-${role}`, role);
      await assert.rejects(listRates(db.sql, actor, undefined), rejectsWith(403));
      await assert.rejects(publishRate(db.sql, actor, { id: rate.id }), rejectsWith(403));
      await assert.rejects(archiveRate(db.sql, actor, { id: rate.id }), rejectsWith(403));
      await assert.rejects(listRatings(db.sql, actor, undefined), rejectsWith(403));
      await assert.rejects(publishRating(db.sql, actor, { id: rating.id }), rejectsWith(403));
    }
  });
});
