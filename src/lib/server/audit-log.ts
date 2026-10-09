/** The read-only audit log view (`audit.view`: ADMIN and SUPER_ADMIN). */
import type { JsonValue } from "@/lib/json";
import { adminOperation } from "@/lib/server/access";
import { InvalidRequestError } from "@/lib/server/errors";

export type AuditRow = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  ip: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  detail: string | null;
  before: JsonValue;
  after: JsonValue;
  created_at: string;
  /** Full-precision timestamp text, used for the page cursor. */
  created_at_text: string;
};

export type AuditQuery = {
  entity?: string;
  action?: string;
  actorId?: string;
  /** Opaque cursor from the previous page (`nextCursor`). */
  cursor?: string;
  limit?: number;
};

export type AuditPage = { rows: AuditRow[]; nextCursor: string | null };

const MAX_LIMIT = 100;

function encodeCursor(row: AuditRow): string {
  return Buffer.from(JSON.stringify([row.created_at_text, row.id])).toString("base64url");
}

function decodeCursor(cursor: string): [string, string] {
  try {
    const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (Array.isArray(value) && value.length === 2 && value.every((v) => typeof v === "string")) {
      return [value[0], value[1]];
    }
  } catch {
    /* fall through */
  }
  throw new InvalidRequestError("That page link is no longer valid. Start again from the first page.");
}

export const listAudit = adminOperation("audit.view", async (sql, _actor, input: AuditQuery | undefined): Promise<AuditPage> => {
  const q = input ?? {};
  const limit = Math.min(Math.max(q.limit ?? 50, 1), MAX_LIMIT);
  const where: string[] = [];
  const params: unknown[] = [];
  const add = (clause: string, value: unknown) => {
    params.push(value);
    where.push(clause.replace("$?", `$${params.length}`));
  };
  if (q.entity) add("a.entity = $?", q.entity);
  if (q.action) add("a.action ilike $?", `${q.action.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
  if (q.actorId) add("a.actor_id = $?", q.actorId);
  if (q.cursor) {
    const [createdAt, id] = decodeCursor(q.cursor);
    params.push(createdAt, id);
    where.push(`(a.created_at, a.id) < ($${params.length - 1}::timestamptz, $${params.length})`);
  }
  params.push(limit + 1);
  const rows = await sql.query<AuditRow>(
    `select a.id, a.actor_id, u.email as actor_email, a.actor_role, a.ip, a.action, a.entity, a.entity_id,
            a.detail, a.before, a.after, a.created_at, a.created_at::text as created_at_text
       from audit_logs a
       left join "user" u on u.id = a.actor_id
      ${where.length ? `where ${where.join(" and ")}` : ""}
      order by a.created_at desc, a.id desc
      limit $${params.length}`,
    params,
  );
  const page = rows.slice(0, limit);
  return { rows: page, nextCursor: rows.length > limit ? encodeCursor(page[page.length - 1]) : null };
});

/** The distinct entity names, for the filter menu. */
export const listAuditEntities = adminOperation("audit.view", async (sql) => {
  const rows = await sql<{ entity: string }>`select distinct entity from audit_logs order by entity`;
  return rows.map((r) => r.entity);
});
