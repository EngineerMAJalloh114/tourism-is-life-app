/**
 * The audit log writer.
 *
 * Every admin write records one row here, with the value before and after the
 * change, in the SAME transaction as the change: `audit()` only accepts a
 * `TxSql`, which only `inTransaction()` produces, so a write and its audit row
 * commit or roll back together. The table itself refuses UPDATE, DELETE and
 * TRUNCATE (migration 0006), so a row cannot be edited or removed later.
 */
import type { Sql, TxSql } from "@/lib/sql";
import { publicId } from "@/lib/server/crypto";

export type AuditActor = { userId: string | null; role?: string | null; ip?: string | null };

export type AuditEntry = {
  actor: AuditActor;
  /** Dotted verb, for example `staff.role`, `enquiry.status`, `settings.publish`. */
  action: string;
  /** What was changed: a table or record kind, for example `staff_profiles`. */
  entity: string;
  entityId: string | null;
  /** The record (or the changed fields) before the change; null for a create. */
  before?: unknown;
  /** The record (or the changed fields) after the change; null for a delete. */
  after?: unknown;
  /** A short human note, kept for continuity with older rows. */
  detail?: string | null;
};

/** Stable JSON for jsonb columns: undefined becomes null, Dates become ISO strings. */
function toJson(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return JSON.stringify(value, (_key, v) => (v instanceof Date ? v.toISOString() : v));
}

export async function audit(tx: TxSql, entry: AuditEntry): Promise<string> {
  const id = publicId();
  await tx`
    insert into audit_logs (id, actor_id, actor_role, ip, action, entity, entity_id, detail, before, after)
    values (
      ${id},
      ${entry.actor.userId},
      ${entry.actor.role ?? null},
      ${entry.actor.ip ?? null},
      ${entry.action},
      ${entry.entity},
      ${entry.entityId},
      ${entry.detail ?? null},
      ${toJson(entry.before)}::jsonb,
      ${toJson(entry.after)}::jsonb
    )
  `;
  return id;
}

/**
 * The older writer, kept for the dormant booking engine (which is not admin code
 * and is not changed by this work). New code uses `audit()`.
 * @deprecated use `audit(tx, entry)`.
 */
export async function writeAudit(
  sql: Sql,
  actorId: string | null,
  action: string,
  entity: string,
  entityId: string,
  detail?: string,
) {
  await sql`
    insert into audit_logs (id, actor_id, action, entity, entity_id, detail)
    values (${publicId()}, ${actorId}, ${action}, ${entity}, ${entityId}, ${detail ?? null})
  `;
}
