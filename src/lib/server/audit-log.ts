/** The read-only audit log view (`audit.view`: ADMIN and SUPER_ADMIN). */
import { adminOperation } from "@/lib/server/access";

export type AuditRow = {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  detail: string | null;
  created_at: string;
};

export const listAudit = adminOperation("audit.view", async (sql) => {
  return sql<AuditRow>`
    select id, actor_id, action, entity, entity_id, detail, created_at
    from audit_logs
    order by created_at desc
    limit 80
  `;
});
