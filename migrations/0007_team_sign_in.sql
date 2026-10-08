-- Task A3: team sign-in, two-factor, password reset, rate limits.
--
-- Additive and idempotent; nothing the live code reads changes.
--
-- 1. Better Auth two-factor plugin schema (better-auth 1.6.30,
--    plugins/two-factor/schema.mjs): a `twoFactor` table and
--    `user.twoFactorEnabled`. camelCase, double-quoted, like 0001_auth.sql.
--    `backupCodes` holds HMAC hashes of the recovery codes, never the codes
--    (src/lib/auth/recovery-codes.ts); `secret` is encrypted by the plugin.

alter table "user" add column if not exists "twoFactorEnabled" boolean default false;

create table if not exists "twoFactor" (
  "id" text not null primary key,
  "secret" text not null,
  "backupCodes" text not null,
  "userId" text not null references "user" ("id") on delete cascade,
  "verified" boolean default true,
  "failedVerificationCount" integer default 0,
  "lockedUntil" timestamptz
);
create index if not exists "twoFactor_secret_idx" on "twoFactor" ("secret");
create index if not exists "twoFactor_userId_idx" on "twoFactor" ("userId");

-- 2. Fixed-window rate-limit counters, shared by every serverless instance
--    (the old limiter lived in one instance's memory, OPS-6).
create table if not exists rate_limit_counters (
  key           text not null,
  window_start  timestamptz not null,
  count         integer not null default 0,
  primary key (key, window_start)
);
create index if not exists rate_limit_counters_window_idx on rate_limit_counters (window_start);

-- 3. Every team sign-in, two-factor, reset and setup attempt.
create table if not exists sign_in_attempts (
  id          text primary key,
  created_at  timestamptz not null default now(),
  kind        text not null,
  email       text,
  user_id     text,
  ip          text,
  user_agent  text,
  outcome     text not null
);
create index if not exists sign_in_attempts_created_idx on sign_in_attempts (created_at desc);
create index if not exists sign_in_attempts_email_idx on sign_in_attempts (email, created_at desc);
