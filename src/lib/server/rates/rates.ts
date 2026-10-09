/**
 * Rates and ratings (task A10). `rates.manage` (ADMIN and SUPER_ADMIN) for all
 * of it.
 *
 *   - Amounts are typed in major units and parsed without floating point
 *     (`src/lib/money.ts`); the database holds integer minor units.
 *   - A rate is published only with a source note and date; a rating only
 *     with a source link and date. The database refuses either otherwise.
 *   - Publishing archives the earlier published rate for the same thing (same
 *     subject, label, unit and currency), or the earlier rating of the tour.
 *   - A published or archived row is not edited: archive it and add a new one,
 *     so the audit log reads as a history of prices.
 *   - Nothing here is read by `pricing.ts`, the booking engine or
 *     `priceCents` (a test greps for it).
 */
import { CURRENCIES, formatMinor, formatRating, parseMajor, parseRating, type Currency } from "@/lib/money";
import { inTransaction, type Sql, type TxSql } from "@/lib/sql";
import { adminOperation } from "@/lib/server/access";
import { audit } from "@/lib/server/audit";
import { publicId } from "@/lib/server/crypto";
import { ConflictError, InvalidRequestError, NotFoundError } from "@/lib/server/errors";

export const RATE_SUBJECTS = ["tours", "cruise-excursions", "vehicles", "vehicle-categories", "services"] as const;
export type RateSubject = (typeof RATE_SUBJECTS)[number];
export const RATE_UNITS = ["per-person", "per-day", "per-group", "per-transfer", "per-night"] as const;
export type RateUnit = (typeof RATE_UNITS)[number];
type Status = "draft" | "published" | "archived";

type RateRow = {
  id: string;
  subject_collection: RateSubject;
  subject_id: string;
  subject_key: string;
  subject_title: string | null;
  label: string;
  currency: Currency;
  amount_minor: string | number;
  unit: RateUnit;
  source_note: string;
  source_date: string | null;
  status: Status;
};

type RatingRow = {
  id: string;
  tour_id: string;
  tour_key: string;
  tour_title: string | null;
  value_tenths: number;
  review_count: number;
  source_url: string;
  source_date: string | null;
  status: Status;
};

const isoDate = (v: string | null | undefined) => (v ? /^\d{4}-\d{2}-\d{2}$/.test(v) : false);

function checkDate(v: string | undefined | null): string | null {
  if (!v) return null;
  if (!isoDate(v) || Number.isNaN(Date.parse(v))) throw new InvalidRequestError("Use a date as YYYY-MM-DD.", "BAD_DATE");
  return v;
}

const rateView = (r: RateRow) => ({
  id: r.id,
  subjectCollection: r.subject_collection,
  subjectId: r.subject_id,
  subjectKey: r.subject_key,
  subjectTitle: r.subject_title,
  label: r.label,
  currency: r.currency,
  amountMinor: Number(r.amount_minor),
  amount: formatMinor(Number(r.amount_minor), r.currency),
  unit: r.unit,
  sourceNote: r.source_note,
  sourceDate: r.source_date,
  status: r.status,
});

const ratingView = (r: RatingRow) => ({
  id: r.id,
  tourId: r.tour_id,
  tourKey: r.tour_key,
  tourTitle: r.tour_title,
  valueTenths: r.value_tenths,
  value: formatRating(r.value_tenths),
  reviewCount: r.review_count,
  sourceUrl: r.source_url,
  sourceDate: r.source_date,
  status: r.status,
});

async function subjectOf(sql: Sql, collection: string, id: string) {
  if (!(RATE_SUBJECTS as readonly string[]).includes(collection)) throw new InvalidRequestError("Rates are for tours, excursions, vehicles, vehicle categories and services.", "BAD_SUBJECT");
  const rows = await sql<{ id: string; key: string }>`
    select id, key from collection_items where id = ${id} and collection = ${collection} and deleted_at is null
  `;
  if (!rows[0]) throw new NotFoundError("That record does not exist.");
  return rows[0];
}

async function lockRate(tx: TxSql, id: string): Promise<RateRow> {
  const rows = await tx<RateRow>`
    select r.id, r.subject_collection, r.subject_id, i.key as subject_key, null::text as subject_title, r.label, r.currency,
      r.amount_minor::text as amount_minor, r.unit, r.source_note, r.source_date::text as source_date, r.status
    from rates r join collection_items i on i.id = r.subject_id where r.id = ${id} for update of r
  `;
  if (!rows[0]) throw new NotFoundError("That rate does not exist.");
  return rows[0];
}

async function lockRating(tx: TxSql, id: string): Promise<RatingRow> {
  const rows = await tx<RatingRow>`
    select g.id, g.tour_id, i.key as tour_key, null::text as tour_title, g.value_tenths, g.review_count, g.source_url,
      g.source_date::text as source_date, g.status
    from ratings g join collection_items i on i.id = g.tour_id where g.id = ${id} for update of g
  `;
  if (!rows[0]) throw new NotFoundError("That rating does not exist.");
  return rows[0];
}

// ---------------------------------------------------------------- rates

export type RateInput = {
  subjectCollection: string;
  subjectId: string;
  label: string;
  currency: string;
  amount: string;
  unit: string;
  sourceNote?: string;
  sourceDate?: string | null;
};

function checkRate(input: Omit<RateInput, "subjectCollection" | "subjectId">) {
  const label = input.label.trim();
  if (!label || label.length > 80) throw new InvalidRequestError("Give the rate a label of up to 80 characters.", "BAD_LABEL");
  if (!(CURRENCIES as readonly string[]).includes(input.currency)) throw new InvalidRequestError("Currency must be USD or SLE.", "BAD_CURRENCY");
  if (!(RATE_UNITS as readonly string[]).includes(input.unit)) throw new InvalidRequestError("Choose what the rate is per.", "BAD_UNIT");
  const parsed = parseMajor(input.amount);
  if (!parsed.ok) throw new InvalidRequestError(parsed.error, "BAD_AMOUNT");
  const sourceNote = (input.sourceNote ?? "").trim().slice(0, 300);
  return { label, currency: input.currency as Currency, unit: input.unit as RateUnit, minor: parsed.minor, sourceNote, sourceDate: checkDate(input.sourceDate) };
}

export const listRates = adminOperation("rates.manage", async (sql) => {
  const rows = await sql<RateRow>`
    select r.id, r.subject_collection, r.subject_id, i.key as subject_key,
      coalesce(i.draft->>'title', i.draft->>'name', i.draft->>'label') as subject_title,
      r.label, r.currency, r.amount_minor::text as amount_minor, r.unit, r.source_note, r.source_date::text as source_date, r.status
    from rates r join collection_items i on i.id = r.subject_id
    order by r.subject_collection, i.position, r.label, r.created_at
  `;
  return rows.map(rateView);
});

export const createRate = adminOperation("rates.manage", async (sql, actor, input: RateInput) => {
  const r = checkRate(input);
  return inTransaction(sql, async (tx) => {
    const subject = await subjectOf(tx, input.subjectCollection, input.subjectId);
    const id = publicId(12);
    await tx`
      insert into rates (id, subject_collection, subject_id, label, currency, amount_minor, unit, source_note, source_date, created_by, updated_by)
      values (${id}, ${input.subjectCollection}, ${subject.id}, ${r.label}, ${r.currency}, ${r.minor}, ${r.unit}, ${r.sourceNote},
        ${r.sourceDate}, ${actor.userId}, ${actor.userId})
    `;
    await audit(tx, {
      actor,
      action: "rate.create",
      entity: "rates",
      entityId: id,
      before: null,
      after: { subject: `${input.subjectCollection}/${subject.key}`, label: r.label, currency: r.currency, amountMinor: r.minor, unit: r.unit, sourceNote: r.sourceNote, sourceDate: r.sourceDate },
    });
    return { id };
  });
});

export const updateRate = adminOperation("rates.manage", async (sql, actor, input: Omit<RateInput, "subjectCollection" | "subjectId"> & { id: string }) => {
  const r = checkRate(input);
  return inTransaction(sql, async (tx) => {
    const row = await lockRate(tx, input.id);
    if (row.status !== "draft") throw new ConflictError("A published or archived rate is not edited. Add a new rate instead.", "NOT_DRAFT");
    await tx`
      update rates set label = ${r.label}, currency = ${r.currency}, amount_minor = ${r.minor}, unit = ${r.unit}, source_note = ${r.sourceNote},
        source_date = ${r.sourceDate}, updated_at = now(), updated_by = ${actor.userId}
      where id = ${row.id}
    `;
    await audit(tx, {
      actor,
      action: "rate.update",
      entity: "rates",
      entityId: row.id,
      before: { label: row.label, currency: row.currency, amountMinor: Number(row.amount_minor), unit: row.unit, sourceNote: row.source_note, sourceDate: row.source_date },
      after: { label: r.label, currency: r.currency, amountMinor: r.minor, unit: r.unit, sourceNote: r.sourceNote, sourceDate: r.sourceDate },
    });
    return { id: row.id };
  });
});

export const publishRate = adminOperation("rates.manage", async (sql, actor, input: { id: string }) => {
  return inTransaction(sql, async (tx) => {
    const row = await lockRate(tx, input.id);
    if (row.status !== "draft") throw new ConflictError("Only a draft rate can be published.", "NOT_DRAFT");
    if (!row.source_note.trim() || !row.source_date) {
      throw new ConflictError("Record where the rate comes from and its date before publishing.", "SOURCE_REQUIRED");
    }
    const replaced = await tx<{ id: string }>`
      update rates set status = 'archived', archived_at = now(), updated_at = now(), updated_by = ${actor.userId}
      where subject_id = ${row.subject_id} and label = ${row.label} and unit = ${row.unit} and currency = ${row.currency}
        and status = 'published' and id <> ${row.id}
      returning id
    `;
    await tx`update rates set status = 'published', published_at = now(), updated_at = now(), updated_by = ${actor.userId} where id = ${row.id}`;
    await audit(tx, {
      actor,
      action: "rate.publish",
      entity: "rates",
      entityId: row.id,
      before: { status: row.status },
      after: { status: "published", amountMinor: Number(row.amount_minor), currency: row.currency, sourceNote: row.source_note, sourceDate: row.source_date, archived: replaced.map((x) => x.id) },
    });
    return { id: row.id, archived: replaced.map((x) => x.id) };
  });
});

export const archiveRate = adminOperation("rates.manage", async (sql, actor, input: { id: string }) => {
  return inTransaction(sql, async (tx) => {
    const row = await lockRate(tx, input.id);
    if (row.status === "archived") return { id: row.id };
    await tx`update rates set status = 'archived', archived_at = now(), updated_at = now(), updated_by = ${actor.userId} where id = ${row.id}`;
    await audit(tx, { actor, action: "rate.archive", entity: "rates", entityId: row.id, before: { status: row.status }, after: { status: "archived" } });
    return { id: row.id };
  });
});

// ---------------------------------------------------------------- ratings

export type RatingInput = { tourId: string; value: string; reviewCount: number; sourceUrl?: string; sourceDate?: string | null };

function checkRating(input: Omit<RatingInput, "tourId">) {
  const parsed = parseRating(input.value);
  if (!parsed.ok) throw new InvalidRequestError(parsed.error, "BAD_RATING");
  if (!Number.isInteger(input.reviewCount) || input.reviewCount < 0 || input.reviewCount > 1_000_000) {
    throw new InvalidRequestError("The number of reviews must be a whole number.", "BAD_COUNT");
  }
  const sourceUrl = (input.sourceUrl ?? "").trim();
  if (sourceUrl && !/^https:\/\/\S+$/.test(sourceUrl)) throw new InvalidRequestError("The source link must start with https://", "BAD_SOURCE_URL");
  return { tenths: parsed.tenths, count: input.reviewCount, sourceUrl, sourceDate: checkDate(input.sourceDate) };
}

export const listRatings = adminOperation("rates.manage", async (sql) => {
  const rows = await sql<RatingRow>`
    select g.id, g.tour_id, i.key as tour_key, i.draft->>'title' as tour_title, g.value_tenths, g.review_count, g.source_url,
      g.source_date::text as source_date, g.status
    from ratings g join collection_items i on i.id = g.tour_id
    order by i.position, g.created_at
  `;
  return rows.map(ratingView);
});

export const createRating = adminOperation("rates.manage", async (sql, actor, input: RatingInput) => {
  const r = checkRating(input);
  return inTransaction(sql, async (tx) => {
    const tour = await subjectOf(tx, "tours", input.tourId);
    const id = publicId(12);
    await tx`
      insert into ratings (id, tour_id, value_tenths, review_count, source_url, source_date, created_by, updated_by)
      values (${id}, ${tour.id}, ${r.tenths}, ${r.count}, ${r.sourceUrl}, ${r.sourceDate}, ${actor.userId}, ${actor.userId})
    `;
    await audit(tx, { actor, action: "rating.create", entity: "ratings", entityId: id, before: null, after: { tour: tour.key, valueTenths: r.tenths, reviewCount: r.count, sourceUrl: r.sourceUrl, sourceDate: r.sourceDate } });
    return { id };
  });
});

export const updateRating = adminOperation("rates.manage", async (sql, actor, input: Omit<RatingInput, "tourId"> & { id: string }) => {
  const r = checkRating(input);
  return inTransaction(sql, async (tx) => {
    const row = await lockRating(tx, input.id);
    if (row.status !== "draft") throw new ConflictError("A published or archived rating is not edited. Add a new rating instead.", "NOT_DRAFT");
    await tx`
      update ratings set value_tenths = ${r.tenths}, review_count = ${r.count}, source_url = ${r.sourceUrl}, source_date = ${r.sourceDate},
        updated_at = now(), updated_by = ${actor.userId}
      where id = ${row.id}
    `;
    await audit(tx, {
      actor,
      action: "rating.update",
      entity: "ratings",
      entityId: row.id,
      before: { valueTenths: row.value_tenths, reviewCount: row.review_count, sourceUrl: row.source_url, sourceDate: row.source_date },
      after: { valueTenths: r.tenths, reviewCount: r.count, sourceUrl: r.sourceUrl, sourceDate: r.sourceDate },
    });
    return { id: row.id };
  });
});

export const publishRating = adminOperation("rates.manage", async (sql, actor, input: { id: string }) => {
  return inTransaction(sql, async (tx) => {
    const row = await lockRating(tx, input.id);
    if (row.status !== "draft") throw new ConflictError("Only a draft rating can be published.", "NOT_DRAFT");
    if (!row.source_url.startsWith("https://") || !row.source_date) {
      throw new ConflictError("Record the source link and its date before publishing.", "SOURCE_REQUIRED");
    }
    const replaced = await tx<{ id: string }>`
      update ratings set status = 'archived', archived_at = now(), updated_at = now(), updated_by = ${actor.userId}
      where tour_id = ${row.tour_id} and status = 'published' and id <> ${row.id}
      returning id
    `;
    await tx`update ratings set status = 'published', published_at = now(), updated_at = now(), updated_by = ${actor.userId} where id = ${row.id}`;
    await audit(tx, {
      actor,
      action: "rating.publish",
      entity: "ratings",
      entityId: row.id,
      before: { status: row.status },
      after: { status: "published", valueTenths: row.value_tenths, reviewCount: row.review_count, sourceUrl: row.source_url, sourceDate: row.source_date, archived: replaced.map((x) => x.id) },
    });
    return { id: row.id, archived: replaced.map((x) => x.id) };
  });
});

export const archiveRating = adminOperation("rates.manage", async (sql, actor, input: { id: string }) => {
  return inTransaction(sql, async (tx) => {
    const row = await lockRating(tx, input.id);
    if (row.status === "archived") return { id: row.id };
    await tx`update ratings set status = 'archived', archived_at = now(), updated_at = now(), updated_by = ${actor.userId} where id = ${row.id}`;
    await audit(tx, { actor, action: "rating.archive", entity: "ratings", entityId: row.id, before: { status: row.status }, after: { status: "archived" } });
    return { id: row.id };
  });
});

/** The published rates for one record (task B5 will read these). */
export async function publishedRates(sql: Sql, subjectId: string) {
  const rows = await sql<RateRow>`
    select r.id, r.subject_collection, r.subject_id, i.key as subject_key, null::text as subject_title, r.label, r.currency,
      r.amount_minor::text as amount_minor, r.unit, r.source_note, r.source_date::text as source_date, r.status
    from rates r join collection_items i on i.id = r.subject_id
    where r.subject_id = ${subjectId} and r.status = 'published'
    order by r.label
  `;
  return rows.map(rateView);
}
