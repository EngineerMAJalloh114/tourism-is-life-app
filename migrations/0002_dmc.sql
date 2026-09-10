-- Tourism Is Life operational tables (per-user bookings, enquiries, saved tours)
create table if not exists bookings (
  id            text primary key,
  user_id       text not null,
  tour_slug     text not null,
  travel_date   date not null,
  guests        integer not null,
  status        text not null,
  guest_name    text not null,
  guest_email   text not null,
  guest_phone   text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists bookings_user_id_idx on bookings (user_id);
create index if not exists bookings_tour_date_idx on bookings (tour_slug, travel_date);

create table if not exists availability (
  tour_slug     text not null,
  travel_date   date not null,
  max_capacity  integer not null,
  booked_seats  integer not null default 0,
  primary key (tour_slug, travel_date)
);

create table if not exists enquiries (
  id            text primary key,
  user_id       text not null,
  type          text not null,
  payload       text not null,
  status        text not null default 'open',
  created_at    timestamptz not null default now()
);
create index if not exists enquiries_user_id_idx on enquiries (user_id);

create table if not exists saved_tours (
  user_id       text not null,
  tour_slug     text not null,
  created_at    timestamptz not null default now(),
  primary key (user_id, tour_slug)
);
