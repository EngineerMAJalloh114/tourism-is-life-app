-- Booking/payment money columns + staff-bootstrap lock.
--
-- Reconstructed from the current application code (the original 0004 file was
-- missing from the export). Every statement below is required by code that
-- already ships:
--   * bookings.amount_cents / bookings.currency
--       - src/lib/server/booking-engine.ts  createHoldTx() INSERT (explicit columns)
--       - src/lib/server/booking-engine.ts / webhooks.ts  BOOKING_SELECT
--         (`coalesce(amount_cents, 0)`, `coalesce(currency, 'USD')`)
--   * payments.amount_cents / payments.currency
--       - src/lib/server/booking-engine.ts  settleBookingTx() INSERT into payments
--   * bootstrap_lock
--       - src/lib/server/ops.ts  bootstrapStaff()
--         (`insert into bootstrap_lock (id, user_id) values (1, ...)`,
--          `select user_id from bootstrap_lock where id = 1`)
--
-- All statements are idempotent so this file is safe to re-run and safe on a
-- database that already applied 0001-0003.

alter table bookings add column if not exists amount_cents integer not null default 0;
alter table bookings add column if not exists currency text not null default 'USD';

alter table payments add column if not exists amount_cents integer not null default 0;
alter table payments add column if not exists currency text not null default 'USD';

create table if not exists bootstrap_lock (
  id            integer primary key,
  user_id       text not null,
  created_at    timestamptz not null default now()
);
