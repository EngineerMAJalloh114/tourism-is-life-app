# Public site inventory: every page, every section, and the section type each becomes

Companion to `docs/CUSTOMIZATION_PLAN.md` (Stage 1, revised 8 October 2026). Line
numbers are from `main` at `55eb69a` (PR #1 merged). Section type ids are defined in
the plan, section 4. "TOI" marks a section that puts text over a photograph, so it
goes through the publish-time contrast check (plan, section 7.4).

Counts used below were checked against the code: 22 tours (16 `bookable`), 4
circuits, 15 destinations, 7 services, 4 articles, 8 journal categories, 3 team
members, 1 testimonial, 8 vehicles, 8 vehicle categories, 6 cruise excursions, 6
cruise destinations, 6 cruise overview items, 9 sample stays, 8 sample dining
places, 85 entries in `public/images/image-sources.json` (36 marked
`license_verification_required`).

---

## 1. Page kinds

| Kind | Meaning | Delete | Change path |
|---|---|---|---|
| **system** | Must always exist: home, contact, privacy, terms, cookies | no | no |
| **template** | Renders one collection record by URL parameter | no | no (record slugs change instead) |
| **standard** | Any other page, including every page created in the admin | yes, with confirmation, restorable 30 days | yes, old path redirects (301) |
| **utility** | Not built from sections (sign-in, account, booking, admin) | n/a | n/a |

## 2. Page register (47 builder pages, plus the utility routes)

| # | Path | File | Kind | Title in `head()` today |
|---|---|---|---|---|
| 1 | `/` | `src/routes/index.tsx` | system | "Tourism Is Life · Discover the Heart of West Africa" |
| 2 | `/about` | `src/routes/about/index.tsx` | standard | "About Tourism Is Life" |
| 3 | `/about/team` | `src/routes/about/team.tsx` | standard | "Our Team" |
| 4 | `/about/what-we-offer` | `src/routes/about/what-we-offer.tsx` | standard | "What We Offer" |
| 5 | `/about/why-us` | `src/routes/about/why-us.tsx` | standard | "Why Travel With Us" |
| 6 | `/about/sustainability` | `src/routes/about/sustainability.tsx` | standard | "Sustainability" |
| 7 | `/about/image-credits` | `src/routes/about/image-credits.tsx` | standard | "Image credits" |
| 8 | `/brochure` | `src/routes/brochure.tsx` | standard | "DMC Brochure" |
| 9 | `/partner` | `src/routes/partner.tsx` | standard | "Become a Partner" |
| 10 | `/coming-soon` | `src/routes/coming-soon.tsx` | standard | none (inherits root title, no canonical) |
| 11 | `/privacy` | `src/routes/privacy.tsx` | system (legal) | "Privacy policy" |
| 12 | `/terms` | `src/routes/terms.tsx` | system (legal) | "Terms of use" |
| 13 | `/cookies` | `src/routes/cookies.tsx` | system (legal) | "Cookies and browser storage" |
| 14 | `/contact` | `src/routes/contact/index.tsx` (layout `contact.tsx`) | system | "Contact Tourism Is Life" |
| 15 | `/contact/emergency` | `src/routes/contact/emergency.tsx` | standard | "Emergency Contact" |
| 16 | `/contact/partner` | `src/routes/contact/partner.tsx` | standard | "Partner Enquiry" |
| 17 | `/contact/travel` | `src/routes/contact/travel.tsx` | standard | "Traveller Enquiry" |
| 18 | `/cruise` | `src/routes/cruise/index.tsx` | standard | "Cruise Ship Handling" |
| 19 | `/cruise/case-studies` | `src/routes/cruise/case-studies.tsx` | standard | "Cruise Case Studies" |
| 20 | `/cruise/group-handling` | `src/routes/cruise/group-handling.tsx` | standard | "Cruise Group Handling" |
| 21 | `/cruise/logistics` | `src/routes/cruise/logistics.tsx` | standard | "Cruise Logistics" |
| 22 | `/cruise/quote` | `src/routes/cruise/quote.tsx` | standard | "Cruise Quote Request" |
| 23 | `/cruise/shore-excursions` | `src/routes/cruise/shore-excursions.tsx` | standard | "Shore Excursions" |
| 24 | `/cruise/vip-meet-and-greet` | `src/routes/cruise/vip-meet-and-greet.tsx` | standard | "VIP Meet & Greet" |
| 25 | `/destinations` | `src/routes/destinations/index.tsx` | standard | "Destinations" |
| 26 | `/destinations/$circuit` | `src/routes/destinations/$circuit/index.tsx` (layout `$circuit.tsx`) | template: circuit | record name |
| 27 | `/destinations/$circuit/$slug` | `src/routes/destinations/$circuit/$slug.tsx` | template: destination | record name |
| 28 | `/journal` | `src/routes/journal/index.tsx` | standard | "Journal" |
| 29 | `/journal/$slug` and `/journal/$category/$slug` | `src/routes/journal/$slug.tsx`, `src/routes/journal/$category/$slug.tsx` | template: article (one template, two URLs today) | record title |
| 30 | `/journal/category/$category` | `src/routes/journal/category/$category.tsx` | template: journal category | category label |
| 31 | `/services` | `src/routes/services/index.tsx` | standard | "DMC Services" |
| 32 | `/services/$slug` | `src/routes/services/$slug.tsx` | template: service (mice, visa-facilitation, travel-insurance, hotel-reservations, ticketing) | record name |
| 33 | `/services/tours-excursions` | `src/routes/services/tours-excursions.tsx` | standard | "Tours & Excursions" |
| 34 | `/services/vehicle-rental` | `src/routes/services/vehicle-rental/index.tsx` | standard | "Vehicle Rental in Sierra Leone · Tourism Is Life" |
| 35 | `/services/vehicle-rental/vehicles/$vehicleId` | `.../vehicles/$vehicleId.tsx` | template: vehicle | "{name} · Vehicle Rental · Tourism Is Life" |
| 36 | `/services/vehicle-rental/book/$vehicleId` | `.../book/$vehicleId.tsx` | template: vehicle enquiry (an enquiry, not a booking) | "Enquire about {name} \| Tourism Is Life" |
| 37 | `/services/vehicle-rental/book/$vehicleId/confirmation` | `.../book/$vehicleId/confirmation.tsx` | template: enquiry received | "Enquiry Received" |
| 38 | `/tours` | `src/routes/tours/index.tsx` | standard | "Tours" |
| 39 | `/tours/$slug` | `src/routes/tours/$slug.tsx` | template: tour | record title |
| 40 | `/tours/search` | `src/routes/tours/search.tsx` | standard | "Search tours" |
| 41 | `/tours/sierra-leone` | `src/routes/tours/sierra-leone.tsx` | standard | "Sierra Leone tours" |
| 42 | `/tours/guinea` | `src/routes/tours/guinea.tsx` | standard | "Guinea programmes" |
| 43 | `/tours/liberia` | `src/routes/tours/liberia.tsx` | standard | "Liberia programmes" |
| 44 | `/tours/west-africa` | `src/routes/tours/west-africa.tsx` | standard | "West Africa circuits" |
| 45 | `/hospitality` | `src/routes/hospitality/index.tsx` | standard (Stay & Dine, locked `noindex`) | "Places to stay and dine" |
| 46 | `/hospitality/stays/$slug` | `src/routes/hospitality/stays/$slug.tsx` | template: stay (locked `noindex`) | record name |
| 47 | `/hospitality/dining/$slug` | `src/routes/hospitality/dining/$slug.tsx` | template: dining (locked `noindex`) | record name |
| n/a | not found (any unknown path) | `src/routes/__root.tsx:41-47` | settings: 404 text | n/a |
| n/a | error screen | `src/lib/error-component.tsx:4-18` | settings: error text | n/a |

**Utility routes (not built from sections, never in the page builder):**
`/login`, `/register`, `/forgot-password`, `/reset-password` (redirect to `/team/*`
in task A3), `/account/*` (9 files, dormant customer portal), `/booking/*`,
`/checkout/*` (dormant commerce), `/admin/*`, `/api/*`, and the new `/team/*`.

---

## 3. Site-wide chrome (on every page)

| Item | File:lines | What is hardcoded | Becomes |
|---|---|---|---|
| Utility bar: theme switcher | `src/components/layout/theme-switcher.tsx`, `src/lib/theme.ts:49-74` | label "Theme", 4 theme names and descriptions, swatches | Theme settings (names, descriptions, allowed themes); swatches derived from tokens |
| Utility bar: contact | `contact-bar.tsx:16-29`, `contact-chooser.tsx:27-117`, `mobile-contact-menu.tsx:29-115` | two phone numbers, email, "Get in touch", "Contact", "WhatsApp", "Send SMS", "Phone Call", "Cancel", "Back" | Site settings › contact (numbers, email); labels in settings › interface text |
| Logo | `brand-logo.tsx:3-4,18` | `/images/misc/tourism-is-life-web-logo.jpg` and `.webp`, alt "Tourism Is Life Tours logo", 1024×512 | Theme › logo (media + alt) |
| Header menu, desktop | `site-header.tsx:184-216` | 4 dropdowns from `NAV`, plus inline labels "Stay & Dine", "Cruise", "Journal" (desktop "Cruise" differs from `NAV.cruise.label` "Cruise Ship Handling") | Navigation › header (each item has a label and an optional short desktop label) |
| Header button | `site-header.tsx:221-223` | "Partner With Us" → `/partner` | Navigation › header button |
| Mobile menu | `site-header.tsx:34-42,240-305` | the same 7 sections plus "Partner With Us", "Open menu", "Close menu", "Expand/Collapse … submenu" | Navigation › header (same items); labels in interface text |
| `NAV` constant | `src/lib/site.ts:74-126` | 7 groups, 29 links | Seed for Navigation › header |
| Footer brand blurb | `site-footer.tsx:67-69` | "Destination management for Sierra Leone and West Africa. Local experts, global standards." | Navigation › footer text |
| Footer columns | `site-footer.tsx:16-49` | Explore (4), Company (6, includes "Coming Soon"), Support (4) | Navigation › footer columns |
| Footer emergency block | `site-footer.tsx:103-133` | "24/7 emergency", primary phone, "WhatsApp", "SMS" | Footer block bound to settings › contact |
| Footer copyright line | `site-footer.tsx:142-144` | `© {year} {legalName}. {address}.` | Footer text with tokens `{year}`, `{legalName}`, `{address}` |
| Footer claim | `site-footer.tsx:145` | "Member partner of 1 DCM World, as stated by the CEO in Travel And Tour World, 2024." | Claim field (hidden until a source link and date are recorded, see section 5) |
| Footer legal links | `site-footer.tsx:147-157` | Privacy, Terms, Cookies | Navigation › footer legal links |
| Social links | `src/lib/site.ts:34-70`, `social-links.tsx` | 4 live, TikTok placeholder disabled | Site settings › social (on/off, URL, handle) |
| Newsletter | `newsletter-form.tsx` | "Email", "you@example.com", "Subscribe", "Sending…", "You're on the list.", "Could not subscribe." | Interface text › newsletter |
| Skip link | `site-shell.tsx:8-13` | "Skip to content" | Interface text |
| Root head | `src/routes/__root.tsx:12-39` | title, description, theme-color `#1B2E28`, og:image, favicon links, Google Fonts link | Settings › default SEO; Theme › favicon and fonts |
| Default theme | `src/lib/theme.ts:34` | `INITIAL_THEME = "two"` (first-time visitors see Theme Two) | Theme › default theme |
| 404 | `__root.tsx:41-47` | "404", "This page is not on the map", "Try Destinations, Tours, or the home page." (plain text, no links) | Settings › 404 text (links optional) |
| Error screen | `error-component.tsx:4-18` | "Something went wrong", "An unexpected error occurred. Try reloading the page." | Settings › error text |
| Manifest | `public/manifest.webmanifest` | name, short name, colours | Generated from settings in B9 (static file kept as fallback) |
| Robots and sitemap | `public/robots.txt`, `public/sitemap.xml` (30 URLs) | static | Generated in B5 |

---

## 4. Sections page by page

Each row: order, section type id, where it is rendered, what it holds. "Binding"
means the field reads from a collection or the current record instead of holding
its own text.

### 4.1 `/` home (`src/routes/index.tsx`)

| # | Type | Lines | Content |
|---|---|---|---|
| 1 | `hero-explore` with tour search pill (TOI) | 104-185; `home-hero.tsx`; `explore-hero.tsx`; slides `src/lib/hero-media.ts:67-120` | chip "Sierra Leone · Guinea · Liberia"; aria "Discover Sierra Leone and West Africa"; 4 slides (welcome, freetown, heritage, coast: title, heading, description, image, alt, position, CTA); search pill labels "Search tours", "Destination", "Month", "Travelers", placeholder "Banana Island, Gola, Bintumani", button "Search" (pill `--glass-dim: 0.37` is fixed) |
| 2 | `grid-icon-cards` | 187-204 | 4 items: Shield "Local experts", Compass "Tailor-made", Users "B2B & B2C", Leaf "Full-service" with one line each |
| 3 | `carousel-circuits` (TOI) | 206-212 | kicker "The four circuits", heading "Sierra Leone, mapped as we travel it"; binding: circuits (4), CTA "Explore this circuit" |
| 4 | `carousel-stacked` | 214-229 | kicker "Featured journeys", heading "Tours from the public catalogue", header button "All tours"; binding: tours, today the first 6 bookable (becomes an explicit ordered list) |
| 5 | `banner-image-quote` (TOI) | 231-256 | image `IMG_FOREST`, alt "Rainforest canopy"; kicker "Why Tourism Is Life"; heading "A Sierra Leone story, told on the ground"; paragraph names AFAR Magazine; button "Meet the team"; quote: testimonial (binding) |
| 6 | `grid-image-tiles` (TOI) | 258-284 | heading "Travel by experience"; 4 tiles (Wildlife, Beaches & Islands, Culture & Heritage, Adventure & Trekking) with image, subline "Filter the catalogue", link to `/tours/search?category=` |
| 7 | `carousel-layered` (TOI) | 286-294 | kicker "Signature experiences", heading "Islands, chimps, rainforest, summit"; binding: 4 named tours |
| 8 | `cta-split-image` (TOI on the card) | 296-325 | kicker "Operators", heading "Your DMC partner in Sierra Leone & West Africa", paragraph with the 1 DCM World claim, button "Partner enquiry"; card: image `IMG_CRUISE`, kicker "Cruise", heading "Shore excursions & group handling", button "Cruise desk" |
| 9 | `carousel-stacked` | 327-340 | kicker "What we handle", heading "Seven DMC services" (number typed in the heading), header button "All services"; binding: services (7), kicker "Tourism Is Life service", CTA "Learn more" |
| 10 | `grid-story-cards` | 342-358 | heading "Journal", link "All stories"; binding: latest 3 articles, eyebrow = date |
| 11 | `newsletter-band` | 360-368 | heading "Notes from Freetown", body "Occasional itinerary notes. No invented offers." |
| 12 | `cta-band` | 370-381 | heading "Plan your journey", body "Quotes are confirmed in writing. Published pages do not invent prices.", buttons "Plan Your Journey" → `/contact`, "Request a Quote" → `/contact/partner` |

JSON-LD: Organization and WebSite (lines 102-103), generated from settings.

### 4.2 About pages

**`/about`** (`about/index.tsx`): 1 `hero-page` (TOI, 19-26: kicker "The company",
title "Tourism Is Life Tours", image `pepper-seller.jpg`, focal "center 12%");
2 `prose` (27-47: two paragraphs, the second holds the 1 DCM World and AFAR
claims; buttons "Our team", "What we offer").

**`/about/team`** (`about/team.tsx`): 1 `hero-page` (TOI, 20-26); 2
`carousel-team` (27-29, binding: team profiles; photos shown only with recorded
consent, otherwise the component's existing initials monogram).

**`/about/what-we-offer`**: 1 `hero-page` (TOI, 19-25; alt "Aberdeen beach road…"
does not match `kings-gate-freetown.jpg`, flagged for the owner); 2
`grid-link-cards` (26-38, binding: services, name and summary).

**`/about/why-us`**: 1 `hero-page` (TOI, 19, no lede; `karangia-trail.jpg` is one of
the two images stored rotated 90°, PC-16); 2 `list-bullets` with button (20-30: 4
bullets, the fourth is the 1 DCM World claim; button "Plan your journey").

**`/about/sustainability`** (`about/sustainability.tsx`, components in
`src/components/sustainability/`, data `src/data/sustainability.ts`). The route
holds shared state (`pillar`, `filter`); in the builder that state moves to a
page-level context the sustainability sections share, and links degrade to plain
anchors if one of them is removed.

| # | Type | Lines | Content |
|---|---|---|---|
| 1 | `sustainability-hero` | route 44; `sustainability-hero.tsx` | chip "Responsible tourism", heading "Travel With Purpose" (highlighted word), paragraph, 2 buttons, 4 pillar cards, impact strip (`IMPACT_STRIP`, 4) |
| 2 | `section-nav` | 45; `section-nav.tsx` | 7 anchors (`SECTION_NAV`) |
| 3 | `sustainability-why` | 46; `why-section.tsx` | kicker, heading, paragraph, 3 tabs (`WHY`), image `kabala-village.jpg` |
| 4 | `sustainability-pillars` | 47; `pillar-explorer.tsx` | kicker "Four pillars", heading, 4 pillars (`PILLARS`: title, short, body, 5 points, image, filter, CTA) |
| 5 | `sustainability-experiences` | 48; `experience-explorer.tsx` | kicker, heading, paragraph, 7 filters, 9 experiences (tour slug, tags, relevance line; tour fields are bindings) |
| 6 | `sustainability-guide` | 49; `travel-guide.tsx`, `traveler-checklist.tsx` | 3 tabs (`GUIDE`, 4+6+4 items), checklist heading and 7 items (`CHECKLIST`), "Reset" |
| 7 | `sustainability-partners` | 50; `partner-section.tsx` | kicker, heading, paragraph, button "Work With Tourism Is Life", 5 cards |
| 8 | `sustainability-principles` | 51; `principles-section.tsx` | 5 principles (word, line, more) |
| 9 | `sustainability-timeline` | 52; `improvement-timeline.tsx` | statement "We do not claim a formal sustainability certification…", 4 steps with status |
| 10 | `sustainability-policy` | 53; `policy-section.tsx` | binding: settings › documents › sustainability policy URL (`null` today: disabled button and "not published yet" note) |
| 11 | `hero-frame` height `tall` (TOI) | 55-87 | heading "Travel With Purpose. Discover With Meaning.", paragraph, 3 buttons, image `river-number-two-beach.jpg` focal "center 78%" |

**`/about/image-credits`**: 1 `hero-page` (TOI, 42-48); 2 `image-credits` (49-86:
binding to the media library, entries whose licence starts "CC BY", 35 today;
footnote text).

### 4.3 `/brochure` (`brochure.tsx`)

| # | Type | Lines | Content |
|---|---|---|---|
| 1 | `hero-page` (TOI) | 46-52 | kicker "DMC brochure", title "Tourism Is Life, in one document" |
| 2 | `prose` | 55-71 | kicker "Welcome to Sierra Leone", a second `<h1>` "A small country with an outsized amount to see" (heading level kept as is), 2 paragraphs |
| 3 | `prose` on surface | 74-90 | kicker "Why Tourism Is Life", heading "A local team, not a booking layer", paragraph with the 1 DCM World and AFAR claims, button "More about the company" |
| 4 | `grid-link-cards` | 93-120 | heading "Four circuits, one country", lede; binding: circuits (image, name, region) |
| 5 | `grid-link-cards` on brand-dark | 123-150 | anchor `shore-excursions`; heading "For the desk, the cruise call is a few hours…"; binding: first 3 cruise excursions (no prices shown); button "See the full shore excursion menu" |
| 6 | `cards-text` | 153-174 | "Culture & history": Bunce Island, Rogbonko Village |
| 7 | `cards-text` on surface | 176-205 | "Nature & wildlife": Tacugama, Tiwai Island, Bird watching |
| 8 | `cards-text` | 207-226 | "Beaches & islands": 2 cards |
| 9 | `grid-link-cards` on brand-dark | 229-269 | anchor `mano-river-triangle`; binding: tour summary; 3 country cards; button "See the full route" |
| 10 | `grid-link-cards` | 272-291 | "Tailor-made"; binding: services (7) |
| 11 | `list-pills` on surface | 294-310 | "Where we go"; binding: destinations (15) |
| 12 | `contact-block` (compact) | 313-336 | heading "Talk to the Freetown desk", paragraph, email, two phones (settings), button "Send an enquiry" |

### 4.4 Partner, coming soon, legal

**`/partner`**: 1 `hero-page` (TOI, 19-25); 2 `prose-with-form` (26-49: two
paragraphs, the first holds the 1 DCM World claim, the second names Oasis Overland
and KE Adventure; 3 bullets; brochure link; `form-enquiry` B2B).

**`/coming-soon`**: 1 `hero-page` (TOI, 9-15; lede mentions "eco-lodge
partnerships", a partnership claim); 2 `prose` (16-18). The footer links here (PC-17).

**`/privacy`, `/terms`, `/cookies`** (`legal-page.tsx`, `LEGAL_UPDATED = "25 September
2026"`): each is 1 `hero-page` (TOI, kicker "Legal", `freetown-street.jpg`) and 2
`legal-text` (last-updated date, then sections: privacy 7, terms 9, cookies 3). Privacy
"Who receives your information" prints `ENQUIRY_TEAM_EMAILS`; in the builder it uses the
token `{enquiryRecipients}`, so it always matches Settings › enquiry recipients.
Editing needs `legal.edit`.

### 4.5 Contact pages

**`/contact`**: 1 `hero-page` (TOI, 21-27); 2 `contact-with-form` (29-53 plus form:
phones with WhatsApp and SMS, mobile with WhatsApp and SMS, email, address, note
"Template addresses from the old website…", `form-enquiry` B2C).

**`/contact/emergency`**: 1 `hero-page` (TOI, kicker "24/7"); 2 `contact-block`
(emergency variant: large primary phone, WhatsApp, SMS, email; mobile not shown).

**`/contact/partner`**: 1 `hero-page` (TOI); 2 `form-enquiry` B2B.

**`/contact/travel`**: 1 `hero-page` (TOI); 2 `form-enquiry` B2C.

### 4.6 Cruise (`src/routes/cruise/*`, `src/components/cruise/*`, `src/data/cruise.ts`)

**`/cruise`** (`cruise/index.tsx`):

| # | Type | Lines | Content |
|---|---|---|---|
| 1 | `hero-page` (TOI) | 45-51 | kicker "Cruise handling", lede mentions "24-hour support" |
| 2 | `prose-with-aside` | 53-81 | paragraph, buttons "Request a cruise plan", "Explore shore excursions"; aside "Emergency / operations" naming Sonia Koroma and Alieya A. Kargbo (`cruiseContacts`) |
| 3 | `section-nav` | 83 | 14 anchors (`SECTION_NAV`) |
| 4 | `carousel-stacked` | 86-95 | anchor `overview`; header "Overview" / "Cruise services in Sierra Leone"; binding: cruise overview (6) |
| 5 | `grid-icon-cards` | 97-106 | anchor `why`; 6 cards typed in `sections.tsx:39-58` ("Established in 2013" and so on) |
| 6 | `cruise-excursions` | 108-117 | anchor `excursions`; binding: cruise excursions (6) with filters; price badge and price filter read published rates |
| 7 | `carousel-stacked` | 119-128 | anchor `destinations`; binding: cruise destinations (6) |
| 8 | `facts-image` | 130-173 | anchor `port`; port facts (name, location, typed 11.6m / 365m / 702m at 151-159), attribution, image |
| 9 | `list-bullets` | 175-184 | anchor `arrival`; 12 items (`vesselInfoRequired`) |
| 10 | `list-bullets` | 186-195 | anchor `documentation`; 15 items |
| 11 | `grid-icon-cards` | 197-206 | anchor `services`; 6 cards typed in `sections.tsx:85-104` |
| 12 | `cards-text` | 208-239 | anchor `berthing`; Pilotage (4), Anchorage & tugs (3) plus note |
| 13 | `cards-text` | 241-250 | anchor `personnel`; Drivers (4), Tour guides (8) typed in `sections.tsx:106-133` |
| 14 | `list-bullets` | 252-261 | anchor `capabilities`; 7 items typed in `sections.tsx:135-155` |
| 15 | `faq` (details style) | 263-272 | anchor `terms`; 6 items typed in `sections.tsx:157-183` |
| 16 | `cards-text` | 274-294 | anchor `payment`; Deposit, Balance, Banking |
| 17 | `form-cruise-inquiry` | 296-305 | anchor `inquiry`; every label in `cruise-inquiry-form.tsx` |

Six arrays in `cruise.ts` are unused because `sections.tsx` holds typed copies. The
seed takes what the page renders (the copies), so nothing on screen changes.

**`/cruise/case-studies`**: `hero-page` (TOI) + `list-links` (binding: articles in
"case-studies"). **`/cruise/group-handling`**, **`/cruise/logistics`**,
**`/cruise/shore-excursions`**, **`/cruise/vip-meet-and-greet`**: `hero-page` (TOI)
+ `prose` with a "Request a quote" button. **`/cruise/quote`**: `hero-page` (TOI) +
`form-enquiry` CRUISE.

### 4.7 Destinations

**`/destinations`**: 1 `hero-page` with 3 images (TOI, 81-86); 2
`grid-destination-cards` (TOI on the shelf, 88-101, binding: circuits, meta = best
time); 3 `carousel-layered` (TOI, 103-115, heading "Places worth the detour",
binding: 5 destinations `ATTRACTION_SLUGS`, CTA "Explore this place"); 4
`carousel-place-peek` (TOI, 117-134, eyebrow "Places", heading "The Places You'll
Meet" with highlighted part, paragraph with the count token `{count}`; binding: all
destinations).

**Template: circuit** (`$circuit/index.tsx`): `hero-page` bound (kicker "Circuit",
title, summary, image); `prose` bound ("Best time: {bestTime}. {region}."); `list-pills`
bound (highlights); `grid-destination-cards` bound (places in circuit, heading
"Places"); `grid-tour-cards` bound (heading "Tours in this circuit").

**Template: destination** (`$circuit/$slug.tsx`): `hero-page` bound (kicker = circuit
name); `prose` bound (meta line, summary, typed sentence "Editorial photography on this
page is licensed stock…", buttons "Browse tours", "Plan this journey");
`grid-tour-cards` bound (heading "Tours that visit {name}", empty state text).

### 4.8 Journal

**`/journal`**: `hero-page` (TOI); `list-pills` (binding: 8 categories);
`grid-story-cards` (binding: all articles, eyebrow "{category} · {date}").

**Template: article** (two URLs): `article-body` bound (breadcrumb "Journal /
{category}", title, date, image, body paragraphs). **Template: journal category**:
`hero-page` (TOI, title bound); `list-links` bound (date, title, excerpt; empty
state "No published pieces in this category yet.").

### 4.9 Services and vehicle rental

**`/services`**: `hero-page` (TOI, no lede); `carousel-stacked` (binding: services).

**Template: service** (`services/$slug.tsx`): `hero-page` bound (kicker "Service";
image today is always `atlantic-hotel.jpg`, kept as a static field on the template so
nothing changes); `service-detail` bound (Benefits list, Process list,
`form-enquiry` MICE for `mice`, B2C otherwise).

**`/services/tours-excursions`**:

| # | Type | Lines | Content |
|---|---|---|---|
| 1 | `hero-frame` (TOI) | 71-94 | kicker "Services", h1 "Tours & Excursions", paragraph, buttons "Send an enquiry", "Browse the catalogue" (`#all-tours`) |
| 2 | `tours-feature-list` | 96-166 | kicker "Signature itineraries", heading "Three routes we plan end to end", binding: 3 tours, buttons "See the full itinerary", "Ask about this trip" |
| 3 | `tours-catalogue` | 168-205 | anchor `all-tours`; filter labels and options (`src/lib/tour-filters.ts:14-28`), empty state texts; binding: tours |
| 4 | `grid-icon-cards` (numbered) | 207-221 | kicker "How it works", 4 steps (`ENQUIRY_STEPS` 31-48) |
| 5 | `prose-with-form` | 223-249 | heading "Plan your trip", paragraph, 2 definition entries, `form-enquiry` B2C context "Tours & Excursions" |

**`/services/vehicle-rental`**: 1 `hero-vehicle` (TOI, `vehicle-hero.tsx`,
`vehicle-search-form.tsx`: kicker, h1 "Explore More. Travel Freely.", 6 pills, every
search field label and option list); 2 `vehicle-categories` (31-50: header, binding:
8 categories, starting price reads published rates); 3 `vehicle-cards` (52-64:
"Popular Choices", binding: popular vehicles); 4 `vehicle-grid` (66-69: sort and filter
labels, empty state); 5 `grid-icon-cards` (`why-choose-us.tsx`: 4 cards, one says
"What you see is what you pay"); 6 `grid-icon-cards` numbered (`how-it-works.tsx`); 7
`grid-image-tiles` (`airport-transfers.tsx`: 6 linked cards); 8 `vehicle-destinations`
(`destination-vehicles.tsx`, binding: destinations with a vehicle list).

**Template: vehicle**: `vehicle-detail` bound (specs, conditions, destinations, side
card with rate and buttons). **Template: vehicle enquiry**: `vehicle-enquiry` bound (5
step labels, every field label, review lines, sidebar note, error text).
**Template: enquiry received**: `enquiry-received` (two states: with and without a
reference; contact links bound to settings).

### 4.10 Tours

**`/tours`**: `hero-page` with 3 images (TOI, 54-59); `tours-country-filter` (61-90:
pill labels, stacked carousel of tours, empty state).

**`/tours/search`**: `hero-page` (TOI); `tours-search` (61-129: keyword placeholder,
5 selects with their option labels, result count, empty state). The "Self-serve
bookable" option belongs to the dormant booking flow and goes in task B1.

**Country pages** (`/tours/sierra-leone`, `/guinea`, `/liberia`, `/west-africa`, all
through `src/components/country-tours-page.tsx`): `hero-page` (TOI, title and lede
from `COPY` 7-24, image `hofstra-trees-hills-299.jpg`); `grid-tour-cards` (binding:
tours of that country; empty state).

**Template: tour** (`tours/$slug.tsx`), in order:

| # | Type | Lines | Content |
|---|---|---|---|
| 1 | `tour-hero` (TOI) | 53-70 | image, breadcrumb "Home / Tours / {title}", h1, meta line (duration, difficulty, languages; rating line, see B1) |
| 2 | `tour-overview` | 74-90 | summary; facts labels "Duration:", "Group:" ("On request" for 0/0), "Difficulty:", "Languages:" |
| 3 | `tour-list` "Highlights" | 91-96 | bound list |
| 4 | `tour-itinerary` | 97-106 | heading "Itinerary", "Day {n}" cards |
| 5 | `tour-inclusions` | 107-124 | "Inclusions", "Exclusions" |
| 6 | `tour-practicalities` | 125-153 | "Meeting point:", "Requirements:", "Destination:" link, Freetown map and caption "…Exact pickup is on the voucher." |
| 7 | `tour-gallery` | 154-158 | bound images |
| 8 | `tour-reviews` | 159-171 | heading "Reviews", note, empty state "No moderated reviews yet." |
| 9 | `faq` bound | 172-180 | heading "FAQs"; binding: the tour's FAQ group (all 22 use the shared 4-item set today, which describes holds and payments, PC-6) |
| 10 | `form-enquiry` B2C | 181-186 | heading "Request a quote", only on the 6 quote-only tours today |
| 11 | `grid-tour-cards` bound | 187-192 | heading "Related tours", 3 related |
| 12 | `tour-quote-card` (side) | 195-229 | "From", "Quote on request" / "Custom / quote", note, CTA, "Save tour" |
| 13 | `tour-mobile-bar` | 232-240 | "Select dates" bar on the 16 bookable tours |

### 4.11 Stay & Dine (`src/components/hospitality/*`, `src/data/hospitality.ts`)

**`/hospitality`**: 1 `hospitality-notice` (locked while `HOSPITALITY_PREVIEW` is
`true`, `sample-notice.tsx:10-26`); 2 `hero-explore` with the Stays/Dining toggle (TOI,
`hospitality-hero.tsx`, 6 slides); 3 `hospitality-discover` (search bar, featured,
filters, results, sort and empty-state labels; binding: sample stays and dining); 4
`cta-band` ("Need help choosing?").

**Templates: stay, dining** (`stay-detail.tsx`, `dining-detail.tsx`): locked notice,
`hospitality-listing` bound (gallery, pills, booking or reservation card, the
`SAMPLE_LISTING_NOTE`, sections, related). Locked fields: the "Sample" badges
(`listing-card.tsx:139-140,165`), "Sample listing" pills, the sample note, the SAMPLE
suffix on enquiry context (`stay-detail.tsx:95`, `dining-detail.tsx:87`), and
`noindex,nofollow` on all three routes.

---

## 5. Items PR #2's inventory missed, or that need a rule

| # | Item | Where | Treatment |
|---|---|---|---|
| M1 | Inline section headings, kickers and paragraphs inside components (not only routes) | every file under `src/components/sustainability/`, `cruise/sections.tsx`, `vehicle-rental/*`, `hospitality/*` | Moved into section fields in B3 |
| M2 | Form labels, placeholders, options, success and error messages | `enquiry-form.tsx`, `cruise-inquiry-form.tsx`, `newsletter-form.tsx`, `vehicle-booking.tsx`, `inquiry-dialog.tsx`, hospitality search bar | Section fields on each form type; the set of fields stays in code because the server schema depends on it |
| M3 | Carousel ARIA nouns and control labels ("Previous tour", "Pause", "Hide details") | carousels | Section field `label` (noun); control wording in interface text |
| M4 | Desktop header labels that differ from `NAV` | `site-header.tsx:194,203,214` | Navigation item "short label" |
| M5 | Homepage search option list (destinations) and vehicle search option lists (15 pickup locations, 16 destinations, 9 types, 3 driver options) | `index.tsx`, `vehicle-rental.ts` | Bound to collections; vehicle lists become section item lists |
| M6 | Filter labels (tour categories, durations, cruise price and group bands, activity tags, hospitality facets) | `tour-filters.ts`, `excursion-explorer.tsx`, `hospitality/filters.tsx` | Section fields. Hospitality facets stay derived from data, as today |
| M7 | Counts typed into copy ("Seven DMC services", "The four circuits", "Four circuits, one country", "all 15 places") | home, brochure, destinations | Text with a `{count}` token where the code computed it, plain text where it was typed |
| M8 | Unsourced claims inside sentences | footer 145; home 239-241 (AFAR), 302-303 (1 DCM World); about 35-37; why-us 25; partner 29-33; brochure 78-81; coming soon 12 ("eco-lodge partnerships"); "Licensed guide(s)" in catalog 236, 1033 and sustainability 328 | `claim` field: claim text, source link, source date, and the text shown without the claim. Hidden until sourced (B1) |
| M9 | People named on the site: cruise contacts (Sonia Koroma, Alieya A. Kargbo), team names and roles, testimonial name and handle | `cruise.ts`, `catalog.ts:1153-1184` | Team: collection with consent fields; testimonial: collection with source link and date; cruise contacts: section fields (owner check, PC-15) |
| M10 | Per-page share image | `pageHead()` has no image argument | Page field "share image" (empty = site default) |
| M11 | Image positions | `imagePosition`, `object-[center_62%]`, slide `position` | Focal point on each image placement, seeded to today's exact position |
| M12 | Tour CTAs that lead into the dormant booking flow ("Select dates", "Check availability", "Self-serve bookable") | `tours/$slug.tsx:200-240`, `tour-card.tsx:68`, `index.tsx` and `tours/index.tsx` CTA mapping, `tours/search.tsx` | Task B1 (enquiry-only), owner decision O6 |
| M13 | "Save tour" sends visitors to `/login` | `tours/$slug.tsx:219` | Becomes device-local saving (the Stay & Dine favourites pattern) in A3 |
| M14 | Real-sounding sample hotel name "Atlantic Lumley Hotel" | `hospitality.ts` | Owner decision O14 |
| M15 | Legal "last updated" date | `legal-page.tsx:4` | Field on each legal page |
| M16 | Vehicle "What you see is what you pay" while rates are hidden | `why-choose-us.tsx` | Owner decision O8 |
| M17 | Email templates (receipt, team notification) | `src/services/notify.ts` | Not on the site; still deferred |

## 6. Contrast-tuned values (fixed in code, never editable)

`HeroFrame` gradients and film grain (`hero-frame.tsx:81-83`), `HERO_KICKER_CLASS`;
`ExploreHero` scrims and headline shadow (`explore-hero.tsx:98-99,113`); home chip
`bg-brand-dark/55`, search pill `--glass-dim: 0.37`, why band `/75`, experience tiles
`/45`, cruise card `/70`; `LayeredTravelCarousel` (127, 168); `CircuitShowcase`
(116-118, 168); `PlacePeekCarousel` `/92` panel and `/90` chip; `StackedCardCarousel`
`bg-ivory/30`, `/94`, `/10`, `bg-gold/92`; `TeamOrbitCarousel` caption glass;
`DestinationCard` `/92` shelf; `SlidePauseButton` dark surface; `.glass-*` and
`.film-grain` in `src/styles.css:433-650`; the sustainability panels over photos
(`bg-page/90`, `/92`, `/95`, `from-surface via-surface/55`). The theme editor changes
colours, not these alphas or stops, and theme publish re-runs the photo check because
the overlays use `brand-dark`.
