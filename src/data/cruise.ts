/**
 * Cruise Ship / Call Freetown content from Cruiseship Proposal 2024 — Ready NTB.
 * Operational figures not listed in the brief are omitted rather than invented.
 */

export type ExperienceTag =
  | "culture"
  | "history"
  | "wildlife"
  | "beach"
  | "adventure"
  | "nature";

export type CruiseAudience = "guest" | "operator";

export type Excursion = {
  id: string;
  name: string;
  destination: string;
  summary: string;
  itineraryNotes?: string;
  activities: string[];
  experienceTags: ExperienceTag[];
  priceUsdPerPerson: number;
  groupMin: number;
  groupMax: number;
  departure: string;
  inclusions: string[];
  image: string;
  imageAlt: string;
};

export type CruiseDestination = {
  id: string;
  name: string;
  summary: string;
  image: string;
  imageAlt: string;
};

export const CRUISE_HERO = {
  image: "/images/cruise/freetown-port.jpg",
  imageAlt:
    "Ships in the port of Freetown, Sierra Leone, at the Queen Elizabeth II Quay approach",
} as const;

export const cruiseOverview = [
  {
    id: "handling",
    title: "Cruise Ship Handling",
    body: "Destination management for cruise calls at Freetown, from arrival coordination to shore programmes.",
    image: "/images/cruise/freetown-port.jpg",
    imageAlt: "Freetown port and harbour shipping",
  },
  {
    id: "excursions",
    title: "Shore Excursions",
    body: "Six primary shore programmes covering the city, heritage islands, rainforest, wildlife, and peninsula beaches.",
    image: "/images/cities/freetown-street.jpg",
    imageAlt: "A busy market street in central Freetown, Sierra Leone",
  },
  {
    id: "overland",
    title: "Overland Journeys",
    body: "Overland experiences beyond the immediate quay, arranged as part of cruise destination services.",
    image: "/images/beaches/tokeh-beach-hero.jpg",
    imageAlt: "Peninsula coastline south of Freetown",
  },
  {
    id: "turnaround",
    title: "Turnaround Services",
    body: "Turnaround support for cruise calls, coordinated with the liner’s agent and ground operations.",
    image: "/images/mice/atlantic-hotel.jpg",
    imageAlt: "Atlantic Hotel in Freetown, used as a destination-services visual",
  },
  {
    id: "destination",
    title: "Destination Services",
    body: "Transportation, tours, excursions, hotels, and related destination services as a full-service DMC.",
    image: "/images/heritage/cotton-tree-freetown.jpg",
    imageAlt: "The Cotton Tree in central Freetown",
  },
  {
    id: "support",
    title: "24-Hour Support",
    body: "Once a request is confirmed, a 24-hour contact person is provided for the call.",
    image: "/images/cities/freetown-aerial.jpg",
    imageAlt: "Aerial view of Freetown and the harbour hills",
  },
] as const;

export const whyTourismIsLife = [
  {
    title: "Established DMC",
    body: "Tourism Is Life Tours is a destination management company established in 2013.",
  },
  {
    title: "Local expertise",
    body: "100% locally owned and managed.",
  },
  {
    title: "Experienced team",
    body: "Qualified travel and tourism staff and guides with extensive travel and tourism experience.",
  },
  {
    title: "Cruise handling",
    body: "Dedicated cruise ship handling as part of the company’s DMC services.",
  },
  {
    title: "Full-service DMC",
    body: "Transportation, tours, excursions, hotels, and related destination services.",
  },
  {
    title: "International experience",
    body: "Serves an international customer base.",
  },
] as const;

export const excursions: Excursion[] = [
  {
    id: "freetown-city-tour",
    name: "Freetown City Tour",
    destination: "Freetown",
    summary:
      "A guided city programme covering major historical and cultural attractions in Freetown.",
    itineraryNotes:
      "Stops described in the proposal include the Cotton Tree, National Museum, Maroon Church, Railway Museum, market, and Old Fourah Bay College.",
    activities: ["Sightseeing"],
    experienceTags: ["culture", "history"],
    priceUsdPerPerson: 60,
    groupMin: 120,
    groupMax: 500,
    departure: "Queen Elizabeth II Quay",
    inclusions: [
      "Air-conditioned bus",
      "Experienced driver",
      "English-speaking guide",
      "Sightseeing",
      "Lunch",
    ],
    image: "/images/heritage/cotton-tree-freetown.jpg",
    imageAlt: "The historic Cotton Tree in Freetown, wrapped in the Sierra Leone flag",
  },
  {
    id: "bunce-tasso",
    name: "Bunce Island & Tasso Island",
    destination: "Bunce Island",
    summary:
      "A heritage excursion to Bunce Island and Tasso Island on the Sierra Leone River.",
    itineraryNotes: "The experience includes both Bunce Island and Tasso Island.",
    activities: ["Sightseeing", "Heritage visit"],
    experienceTags: ["history", "culture"],
    priceUsdPerPerson: 75,
    groupMin: 25,
    groupMax: 75,
    departure: "Queen Elizabeth II Quay",
    inclusions: [
      "Air-conditioned bus",
      "Experienced driver",
      "English-speaking guide",
      "Sightseeing",
      "Lunch",
    ],
    image: "/images/heritage/bunce-island-wall.jpg",
    imageAlt: "Fortress wall at Bunce Island on the Sierra Leone River",
  },
  {
    id: "tacugama",
    name: "Tacugama Chimpanzee Sanctuary",
    destination: "Tacugama",
    summary:
      "A rainforest sanctuary visit with a guided tour and chimpanzee-related activities.",
    itineraryNotes:
      "The proposal describes a rainforest sanctuary experience, a guided tour, and chimpanzee-related activities.",
    activities: ["Wildlife viewing", "Guided sanctuary tour"],
    experienceTags: ["wildlife", "nature"],
    priceUsdPerPerson: 65,
    groupMin: 30,
    groupMax: 200,
    departure: "Queen Elizabeth II Quay",
    inclusions: [
      "Air-conditioned bus",
      "Experienced driver",
      "English-speaking guide",
      "Sightseeing",
      "Lunch",
    ],
    image: "/images/wildlife/tacugama-chimpanzee.jpg",
    imageAlt: "Chimpanzees at Tacugama Chimpanzee Sanctuary near Freetown",
  },
  {
    id: "banana-island",
    name: "Banana Island",
    destination: "Banana Island",
    summary:
      "A coastal island day with water activities and a seafood lunch on the beach.",
    itineraryNotes:
      "Activities described include diving, snorkelling, paddle boating, swimming, and relaxation.",
    activities: ["Diving", "Snorkelling", "Paddle boating", "Swimming", "Relaxation"],
    experienceTags: ["beach", "adventure", "nature"],
    priceUsdPerPerson: 90,
    groupMin: 120,
    groupMax: 200,
    departure: "Queen Elizabeth II Quay",
    inclusions: [
      "Air-conditioned bus",
      "Experienced driver",
      "English-speaking guide",
      "Sightseeing",
      "Seafood lunch on the beach",
    ],
    image: "/images/islands/banana-island-rainbow.jpg",
    imageAlt: "Banana Island off the Freetown Peninsula, Sierra Leone",
  },
  {
    id: "bird-watching",
    name: "Bird Watching",
    destination: "River No. 2",
    summary:
      "Rainforest birding on a trail that ends at River No. 2 beach.",
    itineraryNotes:
      "The experience includes rainforest birding and a trail ending at River No. 2 beach.",
    activities: ["Bird watching", "Rainforest trail"],
    experienceTags: ["nature", "wildlife"],
    priceUsdPerPerson: 85,
    groupMin: 12,
    groupMax: 25,
    departure: "Queen Elizabeth II Quay",
    inclusions: [
      "Air-conditioned bus",
      "Experienced driver",
      "English-speaking guide",
      "Sightseeing",
      "Lunch",
    ],
    image: "/images/beaches/river-number-two-beach.jpg",
    imageAlt: "River Number Two beach, where the bird-watching trail ends",
  },
  {
    id: "peninsula-beaches",
    name: "Peninsula Beaches",
    destination: "Peninsula beaches",
    summary:
      "A peninsula beach programme with sport, water, and community activities.",
    itineraryNotes:
      "Activities described include surfing, beach volleyball, beach football, canoe racing, surfing competitions, community engagement, and storytelling.",
    activities: [
      "Surfing",
      "Beach volleyball",
      "Beach football",
      "Canoe racing",
      "Community engagement",
      "Storytelling",
    ],
    experienceTags: ["beach", "adventure", "culture"],
    priceUsdPerPerson: 65,
    groupMin: 30,
    groupMax: 200,
    departure: "Queen Elizabeth II Quay",
    inclusions: [
      "Air-conditioned bus",
      "Experienced driver",
      "English-speaking guide",
      "Sightseeing",
      "Lunch",
    ],
    image: "/images/beaches/tokeh-beach-hero.jpg",
    imageAlt: "Boats and shoreline at Tokeh Beach on the Freetown Peninsula",
  },
];

export const cruiseDestinations: CruiseDestination[] = [
  {
    id: "freetown",
    name: "Freetown",
    summary:
      "Sierra Leone’s capital and the starting point for city sightseeing: Cotton Tree, museums, churches, markets, and Old Fourah Bay College.",
    image: "/images/heritage/cotton-tree-freetown.jpg",
    imageAlt: "The historic Cotton Tree in Freetown with the Sierra Leonean flag",
  },
  {
    id: "bunce-island",
    name: "Bunce Island",
    summary:
      "A heritage island in the Sierra Leone River, visited together with neighbouring Tasso Island.",
    image: "/images/heritage/bunce-tasso-national-parks.jpg",
    imageAlt: "Bunce and Tasso Islands, Sierra Leone River",
  },
  {
    id: "tacugama",
    name: "Tacugama",
    summary:
      "A rainforest chimpanzee sanctuary in the hills above Freetown, visited as a guided shore programme.",
    image: "/images/wildlife/tacugama-chimpanzee.jpg",
    imageAlt: "Chimpanzees in forest at Tacugama Sanctuary",
  },
  {
    id: "banana-island",
    name: "Banana Island",
    summary:
      "An island shore day with diving, snorkelling, paddle boating, swimming, and a seafood lunch on the beach.",
    image: "/images/islands/banana-island-rainbow.jpg",
    imageAlt: "Banana Island coastline off Sierra Leone",
  },
  {
    id: "river-no-2",
    name: "River No. 2",
    summary:
      "The beach at the end of the rainforest birding trail offered as a shore excursion.",
    image: "/images/beaches/river-number-two-beach.jpg",
    imageAlt: "River Number Two Village Beach on the Freetown Peninsula",
  },
  {
    id: "peninsula-beaches",
    name: "Peninsula beaches",
    summary:
      "Western Area peninsula beaches used for surfing, beach sports, canoe racing, and community-hosted activities.",
    image: "/images/beaches/lumley-beach.jpg",
    imageAlt: "Lumley Beach in Freetown, Sierra Leone",
  },
];

export const portFacts = {
  name: "Queen Elizabeth II Quay",
  location: "Freetown, Sierra Leone",
  characteristics: [
    "Described in the proposal as Africa’s largest natural harbour",
    "Sheltered natural harbour",
    "Minimum entrance depth of 11.6m",
    "Original quay length: 365m",
    "Quay extension: 702m",
  ],
  attribution:
    "Port figures are taken from the 2024 cruise-ship proposal and are presented as proposal information, not as independently verified live conditions.",
} as const;

export const vesselInfoRequired = [
  "Vessel name",
  "Port of registry",
  "Gross registered tonnage",
  "Length overall",
  "Draft forward and aft",
  "Total cargo tonnage",
  "Sierra Leone cargo tonnage",
  "Containers for Sierra Leone",
  "Vehicles for Sierra Leone",
  "Expected arrival time at pilot station",
  "Last port of call",
  "Next port of call",
] as const;

export const documentationChecklist = [
  "Last port clearance",
  "Ports of call list",
  "Maritime declaration of health",
  "Vaccination list",
  "Stowaway list",
  "Crew list",
  "Narcotics list",
  "Animal list",
  "Passenger list",
  "Arms and ammunition list",
  "Stores / bonded store list",
  "Crew declaration list",
  "Cargo manifest",
  "Notice of readiness",
  "Nil lists",
] as const;

export const portServices = [
  { title: "Fresh water", body: "Fresh water availability is listed in the proposal." },
  { title: "Bunkering", body: "Bunkering by truck is listed in the proposal." },
  { title: "Ship chandler", body: "Ship chandler / store provisions are listed." },
  { title: "Garbage collection", body: "Garbage collection is listed among port services." },
  {
    title: "Medical emergency",
    body: "Hospital, doctor, and dentist emergency availability is listed.",
  },
  {
    title: "Telephone / mobile",
    body: "Telephone and mobile services are listed as available with notice.",
  },
] as const;

export const pilotage = [
  "Sea pilot is compulsory for berthing",
  "Pilot meets the vessel at Falcon Bridge point",
  "Pilotage is listed as 08:00–18:00",
  "Extension may be granted via the ship’s agent",
] as const;

export const anchorageNotes = [
  "An anchorage area is available",
  "Tugs are listed as available",
  "Maximum draft for a specific call is confirmed with the agent, since figures are not published here as live conditions",
] as const;

export const berthingNote =
  "The proposal lists seven berths and associated draft information. Those berth-by-berth figures are confirmed per call with the ship’s agent rather than shown as a live berthing table on this public page.";

export const driversNotes = [
  "English-speaking",
  "Mobile-equipped",
  "5+ years driving experience",
  "Familiar with road conditions",
] as const;

export const guideNotes = [
  "Accompany excursions",
  "Provide historical and cultural information",
  "Monitor groups",
  "Coordinate pickup and drop-off",
  "Coordinate lunch and sightseeing",
  "Connect facilities and tour operations",
  "Provide guest briefings",
  "Provide first aid when needed",
] as const;

export const serviceCapabilities = [
  "English-speaking guides",
  "Lunch when stated on the excursion",
  "Bottled water",
  "Experienced drivers",
  "24-hour support desk once a request is confirmed",
  "Comprehensive bus insurance",
  "Fully air-conditioned buses",
] as const;

export const termsItems = [
  {
    title: "Per-person costing",
    body: "Costs are charged per person.",
  },
  {
    title: "Minimum numbers",
    body: "Minimum group numbers apply. Special arrangements may be possible when minimum numbers are not met.",
  },
  {
    title: "Changes and cancellation",
    body: "Changes and cancellation fees apply.",
  },
  {
    title: "Visa and shore pass",
    body: "Visa / shore-pass facilitation is available upon receiving the passenger manifest.",
  },
  {
    title: "Gratuities",
    body: "Tips and gratuities are applicable.",
  },
  {
    title: "Shipping agency",
    body: "Shipping agency cost is the cruise liner’s liability. The inbound operator can recommend an operator.",
  },
] as const;

export const paymentNotes = {
  deposit: "A 50% deposit is required upon confirmation.",
  balance: "Payment is due at least three weeks before excursion dates.",
  banking: "Payment details are provided during confirmed booking and invoicing.",
} as const;

export const cruiseContacts = {
  travelDirector: "Alieya A. Kargbo",
  operationsOfficer: "Sonia Koroma",
} as const;

export const EXPERIENCE_FILTERS: { id: ExperienceTag; label: string }[] = [
  { id: "culture", label: "Culture" },
  { id: "history", label: "History" },
  { id: "wildlife", label: "Wildlife" },
  { id: "beach", label: "Beach" },
  { id: "adventure", label: "Adventure" },
  { id: "nature", label: "Nature" },
];

export const ACTIVITY_FILTERS = [
  "Sightseeing",
  "Wildlife viewing",
  "Diving",
  "Snorkelling",
  "Swimming",
  "Bird watching",
  "Surfing",
  "Community engagement",
] as const;

export type PriceFilter = "all" | "under-70" | "70-80" | "over-80";
export type GroupFilter = "all" | "small" | "medium" | "large";

export function filterExcursions(
  list: Excursion[],
  filters: {
    price: PriceFilter;
    group: GroupFilter;
    experiences: ExperienceTag[];
    activities: string[];
  },
): Excursion[] {
  return list.filter((item) => {
    if (filters.price === "under-70" && item.priceUsdPerPerson >= 70) return false;
    if (filters.price === "70-80" && (item.priceUsdPerPerson < 70 || item.priceUsdPerPerson > 80)) {
      return false;
    }
    if (filters.price === "over-80" && item.priceUsdPerPerson <= 80) return false;

    if (filters.group === "small" && item.groupMax > 75) return false;
    if (filters.group === "medium" && !(item.groupMin >= 30 && item.groupMin < 120)) return false;
    if (filters.group === "large" && item.groupMin < 120) return false;

    if (
      filters.experiences.length > 0 &&
      !filters.experiences.some((tag) => item.experienceTags.includes(tag))
    ) {
      return false;
    }

    if (
      filters.activities.length > 0 &&
      !filters.activities.some((activity) => item.activities.includes(activity))
    ) {
      return false;
    }

    return true;
  });
}

export const SECTION_NAV = [
  { id: "overview", label: "Overview" },
  { id: "why", label: "Why Tourism Is Life" },
  { id: "excursions", label: "Shore Excursions" },
  { id: "destinations", label: "Destinations" },
  { id: "port", label: "Port" },
  { id: "arrival", label: "Arrival info" },
  { id: "documentation", label: "Documentation" },
  { id: "services", label: "Port services" },
  { id: "berthing", label: "Berthing" },
  { id: "personnel", label: "Personnel" },
  { id: "capabilities", label: "Capabilities" },
  { id: "terms", label: "Terms" },
  { id: "payment", label: "Payment" },
  { id: "inquiry", label: "Cruise inquiry" },
] as const;
