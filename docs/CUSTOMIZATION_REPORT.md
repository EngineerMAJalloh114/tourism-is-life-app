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
| A3 Team sign-in, two-factor, password reset | PENDING | | |
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
