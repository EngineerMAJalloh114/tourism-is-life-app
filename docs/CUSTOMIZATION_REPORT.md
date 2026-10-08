# Customization report

Progress against `docs/CUSTOMIZATION_PLAN.md` (PR #2). One commit per task. Status is
GREEN (gate passed), SKIPPED (reverted after two failed fixes, reason given) or PENDING.
Resume from the first task that is neither GREEN nor SKIPPED.

**Baseline** (`main` at `55eb69a`, clean `npm ci`): typecheck 0 errors, lint 0 problems,
tests 324 (322 pass, 2 skipped on Windows, 0 fail), `build:dev` OK, `check:assets` OK
(145 assets).

## Milestone A: `feat/admin-core`

| Task | Status | Tests (total / skipped / failed) | Migration |
|---|---|---|---|
| A1 Capabilities and SEC-6 | GREEN | 373 / 2 / 0 | `0005_capabilities` |
| A2 Append-only audit log | GREEN | 383 / 2 / 0 | `0006_audit_append_only` |
| A3 Team sign-in, two-factor, password reset | GREEN | 415 / 2 / 0 | `0007_team_sign_in` |
| A4 Admin shell | PENDING | | |
| A5 Team accounts | PENDING | | |
| A6 Media library and uploads | PENDING | | |
| A7 Site settings | PENDING | | |
| A8 Collections I | PENDING | | |
| A9 Collections II | PENDING | | |
| A10 Rates and ratings | PENDING | | |
| A11 Announcements | PENDING | | |
| A12 Enquiry desk | PENDING | | |

### A1 notes

- **Guard design.** Every admin server function lives in `src/lib/server/admin/*.functions.ts`,
  uses `staffMiddleware` (session read with the cookie cache bypassed; 401 signed out or
  inactive, 403 not a team account; typed errors keep their HTTP status), and calls one
  `adminOperation(capability, fn)`, which checks the capability before any query. Tests run
  every operation for a signed-out caller (401) and every role without the capability (403)
  against a database handle that fails if touched; a structure test fails if a server
  function in `admin/` skips the middleware or the operation.
- **Verified in the running app** (`npm run dev:local`, PGLite): `/admin` and `/admin/audit`
  signed out answer 307 to sign-in; the audit server function answers 401 signed out and
  403 for a signed-in non-team account; TanStack Start's own CSRF check refuses a request
  with no same-origin signal (403) before our middleware runs; the local SUPER_ADMIN claim
  works; self-disable is refused with "You cannot disable or remove your own account."
- **Decision: `users.view`.** The plan's table has no capability for seeing the team list.
  Added `users.view` for ADMIN and SUPER_ADMIN (ADMIN is "everything except account
  management", and viewing is not managing). Changing roles or status stays SUPER_ADMIN only.
- **Concurrency.** Role and status changes take `pg_advisory_xact_lock(7214001)` and then
  `select … for update` on the active SUPER_ADMIN rows. PGLite has one connection, so the
  tests assert the lock statements run first; a real race can only be shown on Postgres.
- **`0005` is additive**: `staff_profiles.status` (default `active`), `disabled_at`,
  `disabled_by`, `updated_by`; FK to `user` and CHECKs on role and status, all `NOT VALID`.
- **`check:migrations`** (new, also in `npm test` and CI): fresh PGLite, upgrade from main's
  schema with fixture rows, and every file run twice with no table change.
- **Tooling.** `.claude/launch.json` gains a `dev-local` entry (`npm run dev:local`).

### A2 notes

- `audit(tx, entry)` takes a `TxSql`, which only `inTransaction()` produces, so every audit
  row commits or rolls back with its change (tested: a transaction that fails after
  writing its audit row leaves none). Every admin write now records actor, role, request
  IP, and the value before and after: role changes, status changes, enquiry status, review
  moderation and the SUPER_ADMIN claim.
- `0006` adds `before`, `after`, `actor_role`, `ip` and two indexes, plus triggers that
  refuse `UPDATE`, `DELETE` and `TRUNCATE` (tested on PGLite). Uses `create or replace
  trigger` (Postgres 14+), so re-running it changes nothing.
- The audit page is read-only for `audit.view`: filter by area and action, cursor
  pagination on the full-precision timestamp, before/after per entry.
- **Bug found and fixed while verifying in the browser:** a repeat SUPER_ADMIN claim by the
  account that already owned it was accepted again and wrote a second audit row (behaviour
  carried over from the original code). The claim is now `claimBootstrap()`: a repeat is a
  no-op, anyone else gets 409, and a test pins it.
- The dormant booking engine keeps the old `writeAudit()` (marked deprecated); it is not
  admin code and is not changed by this work.

### A3 notes

- **Resend in Production (required before merge): present.** `vercel env ls` (names only,
  8 October 2026) shows `RESEND_API_KEY` and `RESEND_FROM` in Production. It also shows
  `DATABASE_URL` in **Production only** (not Preview), so preview builds of these branches
  cannot migrate the live database, and `BOOTSTRAP_ADMIN_EMAIL` **is not set** in
  Production, so the claim is locked as owner item O2 intends.
- **Rules** (`src/lib/auth/team-auth.ts`, one function used by the app and by the tests):
  public sign-up closed; only active team accounts may hold a session (database hook), plus
  the owner before the claim with a verified bootstrap address; TOTP two-factor through the
  installed plugin, required before any admin page or server function; recovery codes stored
  as HMAC hashes (stored column checked to hold no plain code; a code works once); "trust
  this device" never honoured; members cannot switch two-factor off or re-enrol over it;
  Postgres rate limits 5 per email and IP, 20 per IP, per 15 minutes on sign-in, code checks,
  reset requests and setup; every attempt logged in `sign_in_attempts`; one message for any
  failed sign-in; 12-hour absolute sessions; reset links last 60 minutes and end every
  session; following a reset or invite link verifies the email.
- **Tested** with the real Better Auth on PGLite (14 tests, TOTP computed from the
  `otpauth://` URI with `node:crypto`, as an authenticator app does), and **in the running
  app** with Playwright in Edge: sign-in, generic wrong-password message, forced enrolment,
  QR drawn locally, 10 recovery codes, a real code enabling two-factor, the second sign-in
  through the code page (wrong code refused, right code accepted), a recovery code, the
  footer link, and every `/team` page at 390 px with no overflow and `noindex,nofollow`.
- **Redirects:** `/login` and `/register` 301 to `/team/sign-in`, `/forgot-password` to
  `/team/forgot-password`, `/reset-password` to `/team/reset-password` keeping the token;
  signed-out `/admin` 307 to `/team/sign-in?next=/admin`. `robots.txt` disallows `/admin`,
  `/team` and `/api`.
- **First-time setup** (`/team/setup`) is open only while there is no team account and no
  claim, accepts only the bootstrap address, and answers every request the same way; the
  emailed link verifies the mailbox, which closes SEC-1. The claim itself stays at `/admin`.
- **Grok:** the always-on gate session plugin is removed; `bearer()` is registered only in the
  Grok workspace preview.
- **"Save tour"** now saves on the device (`til-saved-tours`), the Stay & Dine pattern; the
  cookies page lists it and the existing `til-saved-places` (LEG-16) and says the sign-in
  cookie is for team members, with its own "last updated" date (8 October 2026).
- **QR encoder:** the Project Nayuki QR Code generator (MIT) is vendored at
  `src/lib/vendor/qrcodegen.ts`, adapted to an ES module only. Checked identical to the
  original compiled with `tsc` on 15 cases; two fingerprints pinned in a test.
- **Local test SUPER_ADMIN:** `LOCAL_SUPER_ADMIN_EMAIL` and `LOCAL_SUPER_ADMIN_PASSWORD` in
  `.env.example`; seeded only when `scripts/local-db.mjs` set `TIL_LOCAL_SEED=1`, both database
  URLs are blank and the backend is PGLite (6 tests).
- **Postgres version:** production is Postgres 18 (Neon project metadata, read-only); PGLite
  is 17. Nothing in 0005-0007 differs between them.
- **Small fix:** `src/lib/auth/pglite-dialect.ts` used TypeScript parameter properties, which
  `node --experimental-strip-types` cannot run; rewritten as plain fields (same behaviour).
