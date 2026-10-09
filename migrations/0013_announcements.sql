-- 0013_announcements: the site-wide announcement bar (task A11).
--
-- Additive only: one new table, no seed (the site has no announcement today).
-- The public site shows the active one from task B5: published, inside its
-- start and end, and the latest start when several overlap. Announcements are
-- archived, never deleted.

create table if not exists announcements (
  id text primary key,
  message text not null,
  link_label text not null default '',
  link text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  created_by text,
  updated_at timestamptz not null default now(),
  updated_by text,
  published_at timestamptz,
  archived_at timestamptz,
  constraint announcements_message_check check (length(message) between 1 and 200),
  constraint announcements_window_check check (ends_at is null or ends_at > starts_at),
  constraint announcements_link_check check (link = '' or link like 'https://%' or (link like '/%' and link not like '//%')),
  constraint announcements_status_check check (status in ('draft', 'published', 'archived'))
);

create index if not exists announcements_live_idx on announcements (status, starts_at desc);
