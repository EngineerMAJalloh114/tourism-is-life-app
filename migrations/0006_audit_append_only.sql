-- Task A2: append-only audit log.
--
-- Additive and idempotent. The live code only ever inserts into audit_logs,
-- so the triggers below change nothing for it; they make the table refuse
-- UPDATE, DELETE and TRUNCATE from any code path. A database owner could still
-- drop a trigger; full immutability needs a separate restricted role (owner).

alter table audit_logs add column if not exists before jsonb;
alter table audit_logs add column if not exists after jsonb;
alter table audit_logs add column if not exists actor_role text;
alter table audit_logs add column if not exists ip text;

create index if not exists audit_logs_entity_idx on audit_logs (entity, entity_id, created_at desc);
create index if not exists audit_logs_actor_idx on audit_logs (actor_id, created_at desc);

create or replace function audit_logs_append_only() returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_logs is append-only: % is not allowed', tg_op
    using errcode = 'insufficient_privilege';
end
$$;

create or replace trigger audit_logs_no_update_delete
  before update or delete on audit_logs
  for each row execute function audit_logs_append_only();

create or replace trigger audit_logs_no_truncate
  before truncate on audit_logs
  for each statement execute function audit_logs_append_only();
