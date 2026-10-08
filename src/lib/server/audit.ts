/**
 * The audit log writer. Every admin write records a row here in the same
 * transaction as the change it describes.
 */
import type { Sql } from "@/lib/sql";
import { publicId } from "@/lib/server/crypto";

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
