-- Booking engine, payments, guest checkout, staff RBAC, reviews, audit

alter table bookings alter column user_id drop not null;
alter table bookings add column if not exists access_token text;
alter table bookings add column if not exists hold_expires_at timestamptz;
alter table bookings add column if not exists payment_provider text;
alter table bookings add column if not exists payment_intent_id text;
alter table bookings add column if not exists voucher_code text;

alter table enquiries alter column user_id drop not null;
alter table enquiries add column if not exists guest_email text;
alter table enquiries add column if not exists guest_name text;

alter table availability add column if not exists reserved_seats integer not null default 0;

create unique index if not exists bookings_access_token_idx on bookings (access_token);

create table if not exists payments (
  id              text primary key,
  booking_id      text not null references bookings(id),
  provider        text not null,
  provider_ref    text,
  amount_label    text not null default 'quote',
  status          text not null,
  raw_event       text,
  created_at      timestamptz not null default now()
);
create index if not exists payments_booking_id_idx on payments (booking_id);

create table if not exists webhook_events (
  id              text primary key,
  provider        text not null,
  provider_event_id text not null,
  payload         text not null,
  status          text not null,
  created_at      timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create table if not exists staff_profiles (
  user_id         text primary key,
  role            text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists audit_logs (
  id              text primary key,
  actor_id        text,
  action          text not null,
  entity          text not null,
  entity_id       text,
  detail          text,
  created_at      timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on audit_logs (created_at desc);

create table if not exists reviews (
  id              text primary key,
  booking_id      text not null,
  user_id         text,
  tour_slug       text not null,
  rating          integer not null,
  body            text not null,
  status          text not null default 'pending',
  created_at      timestamptz not null default now()
);
create index if not exists reviews_tour_idx on reviews (tour_slug, status);

create table if not exists newsletter_subscribers (
  email           text primary key,
  source          text,
  created_at      timestamptz not null default now()
);
