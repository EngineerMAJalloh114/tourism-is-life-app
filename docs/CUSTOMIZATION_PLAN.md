# Admin customization plan

Status: **proposal for approval** (Stage 1). No feature code is in this branch.
Date: 7 October 2026. Finding IDs (PERF-1, SEC-6, OPS-4 and so on) refer to the gap
analysis in `artifacts/Tourism-Is-Life-Gap-Analysis-and-Roadmap.pdf`.

**Goal.** The SUPER_ADMIN and the team they appoint can change content, rates, people
and settings from `/admin`, with no developer needed for day-to-day changes.

**Fixed constraints.** Enquiry-only: booking, checkout and payment code stays dormant
and never appears in the admin. Nothing invented: no price, rating, review,
certification or partnership without a recorded source. Visual design, themes and
tokens unchanged. Approved contact details seeded exactly. No DNS or production data
changes. Every admin write is audited.

**Before Stage 2 starts.** The owner merges PR #1 (`chore/ship-pending-work`) and
claims SUPER_ADMIN on the live site from the `BOOTSTRAP_ADMIN_EMAIL` address. Stage 2
closes public sign-up, so the claim must happen first.

---

## 1. Inventory: what is hardcoded today, and where it will be edited

Roles in the last column use the capability map in section 3. "Content team" means
CONTENT_MANAGER, ADMIN and SUPER_ADMIN. Line numbers are from commit `cd27dcf`.

| # | Item | Where it lives today | Admin page that will edit it | Roles that may edit |
|---|---|---|---|---|
| 1 | Business name, legal name, tagline, description | `src/lib/site.ts:1-24` (`SITE`); tagline duplicated at `src/routes/index.tsx:36` and `src/components/layout/site-footer.tsx:110` | Settings › Business | SUPER_ADMIN |
| 2 | Contact details: two phones, email, WhatsApp and SMS links, address, emergency note | `src/lib/site.ts:1-24`, `src/lib/contact.ts:5-22`, `contact-bar.tsx:17-26`, `mobile-contact-menu.tsx:75-108`, `site-footer.tsx`, `src/routes/contact/*` | Settings › Contact | SUPER_ADMIN |
| 3 | Social links (4 live, TikTok placeholder) | `src/lib/site.ts:32-72`, `social-links.tsx:5-94` | Settings › Social | SUPER_ADMIN |
| 4 | Navigation, including Stay & Dine visibility | `src/lib/site.ts:74-126` (`NAV`); desktop labels hardcoded at `site-header.tsx:185-215`; footer groups `site-footer.tsx:10-49` | Settings › Navigation (visibility and labels; link targets stay in code because they must match real routes) | SUPER_ADMIN |
| 5 | Enquiry notification recipients (desk inbox plus the hardcoded external CC, OPS-9) | `src/lib/site.ts:26-30` (`ENQUIRY_TEAM_EMAILS`), `src/services/notify.ts:250-279`, `src/routes/privacy.tsx:59-63` | Settings › Enquiry recipients | SUPER_ADMIN |
| 6 | Site-wide SEO defaults, Organization JSON-LD, share image | `src/lib/seo.ts:3-59`, `src/routes/__root.tsx:12-38`, `public/manifest.webmanifest` | Settings › SEO | SUPER_ADMIN |
| 7 | Per-page titles and descriptions (55 `pageHead()` calls; 36 static pages) | each `src/routes/**` `head()` | Content › Pages (meta fields on each page) | Content team |
| 8 | Inline page text, about 650 blocks: home (~55), about pages (~20), brochure (~54), contact and partner (~29), cruise pages and sections (~190), services and tours-excursions (~40), vehicle rental (~65), tours templates (~75), destinations wrappers (~19), journal wrappers (~6), sustainability wrappers (~40), forms (~54), header and footer (~26), 404 and error (5), coming soon (4) | `src/routes/**`, `src/components/cruise/sections.tsx`, `src/components/vehicle-rental/*`, `src/components/sustainability/*`, `src/components/layout/*`, `src/components/enquiry-form.tsx`, `newsletter-form.tsx`, `cruise-inquiry-form.tsx`, `src/lib/error-component.tsx` | Content › Pages | Content team |
| 9 | Claims inside page text: 1 DCM World (6 places), AFAR, "licensed guides", Oasis Overland and KE Adventure, "eco-lodge partnerships" | `site-footer.tsx:145`, `index.tsx:239-241,302-303`, `about/index.tsx:35-37`, `about/why-us.tsx:25`, `partner.tsx:29-33`, `brochure.tsx:78-81`, `coming-soon.tsx:12` | Content › Pages, as **claim blocks** that need a source note before they can be shown | Content team edits; ADMIN or SUPER_ADMIN records the source |
| 10 | Homepage hero states (4 slides: headline, sub-heading, description, CTA, image) | `src/lib/hero-media.ts:53-120` | Content › Homepage hero | Content team |
| 11 | Announcements and banners | none exist | Content › Announcements | Content team |
| 12 | Legal pages (privacy, terms, cookies) and "last updated" date | `src/routes/privacy.tsx:18-116`, `terms.tsx:18-114`, `cookies.tsx:17-60`, `src/components/legal-page.tsx` | Content › Legal | ADMIN, SUPER_ADMIN |
| 13 | Circuits (4) | `src/data/catalog.ts:133-178` | Catalogue › Circuits | Content team; delete: ADMIN, SUPER_ADMIN |
| 14 | Destinations (15) | `src/data/catalog.ts:180-196` | Catalogue › Destinations | as above |
| 15 | Tours (22): fields, 115 itinerary days, requirements, inclusions, exclusions, meeting point, gallery (47 images), shared FAQ set | `src/data/catalog.ts:198-1017` | Catalogue › Tours | as above |
| 16 | Tour ratings and review counts (16 tours, no source; values repeat in a cycle, PC-3) | `src/data/catalog.ts` (`rating`, `reviewCount`), shown at `src/routes/tours/$slug.tsx:67` | Catalogue › Tours › Ratings (source link and date required) | ADMIN, SUPER_ADMIN |
| 17 | Services (7) | `src/data/catalog.ts:1019-1083` | Catalogue › Services | Content team |
| 18 | Cruise content: overview, 6 excursions, 6 destinations, port, documentation and payment facts, plus copies duplicated inline | `src/data/cruise.ts`, `src/components/cruise/sections.tsx:39-183`, `src/routes/cruise/*.tsx` | Catalogue › Cruise (structured items) and Content › Pages (prose) | Content team |
| 19 | Cruise excursion prices (USD per person, from "Cruiseship Proposal 2024") | `src/data/cruise.ts:119-270` | Rates | ADMIN, SUPER_ADMIN |
| 20 | Vehicles (8) and categories (8), search lists | `src/data/vehicle-rental.ts` | Catalogue › Vehicles | Content team |
| 21 | Vehicle daily rates, "From $X/day", Available/Limited labels (no source, PC-2) | `src/data/vehicle-rental.ts`, `vehicle-category-card.tsx`, `why-choose-us.tsx` | Rates (prices); Catalogue › Vehicles (availability note) | ADMIN, SUPER_ADMIN |
| 22 | Journal posts (4) and categories (8, 5 empty) | `src/data/catalog.ts:1085-1141` | Catalogue › Journal | Content team |
| 23 | Team members (3: names, roles, bios never shown, photos) | `src/data/catalog.ts:1143-1178`, `team-orbit-carousel.tsx` | Team › Public profiles | ADMIN, SUPER_ADMIN |
| 24 | Homepage testimonial (names a private person, no source) | `src/data/catalog.ts:1180-1184`, `src/routes/index.tsx:249-254` | Content › Testimonials (source and consent required) | ADMIN, SUPER_ADMIN |
| 25 | Curated selections: homepage featured and signature tours, tours-excursions featured, destination "places worth the detour", brochure picks, sustainability experiences | `src/routes/index.tsx:49-52`, `services/tours-excursions.tsx:24-29`, `destinations/index.tsx:20`, `brochure.tsx:41-42`, `src/data/sustainability.ts:161-208` | "Featured" flag and sort order on each catalogue item | Content team |
| 26 | Images: about 40 literal hero and section image paths in 27 files, catalogue images, provenance manifest (85 entries; 36 marked `license_verification_required`) | `public/images/**`, `public/images/image-sources.json`, routes and data files | Media library (upload, provenance, publish) | Content team uploads; publish needs provenance (enforced by data) |
| 27 | Sustainability page content (pillars, guide, checklist, principles, timeline) and policy URL (null) | `src/data/sustainability.ts`, `src/components/sustainability/*` | Content › Pages (text and lists); Settings › Documents (policy URL) | Content team; policy URL: SUPER_ADMIN |
| 28 | Stay & Dine sample listings and notice | `src/data/hospitality.ts`, `src/components/hospitality/sample-notice.tsx` | Not in this plan (stays sample data in code). Only its menu visibility moves to Settings (item 4) | n/a |
| 29 | Email templates (enquiry receipt, team notification, subjects, From fallback) | `src/services/notify.ts:46-279` | Deferred, not in the Stage 2 task list | n/a |
| 30 | Theme names and default theme | `src/lib/theme.ts` | Not editable (design is fixed) | n/a |
| 31 | Sitemap (static, 30 URLs, missing every detail page) | `public/sitemap.xml` | Generated from the database in task 13; nothing to edit | n/a |
| 32 | Enquiries | `enquiries` table; `/admin/enquiries` | Operations › Enquiries (task 12) | BOOKING_MANAGER, ADMIN, SUPER_ADMIN |
| 33 | Staff accounts and roles | Better Auth `user`, `staff_profiles` | Settings › Team accounts | SUPER_ADMIN |

**Not editable on purpose:** booking, checkout, availability, payment, voucher and
review-moderation pages. `/admin/bookings`, `/admin/availability` and `/admin/reviews`
exist today and expose dormant commerce data; task 4 removes them from the admin.

---

## 2. Roles, sign-in and permission checks today

**Roles** (`src/lib/roles.ts:1-8`): CUSTOMER, STAFF, BOOKING_MANAGER, CONTENT_MANAGER,
ADMIN, SUPER_ADMIN. Checks use a linear rank (`RANK`, `atLeast()`); BOOKING_MANAGER and
CONTENT_MANAGER share rank 2 and no function distinguishes them, so both behave as
STAFF. A user with no `staff_profiles` row is CUSTOMER.

**Sign-in** (`src/lib/auth/server.ts`, Better Auth 1.6.30):

- Email and password, `emailAndPassword: { enabled: true }` only (`server.ts:271`,
  `email-password.ts:10`). **Public sign-up is open** (`/register`, `/login` sign-up
  mode). **No email verification.**
- **Password reset cannot work** (OPS-2): no `sendResetPassword`, so Better Auth throws
  `RESET_PASSWORD_DISABLED`; the forgot-password page still says a link will follow.
- Sign-in and sign-up forms ignore `{ error }` results (`createAuthClient` has no
  `throw`), so failures look like success (BK-7).
- Sessions: 7 days; `cookieCache` 300 s (`server.ts:268`), so a revoked session keeps
  working in server functions for up to 5 minutes.
- Always-on Grok template plugins: `gateIdentitySessions()` and `bearer()`
  (`server.ts:291-309`); the Grok OAuth broker is registered only with Grok env vars.
  The gate plugin trusts tokens from two fixed Grok issuers; nothing the business uses.
- SUPER_ADMIN bootstrap: `bootstrapStaff` (`src/lib/server/ops.ts:405-434`), gated by
  `BOOTSTRAP_ADMIN_EMAIL` and the single-row `bootstrap_lock`. The claim only checks the
  email string, which is why it must be done before anyone else registers (SEC-1).
- Rate limiting: in-memory per serverless instance, or Upstash if configured (not in
  production), fail-open (`src/lib/server/rate-limit.ts:53-81`, OPS-6).
- Two-factor: **available but unused.** The installed 1.6.30 ships
  `better-auth/plugins/two-factor` (TOTP, OTP, backup codes); it needs a `twoFactor`
  table and `user.twoFactorEnabled`.

**Where permission is enforced.** Every admin server function calls the private helper
`requireStaff(userId, min)` (`ops.ts:436-444`), which reads `staff_profiles` on each call:

| Server function | Guard today | Returns personal data |
|---|---|---|
| `adminSnapshot` (`ops.ts:446`) | STAFF | no |
| `adminListBookings` (`ops.ts:499`) | STAFF | **yes**, every guest's name, email, phone, notes |
| `adminListEnquiries` (`ops.ts:510`) | STAFF | **yes**, names, emails, raw payload with phone and message |
| `adminSetEnquiryStatus` (`ops.ts:531`) | STAFF | no |
| `adminListAvailability`, `adminListReviews`, `adminModerateReview` | STAFF | no |
| `adminListAudit` (`ops.ts:595`) | ADMIN | no (user ids only) |
| `adminListStaff` (`ops.ts:638`) | ADMIN | **yes**, staff emails |
| `adminSetRole` (`ops.ts:657`) | ADMIN | no |

Pages under `/admin` check staff status **in the browser only** (`src/routes/admin.tsx:42-52`);
data is protected by the server functions above. `/admin/tours` calls no server
function and reads the static catalogue.

**SEC-6 today** (`ops.ts:657-696`): an ADMIN can demote or remove a SUPER_ADMIN, and
promote anyone to ADMIN, as long as more than one SUPER_ADMIN exists. Only granting
SUPER_ADMIN is restricted. The last-SUPER_ADMIN check is a plain count on an autocommit
connection, outside a transaction and without a lock, so two concurrent demotions can
remove the last one. `staff_profiles` has no foreign key to `user` and no CHECK on role.

**Audit log today** (`migrations/0003_ops.sql:47-56`): `audit_logs(id, actor_id, action,
entity, entity_id, detail, created_at)`. No before and after values, no trigger, and the
app's database role can update or delete rows. Some writes happen after, not inside,
the change they record.

---

## 3. Role-to-capability map

One map in code (`src/lib/capabilities.ts`), one guard (`requireCapability`) on every
admin page and server function. Ranks are no longer used for permission. Where the brief
left a choice I took the more restrictive option.

| Capability | STAFF | BOOKING_MANAGER | CONTENT_MANAGER | ADMIN | SUPER_ADMIN |
|---|:-:|:-:|:-:|:-:|:-:|
| `dashboard.view` (counts only, no personal data) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `enquiries.read` (includes name, email, phone, message) | | ✓ | | ✓ | ✓ |
| `enquiries.manage` (status, notes, assignee, reply links) | | ✓ | | ✓ | ✓ |
| `enquiries.export` (CSV) | | | | ✓ | ✓ |
| `content.edit` (pages, hero, announcements) | | | ✓ | ✓ | ✓ |
| `catalogue.edit` (create, edit, hide, reorder) | | | ✓ | ✓ | ✓ |
| `catalogue.delete` (safe delete) | | | | ✓ | ✓ |
| `claims.source` (record sources for claims, ratings, testimonials) | | | | ✓ | ✓ |
| `legal.edit` | | | | ✓ | ✓ |
| `rates.manage` (draft and publish with source) | | | | ✓ | ✓ |
| `media.upload` and `media.publish` (publish needs full provenance) | | | ✓ | ✓ | ✓ |
| `team.profiles` (public profiles, photo consent) | | | | ✓ | ✓ |
| `audit.view` | | | | ✓ | ✓ |
| `users.manage` (create accounts, disable, re-enable, send reset) | | | | | ✓ |
| `roles.manage` (assign roles, including SUPER_ADMIN) | | | | | ✓ |
| `settings.edit` (business, contact, social, SEO, recipients, nav, documents) | | | | | ✓ |

CUSTOMER has no capabilities and cannot open `/admin`. Rules enforced in code and
tested: only a SUPER_ADMIN may change a SUPER_ADMIN; the role count and the update run
in one transaction holding a row lock; the last SUPER_ADMIN can never be demoted,
disabled or removed; nobody changes their own role.

---

## 4. Build order (Stage 2)

Branch `feat/customization` from the updated `main`, one commit per task, one migration
per task that needs one (numbering continues from `0005`). Every task: Zod on every
input, an audit row for every admin write, existing components and tokens, usable at
390 px, new tests registered in `npm test`. Business logic lives in plain functions that
take a SQL handle and an actor, so it is tested against PGLite; server functions are
thin wrappers. Check tiers as in the brief.

| # | Task | Migration | Done when |
|---|---|---|---|
| 1 | **Capabilities and SEC-6.** `src/lib/capabilities.ts`, `requireCapability` (401 signed out, 403 wrong capability) on every admin server function and a route `beforeLoad` on every admin page. Role changes in one transaction with `select ... for update` on the SUPER_ADMIN rows; last-SUPER_ADMIN and self-change refused; only SUPER_ADMIN touches SUPER_ADMIN. Enquiry and booking personal data only for `enquiries.read`. Staff checks bypass the 300 s session cookie cache. | `0005`: FK `staff_profiles.user_id → user`, CHECK on role | PGLite tests: signed out → 401 and wrong role → 403 for every admin function; ADMIN cannot demote SUPER_ADMIN; two concurrent demotions leave one SUPER_ADMIN; STAFF cannot read enquiry PII. Grep test: no admin function without `requireCapability`. |
| 2 | **Team sign-in.** `disableSignUp`; SUPER_ADMIN creates accounts (server-side create with a one-time set-password email). Working password reset through the existing Resend sender (OPS-2), using `requestPasswordReset`. Real sign-in errors shown. Postgres-backed rate limit (Better Auth `rateLimit.storage: "database"` plus an app limiter table) and a sign-in attempts log. TOTP two-factor required for SUPER_ADMIN and ADMIN (plugin ships in 1.6.30). Remove the always-on Grok gate session plugin and broker from production. | `0006`: rate limit, sign-in attempts, two-factor tables | `/register` and sign-up API refuse; reset email sent through a mocked Resend and the link sets a new password (PGLite test); wrong password shows an error; an attempt over the limit is refused and every attempt is logged; ADMIN without 2FA is sent to enrol before any admin page loads. |
| 3 | **Append-only audit log.** Add `before` and `after` JSON columns; one `audit()` helper that must be called with the transaction handle; triggers refuse UPDATE, DELETE and TRUNCATE. | `0007` | Test: update and delete on `audit_logs` raise; every admin write test asserts its audit row with before and after; a failed write leaves no audit row. |
| 4 | **Admin shell.** Sidebar grouped Operations / Content / Settings, items shown by capability, unbuilt items disabled. Bookings, availability and reviews pages removed from the admin. | none | Screenshots at 1440 and 390 px; each role sees only its items; old commerce admin URLs return 404. |
| 5 | **Site settings.** Business, contact, addresses, social, SEO, enquiry recipients (replaces the hardcoded CC, OPS-9), Stay & Dine visibility, sustainability policy URL. Seeded from today's values; an empty value hides its element. | `0008` (+ seed) | Seed twice is idempotent; seeded contact values equal the approved ones exactly (test); changing a phone shows on the next request; clearing the tagline hides it; recipients list drives `notifyEnquiryTeam` (test with mocked Resend). |
| 6 | **Content blocks.** Every visible text section keyed (`home.hero.title`, ...), a code registry holding today's text as the default, seeded from that registry, rendered as plain text (no HTML). Claim blocks carry a source field and stay hidden until a source is recorded. | `0009` (+ seed) | Snapshot test: every page renders identical text before and after with an untouched database; editing a block changes the next response; `<script>` in a block renders as text. |
| 7 | **Catalogue.** Circuits, destinations, tours (itinerary, requirements, FAQs, gallery), services, cruise items, vehicles, journal. Create, edit, hide, reorder; delete refused while referenced (tour slugs in bookings, availability, saved tours, reviews; curated lists). Slugs immutable once referenced; reserved slugs refused. Seeded exactly from `src/data/*.ts` by a generator whose output is checked by a test. | `0010` (+ seed) | Generated seed equals the data files (test); seed twice idempotent; hiding a tour removes it from lists and returns 404; deleting a referenced tour is refused. |
| 8 | **Rates.** Separate `rates` table: item, currency (USD or SLE), amount in integer minor units, source note, source date, status. Entered in major units, parsed without floating point. Default "Request a quote"; publish refused without source note and date; no sums across currencies. Ratings move to a table that needs a source link and date. Rates never feed the dormant `priceCents` payment path. | `0011` | Parser tests (`12.50`, `12.5`, `0.07`, `1,000`, negatives and junk); publish without source refused; a published rate shows on the next request; `quoteForTour` still returns "quote" for every tour (test). |
| 9 | **Image uploads.** One upload path: signed upload ticket, server checks size, declared type and file signature (magic bytes) before the image is usable; the replaced file is deleted only after the database update commits; an image cannot be public until source, author, licence and location are recorded; every storage call has a timeout; no network call inside a database transaction. Storage behind an interface with an in-memory fake for tests. | `0012` | Tests with the fake: oversize, wrong type and spoofed signature refused; publish without provenance refused; replace keeps the old file when the database update fails. Real storage verified once on a preview deployment after the owner adds keys. |
| 10 | **Team.** Accounts list, roles, disable and re-enable (all live sessions deleted at once), public profiles with photo and a recorded-consent checkbox (photo shown only with consent). | `0013` | Disabled user's next server call is 401; profile edit shows on `/about/team` next request; photo hidden until consent recorded. |
| 11 | **Announcements** with start and end dates, plain text and an optional internal link. | `0014` | Banner shows only inside its window (test with a fixed clock); escaped. |
| 12 | **Enquiry desk** (OPS-4): reference, date, parsed fields, statuses new / in progress / quoted / closed, internal notes, assignee, reply by email (`mailto:`) or WhatsApp (`wa.me`) prefilled with the reference, search, filters, pagination, CSV export (formula-injection safe). | `0015` | PGLite tests for status changes, notes, assignment, search and pagination; CSV escapes `=`, `+`, `-`, `@`; export is audited. |
| 13 | **Public site reads the database** for everything in section 1, with code fallbacks when the database is unreachable or a row is missing. Sitemap generated from the catalogue. Remove the hardcoded values the plan listed. | none | No `SITE`, `NAV` or catalogue constant imported by a public route except as fallback (grep test); site renders with the database down. |
| n/a | **Finish.** One end-to-end test: SUPER_ADMIN changes a text block, a rate, an image and a team member; each shows on the next public request; the audit log holds all four. One PR into `main`. | n/a | Test green; full gate green; report written. |

Progress, decisions and anything skipped go in `docs/CUSTOMIZATION_REPORT.md`.

---

## 5. Image storage options

The site is on Vercel. Uploaded images cannot go in `public/` (the deployment is
read-only and rebuilt on every push), so they need object storage. All options below are
used through one interface (`src/services/storage.ts` grows an upload, head, read-range
and delete API) with an in-memory fake for tests, so switching later is a configuration
change.

| Option | Fit | Cost and limits | Setup the owner does | Risks |
|---|---|---|---|---|
| **Vercel Blob** | Native to the current host; signed client uploads built in; files served from Vercel's CDN | Billed on the Vercel plan (storage and transfer). Note: Vercel Hobby is for non-commercial use; check which plan the `softcodes1` team is on | Create a Blob store in the Vercel project; the token is injected as an env var | One new dependency (`@vercel/blob`); ties images to Vercel |
| **Cloudflare R2** | S3-compatible; `storage.ts` already expects `R2_*` variables | No egress fees; low storage cost | Cloudflare account, bucket, API token; a custom domain for public URLs needs a DNS record (owner's DNS, not ours) | Needs an S3 signing library (`aws4fetch`, small) |
| **Neon Object Storage** | Same provider as the database; available in this project's region (`aws-us-east-2`); branches with the database, so dev and preview branches get isolated files | Plan pricing not confirmed; free tier limits unknown | Enable on the Neon project | **Public beta**; project is on the free plan |
| Postgres (bytea) | No new account | Uses the 1 GB branch limit fast | none | Not recommended for images |

**Recommendation (owner decides): Vercel Blob**, because it adds no new vendor, the
credentials are injected by the host, and signed uploads are a supported pattern.
Choose **Cloudflare R2** instead if image traffic is expected to be high or the team
wants storage independent of Vercel. Neon Object Storage becomes attractive when it
leaves beta, because it would also solve isolated test data for images.

---

## 6. What needs the owner

**Accounts and access**
1. Merge PR #1, then claim SUPER_ADMIN on the live site from the bootstrap address.
2. Fix GitHub billing: the CI job on PR #1 was **not started** ("recent account payments
   have failed or your spending limit needs to be increased"). Until fixed, no CI runs.
3. Choose image storage (section 5), create the store or bucket, and add its keys in
   Vercel (names will be listed in `.env.example`; never paste values in chat).
4. Authenticator app on the phone of each SUPER_ADMIN and ADMIN (two-factor).
5. Create a Neon development branch for local work (QA-OPS-1) and decide on a plan with
   longer backups (OPS-3); the project is on `free_v3` with 6 hours of history.
6. Confirm the Vercel plan for the `softcodes1` team (Hobby is non-commercial).

**Decisions**
7. External enquiry copy to the UK partner address (OPS-9, LEG-4): keep, narrow or remove.
   Task 5 moves it to Settings; the seed keeps today's two recipients unless told otherwise.
8. Unsourced numbers. Under the new rules, tour ratings (16 tours), vehicle rates and
   availability labels have no source and will show "Request a quote" or nothing until a
   source and date are recorded. Cruise prices cite "Cruiseship Proposal 2024": confirm
   they are current, or they will also show "Request a quote". **This visibly changes
   the public site** and needs your approval.
9. Team photos: no consent is recorded. Proposed default: show initials until consent is
   ticked. Approve or supply consent.
10. Claims (1 DCM World, AFAR, licensed guides, named operators): supply a source, or
    the claim blocks stay hidden.

**Content and sources**
11. Rate card for vehicles; confirmation of cruise rates; sources for any ratings.
12. Real content to replace thin pages (FAQ, travel information and similar remain
    content work, not admin work).

---

## 7. Decisions recorded for Stage 2 (proposed)

- **Freshness over caching.** Settings and content blocks are read per request in one
  small query per page; no cross-instance cache, so an edit shows on the next request.
  Revisit only if response times demand it.
- **Seeding.** Each data migration ships a generated SQL seed (`insert ... on conflict
  do nothing`) produced from the current code constants by a script; a test regenerates
  it and compares, so the seed equals today's content exactly and running it twice
  changes nothing.
- **Legacy enquiry status.** Existing rows keep `open`; the desk treats `open` as "new".
  No existing data is rewritten.
- **Replies** use the staff member's own mail client and WhatsApp (`mailto:`, `wa.me`),
  so replies stay in the Microsoft 365 mailbox; the server sends no new email type.
- **Audit immutability** is enforced by triggers. A determined database owner can still
  drop a trigger; full immutability needs a separate restricted database role (owner,
  later).
- **Dormant commerce** stays in code, untouched, and leaves the admin.
- **Existing images** in `public/images` keep working; ones marked
  `license_verification_required` are listed as "provenance missing" in the media
  library. The publish rule applies to new uploads.
- **Email templates** stay in code for now (not in the task list).
