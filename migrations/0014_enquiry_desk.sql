-- 0014_enquiry_desk: assignee, timestamps, internal notes and statuses for the enquiry desk (task A12, OPS-4).
--
-- Additive and safe on live data: new nullable columns, a new notes table,
-- indexes, and a status CHECK added NOT VALID so existing rows are never
-- re-checked. Statuses: 'open' (shown as New, and what the public form keeps
-- writing), 'in_progress', 'quoted', 'closed'. Enquiry rows are never deleted
-- by the admin; notes are append-only.

alter table enquiries add column if not exists assignee_id text;
alter table enquiries add column if not exists status_changed_at timestamptz;
alter table enquiries add column if not exists updated_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'enquiries_status_check') then
    alter table enquiries
      add constraint enquiries_status_check check (status in ('open', 'in_progress', 'quoted', 'closed')) not valid;
  end if;
end
$$;

create index if not exists enquiries_created_idx on enquiries (created_at desc, id desc);
create index if not exists enquiries_status_created_idx on enquiries (status, created_at desc);
create index if not exists enquiries_assignee_idx on enquiries (assignee_id) where assignee_id is not null;

create table if not exists enquiry_notes (
  id text primary key,
  enquiry_id text not null references enquiries (id),
  author_id text,
  body text not null,
  created_at timestamptz not null default now(),
  constraint enquiry_notes_body_check check (length(body) between 1 and 4000)
);

create index if not exists enquiry_notes_enquiry_idx on enquiry_notes (enquiry_id, created_at);
