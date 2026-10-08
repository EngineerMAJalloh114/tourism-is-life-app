-- Task A1: capabilities and SEC-6.
--
-- Additive and idempotent. Safe on the live schema with live data, and
-- compatible with the code that is live when it runs:
--   * `status` defaults to 'active', so every existing staff row keeps working.
--   * The foreign key and both CHECKs are NOT VALID: Postgres enforces them for
--     new and updated rows only and does not scan existing rows, so a stray row
--     (for example a preview-era 'dev-user' profile with no user) cannot make
--     the deploy fail. Validating them later is an owner decision.

alter table staff_profiles add column if not exists status text not null default 'active';
alter table staff_profiles add column if not exists disabled_at timestamptz;
alter table staff_profiles add column if not exists disabled_by text;
alter table staff_profiles add column if not exists updated_by text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'staff_profiles_user_fk') then
    alter table staff_profiles
      add constraint staff_profiles_user_fk foreign key (user_id) references "user" (id) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'staff_profiles_role_check') then
    alter table staff_profiles
      add constraint staff_profiles_role_check
      check (role in ('STAFF', 'BOOKING_MANAGER', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'staff_profiles_status_check') then
    alter table staff_profiles
      add constraint staff_profiles_status_check
      check (status in ('active', 'disabled', 'removed')) not valid;
  end if;
end
$$;

create index if not exists staff_profiles_role_status_idx on staff_profiles (role, status);
