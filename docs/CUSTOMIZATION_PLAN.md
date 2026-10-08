# Admin and page builder plan

Status: **proposal for approval** (Stage 1, revision 2). No feature code is in this branch.
Date: 8 October 2026. Base: `main` at `55eb69a` (PR #1 merged). Finding IDs (SEC-6, OPS-2,
OPS-4, OPS-9, BK-1, PC-3 and so on) refer to
`artifacts/Tourism-Is-Life-Gap-Analysis-and-Roadmap.pdf`.

**Goal.** Every page, section, text, image, button, link, menu item and setting that a
visitor sees is editable from a secure team admin at `/admin`. Nothing visible stays
hardcoded. This extends the first version of this plan (its 13 tasks are all still here,
re-ordered and split) with pages, sections, navigation, theme, drafts, preview, publish and
version history.

**Companion document.** `docs/CUSTOMIZATION_INVENTORY.md` lists all 47 pages, every section
on each one with file and line numbers, the section type it becomes, the site-wide chrome,
the 17 hardcoded items the first version missed (M1 to M17) and the contrast-tuned values
that stay in code.

---

## 1. Fixed rules (from the brief, not open for change)

1. **Enquiry only.** No online booking, payment or availability. Booking, checkout and payment
   code stays dormant and never appears in the admin. "Request a quote", never "Book now".
2. **Nothing invented.** A price, rating, review, testimonial, certification or partnership is
   stored and shown only with a recorded source and date. Without one: "Request a quote" or
   hidden.
3. **Approved contact details** are seeded exactly: `info@tourismislife.com`,
   `+232 79 616 668`, `+232 76 568 335`. `+232 80 343 826` must never appear (test).
4. **Stay & Dine**: while `HOSPITALITY_PREVIEW` is `true` in code, the admin cannot remove the
   "Sample" labels, the preview notice or `noindex`.
5. **Contrast-tuned values** (hero and carousel gradients, scrims, glass dim and tint) are not
   editable fields. Inventory section 6 lists them.
6. **No DNS, production data or secrets.** Env var names only.
7. **Safety.** `npm run dev:local` and `npm run build:dev` only. No migration, seed or script
   runs against production from this machine. Merging runs `db:migrate` on production, so
   every migration is additive, idempotent and compatible with the code that is live at the
   time (expand only, never contract). Branches only; never push to `main`; never merge.

---

## 2. What is hardcoded today, and where it will be edited

The page-by-page detail is in the inventory. This table is the first version's list,
updated for the new structure. "Content team" means CONTENT_MANAGER, ADMIN and SUPER_ADMIN.

| # | Item | Where today | Edited in | Who |
|---|---|---|---|---|
| 1 | Business name, legal name, tagline, description, site URL | `src/lib/site.ts:1-24`, tagline repeated in `index.tsx`, footer | Settings › Business | ADMIN, SUPER_ADMIN |
| 2 | Phones, email, WhatsApp, SMS, address, emergency note | `site.ts`, `contact.ts`, `contact-bar.tsx`, `contact-chooser.tsx`, `mobile-contact-menu.tsx`, footer, `/contact/*`, brochure | Settings › Contact (one place; text fields use tokens such as `{phone}`) | ADMIN, SUPER_ADMIN |
| 3 | Social links | `site.ts:32-72`, `social-links.tsx` | Settings › Social | ADMIN, SUPER_ADMIN |
| 4 | Header and footer menus, header button, footer text | `site.ts:74-126`, `site-header.tsx:34-305`, `site-footer.tsx:16-160` | Navigation | edit: content team; publish: ADMIN, SUPER_ADMIN |
| 5 | Enquiry recipients (OPS-9) | `site.ts:26-30`, `notify.ts:250-279`, `privacy.tsx:59-63` | Settings › Enquiry recipients | ADMIN, SUPER_ADMIN |
| 6 | Default SEO, Organization JSON-LD, share image | `seo.ts`, `__root.tsx:12-38` | Settings › SEO | ADMIN, SUPER_ADMIN |
| 7 | Per-page title, description, share image | every route `head()` | Pages › page settings | edit: content team; publish: ADMIN, SUPER_ADMIN |
| 8 | All page text, about 650 blocks plus component-internal copy (M1, M2) | `src/routes/**`, `src/components/**` | Pages › sections | as row 7 |
| 9 | Claims (1 DCM World, "licensed guides", named operators, "eco-lodge partnerships") (M8) | inventory M8 | Claim fields inside sections; source recorded by ADMIN, SUPER_ADMIN | as row 7, plus `claims.source` |
| 10 | Homepage hero states | `hero-media.ts:53-120` | Pages › Home › hero section | as row 7 |
| 11 | Announcement bar | none exists | Announcements | content team |
| 12 | Legal pages and "last updated" | `privacy.tsx`, `terms.tsx`, `cookies.tsx`, `legal-page.tsx` | Pages (restricted to `legal.edit`) | ADMIN, SUPER_ADMIN |
| 13 | Circuits (4) | `catalog.ts:133-178` | Collections › Circuits | content team; delete: ADMIN, SUPER_ADMIN |
| 14 | Destinations (15) | `catalog.ts:180-196` | Collections › Destinations | as row 13 |
| 15 | Tours (22): itinerary, requirements, inclusions, gallery, FAQ group | `catalog.ts:198-1017` | Collections › Tours | as row 13 |
| 16 | Tour ratings and review counts (16 tours, no source, PC-3) | `catalog.ts`, `tours/$slug.tsx:67` | Rates & ratings (source link and date required) | ADMIN, SUPER_ADMIN |
| 17 | Services (7) | `catalog.ts:1019-1083` | Collections › Services | content team |
| 18 | Cruise content (overview, excursions, destinations) and page lists | `cruise.ts`, `cruise/sections.tsx`, `cruise/*.tsx` | Collections › Cruise; lists in Pages › Cruise | content team |
| 19 | Cruise excursion prices ("Cruiseship Proposal 2024") | `cruise.ts:119-270` | Rates & ratings | ADMIN, SUPER_ADMIN |
| 20 | Vehicles (8), categories (8), search option lists | `vehicle-rental.ts` | Collections › Vehicles; lists in Pages › Vehicle rental | content team |
| 21 | Vehicle daily rates and availability labels (PC-2) | `vehicle-rental.ts`, `vehicle-card.tsx`, `vehicle-category-card.tsx` | Rates & ratings; availability labels removed (rule 1) | ADMIN, SUPER_ADMIN |
| 22 | Journal posts (4) and categories (8) | `catalog.ts:1085-1141` | Collections › Journal | content team |
| 23 | Team profiles (3) and photos | `catalog.ts:1143-1178`, `team-orbit-carousel.tsx` | Collections › Team profiles (photo needs recorded consent) | ADMIN, SUPER_ADMIN |
| 24 | Testimonial (no source) | `catalog.ts:1180-1184`, `index.tsx:249-254` | Collections › Testimonials (source link and date required) | content team; source: ADMIN, SUPER_ADMIN |
| 25 | Curated selections (featured tours, signature tours, attractions, brochure picks, sustainability experiences) | inventory 4.1, 4.3, 4.7, 4.2 | The section's own "items" field (an ordered list of records) | as row 7 |
| 26 | Images (literal paths in 27 files, 85 manifest entries, 36 without a verified licence) | `public/images/**`, `image-sources.json` | Media library | upload: content team; placement needs full provenance |
| 27 | Sustainability page (pillars, guide, checklist, principles, timeline) and policy URL | `sustainability.ts`, `components/sustainability/*` | Pages › Sustainability; Settings › Documents | as row 7; URL: ADMIN, SUPER_ADMIN |
| 28 | Stay & Dine sample listings, hero, labels | `hospitality.ts`, `components/hospitality/*` | Collections › Stay & Dine samples; Pages › Stay & Dine (sample flags locked) | content team |
| 29 | Email templates | `notify.ts:46-279` | Deferred (not on the site) | n/a |
| 30 | Theme names, default theme, allowed themes, token colours, fonts, logo, favicon | `theme.ts`, `styles.css`, `brand-logo.tsx`, `__root.tsx` | Theme | edit: content team; publish: ADMIN, SUPER_ADMIN |
| 31 | Sitemap and robots | `public/sitemap.xml`, `public/robots.txt` | Generated (B5) | n/a |
| 32 | Enquiries | `enquiries` table | Enquiry desk | BOOKING_MANAGER, ADMIN, SUPER_ADMIN |
| 33 | Team accounts and roles | Better Auth `user`, `staff_profiles` | Team › Accounts | SUPER_ADMIN only |
| 34 | 404 and error text, interface labels (skip link, menu, contact popovers, carousel controls, form messages) | `__root.tsx:41-47`, `error-component.tsx`, inventory M2, M3 | Settings › Interface text | ADMIN, SUPER_ADMIN |

**Not editable on purpose:** booking, checkout, availability, payment, voucher and review
moderation; the customer account area; contrast-tuned values; the Stay & Dine sample
gating; the form field sets (the server schema depends on them, so only their labels are
editable). `/admin/bookings`, `/admin/availability`, `/admin/reviews` and `/admin/tours`
leave the admin in task A4.

---

## 3. Roles, sign-in and checks today (verified, unchanged since the first version)

- **Roles** (`src/lib/roles.ts`): CUSTOMER, STAFF, BOOKING_MANAGER, CONTENT_MANAGER, ADMIN,
  SUPER_ADMIN. One linear rank; BOOKING_MANAGER and CONTENT_MANAGER share rank 2, so no check
  tells them apart.
- **Sign-in** (`src/lib/auth/server.ts`, Better Auth 1.6.30): email and password only;
  public sign-up open; no email verification; no `sendResetPassword` (OPS-2); forms ignore
  `{ error }` (BK-7); 7-day sessions with a 300 s cookie cache (line 268);
  `gateIdentitySessions()` and `bearer()` always registered (lines 291-305).
- **Two-factor** is installed but not registered (`better-auth/plugins/two-factor`).
  Recovery codes are stored as plain or reversibly encrypted JSON
  (`plugins/two-factor/backup-codes/index.mjs:17-51`); section 9.3 says how they are
  stored hashed instead.
- **Guards**: every admin server function calls the private `requireStaff(userId, min)`
  (`src/lib/server/ops.ts:436-444`); admin pages check only in the browser
  (`src/routes/admin.tsx:42-52`). STAFF and CONTENT_MANAGER can read all enquiry and booking
  personal data.
- **SEC-6** (`ops.ts:657-696`): an ADMIN can demote a SUPER_ADMIN while two exist; the
  last-SUPER_ADMIN count runs outside a transaction with no lock.
- **Audit** (`migrations/0003_ops.sql:47-56`): no before and after, mutable, sometimes
  written after the change it records.
- **Bootstrap**: `bootstrapStaff` (`ops.ts:405-434`) checks the email string only (SEC-1).

---

## 4. Content model

### 4.1 Records

| Record | Table(s) | Draft / published | Versions kept | Notes |
|---|---|---|---|---|
| Page | `pages`, `page_versions` | `draft` jsonb plus `published_version_id` | last 30 published | key, kind (system, standard, template), template type, path, status (draft, published, hidden), title, SEO title, SEO description, share image, ordered section ids |
| Section | `page_sections`, `section_versions` | `draft` jsonb; published copy lives in `section_versions` | last 30 published | type, anchor, hidden flag, fields (validated by the type's Zod schema) |
| Navigation | `navigation`, `navigation_versions` | yes | last 30 | header items (one level of children), header button, footer blurb, columns, legal links, copyright text, footer claim |
| Theme | `theme`, `theme_versions` | yes | last 30 | logo, favicon, default theme, allowed themes, token overrides per theme, theme names, fonts |
| Site settings | `site_settings`, `site_settings_versions` | yes | last 30 | section 2 rows 1-6, 27, 34 |
| Collection item | `collection_items`, `collection_item_versions` | yes | last 30 | one table, `collection` column, Zod schema per collection in code |
| Rate, rating | `rates`, `ratings` | status column | n/a (audit holds history) | integer minor units; database CHECK refuses `published` without source |
| Media | `media`, `media_usage` | provenance status | n/a | one row per stored image; variants; provenance |
| Announcement | `announcements` | status column | n/a | start and end date |
| Redirect | `redirects` | n/a | n/a | from path, to page id or to path, 301 |
| References | `content_refs` | n/a | n/a | who points at what (pages, items, media); drives "delete refused while referenced" |
| Audit | `audit_logs` (extended) | append only | forever | before and after, same transaction |

**Collections** (all draft/publish, all restorable from the trash for 30 days): circuits,
destinations, tours (itinerary days, requirements, inclusions, exclusions, meeting point,
gallery, FAQ group), services, cruise overview, cruise excursions, cruise destinations,
vehicles, vehicle categories, journal posts, journal categories, FAQ groups, testimonials
(source link and date required to publish), team profiles (photo shown only with recorded
consent: who recorded it, when, note), Stay & Dine sample stays and dining places (sample
status locked while `HOSPITALITY_PREVIEW`).

**Rates** (`rates`): subject (collection and item), label, currency `USD` or `SLE`,
`amount_minor bigint` (cents; SLE also uses 100 minor units), unit (per person, per day,
per group, per transfer, per night), source note, source date, status (draft, published,
archived). Entered in major units as text and parsed without floating point; shown with
string formatting; never summed across currencies; never read by `pricing.ts`, the booking
engine or `priceCents` (grep test). **Ratings** (`ratings`): tour, value in tenths (`41`
means 4.1), review count, source link, source date, status; same database CHECK.

**Optimistic concurrency.** Every draft has a `rev`. Saving with a stale `rev` is refused
("Someone else saved this page. Reload to see their changes."), so two editors cannot
silently overwrite each other.

**Trash.** Deleting sets `deleted_at`; restore clears it within 30 days; after that the row
is purged the next time anyone opens the trash or publishes. Delete is refused while
`content_refs` shows a reference (a menu item, a button, a section's item list, a template,
a dormant booking row for a tour slug).

### 4.2 Field types

| Field | Stored as | Editor | Rules |
|---|---|---|---|
| Plain text | string | input | length limits per field; rendered as text |
| Rich text | AST: paragraphs, bulleted and numbered lists, bold, italic, links | textarea with a toolbar (Bold, Italic, Link, Bulleted list, Numbered list) writing a small Markdown subset, plus a live preview | parsed on save by our own parser into the AST; anything else stays literal text; rendered with React elements only (escaped), no `dangerouslySetInnerHTML` (test) |
| Link | `{ kind: page, pageId }`, `{ kind: record, collection, itemId }`, `{ kind: path, path }` (a code route such as `/tours/search?category=wildlife`), `{ kind: anchor, id }`, `{ kind: url, https only }`, `{ kind: whatsapp, phone, message? }`, `{ kind: phone }`, `{ kind: email, subject? }` | picker | page and record links are resolved to the current path at render, so a rename never breaks a link; only `https:`, `mailto:`, `tel:` and site links are allowed |
| Button | label plus link plus variant (the five existing `Button` variants) and size | picker | |
| Image | media id, alt text (default from the media item), focal point (x %, y %) | media picker, alt input, click-to-set focal point | the media item must have full provenance before it can be newly placed (section 7.3) |
| Icon | key from a fixed list (the lucide icons used in content today, about 35) | select | |
| Item list | ordered array of sub-objects, min and max per section | add, remove, reorder (drag and arrows) | |
| Record list | ordered ids from one collection | picker | |
| Claim | claim text, source link, source date, text shown without the claim | grouped inputs | shown only when link and date are recorded (`claims.source` to record) |
| Layout option | one value from the options the component already supports (for example HeroFrame height `page`, `tall`, `full`; surface `page`, `surface`, `brand`, `brand-dark`; grid columns already in use) | select | no new layout values |
| Tokens | `{year}`, `{name}`, `{legalName}`, `{address}`, `{phone}`, `{mobile}`, `{email}`, `{enquiryRecipients}`, `{count}` | inserted from a menu | resolved at render from settings, so the 100+ places that show contact details stay consistent |

On template pages (tour, destination, circuit, service, article, journal category, vehicle,
vehicle enquiry, enquiry received, stay, dining), a field can be **bound** to a field of the
current record instead of holding its own text. The seed reproduces today's bindings.

---

## 5. Section library

Every section on every page maps to one of these types (the inventory gives the mapping).
Each type lives in `src/content/sections/<type>/`: a Zod schema, the renderer (the existing
component, unchanged), the editor form, and the `allowedOn` rule (any page, or one
template). "TOI" means text over a photograph (section 7.4).

| Group | Type | Component | Main fields | Layout options | TOI |
|---|---|---|---|---|---|
| Heroes | `hero-explore` | `ExploreHero` (+`HomeHero` search pill, `HospitalityHero` toggle) | aria label, chip text, slides (1-6: title, heading, description, thumbnail label, image, CTA), attachment: none / tour search / Stay & Dine toggle | none | yes |
| | `hero-page` | `PageHero` | kicker, title, lede, one image or 1-6 images | focal point | yes |
| | `hero-frame` | `HeroFrame` | kicker, heading, heading level (h1, h2), body, buttons (0-3), pills (0-8), image | height `page`, `tall`, `full` | yes |
| | `hero-vehicle` | `VehicleHero` + `VehicleSearchForm` | kicker, h1, body, pills, every search label, option lists | none | yes |
| | `tour-hero` | tour detail hero (template) | breadcrumb labels, bound title, image, meta line | none | yes |
| Carousels | `carousel-stacked` | `StackedCardCarousel` | header (kicker, heading, intro, header button), items from a collection or a hand-made list, kicker pattern, CTA label, aria noun | surface | no (solid strip) |
| | `carousel-layered` | `LayeredTravelCarousel` | header, record list (tours or destinations), CTA label | none | yes |
| | `carousel-place-peek` | `PlacePeekCarousel` | header (eyebrow, heading with highlighted part, paragraph), destinations (all or list) | none | yes |
| | `carousel-circuits` | `CircuitShowcase` | header, circuits, CTA label | none | yes |
| | `carousel-team` | `TeamOrbitCarousel` | team profiles (photo only with consent) | none | yes (caption glass) |
| Grids and lists | `grid-tour-cards` | `TourCard` grid | header, record query (list, circuit, destination, country, related), empty-state text | columns in use (2, 3, 4) | no |
| | `grid-destination-cards` | `DestinationCard` grid | header, circuits or destinations, meta field | columns in use | yes (shelf) |
| | `grid-story-cards` | `CompactStoryCard` grid | header, articles (latest N or category), eyebrow pattern | columns in use | no |
| | `grid-image-tiles` | home experience tiles, vehicle "made for your journey" cards | tiles: image, label, subline, link | columns in use | yes |
| | `grid-icon-cards` | trust strip, cruise cards, vehicle cards, how-it-works steps | header, items: icon, title, body; numbered or plain | surface | no |
| | `grid-link-cards` | services list, brochure cards | header, items from a collection or a list | surface, columns in use | no |
| | `list-bullets` | cruise lists, why-us list | header, items, optional button | columns in use | no |
| | `list-pills` | category chips, highlight pills, destination pills | items (links or plain) | none | no |
| | `list-links` | journal category list, cruise case studies | header, records, empty-state text | none | no |
| | `cards-text` | brochure stories, cruise berthing, personnel, payment | header, cards: title, rich text or list | surface | no |
| | `facts-image` | cruise port facts | header, facts (label, value), attribution, image | none | no |
| | `faq` | cruise terms, tour FAQs, new FAQ pages | header, items (question, rich-text answer) or an FAQ group | style `details` or `accordion` | no |
| Text and CTAs | `prose` | text blocks | kicker, heading, heading level, rich text, buttons, claims | width `narrow`, `wide`; surface | no |
| | `prose-with-form` | `/partner`, tours-excursions "Plan your trip", service benefits | left: prose or definition list; right: an enquiry form | none | no |
| | `prose-with-aside` | cruise intro and emergency box | prose, buttons, aside (title, text) | none | no |
| | `contact-with-form` | `/contact` | bound contact details, note, form | none | no |
| | `contact-block` | emergency page, brochure contact | bound contact details, which numbers, variant | variant `full`, `emergency`, `compact` | no |
| | `cta-band` | home "Plan your journey", Stay & Dine "Need help choosing?" | heading, body, buttons | surface | no |
| | `cta-split-image` | home operators band with cruise card | left text, button, claim; card: image, kicker, heading, button | none | yes (card) |
| | `banner-image-quote` | home "Why Tourism Is Life" band | image, kicker, heading, body, button, testimonial | none | yes |
| | `newsletter-band` | home newsletter | heading, body, form labels | none | no |
| | `section-nav` | sustainability and cruise sticky navigation | items pointing at sections on the page | none | no |
| Forms | `form-enquiry` | `EnquiryForm` | form type (B2C, B2B, CRUISE, MICE: fixed field set), every label, badge texts, button, success text, context label | none | no |
| | `form-cruise-inquiry` | `CruiseInquiryForm` | every label and message | none | no |
| Legal | `legal-text` | `LegalPage` body | last-updated date, sections (heading, rich text) | none | no |
| | `image-credits` | credits list | bound to media with a CC licence; footnote | none | no |
| Page-specific | `sustainability-hero`, `-why`, `-pillars`, `-experiences`, `-guide`, `-partners`, `-principles`, `-timeline`, `-policy` | `src/components/sustainability/*` | the data in `sustainability.ts`, moved into fields; the shared pillar and filter state becomes a page context | as today | panels over photos are checked |
| | `cruise-excursions` | `ExcursionExplorer` | filter labels and bands; excursions from the collection; prices from published rates only | none | no |
| | `tours-country-filter`, `tours-search`, `tours-catalogue`, `tours-feature-list` | `/tours`, `/tours/search`, tours-excursions | labels, option lists, empty states, record lists | none | no |
| | `vehicle-categories`, `vehicle-cards`, `vehicle-grid`, `vehicle-destinations` | vehicle rental components | labels, sort and filter options (price options hidden without published rates), records | none | no |
| Templates | `tour-overview`, `tour-list`, `tour-itinerary`, `tour-inclusions`, `tour-practicalities`, `tour-gallery`, `tour-reviews`, `tour-quote-card`, `tour-mobile-bar` | `tours/$slug.tsx` | labels; record bindings | none | no |
| | `service-detail`, `article-body`, `vehicle-detail`, `vehicle-enquiry`, `enquiry-received` | their templates | labels; record bindings | none | no |
| Stay & Dine | `hospitality-notice` (locked), `hospitality-discover`, `hospitality-listing` | `src/components/hospitality/*` | labels; sample records; sample flags read-only | none | cards are checked |

Template sections are `required`: they can be edited, reordered and (where harmless)
hidden, but not deleted. All other sections can be added, edited, reordered (drag and
arrows), hidden, duplicated and deleted.

---

## 6. Routing for database pages

- **Existing file routes stay.** Each becomes a thin route whose loader asks for its page
  by a stable `key` (for example `about.why-us`) and renders `<SectionList>`. Typed `<Link>`
  calls keep compiling.
- **New pages** created in the admin are served by one new splat route, `src/routes/$.tsx`.
  TanStack Router ranks static and parameter routes above a splat, so it only receives paths
  no file route owns. Its loader: a published page with that path renders; otherwise a row in
  `redirects` answers `301`; otherwise `notFound()` (a real 404 status). Adding the file makes
  the router plugin regenerate `src/routeTree.gen.ts` during `dev` and `build`. That file is
  never edited by hand.
- **Paths.** One to three lowercase segments of `[a-z0-9-]`. Refused when the path equals a
  file route, sits under a parameter route (`/tours/*`, `/destinations/*`, `/services/*`,
  `/journal/*`, `/hospitality/stays/*`, `/hospitality/dining/*`), or starts with a reserved
  prefix (`/admin`, `/team`, `/api`, `/account`, `/booking`, `/checkout`, `/login`,
  `/register`, `/forgot-password`, `/reset-password`, `/images`, `/icons`, `/fonts`,
  `/media`, `/assets`). The reserved list is generated from the route tree; a test fails if
  a new route file is not covered.
- **Changing a standard page's path.** The page record gets the new path and a redirect row
  from the old one. The old file route sees `page.path` differ from its own path and answers
  `301`; the splat serves the new path. System pages and templates keep their paths.
- **Record slugs.** Changing a tour, destination, circuit, service, article or vehicle slug
  writes a redirect row (`/tours/old` → `/tours/new`). Template loaders look the record up in
  the loader (not the component), so an unknown slug returns a real 404 (fixes PC-18, SEO-4)
  and an old slug returns `301`.
- **Hidden or deleted** pages return 404 to visitors; preview still shows them to the team.
- **Sitemap** becomes a server route built from published, indexable pages and records
  (replaces the 30-URL static file, PC-19). `robots.txt` gains `Disallow: /admin`,
  `/team` and `/api`.

### 6.1 Reading published content

One SQL statement per request (`loadPublished`) returns three JSON documents: the site
bundle (settings, navigation, theme, active announcement), the page (its published version
and its section versions), and the published collection records the page's sections and
template need. It is built from CTEs over the published tables, so it is one round trip.
There is **no cache**: an edit shows on the next request on every instance.

**Fallback.** The statement has a 2 s timeout. On failure or timeout the page renders from
`src/content/defaults/`, the same modules the seed migrations are generated from, and logs
`content.fallback`. A page created in the admin has no code fallback; it answers `503` with
the fallback contact details. The fallback reflects the content as seeded, so it ages as the
team edits; an "Export fallback snapshot" button (ADMIN) produces the file a developer
commits to refresh it (owner item O22).

---

## 7. Drafts, preview, publish, history

### 7.1 Drafts and preview

Every edit saves to a draft. **Preview** sets a short-lived signed cookie (HMAC, tied to the
session, 30 minutes) and opens the real public URL in a frame inside the admin. With that
cookie, and only for a session holding the right `*.edit` capability, the public loaders
read drafts (page, sections, navigation, theme, settings, collection items) instead of
published rows, add `noindex` and `Cache-Control: no-store`, and show a "Preview" banner.
So preview is exactly what visitors will see, through the same renderer.

### 7.2 Publish, versions, restore

**Publish** runs the checks below, then in one transaction writes a new page version and new
section versions for changed sections, points the page at it, prunes to the last 30, and
writes the audit row. **Restore** (one click with confirmation, page or single section)
publishes the chosen old version as a new version, so history is never rewritten. Hide and
unhide are publish actions. Navigation, theme, settings and collection items publish the
same way.

### 7.3 Publish checks (any failure refuses publish and names the field)

1. Every field validates against its type's schema.
2. Every link resolves to a published page, a published record or a valid URL.
3. **Images:** every newly placed image has source, author, licence and location recorded.
   The 85 images in use today are seeded with what `image-sources.json` records; the 36
   without a verified licence stay where they are (marked "provenance missing" in the media
   library) but cannot be placed anywhere new until completed (owner item O11).
4. **Sources:** a claim, rating, rate or testimonial without its source link and date is not
   shown, and publish warns which ones are hidden.
5. **Photo contrast** (7.4) for every TOI section whose image, focal point, text or theme
   colours changed.
6. Stay & Dine locks: the sample flags, the notice and `noindex` cannot change while
   `HOSPITALITY_PREVIEW` is `true`.

### 7.4 Photo contrast method (refuse publish below 4.5:1)

This follows the method CLAUDE.md records for `CircuitShowcase` and the hero, and keeps the
"validate the auditor" rule.

1. **Overlay models in code.** Every TOI component exports its overlay model: each gradient
   (direction, stops with token, alpha and position), flat scrim, or glass dim and tint, and
   the text colour and alpha. The component builds its class string from that same constant,
   and a test checks they match, so the check can never drift from what renders.
2. **Real geometry from the preview.** In the preview frame the checker sets each TOI section
   to each slide in turn (autoplay off), at 390, 768 and 1440 px, under every theme visitors
   may pick. For each text element it reads the line boxes (`Range.getClientRects`) and the
   image's rendered box, `object-fit: cover` crop and focal point, and maps every text box
   onto the photo's pixel grid. Ken Burns scale is checked at its start and end scale.
3. **Pixels.** At upload each image gets a small analysis raster (about 320 px wide, raw RGB)
   stored beside it. The server reads that raster, composites each overlay layer at each
   pixel's own position (alpha evaluated per pixel, interpolation in oklab as Tailwind v4
   renders it; glass as `brightness()` times the tint; blur ignored, which is the
   conservative choice), computes the contrast of the text colour against every pixel in the
   box, and takes the 5th percentile. For light text this is the same as the 95th
   percentile background luminance that earlier measurements in this repo used. Below 4.5:1
   in any box, at any width, on any theme, refuses publish and shows the box, the slide, the
   width, the theme and the measured ratio.
4. **The checker is tested before it is trusted.** A known-bad fixture (a bright sky with no
   overlay) must fail and a known-good one (a dark photo under the hero overlay) must pass;
   a Playwright test (Edge channel) on three fixtures compares the estimate against real
   rendered pixels (text set to `color: transparent`, never `display: none`, per CLAUDE.md)
   and must agree within 0.25 of a ratio point. Every seeded TOI section is run through the
   checker in task B7; any seeded section it flags is reported, not silently re-tuned.
5. **Theme changes** re-run the check on every published TOI section for the changed themes,
   because overlays use `brand-dark`.

### 7.5 Audit

`audit_logs` gains `before` and `after` (jsonb), actor role and request IP. One `audit(tx, …)`
helper takes the transaction handle, so the row commits or rolls back with the change. A
trigger refuses `UPDATE`, `DELETE` and `TRUNCATE` on the table. The audit page is read-only
for ADMIN and SUPER_ADMIN, with filters and a before/after view. A database owner could
still drop the trigger; full immutability needs a separate restricted database role (owner,
later).

---

## 8. Capability table

One map in code (`src/lib/capabilities.ts`). One guard, `requireCapability(cap)`, wraps every
admin server function through an `adminFn(cap, schema, handler)` builder, so a guard cannot
be forgotten (structural test: no `createServerFn` in admin modules outside the builder). A
route-level `beforeLoad` calls the same check for every admin page. Signed out: **401**.
Signed in without the capability: **403**. Disabled or removed account: **401** and its
sessions are deleted. Team account without two-factor: **403** with a pointer to enrolment.
Ranks are no longer used for permission.

| Capability | STAFF | BOOKING_MANAGER | CONTENT_MANAGER | ADMIN | SUPER_ADMIN |
|---|:-:|:-:|:-:|:-:|:-:|
| `dashboard.view` (counts only, no personal data) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `enquiries.read` (name, email, phone, message) | | ✓ | | ✓ | ✓ |
| `enquiries.manage` (status, notes, assignee, replies) | | ✓ | | ✓ | ✓ |
| `enquiries.export` (CSV) | | | | ✓ | ✓ |
| `pages.edit` (create, duplicate, edit drafts, sections, preview) | | | ✓ | ✓ | ✓ |
| `pages.publish` (publish, hide, rename and change path live, restore a version) | | | | ✓ | ✓ |
| `pages.delete` (delete, restore from trash) | | | | ✓ | ✓ |
| `navigation.edit` / `navigation.publish` | | | ✓ / | ✓ / ✓ | ✓ / ✓ |
| `theme.edit` / `theme.publish` | | | ✓ / | ✓ / ✓ | ✓ / ✓ |
| `collections.edit` (create, edit, hide, reorder, publish) | | | ✓ | ✓ | ✓ |
| `collections.delete` | | | | ✓ | ✓ |
| `media.upload`, `media.publish` (needs provenance) | | | ✓ | ✓ | ✓ |
| `announcements.edit` (includes publish) | | | ✓ | ✓ | ✓ |
| `claims.source` (sources for claims, ratings, testimonials) | | | | ✓ | ✓ |
| `legal.edit` | | | | ✓ | ✓ |
| `rates.manage` (draft, publish with source, archive) | | | | ✓ | ✓ |
| `team.profiles` (public profiles, photo consent) | | | | ✓ | ✓ |
| `settings.edit` (business, contact, social, SEO, recipients, interface text, documents) | | | | ✓ | ✓ |
| `audit.view` (audit log, sign-in log) | | | | ✓ | ✓ |
| `users.manage` (create, disable, re-enable, remove, send reset) | | | | | ✓ |
| `roles.manage` (change any role, including SUPER_ADMIN) | | | | | ✓ |
| `users.reset_two_factor` | | | | | ✓ |

CUSTOMER has no capabilities. Two choices are recorded here: `collections.edit` lets a
CONTENT_MANAGER publish collection edits because the first version of the map gave them live
catalogue editing (the stricter alternative is owner item O10); and `settings.edit` now
includes ADMIN, because the brief defines ADMIN as every capability except account
management.

**Account rules** (enforced in one transaction that takes `pg_advisory_xact_lock` on a
fixed key and `select … for update` on the active SUPER_ADMIN rows): only a SUPER_ADMIN
creates, disables, re-enables, removes or changes the role of any account; nobody changes
their own role or disables or removes themselves; the last active SUPER_ADMIN can never be
removed, disabled or demoted. PGLite runs one connection, so tests cannot reproduce a real
race; the tests assert the lock is taken and the rules hold, and the race itself is
verifiable only on a real Postgres branch (owner item O4).

---

## 9. Team sign-in and two-factor

### 9.1 Pages and flow

- `/team/sign-in`: email and password, then the two-factor step. A small "Team access" link
  goes in the footer (a visible change on every page, listed in section 11).
- `/team/two-factor`: authenticator code, or one recovery code.
- `/team/enrol`: forced before any admin page for a team account without two-factor. The QR
  code is drawn locally as SVG (no third-party QR service). Ten recovery codes are shown
  once, with copy and print, and are never shown again.
- `/team/forgot-password` and `/team/reset-password`: working reset through the existing
  Resend sender (`sendResetPassword`, `requestPasswordReset`, real error messages, OPS-2),
  1-hour links, all sessions revoked on reset.
- `/team/setup`: the first-time path, shown only while `bootstrap_lock` and `staff_profiles`
  are both empty. It accepts only the `BOOTSTRAP_ADMIN_EMAIL` address and emails a link to
  set the password, which also proves the mailbox (closes SEC-1). The single-use claim stays
  at `/admin` as today. No script touches production.
- `/login`, `/register`, `/forgot-password`, `/reset-password` answer `301` to the `/team/*`
  pages. Public sign-up is closed (all sign-up requests refused except the setup path). Team
  sign-in refuses accounts with no active staff profile with the same generic message, so the
  dormant customer account area becomes unreachable (BK-8, owner item O15).
- "Save tour" on tour pages becomes device-local saving (the Stay & Dine favourites
  pattern), so visitors are never sent to a sign-in page. It looks the same.
- `noindex,nofollow` on every `/team` and `/admin` page; both disallowed in `robots.txt`.
- The always-on Grok gate session plugin is removed. `bearer()` stays only in the Grok
  workspace preview.

### 9.2 Limits, sessions, disabled accounts

- **Rate limit in Postgres** (`rate_limit_counters`): 5 attempts per email and IP and 20 per
  IP in 15 minutes, on sign-in, two-factor verification and reset requests. The IP is the
  first `x-forwarded-for` entry set by Vercel's edge. Wrong email and wrong password give the
  same message ("Email or password is incorrect").
- **Every attempt is logged** (`sign_in_attempts`: time, email, IP, user agent, outcome,
  user id), readable by `audit.view`. Retention: owner item O18.
- **Team sessions end after 12 hours** (absolute: `expiresIn` 12 h, never extended). Admin
  checks read the session with the cookie cache bypassed, so a revoked session stops at once.
- **Disabled or removed accounts** cannot sign in (a `session.create` hook refuses them) and
  their sessions are deleted in the same transaction as the change.
- Minimum password length 12.

### 9.3 Recovery codes stored hashed

Better Auth 1.6.30 stores recovery codes as JSON, plain or reversibly encrypted
(`backup-codes/index.mjs:17-51`). We pass a custom `storeBackupCodes: { encrypt, decrypt }`:
`encrypt` replaces every code that is not already hashed with `h1:` plus an HMAC-SHA-256 of
the code keyed with `BETTER_AUTH_SECRET`, and `decrypt` returns the stored list unchanged. A
`before` hook on `/two-factor/verify-backup-code` hashes the submitted code the same way, so
the plugin's own `codes.includes(code)` check and its removal of the used code work on hashes.
`view-backup-codes` is refused. A test pins this to the installed version: after enrolment the
stored column contains no plain code, a code works once, and a second use fails. Codes are
10 random characters (about 59 bits), so a keyed fast hash is enough; the plugin's own
attempt lock still applies.

### 9.4 Local test SUPER_ADMIN

`npm run dev:local` seeds one SUPER_ADMIN into PGLite from `LOCAL_SUPER_ADMIN_EMAIL` and
`LOCAL_SUPER_ADMIN_PASSWORD` in `.env.local` (names added to `.env.example`, empty). The seed
runs only when `scripts/local-db.mjs` set its flag, the active backend is PGLite, and both
`DATABASE_URL` and `DATABASE_URL_UNPOOLED` are blank; otherwise it refuses and logs why. The
account enrols two-factor on first sign-in like any other.

---

## 10. Theme

- **Editable:** logo (media plus alt), favicon (PNG or ICO only; SVG is refused because it
  can carry script), default theme (today `INITIAL_THEME = "two"`), which of the four themes
  visitors may pick (at least one; the default must be allowed), theme names and
  descriptions, the 16 colour tokens per theme, and fonts from a fixed self-hosted list.
- **Rendering:** the seeded theme has no overrides, so the page carries no extra style and
  stays byte-identical. Changed tokens are emitted as one inline `<style>` block of
  `html[data-theme=…]` custom properties; the default theme id and the allowed list feed the
  server-rendered `data-theme` and `THEME_BOOTSTRAP`; swatches are derived from the tokens
  (CLAUDE.md requires they mirror `page`, `brand` and `gold`).
- **Fonts:** the list proposed is Figtree, Source Sans 3 and Work Sans (body) and Fraunces,
  Playfair Display and Lora (display), all SIL Open Font License. The woff2 files are fetched
  once from the official Google Fonts distribution during task B9 and committed under
  `public/fonts` with their licence, so no visitor's browser contacts a font server
  (LEG-8, PERF-4). Owner item O12.
- **Saving is refused** when any of these 18 pairs is below 4.5:1 for any theme. **Gold on
  brand is checked first.** CLAUDE.md cites 18 pairs but no list existed in the repo; this is
  the list, measured on `main` today (worst theme in brackets):

| # | Text on background | Lowest today | # | Text on background | Lowest today |
|---|---|---|---|---|---|
| 1 | `gold` on `brand` | 4.62 (Two) | 10 | `ink` on `surface` | 6.54 (Four) |
| 2 | `ivory` on `brand` | 9.25 (Two) | 11 | `muted` on `surface` | 4.96 (Four) |
| 3 | `ivory` on `brand-dark` | 15.01 (Three) | 12 | `gold-ink` on `surface` | 5.04 (Four) |
| 4 | `gold` on `brand-dark` | 6.44 (Three) | 13 | `brand-dark` on `gold` (primary button) | 6.44 (Three) |
| 5 | `heading` on `page` | 11.54 (Four) | 14 | `ok` on `surface` | 4.60 (Default) |
| 6 | `ink` on `page` | 8.82 (Four) | 15 | `danger` on `surface` | 4.78 (Four) |
| 7 | `muted` on `page` | 5.80 (Default) | 16 | `info` on `surface` | 4.68 (Default) |
| 8 | `gold-ink` on `page` | 5.87 (Default) | 17 | `ink` on `surface-muted` | 6.94 (Three) |
| 9 | `heading` on `surface` | 8.56 (Four) | 18 | `heading` on `surface-muted` | 8.67 (Three) |

  `warn` is not in the list because no component uses it as text (it measures 2.75:1 on the
  default `surface`), and `sage` is not used behind text. A test recomputes this table from
  `src/styles.css` so the seeded theme always passes its own check.

---

## 11. Seeding, fallbacks and the screenshot proof

- **One generator** (`scripts/content/generate-seed.mjs`, introduced in A7 and extended by
  each seeding task) imports the code constants and `src/content/defaults/`, and writes the
  seed migration with deterministic ids (UUID v5 from a fixed namespace and the record key)
  as `insert … on conflict do nothing`. A test regenerates it and compares byte for byte,
  then applies it to PGLite and checks the rows equal the constants. Running a seed twice
  changes nothing.
- **Rule 2 is applied when rendering, never by rewriting data.** Every seed stores the value
  exactly as the site shows it today. Values that rule 2 covers are stored together with their
  missing source: ratings and rates as `draft` rows, the testimonial unpublished, team photos
  with consent not recorded, and the claims in inventory M8 as claim fields (claim text,
  empty source, and the text shown without it; a claim that is a whole list item, such as the
  "Licensed guide" inclusion, is simply left out when unsourced). The renderer applies the
  rule the same way to the code fallback (B1) and to the database (B5). So nothing seeded in
  Milestone A has to be changed later, and recording a source in the admin is enough to make
  the value appear.
- **Before any public page reads the database** (B5), task B3 moves every inline string out
  of the route and component files into `src/content/defaults/` and renders every page
  through the section library. That move is proven exact by screenshots.
- **Screenshots** (`scripts/screenshot-compare.mjs`, Playwright with `channel: "msedge"`,
  output in the system temp folder, never the repo): every page in the inventory plus one
  instance of every record (22 tours, 4 circuits, 15 destinations, 4 articles at both URLs,
  8 categories, 5 service templates, 8 vehicles, 8 vehicle enquiry pages, the confirmation
  page, 9 stays, 8 dining places, the 404 page: 133 URLs) at 1440 and 390 px, full page, with
  the default theme set through `til-prefs` (`{"state":{"theme":"default"},"version":0}`),
  `reducedMotion: "reduce"`, lazy images forced in by scrolling, and `document.fonts.ready`
  awaited. Images are compared pixel by pixel (decoded with the `sharp` already installed).
  Any differing pixel is a failure to fix or to explain region by region.

### 11.1 Expected visible changes (task B1, before the screenshot baseline)

Rule 2 (nothing invented) and rule 1 (enquiry only) require these. Each one disappears if the
owner supplies the missing source before B1 lands (owner items O6 to O8).

| Change | Where | Why |
|---|---|---|
| Rating line removed ("· 4.1 / 5 (25 reviews on the public catalogue)") | 16 tour pages | no source (PC-3, LEG-13) |
| Vehicle rates become "Rate on request"; price sort and price filter hidden | vehicle rental, 8 vehicle pages, 8 enquiry pages | no source (PC-2, LEG-6) |
| Availability badges (Available, Limited, Unavailable) removed | vehicle cards and detail | rule 1 |
| Cruise excursion price badges and price filter hidden | `/cruise` | the source is named ("Cruiseship Proposal 2024") but has no date; shown again once the date is recorded |
| Testimonial quote hidden | home "Why" band | no source link or date, no consent (LEG-12) |
| Team photos replaced by the existing initials monogram | `/about/team` | no recorded consent (LEG-19) |
| 1 DCM World, "licensed guides", named operators, "eco-lodge partnerships" replaced by the text shown without the claim | footer, home, about, why-us, partner, brochure, coming soon, one tour inclusion, one service benefit, sustainability timeline | no source link and date (LEG-11) |
| "Select dates" and "Check availability" become "Request a quote"; the enquiry form appears on all 22 tour pages; the mobile "Select dates" bar and the "Self-serve bookable" filter go; nothing links to `/booking` | tours, cards, home, search | rule 1 (BK-1); owner item O6 |
| "Team access" link added to the footer | every page | brief (A3, so it lands in Milestone A) |

After B1, every later task must show **zero** differing pixels against the B1 baseline,
except B9 if self-hosted fonts render differently (each region explained).

---

## 12. Build order (Stage 2)

Two milestones, each its own branch and pull request into `main`. One commit per task.
Migrations continue from `0005`, one per task that needs one. Business logic lives in plain
functions that take a SQL handle and an actor, tested against PGLite; server functions are
thin `adminFn` wrappers. Every task: Zod on every input, an audit row for every admin write
in the same transaction, existing components and tokens, usable at 390 px, `e.currentTarget`
captured before any `await`, new tests registered in `package.json`, house voice in all copy.

**Gate after each task:** `npm run typecheck`, `npm run lint`, `npm test`, `npm run build:dev`,
`npm run check:assets`. With a migration, also `npm run check:migrations` (new in A1): apply
all migrations to a fresh PGLite; apply 0001-0004 to PGLite, insert representative data
(users, a SUPER_ADMIN, enquiries open and closed, bookings, subscribers), then apply the rest
and check the data is intact; run every seed twice and check nothing changed. Tests cover
SUPER_ADMIN and ADMIN flows and the refusals (401, 403, ADMIN on team accounts, the last
SUPER_ADMIN).

**Failure rule:** a task failing its gate after two fixes is reverted to the last green
commit, marked SKIPPED with the reason in `docs/CUSTOMIZATION_REPORT.md`, and work continues
unless later tasks depend on it. On restart, the report says where to resume (the first task
not GREEN or SKIPPED).

**Before the first push of each branch:** confirm with `vercel env ls` (names only) that
`DATABASE_URL` is not in the Preview scope, because a preview build runs `npm run build`,
which migrates whatever that variable points at (QA-OPS-2). If it is there, stop and report.

### Milestone A: `feat/admin-core` (from `main`)

The public site does not read the new tables in this milestone. The only visitor-facing
changes are the sign-in redirects, device-local "Save tour" and the footer link (A3).

| # | Task | Migration | Done when |
|---|---|---|---|
| A1 | **Capabilities and SEC-6.** `capabilities.ts`, `requireCapability`, `adminFn`; every existing admin function moved onto it; route `beforeLoad` guards; enquiry and booking personal data only for `enquiries.read`; account rules in one locked transaction; `check:migrations` script and CI step. | `0005_capabilities`: `staff_profiles.status`, `disabled_at`, `disabled_by`; FK to `user` and role CHECK, both `NOT VALID` so existing rows are untouched | Matrix test for all six roles; every admin function answers 401 signed out and 403 without the capability; ADMIN refused on every account change; self-change refused; last active SUPER_ADMIN cannot be demoted, disabled or removed; lock asserted; structural test passes. |
| A2 | **Append-only audit log.** `before`/`after`, actor role, IP; `audit(tx, …)` helper; existing `writeAudit` calls moved inside their transactions; read-only audit page. | `0006_audit_append_only` (columns, trigger) | `UPDATE`, `DELETE` and `TRUNCATE` on `audit_logs` raise; every admin write test asserts its row with before and after; a failed write leaves no row; audit page 403 for STAFF, BOOKING_MANAGER, CONTENT_MANAGER. |
| A3 | **Team sign-in, two-factor, password reset** (section 9). Grok gate plugin removed; sign-up closed; `/team/*` pages; redirects; footer link; robots and `noindex`; "Save tour" device-local; local test SUPER_ADMIN seed. | `0007_team_sign_in`: two-factor table and `user.twoFactorEnabled` (from the plugin's schema), `rate_limit_counters`, `sign_in_attempts` | PGLite tests with a mocked Resend: sign-up refused; sign-in requires TOTP (computed in the test with `node:crypto`); a recovery code works once and the stored value is not the code; reset link sets a new password and revokes sessions; the 6th attempt per email and IP and the 21st per IP in 15 minutes are refused with the generic message; every attempt logged; disabled and non-staff accounts refused; a 12-hour-old session refused; the local seed refuses when `DATABASE_URL` is set; gate plugin absent. |
| A4 | **Admin shell.** Sidebar (Operations, Content, Site, Team, Security) built from capabilities, server-side guard, dashboard counts; bookings, availability, reviews and tours pages removed. | none | Each role sees only its items (test on the menu builder); removed admin URLs return 404; Playwright at 1440 and 390 px shows no horizontal overflow; screenshots per role in the report. |
| A5 | **Team accounts.** Create (name, email, role; "set your password" email), disable, re-enable (sessions deleted on disable), remove, change role, send reset, reset two-factor; list with status, role, two-factor and last sign-in. | none (0005 holds the columns) | SUPER_ADMIN flows pass; ADMIN gets 403 on every one; nobody acts on themselves; last SUPER_ADMIN protected; a disabled member's next request is 401; after a two-factor reset the member must enrol again. |
| A6 | **Media library and uploads.** Storage interface (put, get, range, head, delete, upload ticket; every call has a timeout), in-memory fake for tests, local file driver for `dev:local`, the owner's provider once chosen (section 13); signed direct upload to `incoming/`, then server checks (size up to 15 MB, file signature JPEG, PNG or WebP, decode with `sharp`, orientation fixed, metadata and GPS stripped, longest side 2400 px), WebP variants 480/960/1600 plus a JPEG fallback and the analysis raster; database row written after the uploads, never with a network call inside the transaction; replaced files deleted only after the update commits and only when no draft, published or kept version uses them; provenance form; usage list. | `0008_media` (+ seed: one row per `public/images` file with today's provenance) | With the fake: oversize, wrong type and spoofed signature refused; a failed database write deletes the uploaded objects; replace keeps the old file when the update fails; delete refused while referenced; a timeout surfaces as an error; seed equals `image-sources.json`. Production uploads stay switched off with a clear message until storage keys exist. |
| A7 | **Site settings.** Business, contact, addresses, WhatsApp and SMS per number, social, default SEO, enquiry recipients (OPS-9; `notifyEnquiryTeam` reads the published list, falling back to `ENQUIRY_TEAM_EMAILS`), interface text, 404 and error text, documents (policy URL). Seed generator introduced. | `0009_site_settings` (+ seed) | Generated seed equals the code constants byte for byte; seed twice changes nothing; the seeded numbers and email are exactly the approved three and `+232 80 343 826` appears nowhere; recipients drive `notifyEnquiryTeam` (mocked Resend); invalid email, phone or URL refused; settings pages 403 below ADMIN. |
| A8 | **Collections I: circuits, destinations, tours** (itinerary, requirements, inclusions, gallery as media, FAQ groups with the shared tour set). List, search, reorder, edit, hide, publish, delete to trash, restore; slug change writes a redirect; delete refused while referenced (curated lists, other records, dormant booking, availability, saved-tour and review rows). Claims inside records are stored as claim fields (section 11). | `0010_collections` (`collection_items`, versions, `content_refs`, `redirects`) + seed | Seed equals `catalog.ts` (deep equality after applying to PGLite, claim fields compared by their text); seed twice no change; a hidden tour leaves published queries; a referenced tour cannot be deleted; slug change creates a redirect; CONTENT_MANAGER edits and publishes but cannot delete; STAFF and BOOKING_MANAGER 403. |
| A9 | **Collections II:** services, cruise overview, excursions and destinations, vehicles and categories (the availability field is kept but never shown), journal posts and categories, testimonials (source link and date to publish), team profiles (photo kept, consent fields empty), Stay & Dine samples (status locked). | `0011_collections_seed` | Seeds equal their constants; a testimonial without source cannot publish; the render helper never returns a team photo without recorded consent; the sample status cannot change; capability refusals as above. |
| A10 | **Rates and ratings.** Major units in, integer minor units stored, USD and SLE, source note and date to publish, archive; seeded: 6 cruise prices (source note, no date: draft), 8 vehicle daily rates (no source: draft), 16 tour ratings (no source: draft). | `0012_rates` (`rates`, `ratings`, with CHECKs) + seed | Parser tests (`12.50`, `12.5`, `0.07`, `1,000`, `-1`, `1.234`, `1e3`, empty, junk, overflow); the database refuses a published row without source; publish needs `rates.manage`; no function adds amounts of different currencies; `pricing.ts` and the booking engine never import rates (grep); `quoteForTour` still returns "quote" for every tour. |
| A11 | **Announcements.** Message (plain text, up to 200 characters), optional link, start and end. Shown publicly from B5. | `0013_announcements` | Only one active (the latest start) inside its window (fixed-clock test); text is rendered as text; audit rows. |
| A12 | **Enquiry desk (OPS-4).** Reference, date, type, parsed fields, statuses new (stored `open`, untouched), in progress, quoted, closed; notes; assignee; reply by email (`mailto:` with "Re: {ref}") and WhatsApp (`wa.me`, prefilled with the reference, only when a phone exists); search, filters, keyset pagination; CSV export (formula-injection safe, audited). | `0014_enquiry_desk` (assignee, timestamps, notes table, status CHECK `NOT VALID`) | PGLite tests for status, notes, assignment, search, pagination; CSV escapes cells starting with `=`, `+`, `-`, `@`, tab or carriage return; export audited; CONTENT_MANAGER and STAFF get 403 on every personal-data endpoint. |

### Milestone B: `feat/page-builder` (from `feat/admin-core`)

| # | Task | Migration | Done when |
|---|---|---|---|
| B1 | **Source and enquiry rules on the public site** (section 11.1), in code, before any page reads the database. | none | Screenshot report: every differing region matches a row of 11.1 and nothing else; a product-rule test fails if a rating, rate, testimonial or claim renders without a source, or if anything links to `/booking` or `/checkout`; this run becomes the baseline. |
| B2 | **Content store** for pages, sections, versions, navigation, theme, trash; path rules. | `0015_pages` | Repository functions (create, duplicate, rename, change path, hide, delete, restore, publish, restore version, prune to 30) pass on PGLite with audit rows; path tests (reserved, under a parameter route, format, duplicates). |
| B3 | **Section library and extraction.** Types, schemas, renderers, field types (rich text parser, links, images, icons, tokens); every inline string moved to `src/content/defaults/`; every page rendered through `<SectionList>` from the defaults. | none | **Zero differing pixels** against the B1 baseline at 1440 and 390 px on all 133 URLs; every default validates; `<script>` and `javascript:` refused or escaped; no `dangerouslySetInnerHTML` in section code (the JSON-LD helper escapes `<`, SEC-15). |
| B4 | **Seed for pages, sections, navigation and theme** from the defaults. | `0016_seed_pages` | Byte-for-byte generator test; applied rows equal the defaults; seed twice no change. |
| B5 | **The public site reads the database**: one statement per request, 2 s timeout, fallback to defaults, splat route, redirects, loader-based 404s, chrome and announcements from the site bundle, generated sitemap and robots, manifest from settings. | none | Zero differing pixels with the seeded database, and again with the database forced to fail (fallback); an instrumented SQL handle sees exactly one statement per page render; a database edit shows on the next request; unknown paths return 404; old paths return 301. |
| B6 | **Page and section editor.** Pages list, create, duplicate, rename, path, SEO, share image; sections add (library picker filtered by `allowedOn`), edit (forms from the schema), reorder (drag and arrows), hide, duplicate, delete; draft saves with `rev`. | none | Each action tested on PGLite with audit rows; CONTENT_MANAGER does every draft action and gets 403 on publish and delete; Playwright at 1440 and 390 px. |
| B7 | **Preview, publish, history, restore, trash, publish checks** (section 7), including the photo contrast checker and its validation. | none | Preview shows drafts only to editors; publish refused for missing provenance, missing source, broken link or contrast below 4.5:1; checker passes its known-bad, known-good and calibration tests; every seeded TOI section checked (result in the report); restore makes a new version that shows on the next request; 30 kept; trash purge after 30 days (fixed clock); delete refused while referenced. |
| B8 | **Navigation editor**: header items, short labels, one level of children, header button, footer text, columns, legal links, copyright tokens, footer claim. | none | A published menu item shows on the next request; a second nesting level is refused; a link to a deleted page is refused; CONTENT_MANAGER edits, publish needs ADMIN or SUPER_ADMIN. |
| B9 | **Theme editor** (section 10), self-hosted fonts. | none | Saving a failing pair is refused and gold on brand is reported first; the seeded theme emits no extra CSS (zero-pixel diff); fonts self-hosted with zero diff or every region explained; a published colour change shows on the next request and re-runs the photo check. |
| B10 | **Finish.** End-to-end test on PGLite (Playwright): the SUPER_ADMIN signs in with two-factor; creates a page from three sections; edits a hero text, swaps an image, changes a button link, reorders two sections, adds a menu item, changes a theme colour, publishes a sourced rate; previews; publishes; every change shows on the public site; restores the previous version of one section; the ADMIN is refused when disabling the SUPER_ADMIN; the audit log holds every change. `docs/OWNER_GUIDE.md`: sign in, two-factor, pages and sections, preview, publish, restore, menus, theme, collections, team. | none | The E2E test is green and the full gate is green; report written; PR open, not merged. |

**Final report per milestone** (max 60 lines, in `docs/CUSTOMIZATION_REPORT.md` and the PR):
task, status, commit, tests, migration; the section library; decisions; skipped; screenshot
comparison result; what the owner must supply; test counts; CI result; PR number; git status.

---

## 13. Image storage (owner decides; unchanged from the first version)

Uploaded images cannot go in `public/` (the deployment is read-only and rebuilt on every
push). All options are used through the one storage interface, so switching later is a
configuration change.

| Option | Fit | Cost and limits | Owner setup | Risks |
|---|---|---|---|---|
| **Vercel Blob** (recommended) | Native to the host; signed client uploads; CDN | Billed on the Vercel plan (Hobby is non-commercial; check the `softcodes1` plan) | Create a Blob store; the token is injected | One dependency (`@vercel/blob`); ties images to Vercel |
| Cloudflare R2 | S3-compatible; `storage.ts` already names `R2_*` variables | No egress fees | Account, bucket, token; a custom domain needs a DNS record (owner's DNS) | Request signing written in-house (no dependency) |
| Neon Object Storage | Same provider as the database; branches with it | Pricing not confirmed | Enable on the project | Public beta; free plan |

---

## 14. Dependencies, environment variables, tests and docs

**Dependencies (each only because it is needed):**
- `sharp` moves from `devDependencies` to `dependencies` (server-side decoding, resizing,
  metadata stripping and the analysis raster). Already in the lockfile. Verified on a
  preview deployment in A6; if it cannot run in the Vercel function, A6 falls back to
  resizing in the browser before upload and the server still checks signature, size and
  dimensions.
- `@vercel/blob` only if the owner picks Vercel Blob.
- A QR encoder: the Project Nayuki QR Code generator (MIT, one TypeScript file, widely
  reviewed) vendored under `src/lib/vendor/`, so the two-factor secret never leaves the
  server. Listed here because it is third-party code even though it is not an npm package.
- Nothing else: no editor, sanitizer, drag-and-drop or TOTP package (rich text is our AST,
  drag is native with arrow buttons, TOTP comes from the installed Better Auth plugin and
  tests compute codes with `node:crypto`). Playwright and `sharp` are already installed.

**New environment variables** (added to `.env.example` as empty placeholders and to the
deployment notes, names only): `LOCAL_SUPER_ADMIN_EMAIL`, `LOCAL_SUPER_ADMIN_PASSWORD` (local
only, never in Vercel); storage, depending on the choice: `BLOB_READ_WRITE_TOKEN`, or
`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE`.
Existing variables relied on: `BOOTSTRAP_ADMIN_EMAIL`, `RESEND_API_KEY`, `RESEND_FROM`,
`BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `DATABASE_URL`.

**Tests:** every new `*.test.ts` is added to the explicit list in the `package.json` `test`
script (CLAUDE.md: unlisted files never run). New scripts: `check:migrations`,
`content:seed` (generator), `screenshots` (compare). CI gains `check:migrations`. CI runs
again: it passed on `main` at `55eb69a` and on this PR.

**Docs:** `docs/CUSTOMIZATION_REPORT.md` (progress), `docs/OWNER_GUIDE.md` (B10), CLAUDE.md
updated in the last task of each milestone (admin, content model, routing, the 18 pairs).

---

## 15. What needs the owner

**Before Stage 2 starts**
- **O1.** Approve this plan, or mark what to change.
- **O2.** Confirm `BOOTSTRAP_ADMIN_EMAIL` is set in Vercel Production and whether SUPER_ADMIN is
  already claimed. If not, claim it after A3 ships through `/team/setup` (email-verified).
- **O3.** Done: GitHub billing is fixed and CI passed on `main` at `55eb69a`. Next, protect
  `main` so a merge needs the CI check (CI-1).
- **O4.** Create a Neon development branch (QA-OPS-1) and take a branch or snapshot of
  production before each milestone is merged (6-hour history today, OPS-3).
- **O5.** Choose image storage (section 13) and add its keys in Vercel. A6 completes without
  them; production uploads stay off until they exist.

**Decisions with a default (the default applies unless you say otherwise)**
- **O6.** Enquiry-only tour CTAs on all 22 tours (BK-1). Default: yes, as section 11.1.
- **O7.** Sources that keep figures visible after B1. Default: hidden until supplied. Needed:
  tour ratings (platform, link, date per tour); vehicle rate card (amount, currency, unit,
  source, date); the date of "Cruiseship Proposal 2024" and confirmation the prices still
  apply; testimonial source link, date and the person's consent; written consent for the
  three team photos; a link and date for the 1 DCM World membership; evidence for "licensed
  guides"; permission to name Oasis Overland and KE Adventure; whether "eco-lodge
  partnerships" exist.
- **O8.** Vehicle copy "Transparent Pricing … What you see is what you pay" while rates are
  hidden. Default: keep the words until you replace them.
- **O9.** Enquiry recipients (OPS-9, LEG-4). Default: the seed keeps both recipients as today.
- **O10.** CONTENT_MANAGER publishing collection edits. Default: allowed (first-version
  parity). Alternative: drafts only, publish by ADMIN or SUPER_ADMIN.
- **O11.** The 36 images without a verified licence. Default: they stay where they are,
  flagged, and cannot be placed anywhere new. Alternative: hide them (visible change).
- **O12.** Font list in section 10. Default: as proposed.
- **O13.** Group sizes on the 16 bookable tours (BK-12) and the AFAR Magazine mentions.
  Default: keep both as they are (neither is in rule 2's list); you may ask for them to be
  treated as claims.
- **O14.** Stay & Dine sample "Atlantic Lumley Hotel" (a real name, PC-14). Default: keep;
  editable in the admin after A9.
- **O15.** The customer account area becomes unreachable once sign-in is team-only (BK-8).
  Default: yes; nothing is deleted.
- **O16.** Who gets which role, and an authenticator app on each team member's phone.
- **O17.** Confirm `RESEND_API_KEY` and `RESEND_FROM` are set in Production (password reset and
  account invitations depend on them).
- **O18.** How long to keep sign-in attempt logs. Default: 90 days.
- **O19.** Analytics is not built: it needs a cookie-consent decision and changes to the
  privacy and cookies pages.
- **O20.** For local testing, add `LOCAL_SUPER_ADMIN_EMAIL` and `LOCAL_SUPER_ADMIN_PASSWORD`
  to your local `.env.local` (test values, never production).
- **O21.** Vercel: confirm the plan allows commercial use, and turn on Deployment Protection
  for previews (a preview build can otherwise show the bootstrap claim, OPS-18).
- **O22.** Accept the fallback snapshot process (section 6.1).
- **O23.** Two hero alt texts do not match their photo (`kings-gate-freetown.jpg` described as
  "Aberdeen beach road" on `/about/what-we-offer` and `/cruise/vip-meet-and-greet`). The seed
  copies them as they are; fix them in the admin after Milestone B.

---

## 16. Decisions recorded

- **Freshness over caching.** No cross-instance cache; one statement per page; edits show on
  the next request.
- **One generic collection table** with a Zod schema per collection, instead of a table per
  collection: fewer migrations and the same draft, version and trash code for all. Rates and
  ratings get typed tables because money and sources need database constraints.
- **Pages keep their file routes**; only new pages use the splat route. This keeps typed links
  and loaders, and lets a moved page redirect from its old route.
- **Seed equals fallback by construction**: both come from `src/content/defaults/`.
- **Legacy enquiry status**: existing rows keep `open`, shown as "new".
- **Replies** use the team member's own mail client and WhatsApp, so replies stay in the
  Microsoft 365 mailbox; the server sends no new email type.
- **Dormant commerce** stays in code, untouched except for being unlinked (B1), and leaves the
  admin (A4).
- **Email templates** stay in code (not on the site).
- **CLAUDE.md conflicts resolved in favour of the brief**: `/admin` becomes disallowed in
  `robots.txt` (SEO-20 suggested leaving it crawlable).
- **The screenshot script is committed** (it is a repeatable gate) but writes its output to the
  system temp folder, in line with CLAUDE.md's rule that QA output stays out of the repo.
