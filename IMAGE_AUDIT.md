# Visual inventory — Tourism Is Life

Audit of every meaningful photographic slot **before** replacement. Current production photography is almost entirely a shared Unsplash pool in `src/data/catalog.ts` (`IMG.*`). The site logo is already local (`public/images/misc/tourism-is-life-web-logo.*`). Team cards have **no portraits** (correct — no authorized photos).

Purpose codes: A Hero · B Destination · C Tour · D Landscape · E Beach · F Wildlife · G Culture · H Heritage · I City · J People · K Activity · L Accommodation · M Transport · N Cruise · O MICE · P Journal · Q Team · R Background

| ID | Page | Section | Current Image | Subject | Visual Purpose | Required Image |
| -- | ---- | ------- | ------------- | ------- | -------------- | -------------- |
| HOME-HERO | Home `/` | Full-bleed hero, text left | `IMG.beach` generic tropical | First impression | A, E | Freetown Peninsula / Lumley Atlantic, left-side negative space |
| HOME-CIRCUIT-* | Home | Four circuit cards | beach / mountain / island / rainforest | Geographic circuits | B, D | Distinct SL west/north/south/east landscapes |
| HOME-WHY | Home | Why TIL overlay | `IMG.forest` generic canopy | R, D | Sierra Leone rainforest (Gola-class) |
| HOME-CAT-WILD | Home | Experience: Wildlife | `IMG.wildlife` (often non-chimp stock) | F | Chimpanzee / SL forest primate |
| HOME-CAT-BEACH | Home | Experience: Beaches | same as hero beach | E | Different peninsula beach than hero |
| HOME-CAT-CULT | Home | Experience: Culture | rainforest (wrong) | G, H | Freetown heritage / Cotton Tree / Krio street |
| HOME-CAT-ADV | Home | Experience: Adventure | rainforest (duplicate) | K, D | Highland / Bintumani-class trek |
| HOME-CRUISE | Home | Operator cruise panel | generic cruise ship | N | Ship or Freetown harbour / quay |
| HOME-JOURNAL | Home | 3 article cards | wildlife / savanna / mountain | P | Match article subjects |
| DEST-INDEX | Destinations index | Hero | `IMG_HERO` beach | A | Peninsula coast (can share canonical hero) |
| DEST-CIRCUIT | Destinations index | Circuit cards | same as HOME-CIRCUIT | B | Same circuit canonicals |
| DEST-WEST | `/destinations/western-circuit` | Hero | beach | B, E | Peninsula |
| DEST-NORTH | `/destinations/northern-circuit` | Hero | mountain | B, D | Northern highlands |
| DEST-SOUTH | `/destinations/southern-circuit` | Hero | island | B | Southern island / Tiwai river |
| DEST-EAST | `/destinations/eastern-circuit` | Hero | rainforest | B | Gola rainforest |
| DEST-FREE | Destination Freetown | Hero/card | generic African city | I | Freetown itself |
| DEST-BANANA | Banana Island | Hero/card | generic island | B, E | Banana Islands |
| DEST-PEN | Freetown Peninsula | Hero/card | generic beach | E | Peninsula beaches |
| DEST-TACA | Tacugama | Hero/card | generic wildlife | F | Chimpanzee / sanctuary |
| DEST-BUNCE | Bunce Island | Hero/card | generic river boat | H | Fort ruins |
| DEST-BUMB | Bumbuna Falls | Hero/card | generic waterfall | D | Bumbuna Falls |
| DEST-WARA | Wara Wara | Hero/card | generic mountain | D | Northern highland (flag if not Wara-specific) |
| DEST-MAKE | Makeni | Hero/card | generic town | I | Makeni / northern town |
| DEST-BINT | Bintumani | Hero/card | generic alpine | D | Loma / Bintumani |
| DEST-BO | Bo | Hero/card | generic town | I | Bo / southern town |
| DEST-TIWAI | Tiwai | Hero/card | generic forest path | F, D | Tiwai / Moa forest-river |
| DEST-TURTLE | Turtle Islands | Hero/card | generic island | E | Remote SL island / Turtle if found |
| DEST-GOLA | Gola | Hero/card | generic rainforest | D, F | Gola rainforest |
| DEST-KENE | Kenema | Hero/card | generic town | I | Kenema / eastern town |
| DEST-KONO | Kono | Hero/card | generic savanna | D | Eastern inland / diamond-country landscape |
| TOUR-* | Each `/tours/$slug` | Hero + gallery (2) | Same IMG pool, often identical to dest | C | Canonical dest + 1–2 story variants |
| TOUR-INDEX | `/tours` | Hero | `IMG_FOREST` | A | Expedition / forest |
| TOUR-SEARCH | `/tours/search` | Hero | `IMG_HERO` | A | Coast (mood OK) |
| TOUR-SL / GN / LR / WA | Country tour pages | Hero | `IMG_FOREST` all | A | Country-appropriate: SL coast/forest, Guinea highland, Liberia forest, Mano overland |
| CRUISE-* | All cruise routes | Hero | same `IMG_CRUISE` ship | N | Diversify: harbour, ship, group, shore |
| SVC-INDEX | `/services` | Hero | `IMG_MICE` conference | O | Conference/event |
| SVC-$slug | Each service | Hero | **all** `IMG_MICE` | O/M/L | Service-specific |
| ABOUT-* | About, offer, why, sustainability | Hero | `IMG_FOREST` | R | Forest / conservation (sustainability); abstract travel OK for why-us |
| ABOUT-TEAM | `/about/team` | Hero + cards | forest; **no portraits** | Q | Keep no fake faces; landscape hero OK |
| JOURNAL-* | Journal index/category | Hero | forest | P | Editorial travel |
| JOURNAL-ART | 4 articles | Cards/heroes | stand-ins | P | Tacugama; overland; adventure; Bunce/homecoming |
| CONTACT-* | Contact / B2C / emergency | Hero | beach | R | Coast mood OK |
| CONTACT-PARTNER | Partner enquiry | Hero | forest | R | Landscape OK |
| PARTNER | `/partner` | Hero | forest | R | Landscape OK |
| COMING | `/coming-soon` | Hero | beach | R | Horizon/coast OK |
| LOGO | Header/footer | Brand | Local logo | — | Keep |
| TEAM-PORTRAIT | Team cards | None | Named people | Q | IMAGE_RESEARCH_REQUIRED — no authorized portraits |

**Reuse rule applied:** one *canonical* file per destination is allowed on destination card + matching tour hero. Galleries and adjacent cards on the same screen must not all be that same file.
