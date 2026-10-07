export type CircuitId =
  | "eastern-circuit"
  | "northern-circuit"
  | "southern-circuit"
  | "western-circuit";

export type TourCategory = "wildlife" | "beaches" | "culture" | "adventure";

export type CountryId = "sierra-leone" | "guinea" | "liberia" | "west-africa";

export type Difficulty = "easy" | "moderate" | "challenging";

export interface Circuit {
  id: CircuitId;
  name: string;
  region: string;
  bestTime: string;
  summary: string;
  image: string;
  imageAlt: string;
  highlights: string[];
}

export interface Destination {
  slug: string;
  name: string;
  circuit: CircuitId;
  country: CountryId;
  summary: string;
  image: string;
  imageAlt: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface Tour {
  slug: string;
  title: string;
  country: CountryId;
  circuit: CircuitId;
  destinationSlug: string;
  duration: string;
  durationDays: number;
  category: TourCategory;
  difficulty: Difficulty;
  groupMin: number;
  groupMax: number;
  languages: string[];
  bookable: boolean;
  rating: number;
  reviewCount: number;
  summary: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  requirements: string;
  meetingPoint: string;
  image: string;
  imageAlt: string;
  gallery: { src: string; alt: string }[];
  itinerary: ItineraryDay[];
  faqs: { q: string; a: string }[];
  /** Published fare in minor units. Omit or null = quote-only (never invent prices). */
  priceCents?: number | null;
  currency?: string;
}

export interface Article {
  slug: string;
  category: string;
  categoryLabel: string;
  title: string;
  date: string;
  excerpt: string;
  body: string;
  image: string;
  imageAlt: string;
}

export interface ServiceItem {
  slug: string;
  name: string;
  summary: string;
  benefits: string[];
  process: string[];
  /**
   * Only set for services with a genuine, verified photograph. Three services
   * (visa facilitation, travel insurance, ticketing) have no natural photo
   * subject, and hotel-reservations has no lodging photo in the library that
   * isn't already used for MICE — `ServiceCard` renders an icon treatment for
   * any service without an image rather than forcing a mismatched photo.
   */
  image?: string;
  imageAlt?: string;
}

/** Local Wikimedia Commons images stored under public/images/ — see public/images/image-sources.json for licensing */
const IMG = {
  beach:
    "/images/beaches/tokeh-beach-hero.jpg",
  rainforest:
    "/images/rainforest/hofstra-trees-hills-299.jpg",
  mountain:
    "/images/mountains/mount-bintumani.jpg",
  waterfall:
    "/images/waterfalls/bumbuna-hills.jpg",
  island:
    "/images/islands/sherbro-island.jpg",
  wildlife:
    "/images/wildlife/tacugama-chimpanzee.jpg",
  village:
    "/images/culture/makeni-sunset.jpg",
  boat:
    "/images/heritage/bunce-island-wall.jpg",
  forestPath:
    "/images/rainforest/tiwai-island.jpg",
  savanna:
    "/images/mountains/outamba-mountain.jpg",
  city:
    "/images/cities/freetown-street.jpg",
  people:
    "/images/culture/makeni-sunset.jpg",
  cruise:
    "/images/cruise/freetown-port.jpg",
  meeting:
    "/images/mice/atlantic-hotel.jpg",
};

export const circuits: Circuit[] = [
  {
    id: "western-circuit",
    name: "Western Circuit",
    region: "Freetown Peninsula & Western Area",
    bestTime: "Year-round",
    summary:
      "Freetown’s peninsula beaches, Banana Island, Tacugama Chimpanzee Sanctuary, and Bunce Island: the gateway most travelers meet first.",
    image: IMG.beach,
    imageAlt: "Tropical coastline with pale sand and turquoise water, editorial stand-in, not an official Tourism Is Life photograph",
    highlights: ["Freetown Peninsula beaches", "Banana Island", "Tacugama", "Bunce Island"],
  },
  {
    id: "northern-circuit",
    name: "Northern Circuit",
    region: "Makeni, Kabala, Outamba-Kilimi, Bintumani",
    bestTime: "December – March",
    summary:
      "Highland trekking and savannah parks: Wara Wara, Bumbuna Falls, and Mount Bintumani, West Africa’s highest peak.",
    image: IMG.mountain,
    imageAlt: "Open highland terrain under cloud, editorial stand-in for Sierra Leone’s northern ranges",
    highlights: ["Mount Bintumani", "Wara Wara Mountains", "Bumbuna Falls", "Makeni"],
  },
  {
    id: "southern-circuit",
    name: "Southern Circuit",
    region: "Bo, Tiwai, Turtle Islands, Sherbro",
    bestTime: "October – April",
    summary:
      "Wildlife sanctuaries and island coasts: Tiwai Island, the Turtle Islands, and the southern riverine towns.",
    image: IMG.island,
    imageAlt: "Remote tropical island seen from the water, editorial stand-in",
    highlights: ["Tiwai Island", "Turtle Islands", "Bo", "Sherbro Island"],
  },
  {
    id: "eastern-circuit",
    name: "Eastern Circuit",
    region: "Kenema, Kailahun, Gola, Kono",
    bestTime: "November – May",
    summary:
      "Gola Rainforest National Park, home to pygmy hippos, hornbills, and one of West Africa’s last lowland rainforests, plus Kenema and Kono.",
    image: IMG.rainforest,
    imageAlt: "Dense tropical rainforest canopy, editorial stand-in for Gola",
    highlights: ["Gola Rainforest", "Kenema", "Kono", "Kailahun"],
  },
];

export const destinations: Destination[] = [
  { slug: "freetown", name: "Freetown", circuit: "western-circuit", country: "sierra-leone", summary: "Sierra Leone’s capital: Krio heritage, Cotton Tree, and the peninsula gateway.", image: IMG.city, imageAlt: "A busy market street in central Freetown, Sierra Leone" },
  { slug: "banana-island", name: "Banana Island", circuit: "western-circuit", country: "sierra-leone", summary: "Three islands off Yawri Bay: Dublin (beaches), Ricketts (forest), and uninhabited Mes-Meheux, settled by freed slaves in the late 18th and 19th centuries.", image: "/images/islands/banana-island-rainbow.jpg", imageAlt: "Banana Island, Sierra Leone" },
  { slug: "freetown-peninsula", name: "Freetown Peninsula", circuit: "western-circuit", country: "sierra-leone", summary: "Eleven beaches along the Western Area peninsula, from River Number Two to Black Johnson.", image: "/images/beaches/river-number-two-beach.jpg", imageAlt: "A wooden canoe marked \"No 2 River\" on the sand at River Number Two Beach, Sierra Leone" },
  { slug: "tacugama", name: "Tacugama Chimpanzee Sanctuary", circuit: "western-circuit", country: "sierra-leone", summary: "A forest sanctuary above Freetown protecting chimpanzees rescued across Sierra Leone.", image: IMG.wildlife, imageAlt: "Chimpanzee in a forest setting, licensed stock, not a Tacugama publicity still" },
  { slug: "bunce-island", name: "Bunce Island", circuit: "western-circuit", country: "sierra-leone", summary: "A former slave-trading fort in the Sierra Leone River, a pilgrimage and history site.", image: IMG.boat, imageAlt: "Overgrown fortress wall at Bunce Island on the Sierra Leone River" },
  { slug: "bumbuna-falls", name: "Bumbuna Waterfalls", circuit: "northern-circuit", country: "sierra-leone", summary: "A day-trip waterfall and hydro landscape north of Freetown.", image: IMG.waterfall, imageAlt: "Waterfall in a forested gorge, editorial stand-in" },
  { slug: "wara-wara", name: "Wara Wara Mountains", circuit: "northern-circuit", country: "sierra-leone", summary: "Highland trekking in Koinadugu District.", image: "/images/mountains/wara-wara-mountains.jpg", imageAlt: "The Wara Wara Mountains in Koinadugu District, Sierra Leone" },
  { slug: "makeni", name: "Makeni", circuit: "northern-circuit", country: "sierra-leone", summary: "The northern commercial hub and a base for Outamba-Kilimi and highland trips.", image: IMG.village, imageAlt: "Town and countryside, editorial stand-in" },
  { slug: "bintumani", name: "Mount Bintumani", circuit: "northern-circuit", country: "sierra-leone", summary: "The highest peak in Sierra Leone and West Africa’s Loma Mountains.", image: IMG.mountain, imageAlt: "High peak above cloud, editorial stand-in, not a verified Bintumani summit photograph" },
  { slug: "bo", name: "Bo", circuit: "southern-circuit", country: "sierra-leone", summary: "Sierra Leone’s second city and the southern circuit’s inland gateway.", image: "/images/culture/bo-rice-farming.jpg", imageAlt: "Rice farming in the countryside around Bo, Sierra Leone" },
  { slug: "tiwai", name: "Tiwai Island", circuit: "southern-circuit", country: "sierra-leone", summary: "A wildlife sanctuary in the Moa River known for primates and forest birds.", image: IMG.forestPath, imageAlt: "Forest island path, editorial stand-in" },
  { slug: "turtle-islands", name: "Turtle Islands", circuit: "southern-circuit", country: "sierra-leone", summary: "A remote archipelago of beaches, fishing communities, and turtle nesting shores.", image: "/images/beaches/tokeh-beach.jpg", imageAlt: "Remote Sierra Leone beach, representative of the Turtle Islands coastline" },
  { slug: "gola", name: "Gola Rainforest", circuit: "eastern-circuit", country: "sierra-leone", summary: "Transboundary rainforest, pygmy hippos, and 300+ bird species.", image: "/images/rainforest/gola-national-parks.jpg", imageAlt: "Forested hills in the Gola Rainforest area of Sierra Leone" },
  { slug: "kenema", name: "Kenema", circuit: "eastern-circuit", country: "sierra-leone", summary: "Eastern Province hub and a base for Gola and diamond-country travel.", image: "/images/culture/kenema-aerial.jpg", imageAlt: "Aerial view of Kenema, Sierra Leone" },
  { slug: "kono", name: "Kono", circuit: "eastern-circuit", country: "sierra-leone", summary: "Kono District, diamond country and a window on eastern Sierra Leone.", image: "/images/culture/koidu-market.jpg", imageAlt: "Koidu market in Kono District, Sierra Leone" },
];

function baseFaqs(): { q: string; a: string }[] {
  return [
    { q: "Are prices listed online?", a: "Published rates are quote-based. Request a quote or start a booking enquiry and the team will confirm current pricing." },
    { q: "Do I need a yellow fever certificate?", a: "A yellow fever vaccination certificate is required if traveling to and from certain areas. Confirm current entry rules before you fly." },
    { q: "Is this a guaranteed departure?", a: "Departures depend on availability and group size. Seats are held for 15 minutes; a booking is confirmed only after a verified payment event." },
    { q: "Can I book as a guest?", a: "Yes. An account is optional. After confirmation you can sign in to keep vouchers and future trips in one place." },
  ];
}

function tour(
  partial: Omit<Tour, "faqs" | "gallery"> & { gallery?: Tour["gallery"]; faqs?: Tour["faqs"] },
): Tour {
  return {
    ...partial,
    faqs: partial.faqs ?? baseFaqs(),
    gallery: partial.gallery ?? [{ src: partial.image, alt: partial.imageAlt }],
  };
}

export const tours: Tour[] = [
  tour({
    slug: "freetown-city-tour",
    title: "Freetown City Tour",
    country: "sierra-leone",
    circuit: "western-circuit",
    destinationSlug: "freetown",
    duration: "Half day",
    durationDays: 1,
    category: "culture",
    difficulty: "easy",
    groupMin: 1,
    groupMax: 12,
    languages: ["English"],
    bookable: true,
    rating: 4.1,
    reviewCount: 25,
    summary: "A guided introduction to Freetown’s Krio heritage, harbour, and city landmarks, the same city tours Tourism Is Life is known for.",
    highlights: ["Krio heritage walk", "Harbour and city viewpoints", "Local food stop"],
    inclusions: ["Licensed guide", "Ground transport in Freetown", "Bottled water"],
    exclusions: ["Meals not listed", "Personal purchases", "Gratuities"],
    requirements: "Comfortable walking shoes. Modest dress for religious sites.",
    meetingPoint: "Freetown, exact pickup confirmed on voucher.",
    image: "/images/cities/freetown-street.jpg",
    imageAlt: "A busy market street in central Freetown, Sierra Leone",
    gallery: [{ src: "/images/cities/freetown-street.jpg", alt: "Freetown market street" }, { src: "/images/culture/sierra-leone-big-market.jpg", alt: "Local life" }],
    itinerary: [{ day: 1, title: "City orientation", description: "Morning or afternoon circuit of Freetown highlights with a local guide." }],
  }),
  tour({
    slug: "tacugama-chimpanzee-sanctuary",
    title: "Tacugama Chimpanzee Sanctuary",
    country: "sierra-leone",
    circuit: "western-circuit",
    destinationSlug: "tacugama",
    duration: "Half day",
    durationDays: 1,
    category: "wildlife",
    difficulty: "easy",
    groupMin: 1,
    groupMax: 10,
    languages: ["English"],
    bookable: true,
    rating: 4.1,
    reviewCount: 25,
    summary: "A half-day visit to Tacugama in the forested hills above Freetown, pairing conservation with peninsula views.",
    highlights: ["Sanctuary visit", "Forest setting", "Conservation briefing"],
    inclusions: ["Transport from Freetown", "Guide", "Sanctuary entry"],
    exclusions: ["Meals", "Souvenirs"],
    requirements: "Closed shoes. Follow sanctuary viewing rules.",
    meetingPoint: "Freetown hotel pickup.",
    image: "/images/wildlife/tacugama-chimpanzee.jpg",
    imageAlt: "Chimpanzees at Tacugama Chimpanzee Sanctuary near Freetown, Sierra Leone",
    gallery: [{ src: "/images/wildlife/tacugama-chimpanzee.jpg", alt: "Tacugama chimpanzees" }, { src: "/images/rainforest/tiwai-island.jpg", alt: "Forest path" }],
    itinerary: [{ day: 1, title: "Tacugama morning", description: "Drive to the sanctuary, guided visit, return to Freetown." }],
  }),
  tour({
    slug: "freetown-peninsula",
    title: "Freetown Peninsula",
    country: "sierra-leone",
    circuit: "western-circuit",
    destinationSlug: "freetown-peninsula",
    duration: "Day trip",
    durationDays: 1,
    category: "beaches",
    difficulty: "easy",
    groupMin: 1,
    groupMax: 12,
    languages: ["English"],
    bookable: true,
    rating: 5,
    reviewCount: 17,
    summary: "Beaches of the Western Area peninsula: golden and white-sand coves including well-known stops such as River Number Two and Black Johnson.",
    highlights: ["Peninsula beaches", "Atlantic viewpoints", "Seafood lunch stop (own account unless quoted)"],
    inclusions: ["Vehicle and driver-guide", "Fuel"],
    exclusions: ["Meals", "Beach club fees if any"],
    requirements: "Sun protection. Swim at your own risk.",
    meetingPoint: "Freetown.",
    image: "/images/beaches/river-number-two-beach.jpg",
    imageAlt: "River Number Two beach on the Freetown Peninsula, Sierra Leone",
    gallery: [{ src: "/images/beaches/river-number-two-beach.jpg", alt: "Peninsula beach" }, { src: "/images/beaches/tokeh-beach-hero.jpg", alt: "Coast" }],
    itinerary: [{ day: 1, title: "Peninsula loop", description: "South along the peninsula beaches and return." }],
  }),
  tour({
    slug: "banana-island",
    title: "Banana Island",
    country: "sierra-leone",
    circuit: "western-circuit",
    destinationSlug: "banana-island",
    duration: "Half day",
    durationDays: 1,
    category: "beaches",
    difficulty: "easy",
    groupMin: 2,
    groupMax: 10,
    languages: ["English"],
    bookable: true,
    rating: 4.5,
    reviewCount: 22,
    summary: "The Banana Islands lie off Yawri Bay, south-west of the Freetown Peninsula. Dublin and Ricketts are linked by a stone causeway; Mes-Meheux is uninhabited. Access is by boat from Kent.",
    highlights: ["Boat transfer from Kent", "Historical island walk", "Lunch and recreation time"],
    inclusions: ["Transportation (private bus with A/C)", "Boat transfer to Banana Island", "Lunch and complimentary drinks", "English-speaking tour guide", "Entrance / site fees", "Insurance"],
    exclusions: ["Personal expenses", "Alcoholic drinks", "Tips to driver and guide"],
    requirements: "Ability to board a small boat. Non-swimmers should say so in advance.",
    meetingPoint: "State Avenue / Cotton Tree pickup, then Kent Village boat landing, confirmed on voucher.",
    image: "/images/islands/banana-island-rainbow.jpg",
    imageAlt: "Banana Island off the coast of Sierra Leone",
    gallery: [{ src: "/images/islands/banana-island-rainbow.jpg", alt: "Banana Island" }, { src: "/images/islands/sherbro-island.jpg", alt: "Boat crossing" }],
    itinerary: [
      { day: 1, title: "Freetown to Kent", description: "Set off from State Avenue Cotton Tree to Kent Village." },
      { day: 1, title: "Crossing and island", description: "Boat transfer to Banana Island, historical tour, lunch and recreation." },
      { day: 1, title: "Return", description: "Depart Kent and transfer to Freetown." },
    ],
  }),
  tour({
    slug: "picket-hill",
    title: "Picket Hill",
    country: "sierra-leone",
    circuit: "western-circuit",
    destinationSlug: "freetown-peninsula",
    duration: "Full day",
    durationDays: 1,
    category: "adventure",
    difficulty: "moderate",
    groupMin: 2,
    groupMax: 8,
    languages: ["English"],
    bookable: true,
    rating: 4.1,
    reviewCount: 21,
    summary: "A full-day peninsula hike with forest and coastal views above the Western Area.",
    highlights: ["Ridge walking", "Forest cover", "Peninsula views"],
    inclusions: ["Guide", "Transport to trailhead", "Water"],
    exclusions: ["Meals", "Trekking poles"],
    requirements: "Moderate fitness. Closed shoes.",
    meetingPoint: "Freetown.",
    image: "/images/rainforest/picket-hill-national-parks.jpg",
    imageAlt: "Hiking trail in the Loma Mountains Forest Reserve, Sierra Leone, representative of Picket Hill forest trail",
    gallery: [{ src: "/images/rainforest/picket-hill-national-parks.jpg", alt: "Trail" }, { src: "/images/mountains/mount-bintumani.jpg", alt: "Ridge" }],
    itinerary: [{ day: 1, title: "Picket Hill hike", description: "Trailhead transfer, hike, return." }],
  }),
  tour({
    slug: "bunce-tasso-island",
    title: "Bunce & Tasso Island",
    country: "sierra-leone",
    circuit: "western-circuit",
    destinationSlug: "bunce-island",
    duration: "Half day",
    durationDays: 1,
    category: "culture",
    difficulty: "easy",
    groupMin: 2,
    groupMax: 12,
    languages: ["English"],
    bookable: true,
    rating: 4.1,
    reviewCount: 25,
    summary: "River journey to Bunce Island’s fort ruins and neighbouring Tasso, history at the heart of the transatlantic story.",
    highlights: ["Fort ruins", "River crossing", "Guided history"],
    inclusions: ["Boat", "Guide", "Site access"],
    exclusions: ["Meals"],
    requirements: "Steady footing on uneven ruins. Sun hat.",
    meetingPoint: "Freetown waterfront landing, confirmed on booking.",
    image: "/images/heritage/bunce-island-wall.jpg",
    imageAlt: "Fortress wall at Bunce Island on the Sierra Leone River",
    gallery: [{ src: "/images/heritage/bunce-island-wall.jpg", alt: "River" }, { src: "/images/islands/sherbro-island.jpg", alt: "Island shore" }],
    itinerary: [{ day: 1, title: "River islands", description: "Boat to Bunce and Tasso, guided visit, return." }],
  }),
  tour({
    slug: "bumbuna-waterfalls",
    title: "Bumbuna Waterfalls",
    country: "sierra-leone",
    circuit: "northern-circuit",
    destinationSlug: "bumbuna-falls",
    duration: "Day trip",
    durationDays: 1,
    category: "adventure",
    difficulty: "easy",
    groupMin: 2,
    groupMax: 10,
    languages: ["English"],
    bookable: true,
    rating: 4.1,
    reviewCount: 10,
    summary: "A northern day trip to Bumbuna Falls through inland countryside.",
    highlights: ["Waterfall viewpoint", "Road journey north", "Picnic stop"],
    inclusions: ["Vehicle", "Driver-guide"],
    exclusions: ["Meals", "Park fees if applied on the day"],
    requirements: "Long driving day. Motion-sickness medication if needed.",
    meetingPoint: "Freetown.",
    image: "/images/waterfalls/bumbuna-hills.jpg",
    imageAlt: "Hills near Bumbuna in northern Sierra Leone, the Bumbuna Falls region",
    gallery: [{ src: "/images/waterfalls/bumbuna-hills.jpg", alt: "Falls" }, { src: "/images/mountains/outamba-mountain.jpg", alt: "Inland road" }],
    itinerary: [{ day: 1, title: "Bumbuna out-and-back", description: "Early departure, falls visit, return evening." }],
  }),
  tour({
    slug: "wara-wara-mountain",
    title: "Wara Wara Mountain",
    country: "sierra-leone",
    circuit: "northern-circuit",
    destinationSlug: "wara-wara",
    duration: "3D / 2N",
    durationDays: 3,
    category: "adventure",
    difficulty: "challenging",
    groupMin: 2,
    groupMax: 8,
    languages: ["English"],
    bookable: true,
    rating: 5,
    reviewCount: 17,
    summary: "A three-day highland trek in Koinadugu District’s Wara Wara range.",
    highlights: ["Mountain trekking", "Village stays", "Northern highlands"],
    inclusions: ["Guide", "Camping or simple lodge as quoted", "Ground transport"],
    exclusions: ["International flights", "Travel insurance", "Sleeping bag unless quoted"],
    requirements: "Good fitness. Prior trekking experience recommended.",
    meetingPoint: "Freetown or Makeni, confirmed on itinerary.",
    image: "/images/mountains/wara-wara-mountains.jpg",
    imageAlt: "Wara Wara Mountains near Bafodia in northern Sierra Leone",
    gallery: [{ src: "/images/mountains/wara-wara-mountains.jpg", alt: "Mountains" }, { src: "/images/culture/makeni-sunset.jpg", alt: "Highland village" }],
    itinerary: [
      { day: 1, title: "Travel north", description: "Transfer into Koinadugu and evening briefing." },
      { day: 2, title: "Wara Wara trek", description: "Full trekking day with picnic lunch." },
      { day: 3, title: "Descent and return", description: "Morning trail and road return." },
    ],
  }),
  tour({
    slug: "makeni-city",
    title: "Makeni City",
    country: "sierra-leone",
    circuit: "northern-circuit",
    destinationSlug: "makeni",
    duration: "3D / 2N",
    durationDays: 3,
    category: "culture",
    difficulty: "easy",
    groupMin: 2,
    groupMax: 10,
    languages: ["English"],
    bookable: true,
    rating: 4.5,
    reviewCount: 22,
    summary: "Three days in Bombali District with Makeni as a cultural and market base.",
    highlights: ["Makeni town life", "Northern countryside", "Optional park add-on on request"],
    inclusions: ["Transport", "Guide", "Two nights’ accommodation as quoted"],
    exclusions: ["Meals not listed", "Optional activities"],
    requirements: "No special fitness requirement.",
    meetingPoint: "Freetown.",
    image: "/images/culture/makeni-sunset.jpg",
    imageAlt: "Sunset over Makeni in northern Sierra Leone",
    gallery: [{ src: "/images/culture/makeni-sunset.jpg", alt: "Town" }, { src: "/images/mountains/outamba-mountain.jpg", alt: "Countryside" }],
    itinerary: [
      { day: 1, title: "Freetown to Makeni", description: "Road north and evening orientation." },
      { day: 2, title: "District day", description: "Town and countryside visits." },
      { day: 3, title: "Return", description: "Drive back to Freetown." },
    ],
  }),
  tour({
    slug: "bintumani-mountain",
    title: "Bintumani Mountain",
    country: "sierra-leone",
    circuit: "northern-circuit",
    destinationSlug: "bintumani",
    duration: "4D / 3N",
    durationDays: 4,
    category: "adventure",
    difficulty: "challenging",
    groupMin: 2,
    groupMax: 8,
    languages: ["English"],
    bookable: true,
    rating: 4.1,
    reviewCount: 21,
    summary: "Expedition to Mount Bintumani, the highest peak in Sierra Leone, a signature Tourism Is Life trek.",
    highlights: ["Summit attempt", "Loma Mountains", "Remote camping"],
    inclusions: ["Mountain guide", "Porters as quoted", "Camping kit as quoted", "Transport"],
    exclusions: ["Personal trekking gear", "Insurance"],
    requirements: "High fitness. Altitude and remote conditions. Travel insurance required.",
    meetingPoint: "Freetown.",
    image: "/images/mountains/mount-bintumani.jpg",
    imageAlt: "Mount Bintumani, the highest peak in Sierra Leone and the Loma Mountains",
    gallery: [{ src: "/images/mountains/mount-bintumani.jpg", alt: "Peak" }, { src: "/images/mountains/adventure-bintumani-fb.jpg", alt: "Approach trail" }],
    itinerary: [
      { day: 1, title: "Approach", description: "Road to the Loma foothills." },
      { day: 2, title: "Ascent camp", description: "Trek to high camp." },
      { day: 3, title: "Summit window", description: "Summit attempt and descent." },
      { day: 4, title: "Return", description: "Road back to Freetown." },
    ],
  }),
  tour({
    slug: "bo-city",
    title: "Bo City",
    country: "sierra-leone",
    circuit: "southern-circuit",
    destinationSlug: "bo",
    duration: "3D / 2N",
    durationDays: 3,
    category: "culture",
    difficulty: "easy",
    groupMin: 2,
    groupMax: 10,
    languages: ["English"],
    bookable: true,
    rating: 4.1,
    reviewCount: 25,
    summary: "A three-day stay in Bo, Sierra Leone’s second city and southern gateway.",
    highlights: ["Bo city", "Southern Province context", "Link to Tiwai on request"],
    inclusions: ["Transport", "Guide", "Accommodation as quoted"],
    exclusions: ["Meals not listed"],
    requirements: "None beyond standard travel fitness.",
    meetingPoint: "Freetown.",
    image: "/images/culture/bo-rice-farming.jpg",
    imageAlt: "Rice cultivation in the inland valleys around Bo, Sierra Leone",
    gallery: [{ src: "/images/culture/bo-rice-farming.jpg", alt: "Bo" }, { src: "/images/culture/sierra-leone-big-market.jpg", alt: "Markets" }],
    itinerary: [
      { day: 1, title: "South to Bo", description: "Road transfer and evening walk." },
      { day: 2, title: "Bo and surroundings", description: "City and nearby visits." },
      { day: 3, title: "Return", description: "Drive to Freetown." },
    ],
  }),
  tour({
    slug: "tiwai-island",
    title: "Tiwai Island Wildlife Sanctuary",
    country: "sierra-leone",
    circuit: "southern-circuit",
    destinationSlug: "tiwai",
    duration: "3D / 2N",
    durationDays: 3,
    category: "wildlife",
    difficulty: "moderate",
    groupMin: 2,
    groupMax: 8,
    languages: ["English"],
    bookable: true,
    rating: 5,
    reviewCount: 17,
    summary: "Two nights on Tiwai Island in the Moa River, with primates, forest walks, and night sounds of the southern rainforest.",
    highlights: ["Island sanctuary", "Primate walks", "River setting"],
    inclusions: ["Transport", "Canoe transfer", "Simple island lodging as quoted", "Guided walks"],
    exclusions: ["Alcohol", "Travel insurance"],
    requirements: "Ability to walk forest trails. Insect protection.",
    meetingPoint: "Freetown or Bo.",
    image: "/images/rainforest/tiwai-island.jpg",
    imageAlt: "Tiwai Island wildlife sanctuary in the Moa River, Sierra Leone",
    gallery: [{ src: "/images/rainforest/tiwai-island.jpg", alt: "Forest" }, { src: "/images/wildlife/tacugama-chimpanzee.jpg", alt: "Wildlife habitat" }],
    itinerary: [
      { day: 1, title: "To Tiwai", description: "Road south and canoe to the island." },
      { day: 2, title: "Sanctuary walks", description: "Dawn and afternoon guided walks." },
      { day: 3, title: "Return", description: "Leave the island and drive north." },
    ],
  }),
  tour({
    slug: "turtle-island",
    title: "Turtle Islands",
    country: "sierra-leone",
    circuit: "southern-circuit",
    destinationSlug: "turtle-islands",
    duration: "3D / 2N",
    durationDays: 3,
    category: "beaches",
    difficulty: "moderate",
    groupMin: 2,
    groupMax: 10,
    languages: ["English"],
    bookable: true,
    rating: 4.5,
    reviewCount: 22,
    summary: "A three-day expedition to the Turtle Islands: remote beaches and fishing communities off the southern coast.",
    highlights: ["Archipelago boat travel", "Remote beaches", "Community visit"],
    inclusions: ["Boat", "Guide", "Camping or simple lodging as quoted"],
    exclusions: ["Sleeping bag unless quoted", "Meals not listed"],
    requirements: "Comfortable on small boats. Flexible timing with tides and weather.",
    meetingPoint: "Southern coast landing, confirmed on itinerary.",
    image: "/images/beaches/tokeh-beach.jpg",
    imageAlt: "Tokeh Beach coastline in Sierra Leone, representative of remote island beaches",
    gallery: [{ src: "/images/beaches/tokeh-beach.jpg", alt: "Islands" }, { src: "/images/islands/sherbro-island.jpg", alt: "Beach" }],
    itinerary: [
      { day: 1, title: "To the islands", description: "Boat out and camp or lodge." },
      { day: 2, title: "Island time", description: "Beaches, snorkelling if conditions allow, village visit." },
      { day: 3, title: "Return", description: "Boat back to the mainland." },
    ],
  }),
  tour({
    slug: "gola-rainforest",
    title: "Gola Rainforest",
    country: "sierra-leone",
    circuit: "eastern-circuit",
    destinationSlug: "gola",
    duration: "3D / 2N",
    durationDays: 3,
    category: "wildlife",
    difficulty: "moderate",
    groupMin: 2,
    groupMax: 8,
    languages: ["English"],
    bookable: true,
    rating: 4.1,
    reviewCount: 25,
    summary: "Three days in Gola Rainforest National Park, in pygmy hippo country, with hornbills and one of West Africa’s last lowland rainforests.",
    highlights: ["Rainforest walks", "Birding", "Park community context"],
    inclusions: ["Park arrangements as quoted", "Guide", "Transport", "Simple lodging"],
    exclusions: ["Specialist birding gear", "Insurance"],
    requirements: "Forest walking fitness. Rain jacket year-round.",
    meetingPoint: "Freetown or Kenema.",
    image: "/images/rainforest/gola-national-parks.jpg",
    imageAlt: "Gola Rainforest National Park landscape, Sierra Leone",
    gallery: [
      { src: "/images/rainforest/gola-national-parks.jpg", alt: "Rainforest canopy" },
      { src: IMG.wildlife, alt: "Forest wildlife" },
    ],
    itinerary: [
      { day: 1, title: "East to Gola", description: "Road to the park edge and evening briefing." },
      { day: 2, title: "Forest day", description: "Guided walks and river time." },
      { day: 3, title: "Return", description: "Drive west." },
    ],
  }),
  tour({
    slug: "kenema-city",
    title: "Kenema City",
    country: "sierra-leone",
    circuit: "eastern-circuit",
    destinationSlug: "kenema",
    duration: "3D / 2N",
    durationDays: 3,
    category: "culture",
    difficulty: "easy",
    groupMin: 2,
    groupMax: 10,
    languages: ["English"],
    bookable: true,
    rating: 5,
    reviewCount: 17,
    summary: "Three days in Kenema District, the eastern hub for Gola and diamond-country travel.",
    highlights: ["Kenema town", "Eastern Province markets", "Optional Gola day on request"],
    inclusions: ["Transport", "Guide", "Accommodation as quoted"],
    exclusions: ["Meals not listed"],
    requirements: "None beyond standard travel fitness.",
    meetingPoint: "Freetown.",
    image: "/images/culture/kenema-aerial.jpg",
    imageAlt: "Aerial view of Kenema, Sierra Leone",
    gallery: [{ src: "/images/culture/kenema-aerial.jpg", alt: "Kenema town" }, { src: IMG.rainforest, alt: "East forest edge" }],
    itinerary: [
      { day: 1, title: "To Kenema", description: "Long road east." },
      { day: 2, title: "District day", description: "Town and nearby visits." },
      { day: 3, title: "Return", description: "Drive to Freetown." },
    ],
  }),
  tour({
    slug: "kono-b-kongo",
    title: "Kono to B Kongo",
    country: "sierra-leone",
    circuit: "eastern-circuit",
    destinationSlug: "kono",
    duration: "3D / 2N",
    durationDays: 3,
    category: "culture",
    difficulty: "moderate",
    groupMin: 2,
    groupMax: 8,
    languages: ["English"],
    bookable: true,
    rating: 4.5,
    reviewCount: 22,
    summary: "A three-day journey into Kono District, including B Kongo, eastern Sierra Leone beyond the tourist trail.",
    highlights: ["Kono District", "Community visits", "Eastern highlands context"],
    inclusions: ["Transport", "Guide", "Lodging as quoted"],
    exclusions: ["Unlisted meals"],
    requirements: "Flexible with basic lodging. Long road days.",
    meetingPoint: "Freetown or Kenema.",
    image: "/images/culture/koidu-market.jpg",
    imageAlt: "Koidu market in Kono District, Sierra Leone",
    gallery: [{ src: "/images/culture/koidu-market.jpg", alt: "Landscape" }, { src: "/images/culture/sierra-leone-big-market.jpg", alt: "Community" }],
    itinerary: [
      { day: 1, title: "Into Kono", description: "Road to Koidu / Kono." },
      { day: 2, title: "B Kongo", description: "District visits as conditions allow." },
      { day: 3, title: "Return", description: "Drive west." },
    ],
  }),
  tour({
    slug: "fouta-djallon-highlands",
    title: "Fouta Djallon Highlands Trek",
    country: "guinea",
    circuit: "northern-circuit",
    destinationSlug: "freetown",
    duration: "Custom",
    durationDays: 7,
    category: "adventure",
    difficulty: "challenging",
    groupMin: 4,
    groupMax: 12,
    languages: ["English", "French"],
    bookable: false,
    rating: 0,
    reviewCount: 0,
    summary: "Custom highland trekking in Guinea’s Fouta Djallon. Quote-only. Logistics confirmed per departure.",
    highlights: ["Highland trails", "Waterfalls", "Fula highlands"],
    inclusions: ["Quoted per itinerary"],
    exclusions: ["Visas", "International flights"],
    requirements: "Valid Guinea entry. Trekking fitness.",
    meetingPoint: "Conakry or overland from Sierra Leone, quoted.",
    image: IMG.mountain,
    imageAlt: "Highland plateau, editorial stand-in",
    gallery: [{ src: IMG.mountain, alt: "Highlands" }],
    itinerary: [{ day: 1, title: "Custom itinerary", description: "Built after a quote request." }],
  }),
  tour({
    slug: "sapo-national-park",
    title: "Sapo National Park Safari",
    country: "liberia",
    circuit: "southern-circuit",
    destinationSlug: "tiwai",
    duration: "Custom",
    durationDays: 5,
    category: "wildlife",
    difficulty: "challenging",
    groupMin: 4,
    groupMax: 10,
    languages: ["English"],
    bookable: false,
    rating: 0,
    reviewCount: 0,
    summary: "Custom Liberia programme centred on Sapo National Park. Quote-only multi-country or Liberia-only.",
    highlights: ["Sapo rainforest", "Park logistics", "Monrovia add-on on request"],
    inclusions: ["Quoted per itinerary"],
    exclusions: ["Visas", "Flights"],
    requirements: "Liberia entry formalities. Remote-travel fitness.",
    meetingPoint: "Monrovia, quoted.",
    image: IMG.rainforest,
    imageAlt: "Liberian rainforest, editorial stand-in",
    gallery: [{ src: IMG.rainforest, alt: "Forest" }],
    itinerary: [{ day: 1, title: "Custom itinerary", description: "Built after a quote request." }],
  }),
  tour({
    slug: "mano-river-triangle",
    title: "Mano River Triangle",
    country: "west-africa",
    circuit: "southern-circuit",
    destinationSlug: "gola",
    duration: "Custom · typically 13 days · 3 countries",
    durationDays: 13,
    category: "culture",
    difficulty: "moderate",
    groupMin: 6,
    groupMax: 16,
    languages: ["English", "French"],
    bookable: false,
    rating: 0,
    reviewCount: 0,
    summary:
      "A cross-border circuit through Guinea, Sierra Leone, and Liberia, the three countries that meet at the Mano River. One route, three national guides, and a single DMC coordinating the handover at each border.",
    highlights: [
      "Conakry, Freetown, and Monrovia in one itinerary",
      "A guide change at each land border, not a single guide guessing their way through three countries",
      "Waterfalls, island crossings, and city stops rather than long transit days back to back",
    ],
    inclusions: ["Quoted per group"],
    exclusions: ["International flights", "Visas", "Travel insurance and yellow fever vaccination"],
    requirements: "Entry requirements for Guinea, Sierra Leone, and Liberia. Confirm current visa rules before booking flights. Group passport copies in advance.",
    meetingPoint: "Conakry, Freetown, or Monrovia, set by the direction of travel and confirmed in the quote.",
    image: "/images/rainforest/picket-hill-national-parks.jpg",
    imageAlt: "Forested border hills typical of the Mano River Triangle region, editorial stand-in",
    gallery: [
      { src: "/images/rainforest/picket-hill-national-parks.jpg", alt: "Forested hill country near the border" },
      { src: "/images/rainforest/gola-national-parks.jpg", alt: "Rainforest along the Sierra Leone–Liberia border" },
    ],
    itinerary: [
      { day: 1, title: "Arrival in Conakry", description: "Meet and assist at Gbessia International Airport, transfer into the city." },
      { day: 2, title: "Conakry city tour", description: "National Museum, the market, the cathedral, and the central mosque." },
      { day: 3, title: "Îles de Los", description: "Boat transfer to the small island group off Conakry: Tamara, Kassa, and Roume." },
      { day: 4, title: "Kindia and Kilissi", description: "Mount Gangan and the Kilissi waterfall, an ecotourism site with two natural swimming pools." },
      { day: 5, title: "Border crossing into Sierra Leone", description: "Guinean and Sierra Leonean guides hand over at the border." },
      { day: 6, title: "Bunce Island", description: "The former slave-trading fort on the Sierra Leone River, a national monument since 1948." },
      { day: 7, title: "Banana Island", description: "Boat crossing via Kent to the island's former plantation settlement." },
      { day: 8, title: "Bo", description: "Sierra Leone's second city: markets and daily life away from the capital." },
      { day: 9, title: "Kenema, then on to Liberia", description: "The Eastern Province's diamond-district hub, then the road to Monrovia via Zimmi." },
      { day: 10, title: "Robertsport", description: "The WWII Allied submarine base site, a fishing village, and (sea conditions allowing) a surf break." },
      { day: 11, title: "Monrovia", description: "A city tour taking in Waterside Market and the West Point neighbourhood." },
      { day: 12, title: "Providence Island", description: "Where Liberia's early settlers first landed on the Mesurado River, and the Centennial Pavilion." },
      { day: 13, title: "Libassa and departure", description: "A coastal morning before the transfer to the airport." },
    ],
  }),
  tour({
    slug: "heart-of-sierra-leone-expedition",
    title: "Heart of Sierra Leone Expedition",
    country: "sierra-leone",
    circuit: "western-circuit",
    destinationSlug: "freetown",
    duration: "11 days / 10 nights",
    durationDays: 11,
    category: "culture",
    difficulty: "moderate",
    groupMin: 0,
    groupMax: 0,
    languages: ["English"],
    bookable: false,
    rating: 0,
    reviewCount: 0,
    summary:
      "Eleven days across the country's headline sites: Freetown's museums and monuments, Bunce and Tasso Islands, Tacugama, Tiwai Island on the Moa River, the peninsula beaches, and Banana Island.",
    highlights: [
      "Bunce Island, the largest British slave castle on the Rice Coast, founded around 1670",
      "Tiwai Island and the heritage trail, including Boma village and Nainiahun",
      "Tacugama Chimpanzee Sanctuary, a 100-acre reserve established in 1995",
      "Peninsula beaches and two nights on Banana Island",
    ],
    inclusions: [
      "Accommodation",
      "English-speaking tour guides",
      "Entrance and site fees",
      "Meals as outlined in the itinerary",
      "Transportation (private bus with air conditioning)",
      "Entry visas",
      "Security fees",
    ],
    exclusions: [
      "Airfares",
      "Travel insurance and yellow fever vaccination",
      "Meals not listed",
      "Tips and gratuities to driver and guide",
      "Change and cancellation fees",
      "Communication cost",
    ],
    requirements:
      "Travel insurance and yellow fever vaccination are arranged by the traveller. Entry visas are included and handled by the desk.",
    meetingPoint: "Lungi International Airport, with meet and assist before the boat transfer to Freetown.",
    image: "/images/islands/banana-island-rainbow.jpg",
    imageAlt: "Banana Island, Sierra Leone",
    gallery: [
      { src: "/images/heritage/bunce-tasso-national-parks.jpg", alt: "Bunce Island on the Sierra Leone River" },
      { src: "/images/wildlife/tacugama-chimpanzee.jpg", alt: "Chimpanzee at Tacugama Chimpanzee Sanctuary" },
      { src: "/images/rainforest/tiwai-island.jpg", alt: "Forest path on Tiwai Island" },
      { src: "/images/beaches/river-number-two-beach.jpg", alt: "River Number Two Beach, Sierra Leone" },
    ],
    itinerary: [
      { day: 1, title: "Arrival", description: "Met and assisted at Lungi International Airport, then transferred to Freetown by boat. Overnight at Country Lodge Complex." },
      { day: 2, title: "Freetown city tour", description: "The Railway Museum, Old Fourah Bay College, the site of the recently fallen Cotton Tree, the Peace and Cultural Monument, the National Museum, the Sierra Leone Peace Museum, and the Gateway to the King's Yard. Lunch at the rooftop restaurant of the country's tallest building, passing State House and the Parliament building." },
      { day: 3, title: "Bunce Island and Tasso Island", description: "Bunce Island was the largest British slave castle on the Rice Coast of West Africa. Founded around 1670, it exported tens of thousands of African captives to North America and the West Indies until Parliament closed it in 1807. A four and a half hour return boat ride plus the tour, followed by Tasso Island." },
      { day: 4, title: "Tacugama", description: "Tacugama Chimpanzee Sanctuary, about 40 minutes from central Freetown, rescues and rehabilitates orphaned and abandoned chimpanzees. Established in 1995, the chimps live semi-wild across a 100-acre reserve." },
      { day: 5, title: "Tacugama to Tiwai Island", description: "Travel to Tiwai by way of the heritage trail, stopping at Boma village on the Moa River near the small island of Nainiati. Boma is the only community on the trail led by a woman chief." },
      { day: 6, title: "Tiwai Island", description: "Walk to Nainiahun along bush trails through rice, cocoa and kola nut plantations. Nainiahun means Sand Village in Mende and is a site of artisanal diamond mining. Visit Kote Wulehun, the cultural heritage site the community shares with visitors." },
      { day: 7, title: "Tiwai Island to Tokeh", description: "An early start into dense forest to look for chimpanzees and other monkey species, some 135 bird species, and the occasional crocodile, before returning to camp for breakfast and departing for the coast." },
      { day: 8, title: "Tokeh and the peninsula beaches", description: "River Number Two for sunbathing, with the option of a 25-minute walk along the white sand, and visits to other peninsula beaches." },
      { day: 9, title: "Tokeh to Banana Island", description: "An early departure by boat to Banana Island, a former slave island with remnants of Portuguese infrastructure from the 1800s and home to a Krio community. Time with locals and water activities." },
      { day: 10, title: "Banana Island", description: "Snorkelling, watersports and sport fishing." },
      { day: 11, title: "Departure", description: "Depart Banana Island by sea coach." },
    ],
  }),
  tour({
    slug: "sierra-breeze-adventure",
    title: "Sierra Breeze Adventure",
    country: "sierra-leone",
    circuit: "northern-circuit",
    destinationSlug: "makeni",
    duration: "9 days / 8 nights",
    durationDays: 9,
    category: "culture",
    difficulty: "moderate",
    groupMin: 0,
    groupMax: 0,
    languages: ["English"],
    bookable: false,
    rating: 0,
    reviewCount: 0,
    summary:
      "Nine days from Freetown into the north and south: Rogbonko village, the Wara Wara mountains at Kabala, agro-tourism at Senekedugu, Bo's markets, Tiwai Island, and Banana Island.",
    highlights: [
      "Rogbonko village, paying homage to the chief and joining local cooking and basket making",
      "Wara Wara mountain at Kabala, plus a local cotton weaver and an evening folklore performance",
      "Agro-tourism at Senekedugu and the gold mines around Kabala town",
      "A dawn rainforest walk on Tiwai in search of pygmy hippos",
    ],
    inclusions: [
      "Accommodation",
      "English-speaking tour guides",
      "Entrance and site fees",
      "Meals as outlined in the itinerary",
      "Transportation (private bus with air conditioning)",
      "Security fees",
      "Sea coach",
      "Entry visas",
    ],
    exclusions: [
      "Airfares",
      "Travel insurance and yellow fever vaccination",
      "Meals not listed",
      "Tips and gratuities to driver and guide",
      "Change and cancellation fees",
      "Communication cost",
    ],
    requirements:
      "Travel insurance and yellow fever vaccination are arranged by the traveller. Entry visas are included and handled by the desk.",
    meetingPoint: "Lungi International Airport, with meet and assist before the boat transfer to Freetown.",
    image: "/images/mountains/wara-wara-mountains.jpg",
    imageAlt: "The Wara Wara Mountains in Koinadugu District, Sierra Leone",
    gallery: [
      { src: "/images/culture/kabala-village.jpg", alt: "Kabala, Koinadugu District, Sierra Leone" },
      { src: "/images/culture/makeni-sunset.jpg", alt: "Makeni, Northern Province, Sierra Leone" },
      { src: "/images/culture/bo-rice-farming.jpg", alt: "Rice farming in the countryside around Bo, Sierra Leone" },
      { src: "/images/rainforest/tiwai-island.jpg", alt: "Forest path on Tiwai Island" },
    ],
    itinerary: [
      { day: 1, title: "Arrival", description: "Met and assisted at Lungi International Airport, then transferred to Freetown by boat." },
      { day: 2, title: "Freetown city tour and Tacugama", description: "The Railway Museum, Old Fourah Bay College, the Cotton Tree site, the Peace and Cultural Monument, the National Museum, the Peace Museum and the Gateway to the King's Yard, followed by Tacugama Chimpanzee Sanctuary, about 40 minutes from central Freetown." },
      { day: 3, title: "Makeni and Rogbonko village", description: "Drive to Makeni for a city tour, then on to Rogbonko village to visit the chief and pay homage. A working village where visitors join in cooking, basket making and other daily activities, returning to Makeni for the night." },
      { day: 4, title: "Makeni to Kabala", description: "An excursion to see Wara Wara mountain, where huge rocks merge into towering formations. In the evening, a visit to a local cotton weaver to take part in the process, followed after dinner by a folklore and cultural dance performance." },
      { day: 5, title: "Kabala and Senekedugu", description: "The gold mines around Kabala town show how mining works here. An early drive three miles to Senekedugu for agro-tourism, welcomed by the chief, with a visit to the vegetable plantations." },
      { day: 6, title: "Kabala to Bo", description: "Drive to Bo, the second capital, for the bustling city, the local market and a gari production site." },
      { day: 7, title: "Bo to Tiwai Island", description: "Shoes off as a sign of respect before entering, then a locally sourced meal under the palms and a walk to the banks of the Moa River, where a boat crosses to Tiwai. In the early evening, a boat ride upriver for a chance of seeing a pygmy hippo." },
      { day: 8, title: "Tiwai Island to Banana Island", description: "A pre-dawn walk through the rainforest in search of pygmy hippos, which come ashore at night to graze. Later, on to Banana Island via Kent beach, a former slave island with remnants of Portuguese infrastructure from the 1800s and home to a Krio community." },
      { day: 9, title: "Departure", description: "Depart Banana Island by sea coach for the airport." },
    ],
  }),
  tour({
    slug: "taste-of-west-africa",
    title: "A Taste of West Africa",
    country: "west-africa",
    circuit: "southern-circuit",
    destinationSlug: "freetown",
    duration: "44 days · 8 countries · 3 joinable segments",
    durationDays: 44,
    category: "culture",
    difficulty: "challenging",
    groupMin: 0,
    groupMax: 0,
    languages: ["English"],
    bookable: false,
    rating: 0,
    reviewCount: 0,
    summary:
      "A 44-day overland route across eight West African countries, run with Oasis Overland. It splits into three segments that can be joined separately: Benin, Togo and Ghana; Ghana through Ivory Coast and Liberia to Sierra Leone; then Sierra Leone north to Senegal.",
    highlights: [
      "Trip 1, 11 days: Benin, Togo and Ghana, including the Dahomey royal palaces at Abomey and the Koutammakou landscape",
      "Trip 2, 18 days: Ghana to Sierra Leone, including Cape Coast and Elmina Castles, Kakum, Mount Nimba and Tiwai Island",
      "Trip 3, 16 days: Sierra Leone to Senegal, including the Fouta Djallon, the Bijagós Archipelago and Gorée Island",
      "Border crossings, visas support and guides coordinated across all eight countries",
    ],
    inclusions: [
      "English-speaking tour guides throughout",
      "All entry and site fees for activities listed in the itinerary",
      "Accommodation for every night of the tour",
      "Daily breakfast",
      "Ground and water transport (private air-conditioned vehicle and boat transfers)",
      "Security fees, airport transfers and border arrangements",
    ],
    exclusions: ["Visas (visa support and guidance are provided, but visa cost is not included)"],
    requirements:
      "Visa requirements vary by nationality and change over time. The desk provides guidance and support through the application process for each country on the route.",
    meetingPoint: "Cotonou, Benin for the full route. Trip 2 begins in Accra, Ghana and Trip 3 begins in Freetown.",
    image: "/images/rainforest/picket-hill-national-parks.jpg",
    imageAlt: "Forested hill country of the kind crossed on the West Africa overland route",
    gallery: [
      { src: "/images/rainforest/tiwai-island.jpg", alt: "Forest path on Tiwai Island, Sierra Leone" },
      { src: "/images/islands/banana-island-rainbow.jpg", alt: "Banana Island, Sierra Leone" },
      { src: "/images/wildlife/tacugama-chimpanzee.jpg", alt: "Chimpanzee at Tacugama Chimpanzee Sanctuary" },
    ],
    itinerary: [
      { day: 1, title: "Arrive in Cotonou, Benin", description: "Trip 1 begins." },
      { day: 2, title: "Cotonou and Porto-Novo", description: "The port city and the historical capital." },
      { day: 3, title: "Abomey", description: "The royal palaces of the Dahomey Kingdom, a UNESCO World Heritage Site." },
      { day: 4, title: "Koutammakou landscape, Togo", description: "Cross into Togo for the mud-tower houses of the Batammariba people." },
      { day: 5, title: "Atakpamé", description: "A scenic drive through Togo's Plateaux Region." },
      { day: 6, title: "Lomé, Togo", description: "The coastal capital, its markets and monumental squares." },
      { day: 7, title: "Wli Waterfalls, Ghana", description: "Cross into Ghana toward the tallest waterfall in West Africa." },
      { day: 8, title: "Hike and wildlife", description: "Trek to the Wli Waterfalls and visit a sacred monkey sanctuary." },
      { day: 9, title: "Akosombo Dam", description: "The dam that created Lake Volta." },
      { day: 10, title: "Accra", description: "Ghana's capital." },
      { day: 11, title: "Accra", description: "Trip 1 concludes and Trip 2 begins." },
      { day: 12, title: "Accra city tour", description: "The Kwame Nkrumah Mausoleum, Makola Market and Labadi Beach." },
      { day: 13, title: "Cape Coast", description: "Cape Coast Castle." },
      { day: 14, title: "Elmina Castle", description: "The first European trading post in sub-Saharan Africa." },
      { day: 15, title: "Kakum National Park", description: "The rainforest canopy walkway." },
      { day: 16, title: "Grand-Bassam, Ivory Coast", description: "Cross into Côte d'Ivoire to this colonial beach town." },
      { day: 17, title: "Abidjan", description: "St Paul's Cathedral and the Plateau district." },
      { day: 18, title: "Yamoussoukro", description: "The Basilica of Our Lady of Peace." },
      { day: 19, title: "Man", description: "The 18 Mountains region and its waterfalls." },
      { day: 20, title: "Cross into Liberia", description: "Arrive in the border city of Ganta." },
      { day: 21, title: "Mount Nimba", description: "The UNESCO-listed mountain range." },
      { day: 22, title: "Monrovia", description: "A guided tour of Liberia's capital." },
      { day: 23, title: "Robertsport", description: "Surfing and a historic WWII submarine base." },
      { day: 24, title: "Tiwai Island, Sierra Leone", description: "Cross into Sierra Leone and travel to the wildlife sanctuary." },
      { day: 25, title: "Tiwai Island", description: "Guided walks in search of the pygmy hippopotamus and other rainforest wildlife." },
      { day: 26, title: "Banana Island", description: "A boat trip to the island community and its Krio heritage." },
      { day: 27, title: "Freetown and Tacugama", description: "A Freetown city tour followed by Tacugama Chimpanzee Sanctuary." },
      { day: 28, title: "Freetown", description: "Trip 2 concludes." },
      { day: 29, title: "Freetown", description: "Trip 3 begins." },
      { day: 30, title: "Cross into Guinea", description: "Arrive in Conakry." },
      { day: 31, title: "Kindia and Voile de la Mariée", description: "The Bridal Veil waterfalls." },
      { day: 32, title: "Labé", description: "Into the Fouta Djallon highlands." },
      { day: 34, title: "Cross into Guinea-Bissau", description: "Through the countryside to Gabu." },
      { day: 35, title: "Bissau", description: "A guided tour of the capital." },
      { day: 36, title: "Bijagós Archipelago", description: "A UNESCO Biosphere Reserve, subject to boat schedules." },
      { day: 37, title: "Cross into The Gambia", description: "Over the Senegambia Bridge, with local markets." },
      { day: 38, title: "Janjanbureh and Baboon Islands", description: "A boat safari on the River Gambia for chimpanzees, hippos and baboons." },
      { day: 39, title: "Serekunda", description: "The Kachikally Crocodile Pool and local markets." },
      { day: 40, title: "Cross into Senegal and Shell Island", description: "Toubacouta and the shell-covered Fadiouth Island." },
      { day: 41, title: "Dakar", description: "Senegal's capital." },
      { day: 42, title: "Gorée Island", description: "The House of Slaves." },
      { day: 43, title: "Pink Lake", description: "Lac Rose." },
      { day: 44, title: "Dakar", description: "Trip 3 and the full itinerary conclude." },
    ],
  }),
];

export const services: ServiceItem[] = [
  {
    slug: "mice",
    name: "MICE",
    summary: "Meetings, incentives, conferences and exhibitions: venue search, ground transport, staffing, and cultural programmes in Sierra Leone.",
    benefits: ["Single in-country coordinator", "Venue and transport shortlists", "Team-building and gala options"],
    process: ["Share dates and headcount", "Receive a proposed programme", "Confirm logistics in writing"],
    image: "/images/services/mice-conference.jpg",
    imageAlt: "A team gathered around a conference table with a shared screen, an editorial stand-in for MICE planning",
  },
  {
    slug: "tours-excursions",
    name: "Tours & Excursions",
    summary: "The same Sierra Leone circuits sold to independent travellers, tailored for groups and business visitors.",
    benefits: ["Half-day and multi-day options", "Licensed guides", "Private or small-group"],
    process: ["Choose a published tour or request a custom itinerary", "Confirm dates", "Receive a quote"],
    image: "/images/services/tours-excursions.jpg",
    imageAlt: "Trekkers with backpacks on a mountain trail, an editorial stand-in for guided tours and excursions",
  },
  {
    slug: "visa-facilitation",
    name: "Visa Facilitation",
    summary: "Invitation letters and practical guidance for Sierra Leone entry, a core DMC service, not a visa guarantee.",
    benefits: ["Invitation letter support", "Document checklist", "Timing guidance"],
    process: ["Send passport details", "Receive requirements", "Letter issued where eligible"],
    image: "/images/services/visa-facilitation.jpg",
    imageAlt: "A passport resting on top of travel documents, an editorial stand-in for visa facilitation",
  },
  {
    slug: "travel-insurance",
    name: "Travel Insurance",
    summary: "The company has publicly described offering travel insurance and medical-evacuation cover. Policies are arranged case by case.",
    benefits: ["Evacuation options discussed at quote", "Trip context from the DMC"],
    process: ["Describe itinerary", "Receive options", "Purchase through the named insurer"],
    image: "/images/services/travel-insurance.jpg",
    imageAlt: "A doctor holding a stethoscope, an editorial stand-in for travel and medical-evacuation insurance",
  },
  {
    slug: "vehicle-rental",
    name: "Vehicle Rental",
    summary: "Chauffeured and self-drive vehicles for city, peninsula, and overland programmes. From economy cars to 4x4s and group coaches.",
    benefits: ["Driver-guides available", "Airport and port transfers", "Group vehicles on request", "Tour-ready fleet"],
    process: ["Select dates and passenger count", "Choose vehicle class and driver option", "Confirm in writing"],
    image: "/images/services/vehicle-rental.jpg",
    imageAlt: "A white SUV parked on rough coastal terrain, an editorial stand-in for vehicle rental",
  },
  {
    slug: "hotel-reservations",
    name: "Hotel Reservations",
    summary: "Accommodation booking across partner properties in Sierra Leone and, on request, Guinea and Liberia.",
    benefits: ["Local contracting", "Mix of city, beach, and simple bush lodging"],
    process: ["Share dates and budget band", "Receive a shortlist", "Confirm on your say-so"],
    image: "/images/services/hotel-reservations.jpg",
    imageAlt: "A bright hotel lobby with a glass atrium ceiling, an editorial stand-in for hotel reservations",
  },
  {
    slug: "ticketing",
    name: "Ticketing",
    summary: "Domestic and international air ticketing plus event tickets when available.",
    benefits: ["Itinerary-aligned routing", "Group ticketing on request"],
    process: ["Share names and dates", "Receive fare options", "Pay to issue"],
    image: "/images/services/ticketing.jpg",
    imageAlt: "An airport departures board, an editorial stand-in for ticketing",
  },
];

export const articleCategories = [
  { slug: "destination-guides", label: "Destination Guides" },
  { slug: "travel-tips", label: "Travel Tips" },
  { slug: "culture", label: "Culture" },
  { slug: "wildlife", label: "Wildlife" },
  { slug: "sustainability", label: "Sustainability" },
  { slug: "adventure", label: "Adventure" },
  { slug: "case-studies", label: "Client Case Studies" },
  { slug: "b2b", label: "B2B Insights" },
] as const;

export const articles: Article[] = [
  {
    slug: "tacugama-krio",
    category: "wildlife",
    categoryLabel: "Wildlife",
    title: "Tacugama Chimpanzee Sanctuary & Krio",
    date: "2026-05-06",
    excerpt: "A field note from a Tacugama visit paired with Freetown’s Krio story, from a published Tourism Is Life journal post.",
    body: "Tourism Is Life published this journal entry after conducting a Tacugama Chimpanzee Sanctuary visit together with a Krio heritage programme. The sanctuary sits in forest above Freetown; the Krio story sits in the city below. Together they are a concise introduction to the Western Circuit.\n\nFor current opening hours and group size limits, request a date-specific quote rather than treating this article as an operations manual.",
    image: "/images/wildlife/tacugama-chimpanzee.jpg",
    imageAlt: "Chimpanzees at Tacugama Chimpanzee Sanctuary near Freetown, Sierra Leone",
  },
  {
    slug: "oasis-overland-group",
    category: "case-studies",
    categoryLabel: "Client Case Studies",
    title: "Oasis Overland Group",
    date: "2024-12-20",
    excerpt: "Ground handling note for an Oasis Overland group, from the public Tourism Is Life journal.",
    body: "This public journal title records work with an Oasis Overland group. Operational details (headcount, routing, and commercial terms) are not republished here.\n\nOperators looking for similar Sierra Leone ground handling should use the Partner With Us enquiry.",
    image: "/images/mountains/outamba-mountain.jpg",
    imageAlt: "Overland landscape in Sierra Leone",
  },
  {
    slug: "keadventure-ultimate-sierra-leone",
    category: "case-studies",
    categoryLabel: "Client Case Studies",
    title: "KE Adventure: Ultimate Sierra Leone",
    date: "2024-12-20",
    excerpt: "A public journal title documenting a KE Adventure programme in Sierra Leone.",
    body: "Tourism Is Life listed this KE Adventure programme among recent posts. It signals inbound adventure-operator work; it is not a copy of KE’s own itinerary.\n\nAdventure brands wanting a Sierra Leone DMC should send dates and a draft routing via the partner form.",
    image: "/images/mountains/mount-bintumani.jpg",
    imageAlt: "Mount Bintumani, Sierra Leone highest peak",
  },
  {
    slug: "eighth-homecoming-pilgrims",
    category: "culture",
    categoryLabel: "Culture",
    title: "8th Homecoming Pilgrims",
    date: "2024-12-20",
    excerpt: "Journal title from the public site marking a Homecoming pilgrims programme.",
    body: "The 8th Homecoming Pilgrims tour is listed on the public Tourism Is Life journal. Diaspora homecoming travel is a recurring Sierra Leone theme: Bunce Island, Freetown, and family reconnection.\n\nIf you are planning a similar pilgrimage, request a quote. Group history and routing are confirmed privately.",
    image: "/images/heritage/bunce-island-wall.jpg",
    imageAlt: "Fortress wall at Bunce Island, Sierra Leone River",
  },
];

export interface TeamMember {
  slug: string;
  name: string;
  role: string;
  bio: string;
  /** Only set for people with a genuine, supplied photograph — never a stand-in. */
  image?: string;
  imageAlt?: string;
}

export const team: TeamMember[] = [
  {
    slug: "alieya-alie-kargbo",
    name: "Alieya Alie Kargbo",
    role: "Executive Director & CEO",
    bio: "Founder of Tourism Is Life Tours. In a 2024 Travel And Tour World interview he described the company as a Sierra Leone DMC and a member partner of 1 DCM World.",
    image: "/images/team/alieya-alie-kargbo.jpg",
    imageAlt: "Alieya Alie Kargbo, Executive Director and CEO of Tourism Is Life Tours",
  },
  {
    slug: "bassie",
    name: "Peter Momoh Bassie",
    role: "Guide & part-owner",
    bio: "Featured in AFAR Magazine. Leads Freetown tours and expeditions toward Gola Rainforest and Mount Bintumani.",
    image: "/images/team/peter-momoh-bassie.jpg",
    imageAlt: "Peter Momoh Bassie, guide and part-owner at Tourism Is Life Tours",
  },
  {
    slug: "isha-bangura",
    name: "Isha Bangura",
    role: "Reservation Officer",
    bio: "Handles reservations, booking coordination, client enquiries, and travel arrangements.",
    image: "/images/team/isha-bangura.jpg",
    imageAlt: "Isha Bangura, Reservation Officer at Tourism Is Life Tours",
  },
];

export const testimonial = {
  name: "Jörg Ehrlich",
  handle: "@jörgehrlich",
  quote: "Great experience Sierra Leone",
};

export function getTour(slug: string) {
  return tours.find((t) => t.slug === slug);
}
export function getCircuit(id: string) {
  return circuits.find((c) => c.id === id);
}
export function getDestination(slug: string) {
  return destinations.find((d) => d.slug === slug);
}
export function toursForCircuit(id: CircuitId) {
  return tours.filter((t) => t.circuit === id);
}
export function toursForDestination(slug: string) {
  return tours.filter((t) => t.destinationSlug === slug);
}
export function getService(slug: string) {
  return services.find((s) => s.slug === slug);
}
export function getArticle(slug: string) {
  return articles.find((a) => a.slug === slug);
}
export function articlesForCategory(slug: string) {
  return articles.filter((a) => a.category === slug);
}
export function relatedTours(tourItem: Tour, n = 3) {
  return tours
    .filter((t) => t.slug !== tourItem.slug && (t.circuit === tourItem.circuit || t.category === tourItem.category))
    .slice(0, n);
}

export const IMG_CRUISE = "/images/cruise/freetown-port.jpg";
export const IMG_MICE = "/images/mice/atlantic-hotel.jpg";
export const IMG_HERO = "/images/beaches/tokeh-beach-hero.jpg";
export const IMG_FOREST = "/images/rainforest/hofstra-trees-hills-299.jpg";
export const IMG_WILDLIFE = "/images/wildlife/tacugama-chimpanzee.jpg";
export const IMG_MOUNTAIN = "/images/mountains/mount-bintumani.jpg";
