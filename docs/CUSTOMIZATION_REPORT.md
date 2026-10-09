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
| A4 Admin shell | GREEN | 418 / 2 / 0 | none |
| A5 Team accounts | GREEN | 442 / 2 / 0 | none (0005 holds the columns) |
| A6 Media library and uploads | GREEN | 500 / 2 / 0 | `0008_media` (+ seed, 86 rows) |
| A7 Site settings | GREEN | 522 / 2 / 0 | `0009_site_settings` (+ seed) |
| A8 Collections I | GREEN | 562 / 2 / 0 | `0010_collections` (+ seed, 42 records) |
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

### A4 notes

- **Menu from the capability map** (`src/lib/admin-menu.ts`): five groups (Operations,
  Content, Site, Team, Security); an item shows only for a role holding its capability, and
  items whose task has not shipped show as "Later". Ten tests check every role's menu, that
  each live item has a route file whose guard asks for the same capability, and that no item
  offers booking, payment or availability.
- **Booking code left the admin.** `/admin/bookings`, `/admin/availability`, `/admin/tours`
  and `/admin/reviews` are removed with their server functions (`commerce.functions.ts`,
  `commerce-admin.ts`); the URLs now 404 even when signed in. The dormant booking tables and
  services are untouched. The dashboard shows counts only (open enquiries, last 7 days, tours
  in the catalogue, and active team accounts for `users.view`).
- **Sign-in log** (`/admin/sign-ins`, `audit.view`) lists `sign_in_attempts`, filterable by
  email. Every admin page now has its own heading; the account bar shows the email, role and
  a Sign out button.
- **Checked in Edge with Playwright** as the local SUPER_ADMIN: menu, active item, all five
  pages, removed URLs 404, collapsible menu at 390 px that closes on navigation, no
  horizontal overflow at 390 px, `noindex,nofollow`, sign out returns `/admin` to sign-in.
  Per-role menus in the browser follow in A5, which creates the other accounts.

### A5 notes

- **Operations** (`src/lib/server/team/accounts.ts`, `staff.ts`): create (name, email, role;
  no password until the member follows the link), send password link, reset two-factor,
  disable, re-enable, remove, change role; the list shows status, role, password set,
  two-factor and last sign-in. All SUPER_ADMIN only (ADMIN 403), never on one's own account,
  the last active SUPER_ADMIN protected, every change audited with before and after, and
  the email sent after the transaction commits (a test proves the order on PGLite).
- **Links:** built the way Better Auth's reset flow builds them (`src/lib/auth/team-links.ts`)
  so the desk can say whether the email went; pinned by a test that sets a password through
  the installed `resetPassword`. The base URL comes from `BETTER_AUTH_URL`, which deployments
  require; the first browser run caught a relative link on the local build, now fixed and
  tested (the link in the email must be absolute).
- **Tighter than A1:** a role change now needs an existing team account. A plain account
  becomes one only through create, which first deletes its old password, other sign-in
  methods, two-factor and sessions, so an old customer sign-up under a team member's address
  cannot be used to get in. Remove deletes the password and two-factor and is final; the
  address can be invited again as a new account. Disable also ends open password links.
- **Checked in Edge** with four real members (one per role) created from the page: each
  link set a password, each member enrolled, each menu matched its role, lower roles saw
  "No access" on `/admin/users`, ADMIN saw the list read-only. Disable signed the member out
  on the next request; a two-factor reset sent the member to `/team/enrol` at the next
  sign-in; a role change changed the member's menu at once; remove signed the member out.
  Team page has no horizontal overflow at 390 px.

### A6 notes

- **Supabase Storage over plain `fetch`, no SDK, no new dependency.** Request shapes confirmed
  on 8 October 2026 against Supabase's own client source (`storage-js` `StorageFileApi.ts`
  and `lib/common/fetch.ts`) and the API keys guide, and pinned by a test with a recording
  `fetch`: signed upload URL `POST /storage/v1/object/upload/sign/{bucket}/{key}` (answer
  `{url}` with `?token=`); browser upload `PUT` to that URL with `x-upsert: false`; upload
  `POST /storage/v1/object/{bucket}/{key}`; download and range `GET` the same path; `HEAD`;
  delete `DELETE /storage/v1/object/{bucket}` with `{"prefixes": [...]}`; public URL
  `/storage/v1/object/public/{bucket}/{key}`. A new secret key goes only in `apikey` (it is
  not a JWT); a legacy `service_role` JWT also goes in `Authorization`. 540 (paused) is
  reported as such. Every call has a 15 s timeout; none runs inside a transaction.
- **One upload path:** the server checks size and type and creates a signed slot for one
  object in the private bucket; the browser sends the file there; the server checks size and
  signature on the first 16 bytes before downloading, decodes with `sharp` (pixel limit,
  still frames only), fixes orientation, drops all metadata including GPS, caps the long side
  at 2400 px, writes WebP 480/960/1600, a JPEG at 1600 and a raw RGB raster (320 px wide,
  private bucket), and only then writes the row and audit entry. A failed row deletes the
  objects; the upload is always deleted. Tickets are signed, tied to the account, 30 minutes.
- **Replace and delete:** a replace writes the new objects, switches in one transaction, and
  deletes the old objects after the commit unless a kept version pins them (`media_usage.
  file_id`); a failed replace keeps the old file. Delete is refused while the photo is used
  anywhere, and for the 86 photos that ship with the site.
- **Provenance:** alt text, source, verified licence and confirmed place are required to
  publish (also a database CHECK); only a published photo may be placed (from B). The seed
  copies each `image-sources.json` record verbatim: 86 files, 43 complete and published,
  43 incomplete (36 with `license_verification_required`, the "unconfirmed" places, and two
  files with no record: `heritage/bunce-tasso-national-parks.jpg`, `misc/og-image.jpg`). The
  record `heritage/bunce-island-cannon.jpg` has no file and is not seeded.
- **`sharp` moved to `dependencies`** (lockfile: only its `dev` flags changed). It is loaded
  with a dynamic `import()` only when a photo is processed (checked in the server bundle), so
  a public page never loads it. It is traced into the Vercel function; whether it runs there
  is checked on the first preview with storage keys (owner item).
- **Drivers:** in-memory fake (tests), local files in `.local-media/` (gitignored) only under
  `npm run dev:local` on PGLite and never on Vercel, Supabase when all four `SUPABASE_*`
  variables exist; otherwise uploads are off with a message naming what is missing. Env names
  in `.env.example` and `docs/DEPLOYMENT_NOTES.md`. A test fails on any `VITE_SUPABASE_*`
  name, and `check:assets` fails if a browser file names `SUPABASE_SERVICE_KEY` or holds
  an `sb_secret_` value.
- **Checked in Edge** through the local driver: a PNG named `.jpg` refused; a real upload
  made four copies with no EXIF; publish refused until provenance was complete; replace
  swapped all four files; delete removed them; the audit log holds every step; 390 px has no
  overflow. Real Supabase was not exercised: no keys exist yet (owner item O5).
- **Pausing:** yes, free-plan pausing takes uploaded photos offline (sources in the plan,
  section 13, and `docs/DEPLOYMENT_NOTES.md`). Recommendation: a paid plan before real uploads.

### A7 notes

- **Settings** (`/admin/settings`, `settings.edit`: ADMIN and SUPER_ADMIN): business, contact
  (each number with its own WhatsApp and SMS switch), social links, default description and
  share image, enquiry recipients, interface text (skip link, 404, error page) and documents
  (sustainability policy link). One draft with a `rev` (a stale save or publish is refused),
  published versions, restore publishes an older version again, 30 kept, every step audited
  with before and after.
- **Checks:** one Zod schema for the form and the server: emails, `+country` phone format,
  https-only links, a shown social account needs a link, no duplicate recipients or numbers,
  and the retired number refused anywhere in any format (`80343826` as digits).
- **Seed generator introduced:** `npm run content:seed` (`scripts/content/generate-seed.mjs`)
  writes the seed from `src/content/defaults/settings.ts`, which is built from the constants
  the site renders. To make those constants real, the root description, share image path,
  skip link, 404 and error text moved into named constants (`seo.ts`,
  `src/content/defaults/interface.ts`); the pages render exactly the same text. A test checks
  the migration's block equals the generator byte for byte; another runs 0009 twice. The
  TikTok placeholder is stored as an empty link (the account stays hidden).
- **Recipients drive the notification:** `submitEnquiry` reads the published list and passes
  it to `notifyEnquiryTeam`; if the settings cannot be read it uses `ENQUIRY_TEAM_EMAILS` and
  logs `enquiry.recipients_from_code`. The seeded list equals today's, so nothing changes for
  the desk until someone publishes a new list. Tested with a mocked Resend, and in the
  browser with a real local enquiry (saved; no fallback logged).
- **Public pages do not read the settings yet** (task B5); only the enquiry notification does.

### A8 notes

- **One engine for every collection** (`src/lib/collections/registry.ts`: a Zod schema, the
  form's fields and the public path per collection; `src/lib/server/collections/items.ts`:
  the operations). Draft with `rev`, publish as a version (30 kept), hide, reorder, trash and
  restore (30 days, then purged when the trash is opened), audit on every step. The admin form
  is built from the field list (`record-form.tsx`), with a photo picker that offers only
  published photos.
- **Seed equals `catalog.ts`:** 4 circuits, 15 destinations, 22 tours and one FAQ group,
  published as version 1 with their references (records in `content_refs`, photos in
  `media_usage`), UUID v5 ids. A test rebuilds every catalogue object from the database and
  compares deeply, claim fields by their text. Deliberately not in records: `bookable`,
  `rating`, `reviewCount`, `priceCents`, `currency` (booking stays out of the admin; ratings
  and rates are A10). The four questions every tour shows became the FAQ group `tour-shared`;
  "Licensed guide" on the Freetown tour is a claim with no source (inventory M8).
- **Rules:** a published key change writes a 301 redirect (older redirects repointed, no
  loops); a record other records point at by key cannot change key; delete is refused while
  pointed at, and for a tour while dormant booking, availability, saved-tour or review rows
  name it; a newly placed photo must be published (complete provenance), photos already on a
  record stay allowed; records pointed at must exist, and be published before this one is;
  recording a claim's source needs `claims.source`; circuit ids are fixed and no circuit can
  be added (the layout uses the four ids). CONTENT_MANAGER edits and publishes; delete and
  restore need ADMIN or SUPER_ADMIN (`collections.delete`).
- **Checked in Edge:** edit, save, publish, slug change with redirect, hide and show, circuit
  reorder, a new destination with a photo from the picker (43 published photos offered),
  trash and restore, a used destination refused with the list of tours using it, 390 px with
  no overflow. The public pages still read `catalog.ts` (they read the database from B5).
