# TOURISM IS LIFE — BASELINE AUDIT

_Task 0 — read-only baseline audit. No application source, database, configuration, or dependency was changed. Date: 2026-09-10._

Sources of truth used: (1) the actual files in `tourism-is-life-app/`, (2) `Tourism_Is_Life_Gap_Analysis.docx` (treated as a claim set to verify, not as fact).

Verification run this session (read-only):

| Check | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | **PASS** (exit 0) |
| Lint | `npm run lint` | **17 errors, 20 warnings** (mostly in `attachments/extracted/`, `.image-research-tmp/`, a few `src/components/vehicle-rental/*`) |
| Unit tests | `npm test` | **55 pass / 0 fail** — but booking/payment/reservation `*.test.ts` are **not included** in the test script |
| Production build | `npm run build` | **PASS** (Vite+Nitro, 7.8s); `db:migrate` skipped (no `DATABASE_URL`) |
| E2E | — | **None** (Playwright installed, zero specs) |
| CI | — | **None** (no `.github/`) |

---

## 1. Executive Summary

Tourism Is Life is a genuine, well-built tourism/DMC web app (TanStack Start + React 19 + PostgreSQL/PGLite). The booking engine, guest checkout, admin command centre, auth gating, and marketing site are all really implemented, with careful concurrency handling and server-side authorization. The code quality is high.

**However, in the state currently on disk the app will not work end-to-end**, for one dominant reason:

> **The `migrations/` folder is missing.** The database schema (bookings, availability, payments, staff, auth tables, etc.) lives in `migrations/*.sql`, which both the runtime (`src/lib/db.ts`) and the deploy migrator (`scripts/migrate.mjs`) load from the project root. That folder is **not present** — only stale copies survive under `attachments/extracted/migrations/`. The last production build (9 Sep) compiled with **zero migrations bundled**. With no schema, every database-backed feature (booking, account, admin, payments, auth persistence) fails at runtime.

Everything else the Gap Analysis lists as "partially complete" is broadly accurate, with a few points now **out of date in the project's favour** (photography has been replaced with licensed local images) and a few **understated** (the auth system is Grok-broker–specific, not generic Google/X OAuth; the live-payment webhook path has a bug that blocks settlement).

**This project is not production-ready.** With focused work the blockers are closable; none require a rewrite.

---

## 2. Architecture

```
Browser (React 19 SPA + SSR)
   │  TanStack Router file routes  (src/routes/**, 83 route files)
   │  TanStack Query + Zustand for client state
   ▼
TanStack Start server functions (createServerFn)   ← Zod validation on every input
   │   src/lib/server/ops.ts        (booking, checkout, enquiries, reviews, admin, roles)
   │   src/lib/server/booking-engine.ts  (holds, settle, expire, capacity)
   │   src/lib/server/webhooks.ts   (payment event application, idempotent)
   │   auth: src/lib/auth/middleware.ts → verify.server.ts → Better Auth
   ▼
Data / services
   ├─ src/lib/db.ts        getSql(): Neon (pg) when DATABASE_URL set, else embedded PGLite
   │                       schema = migrations/*.sql   ◄── MISSING
   ├─ Better Auth          src/lib/auth/server.ts — federates to a **Grok auth broker**
   │                       (genericOAuth), persists to same DB via Kysely/PGLite dialect
   ├─ src/services/payments.ts   PaymentProviderAdapter: Stripe | Moneroo | Demo
   ├─ src/services/reservations.ts  Postgres capacity (source of truth) + optional Upstash lock
   ├─ src/services/notify.ts     Resend (email) + Twilio (SMS), no-op without keys
   ├─ src/services/storage.ts    R2/S3 URL-prefix helper (no upload client)
   └─ src/lib/server/rate-limit.ts   in-memory tokens, or Upstash INCR
   ▼
Build/deploy: Vite 8 → Nitro (preset "vercel") → .vercel/output/  (committed to repo)
```

Route groups: public marketing (`/`, `/destinations`, `/tours`, `/journal`, `/cruise`, `/services`, `/about`, `/contact`, `/partner`), booking (`/booking/$slug`), checkout (`/checkout/$ref/*` — guests, review, payment, processing, confirmation, voucher, failed, cancelled, expired), account (`/account/*`), admin (`/admin/*`), auth (`/login`, `/register`, `/forgot-password`, `/reset-password`), API (`/api/auth/$`, `/api/webhooks/stripe`, `/api/webhooks/moneroo`).

---

## 3. What Is Working (verified against code)

- **Marketing site & routing** — 83 route files, file-based routing, SEO helpers (`src/lib/seo.ts`), JSON-LD, sitemap/robots via `grok-pwa-plugin`. Builds cleanly.
- **Tour catalogue** — `src/data/catalog.ts` (65 `slug:` entries incl. circuits/destinations/tours), `src/data/cruise.ts`, `src/data/vehicle-rental.ts`. Static TS data.
- **Booking hold engine** — `createHoldTx` (booking-engine.ts): atomic capacity via conditional `UPDATE availability SET reserved_seats = reserved_seats + n WHERE (max_capacity - booked_seats - reserved_seats) >= n`; 15-minute hold; audit-logged; access token (SHA-256) issued for guest authorization.
- **Booking state machine** — explicit allowed transitions (`booking-state.ts`), `assertTransition` enforced on settle/cancel/fail; `SELECT … FOR UPDATE` row locks in `settleBookingTx` / `releaseAndMark`.
- **Guest checkout** — `saveGuestDetails`, `getCheckoutBooking`, quote-only detection, `confirmDemoPayment` (gated by `demoPaymentsAllowed()`), voucher code issued only inside the confirmed transaction.
- **Webhook idempotency** — `webhook_events (provider, provider_event_id) UNIQUE`; duplicate events short-circuit; `payments` insert de-duped on `(provider, provider_ref)`.
- **Payment provider abstraction** — `PaymentProviderAdapter` with Stripe, Moneroo, Demo; Stripe/Moneroo send `Idempotency-Key`; **$0 live charge is refused**; signature verification implemented (`verifyStripeSignature` with timestamp tolerance, `verifyHmacSha256` with `timingSafeEqual`).
- **Auth gating** — `authMiddleware` → `assertSameSiteRequest()` (Fetch-Metadata sibling-isolation guard) → `requireUserId()` (fail-closed: throws if `DATABASE_URL` set but auth disabled). `__Host-` prefixed session cookies. Better Auth `trustedOrigins` configured.
- **Server-side RBAC** — every `admin*` server function in `ops.ts` calls `requireStaff(context.userId[, minRole])` after `authMiddleware`; the `/admin` React layout gate is UX only, not the security boundary. Role ranks in `src/lib/roles.ts`.
- **Account isolation** — per-user queries scoped by `context.userId`; booking access also gated by access token or ownership (`loadBookingAuthorized`).
- **Admin role management** — `adminSetRole` prevents non-SUPER_ADMIN granting SUPER_ADMIN and blocks demoting the last SUPER_ADMIN.
- **Images** — 73 local files under `public/images/`, catalog uses only `/images/...` paths (**zero Unsplash URLs remain**), `public/images/image-sources.json` records source/author/licence.
- **Cross-platform local run & build** — Node 20+, pure-Node scripts, `npm run dev/build/preview`.
- **Unit tests** — 55 passing (scripts + app-data + auth gate + sign-in gate).

---

## 4. Partially Working

- **Database layer** — code is correct, but the **schema files are missing** (see §6 #1). PGLite path and Neon path both depend on `migrations/*.sql`.
- **Payments** — abstraction + signature verification present; **demo settlement works**, **live settlement is blocked** by a bug (§6 #4). No live charge has ever run. All tours are quote-only (no `priceCents` set on any catalogue entry), so the live-charge path is currently unreachable anyway.
- **Authentication** — works in the Grok preview via a baked preview client + Grok broker. **Not** wired to standalone Google/X OAuth apps; `GOOGLE_CLIENT_ID` / `TWITTER_CLIENT_ID` are in `.env.example`/README but **read nowhere in code** (§6 #2). Email/password is behind a toggle in `src/lib/auth/email-password.ts`.
- **Admin bootstrap ("first user = SUPER_ADMIN")** — partially locked: gated by `bootstrapEmailAllowed()` + a single-row `bootstrap_lock` table + `BOOTSTRAP_ADMIN_EMAIL` when `isDeployedRuntime()`. Risk remains on a non-Grok host (§7 HIGH-1).
- **Reservation locking** — Postgres capacity check is solid and standalone; Upstash Redis lock is a best-effort accelerator, inactive without credentials. No load/concurrency test exists.
- **Hold expiry** — lazy only (`expireHolds()` runs on the next relevant request). `cronAuthorized()` + `CRON_SECRET` exist but there is **no cron route** and no scheduled worker.
- **Notifications** — Resend/Twilio wrappers implemented, deliberately no-op without keys. Templates are minimal inline HTML (`notifyBookingConfirmed`, `notifyEnquiryReceived`) — not branded, no password-reset template wired.
- **Storage** — `src/services/storage.ts` only computes public URLs / picks a backend from env. **No object upload or read client**; nothing writes to R2/S3.
- **Rate limiting** — `consumeRateLimit` used via `guardPublicMutation` on public mutations (e.g. `createHold`). In-memory Map fallback is **per-instance** (weak on serverless); Upstash used when configured.
- **Localization** — French is a nav label only; no i18n framework.
- **Vehicle rental** — routes/components/data exist and typecheck, but several files carry lint errors/unused-import warnings; not covered by tests.

---

## 5. Missing / Not Implemented

- `migrations/` directory (schema) — **absent from the repo**.
- A `0004`-class migration for columns/tables the **current** code needs but the stale `attachments/extracted/migrations` lack: `bookings.amount_cents`, `bookings.currency`, `payments.amount_cents`, `payments.currency`, and the `bootstrap_lock` table.
- Scheduled hold-expiry worker / cron route.
- Playwright E2E suite (booking → checkout → payment → voucher).
- CI pipeline (lint / typecheck / test / build on push).
- Branded transactional email/SMS templates; password-reset email delivery.
- Real object storage integration (upload/serve via R2/S3).
- Production hosting target + secrets management + production `DATABASE_URL`.
- i18n content pipeline for French.
- On-site attribution page for the CC BY-SA image licences now in use.
- Git version control (the project is **not a git repository**).
- Seed/demo dataset for stakeholder walkthroughs.
- Backup/restore & migration-rollback runbook.
- Standalone Google/X OAuth wiring (if the business wants OAuth off the Grok broker).

---

## 6. Production Blockers

1. **Missing database schema (`migrations/`).** `src/lib/db.ts` globs `/migrations/*.sql`; `scripts/migrate.mjs` reads `../migrations`; `vite.config.ts` `hasGlobbedMigrations()` returns false so PGLite bootstrap is even skipped. The 9 Sep `.vercel` build shows `const migrations = Object.assign({})` — nothing bundled. **No schema on any backend → no bookings, no auth persistence, no admin, no payments.** _Blocker, and it also invalidates several "works end-to-end" claims until restored._
2. **Auth is coupled to the Grok auth broker.** `src/lib/auth/server.ts` federates via `genericOAuth` to `GROK_AUTH_ISSUER` using `GROK_AUTH_CLIENT_ID/SECRET` (falling back to a shared **preview** client that only accepts `*.grok-sandbox.com` callbacks). On a real domain, sign-in requires the deployer to inject `GROK_AUTH_*` + `BETTER_AUTH_URL` + `BETTER_AUTH_SECRET`, **or** the auth layer must be re-pointed at real IdPs. Not a drop-in `GOOGLE_CLIENT_ID`.
3. **`isDeployedRuntime()` / `isWorkspacePreview()` key only off `GROK_PROJECT_ID`.** On any non-Grok host that variable is unset, so the app believes it is "preview": demo payments could be allowed, and the admin bootstrap is not locked (§7 HIGH-1). Needs a production signal that works off-Grok.
4. **Live payment webhooks cannot settle a booking.** `src/routes/api/webhooks/stripe.ts` and `moneroo.ts` parse the body themselves and call `applyVerifiedPaymentEvent({provider, eventId, bookingId, success})` **without `amountCents`/`currency`**. `evaluatePaymentEvent` then rejects every live success with `missing_or_zero_amount`. (The provider adapters' own `parseWebhook` _do_ extract the amount but are not used by the routes.) Demo path is unaffected.
5. **No published prices.** No catalogue entry sets `priceCents`; every tour is quote-only; the currency toggle is display-only. Live payments are moot until the business supplies tariffs.
6. **No production `DATABASE_URL`, hosting, or secrets** configured (expected — needs business/infra decisions).
7. **No automated safety net** — no CI, no E2E, and the booking/payment/reservation unit tests are not in `npm test`.

---

## 7. Security Risks

Positive baseline: Zod on all server inputs; server-side `requireStaff`; same-site scripted-request guard; `__Host-` cookies; webhook signature verification + idempotency; `FOR UPDATE` locks; `$0` live charge refused; fail-closed `requireUserId`. Findings below are about gaps, not existing exploits — and note that with the schema missing the app cannot currently run to be attacked.

**CRITICAL**
- **C-1 Schema loss = total data-layer outage.** Treating availability as a security/production-integrity issue: a deploy from the current tree yields an app with no tables; behaviour under that condition (partial writes, silent failures) is untested. Restore `migrations/` before anything else. _Evidence: `src/lib/db.ts:176`, `scripts/migrate.mjs:29`, `.vercel/output/functions/__server.func/_ssr/booking-engine-*.mjs:160`._

**HIGH**
- **H-1 Admin bootstrap open on a non-Grok production host.** `bootstrapEmailAllowed()` returns `true` for any verified email when `!isDeployedRuntime()`, and `isDeployedRuntime()` is only `Boolean(env("GROK_PROJECT_ID"))`. Deploy to Vercel/Fly/VPS without that var and the first signed-in user with a verified email can `bootstrapStaff()` → `SUPER_ADMIN` while `staff_profiles` is empty. _Evidence: `src/lib/server/config.ts:5,27-34`, `src/lib/server/ops.ts:376-405`._ Fix later: gate on an explicit `NODE_ENV=production` / `APP_ENV` / presence of `DATABASE_URL`, and always require `BOOTSTRAP_ADMIN_EMAIL` (or an invite code) in production.
- **H-2 No CI / E2E on money-and-identity paths.** Booking, payment and reservation logic has unit files that `npm test` does not run, no integration coverage of the webhook→settle→voucher path, and no regression gate. Risk of silent breakage on every change. _Evidence: `package.json:24`; `src/lib/server/payments.test.ts`, `src/services/payments.test.ts`, `src/services/reservations.test.ts`, `src/lib/server/booking-state.test.ts` not referenced._

**MEDIUM**
- **M-1 Live webhook amount bug (also a correctness hole).** See §6 #4. Because the route drops the amount, the amount/currency-match validation in `evaluatePaymentEvent` is effectively dead for live providers, and if the reject were ever removed a booking could confirm without an amount check. _Evidence: `src/routes/api/webhooks/stripe.ts:35-40`, `src/lib/server/evaluate-payment.ts:44-58`._
- **M-2 Rate limiting is per-instance in the default (serverless) case.** `rate-limit.ts` Map fallback resets per lambda / is not shared, so `guardPublicMutation` limits are weak without Upstash. Abuse of `createHold`, enquiry, newsletter endpoints is only lightly bounded. _Evidence: `src/lib/server/rate-limit.ts:5-19,69-81`._
- **M-3 Secret-name drift.** `.env.example` lists `MONEROO_API_KEY`; code requires `MONEROO_SECRET_KEY` + `MONEROO_WEBHOOK_SECRET`. README still describes `GOOGLE_CLIENT_ID`/OAuth that code ignores. Operators can easily misconfigure and think payments/auth are wired. _Evidence: `.env.example`, `src/lib/server/config.ts:13-14`, `README.md:47-50`._
- **M-4 `.vercel/output/` build artefacts and `attachments/extracted/` full source duplicate are committed.** Stale bundles can be deployed by accident; the duplicate tree confuses audits and contains a syntactically broken file. _Evidence: `.vercel/output/**`, `attachments/extracted/src/services/notify.ts:119` (parse error)._

**LOW**
- **L-1 CC BY-SA attribution not shown on-site.** 12+ images are CC BY-SA (2.0/3.0/4.0); licence terms require visible attribution. `image-sources.json` exists but nothing renders it. _Evidence: `IMAGE_IMPLEMENTATION_REPORT.md:29-38`, `public/images/image-sources.json`._
- **L-2 17 ESLint errors** in tracked paths (`.image-research-tmp/*.cjs`, `attachments/extracted/**`, `scripts/qa-render.mjs`, `scripts/test-vehicle-rental.mjs`, some `src/components/vehicle-rental/*`). `npm run lint` currently exits 0 despite them (masking).
- **L-3 Repo hygiene** — empty file literally named `{}`, `candidates6.json`, `.image-research-tmp/`, `.vehicle-img-tmp/`, `.image-research-tmp` in tree.

**INFORMATIONAL**
- **I-1 No version control.** `tourism-is-life-app/` is not a git repo; there is no history, no branch protection, no way to see what changed between the Gap Analysis snapshot and now (which is how `migrations/` was lost unnoticed).
- **I-2** `demoPaymentsAllowed()` correctly disables demo settlement when deployed or when live keys exist — good.
- **I-3** Better Auth files are explicitly marked "do not rewrite"; treat `src/lib/auth/**` as frozen unless a task specifically targets it.

---

## 8. Required Credentials (names only — no values were read or shown)

| Variable (name only) | Used by | Required for | Configured now? |
|---|---|---|---|
| `DATABASE_URL` | `src/lib/db.ts`, `scripts/migrate.mjs`, `src/lib/auth/server.ts` | Production Postgres (else embedded PGLite) | Not set (NOT VERIFIED for any deploy env) |
| `STRIPE_SECRET_KEY` | `src/services/payments.ts`, `config.ts` | Live card payments | Not set |
| `STRIPE_WEBHOOK_SECRET` | `payments.ts`, `routes/api/webhooks/stripe.ts` | Verifying Stripe webhooks | Not set |
| `MONEROO_SECRET_KEY` | `payments.ts`, `config.ts` | Live mobile-money payments | Not set |
| `MONEROO_WEBHOOK_SECRET` | `payments.ts`, `routes/api/webhooks/moneroo.ts` | Verifying Moneroo webhooks | Not set |
| `APP_ORIGIN` | `payments.ts` | Stripe/Moneroo success/cancel URLs | Not set (falls back to `https://tourismislife.com`) |
| `RESEND_API_KEY` | `src/services/notify.ts` | Transactional email | Not set |
| `RESEND_FROM` | `notify.ts` | Email "from" address | Not set (has default) |
| `TWILIO_ACCOUNT_SID` | `notify.ts` | SMS | Not set |
| `TWILIO_AUTH_TOKEN` | `notify.ts` | SMS | Not set |
| `TWILIO_FROM` | `notify.ts` | SMS sender number | Not set |
| `UPSTASH_REDIS_REST_URL` | `services/reservations.ts`, `rate-limit.ts` | Distributed hold lock + rate limit | Not set |
| `UPSTASH_REDIS_REST_TOKEN` | `reservations.ts`, `rate-limit.ts` | Same | Not set |
| `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_ENDPOINT`, `R2_PUBLIC_BASE` | `services/storage.ts` | Cloudflare R2 media | Not set |
| `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_ENDPOINT`, `S3_PUBLIC_BASE` | `services/storage.ts` | AWS S3 media | Not set |
| `GROK_AUTH_ISSUER`, `GROK_AUTH_CLIENT_ID`, `GROK_AUTH_CLIENT_SECRET` | `src/lib/auth/server.ts` | Real federated sign-in off-preview | Not set (uses baked preview client) |
| `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` | `src/lib/auth/server.ts` | Stable auth origin + session signing in production | Not set (preview uses a random per-process secret) |
| `VITE_AUTH_ENABLED` | `auth/server.ts`, `with-app-env.mjs` | Explicit auth on/off | NOT VERIFIED (read from `.grok/app-env.json`; not inspected) |
| `GROK_PROJECT_ID` | `src/lib/env.server.ts`, `config.ts` | "is this production?" signal | Not set locally |
| `BOOTSTRAP_ADMIN_EMAIL` | `src/lib/server/config.ts` | Locking the SUPER_ADMIN bootstrap in production | Not set |
| `CRON_SECRET` | `src/lib/server/config.ts` | Authorizing a future hold-expiry cron | Not set |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` | **none** (named in docs only) | — | Referenced in `.env.example`/README but unused by code — NOT VERIFIED as a real requirement |

No secret values were printed, logged, or inspected. Whether any of the above are set in a real deployment environment is **NOT VERIFIED** (no such environment was accessed).

---

## 9. Required Business Inputs

Genuinely required by the code / Gap Analysis:

- **Approved public prices** for bookable tours (and cruise/vehicle where sold online). Until then all bookings are quote-only and no live payment can be taken. _Code: `src/data/catalog.ts` (no `priceCents` set), `src/lib/server/pricing.ts`._
- **REQUIRED BUSINESS DECISION** — cancellation window / refund policy / fees (no refund logic beyond state transitions exists; nothing should be invented).
- **REQUIRED BUSINESS DECISION** — production auth approach: keep the Grok broker (needs `GROK_AUTH_*` from that platform) or wire real Google/X OAuth apps.
- **REQUIRED BUSINESS DECISION** — who is the first `SUPER_ADMIN` (email for `BOOTSTRAP_ADMIN_EMAIL`, or an invite-code scheme), and the real staff roster to seed `staff_profiles`.
- **REQUIRED CONTENT** — team roster + bios + **authorized headshots** (currently none; `[CONTENT REQUIRED]` in `src/routes/about/team.tsx`).
- **REQUIRED CONTENT** — sustainability certificates / emissions data (`[CONTENT REQUIRED]` in `src/routes/about/sustainability.tsx`).
- **REQUIRED CONTENT** — detailed cruise case-study write-ups (`[CONTENT REQUIRED]` in `src/routes/cruise/case-studies.tsx`).
- **REQUIRED CONTENT / DECISION** — whether the current CC-licensed Wikimedia images are acceptable for launch or should be replaced with owned/commissioned photography; if kept, an attribution page is needed.
- **REQUIRED IMAGE** — any destination/tour/cruise/service slots the business considers mismatched (per `IMAGE_AUDIT.md`, now partly addressed).
- **REQUIRED EXTERNAL SERVICE** — production Postgres (e.g. Neon), payment accounts (Stripe, Moneroo), Resend, Twilio, Upstash, R2/S3, and a hosting platform.

---

## 10. Engineering Work Required

1. **Restore `migrations/`** to the project root (recover the current versions — including the `0004`-class file adding `amount_cents`/`currency`/`bootstrap_lock` — not the stale `attachments/extracted` copies). Verify PGLite bootstrap and `scripts/migrate.mjs` both pick them up. _This is task 1._
2. Put the project under **git** and commit a known-good baseline.
3. Fix the **live payment webhook** routes to use the provider adapters' `parseWebhook` (so `amountCents`/`currency` reach `applyVerifiedPaymentEvent` and the amount/currency checks work).
4. Replace the `GROK_PROJECT_ID`-only "is production" check with a robust signal; **always lock the admin bootstrap in production** (require `BOOTSTRAP_ADMIN_EMAIL` or invite code).
5. Add a **scheduled hold-expiry** worker/cron route (guarded by `CRON_SECRET` / `cronAuthorized`).
6. Wire booking/payment/reservation tests into `npm test`; add **Playwright E2E** for hold → guests → pay (demo) → voucher, and for auth + RBAC.
7. Add a **CI workflow** (install → typecheck → lint → test → build) and make `npm run lint` fail on real errors; clean or ignore `.image-research-tmp/`, `attachments/extracted/`, `.vercel/output/`, `{}`, `candidates6.json`.
8. Decide + implement production auth (Grok broker creds vs real OAuth apps); set `BETTER_AUTH_URL` / `BETTER_AUTH_SECRET`.
9. Branded transactional email/SMS templates; wire password-reset email.
10. Real R2/S3 upload/serve (if media is to be bucket-hosted); otherwise document "public/ only".
11. On-site image attribution page from `image-sources.json`.
12. Concurrency/load test proving no double-booking for the last seat.
13. Backup/restore + migration-rollback runbook; optional seed script.
14. Reconcile `.env.example` + README with the variables the code actually reads.
15. Resolve `src/components/vehicle-rental/*` lint issues; add vehicle-rental tests.
16. (Later) i18n approach for French.

---

## 11. Gap Analysis Verification (all 16 sections)

Legend: ✅ verified complete · 🟡 verified partial · 🔴 verified not complete · ⚠️ gap analysis outdated/incorrect · ❓ not verified

| # | Section | Verdict | Evidence |
|---|---|---|---|
| 1 | Marketing / Public Website | 🟡 | 83 route files, SEO helpers present. Pricing display-only; `[CONTENT REQUIRED]` markers in team/sustainability/cruise. Matches GA. |
| 2 | Destinations & Tour Catalogue | 🟡 / ⚠️ | Static `src/data/catalog.ts` (65 entries) — matches. **Photography claim outdated**: catalogue now uses 73 local CC-licensed images, zero Unsplash (`IMAGE_IMPLEMENTATION_REPORT.md`). |
| 3 | Booking & Checkout Engine | 🟡 | Engine, pricing, state machine, holds all real (`booking-engine.ts`, `ops.ts`). Lazy hold-expiry confirmed. **But** non-functional right now due to missing schema. |
| 4 | Payments (Stripe/Moneroo) | 🟡 / ⚠️ | Abstraction + signed webhooks exist. GA understates: **live webhook path is bugged** (amount dropped → always rejected). Demo-only, as GA says. `.env.example` names `MONEROO_API_KEY`, code wants `MONEROO_SECRET_KEY`+`MONEROO_WEBHOOK_SECRET`. |
| 5 | Reservation Locking / Concurrency | 🟡 | Postgres capacity check solid & standalone; Upstash lock coded, inactive w/o creds. No concurrency test. Matches GA. |
| 6 | Authentication & Identity | 🟡 / ⚠️ | Better Auth present with email/password toggle + gate identity. **GA/README wrong on mechanism**: OAuth is via a **Grok auth broker** (`genericOAuth`), not `GOOGLE_CLIENT_ID`/`TWITTER_CLIENT_ID` (unused). Bootstrap concern real but **partly mitigated** already (see §7 H-1). |
| 7 | Customer Account Area | 🟡 | All `/account/*` routes exist and are gated; data depends on live bookings. No account-area tests. Matches GA. |
| 8 | Admin / Ops Command Centre | 🟡 | All admin routes + server-side `requireStaff` verified in `ops.ts`. No staff runbook. Matches GA. |
| 9 | Notifications (Email/SMS) | 🟡 | `notify.ts` Resend+Twilio wrappers, real no-op without keys. Templates minimal, not branded; no reset-email wiring. Matches GA ("Not Started – blocked on credentials") but wrappers do exist. |
| 10 | File / Media Storage | 🟡 / ⚠️ | `storage.ts` exists but is a **URL/backends helper only — no upload/read client**. Nothing connected. GA overstates "abstraction to target R2 or S3 interchangeably". |
| 11 | Visual Content / Photography | ⚠️ | **Outdated in project's favour**: Unsplash fully replaced with 73 local Wikimedia CC images + `image-sources.json`. Still: not owned/commissioned, no team portraits, attribution not shown on-site. |
| 12 | Localization / Multi-language | 🔴 | French = nav label only. No i18n framework. Matches GA. |
| 13 | Database & Schema | 🔴 / ⚠️ | **GA says "three ordered migrations auto-applied … works out of the box" — currently FALSE**: `migrations/` is missing from the repo; last build bundled none; stale copies in `attachments/extracted` also lack columns the current code needs. No backup/rollback doc. No seed. |
| 14 | Testing & QA | 🟡 | 55 unit tests pass; typecheck + build pass. **No Playwright specs, no CI** (confirmed — no `.github/`). Booking/payment/reservation tests exist as files but are **excluded from `npm test`**. |
| 15 | DevOps, Hosting & Runtime | 🔴 | Builds to `.vercel/output` (Nitro `vercel` preset). No host chosen, no prod `DATABASE_URL`, no secrets manager, no CDN decision. `.vercel/output` is committed (stale-deploy risk). Matches GA. |
| 16 | Security & Access Control | 🟡 | RBAC server-side ✅, Zod ✅, signed webhooks ✅ (but see #4), `rate-limit.ts` exists (in-memory/Upstash, not load-tested). Admin bootstrap gap real; no formal security review. Matches GA, plus new findings in §7. |

Consolidated Action List (A–D) in the docx: **A (credentials)** verified accurate except Moneroo/OAuth variable-name drift; **B (business content)** accurate; **C (engineering)** accurate and expanded in §10; **D ("already solid")** mostly accurate **except** it should not claim the database/booking flow is solid while `migrations/` is missing.

---

## 12. Recommended Implementation Order

0. *(done)* Baseline audit.
1. **Restore the `migrations/` directory** (schema) to the project root and verify both PGLite bootstrap and `scripts/migrate.mjs` apply all files cleanly; confirm a hold → guest → demo-pay → voucher cycle works locally. **← FIRST TASK**
2. Initialise git, commit the restored baseline.
3. Add CI (typecheck/lint/test/build) and wire the booking/payment/reservation tests into `npm test`; make lint meaningful.
4. Fix the live payment webhook amount/currency plumbing; add integration tests for webhook → settle → voucher (success + failure).
5. Harden the production/preview split and lock the SUPER_ADMIN bootstrap for production; seed real staff.
6. Decide + implement production authentication (Grok broker vs real OAuth); set `BETTER_AUTH_URL`/`BETTER_AUTH_SECRET`.
7. Scheduled hold-expiry worker/cron.
8. Playwright E2E for the critical journeys.
9. Notifications: branded templates + password-reset email; then provision Resend/Twilio.
10. Provision production Postgres; write backup/restore + rollback runbook; optional seed script.
11. Choose hosting; configure secrets manager; remove committed build artefacts; CDN if wanted.
12. Wire real prices when the business supplies them; enable live payments; run a small real charge + refund QA.
13. Image attribution page; decide on owned photography; i18n later.
14. Commission an external security review before taking real payments/PII at scale.

---

## 13. Evidence (key findings)

| Finding | File / location | Note |
|---|---|---|
| Schema loading path | `src/lib/db.ts:176` `import.meta.glob("/migrations/*.sql", …)` | Root-relative; folder absent |
| Deploy migrator path | `scripts/migrate.mjs:29` `join(dirname(...), "..", "migrations")` | Prints "no migrations/ directory" |
| Build proof of no migrations | `.vercel/output/functions/__server.func/_ssr/booking-engine-*.mjs:160` | `const migrations = Object.assign({})` |
| Vite skips PGLite bootstrap when no migrations | `vite.config.ts:16-22,38` | `hasGlobbedMigrations()` |
| Stale schema missing current columns | `src/lib/server/booking-engine.ts:109-128` inserts `amount_cents,currency`; `attachments/extracted/migrations/0002_dmc.sql`,`0003_ops.sql` lack them | plus `bootstrap_lock` (`ops.ts:389`) |
| Auth = Grok broker | `src/lib/auth/server.ts:80-86,153-173` | `GROK_AUTH_*`, `PREVIEW_CLIENT_ID`; no `GOOGLE_CLIENT_ID` anywhere |
| "is production?" = one env var | `src/lib/env.server.ts:12-14`, `src/lib/server/config.ts:5` | `GROK_PROJECT_ID` only |
| Admin bootstrap gate | `src/lib/server/ops.ts:376-405`, `config.ts:27-34` | open when `!isDeployedRuntime()` |
| Admin RBAC enforced server-side | `src/lib/server/ops.ts:407-415` `requireStaff` + all `admin*` fns | `/admin` React gate is UX only (`src/routes/admin.tsx:45-52`) |
| Live webhook drops amount | `src/routes/api/webhooks/stripe.ts:35-40`, `moneroo.ts:33-38` vs `evaluate-payment.ts:44-58` | → `missing_or_zero_amount` |
| Capacity is atomic | `src/lib/server/booking-engine.ts:96-104`, `inventory.ts` | conditional `UPDATE` |
| Webhook idempotency | `src/lib/server/webhooks.ts:19-47`; `migrations …0003_ops.sql:30-38` `webhook_events` unique | |
| No prices | `src/data/catalog.ts` (no `priceCents:` on any entry); `src/lib/server/pricing.ts:11-18` | all quote-only |
| Storage has no client | `src/services/storage.ts` (whole file) | URL helper only |
| Rate limit per-instance fallback | `src/lib/server/rate-limit.ts:5-19,69-81` | |
| No E2E / no CI | no `*.spec.ts`, no `playwright.config`, no `.github/` | |
| Tests excluded | `package.json:24` | booking/payment/reservation `*.test.ts` not listed |
| Images replaced | `IMAGE_IMPLEMENTATION_REPORT.md`, `public/images/` (73 files), `src/data/catalog.ts` (only `/images/...`) | CC licences |
| Not a git repo | `tourism-is-life-app/` has no `.git` | |
| Committed build output & duplicate tree | `.vercel/output/**`, `attachments/extracted/**` | |

---

## 14. Final Status

**BASELINE AUDIT STATUS: COMPLETE**

**FIRST RECOMMENDED IMPLEMENTATION TASK:**
Restore the missing `migrations/` directory to `tourism-is-life-app/migrations/` — recover the current schema files (the auth `0001`, DMC/booking `0002`, ops `0003`, and the later migration that adds `bookings.amount_cents` / `bookings.currency` / `payments.amount_cents` / `payments.currency` / the `bootstrap_lock` table), place them where `src/lib/db.ts` and `scripts/migrate.mjs` expect them, and verify (read-only run + local dev) that PGLite bootstrap and the deploy migrator both apply every file cleanly and that a hold → guest-details → demo-payment → voucher cycle works locally.

Do not implement this yet. **Waiting for your approval.**
