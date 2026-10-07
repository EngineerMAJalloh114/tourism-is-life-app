/**
 * Content for the Sustainability page. Kept apart from the components so
 * verified information (figures, a policy document, partners) can be added
 * here later without touching layout.
 *
 * Nothing in this file is a statistic, certification, partnership or
 * achievement. Every sentence is either the company's stated approach, a
 * practical rule already published on a tour page, or plain guidance.
 */

/** Set to a real document URL when a written policy exists. Null renders an honest "not published yet" state. */
export const SUSTAINABILITY_POLICY_URL: string | null = null;

export type IconKey =
  | "mountain"
  | "users"
  | "paw"
  | "landmark"
  | "compass"
  | "sprout"
  | "map"
  | "handshake"
  | "route"
  | "book"
  | "headset";

export type ExperienceFilter = "all" | "nature" | "wildlife" | "culture" | "community" | "heritage" | "coastal";

export const SECTION_NAV = [
  { id: "overview", label: "Overview" },
  { id: "approach", label: "Approach" },
  { id: "pillars", label: "Pillars" },
  { id: "experiences", label: "Experiences" },
  { id: "travel-responsibly", label: "Travel Responsibly" },
  { id: "partners", label: "For Partners" },
  { id: "principles", label: "Principles" },
] as const;

export type PillarId = "environment" | "communities" | "wildlife" | "culture";

export type Pillar = {
  id: PillarId;
  n: string;
  title: string;
  icon: IconKey;
  /** One line, used on the hero card and the pillar tab. */
  short: string;
  body: string;
  points: string[];
  image: string;
  alt: string;
  /** The experience filter this pillar's CTA opens. */
  filter: ExperienceFilter;
  cta: string;
};

export const PILLARS: Pillar[] = [
  {
    id: "environment",
    n: "01",
    title: "Environment",
    icon: "mountain",
    short: "Explore landscapes while respecting the places we visit.",
    body: "Natural places are the reason people come to Sierra Leone. We ask travelers to look after them: taking care with waste, using natural areas responsibly, and choosing experiences that suit protected environments.",
    points: [
      "Respect natural environments",
      "Use natural areas responsibly",
      "Reduce unnecessary waste",
      "Follow protected-area guidance",
      "Travel with care",
    ],
    image: "/images/mountains/wara-wara-mountains.jpg",
    alt: "Forested hills of the Wara-Wara Mountains near Bafodia in northern Sierra Leone",
    filter: "nature",
    cta: "See nature experiences",
  },
  {
    id: "communities",
    n: "02",
    title: "Local Communities",
    icon: "users",
    short: "Local people, knowledge and businesses are part of every journey.",
    body: "Local guides, drivers, suppliers and businesses are central to how a journey is built. We look for ways to keep tourism value within the communities we visit, wherever that is possible.",
    points: [
      "Local guides and drivers",
      "Local businesses and suppliers",
      "Community experiences",
      "Local knowledge",
      "Local participation",
    ],
    image: "/images/culture/koidu-market.jpg",
    alt: "Koidu market in Kono District, Sierra Leone",
    filter: "community",
    cta: "See community experiences",
  },
  {
    id: "wildlife",
    n: "03",
    title: "Wildlife & Conservation",
    icon: "paw",
    short: "Experience natural environments and wildlife responsibly.",
    body: "Wildlife encounters follow the rules of each sanctuary and park. We ask travelers to keep their distance, respect boundaries and learn how to behave around animals.",
    points: [
      "Respectful wildlife encounters",
      "Respect for wildlife boundaries",
      "Sanctuary and park rules followed",
      "Habitats protected",
      "Traveler education",
    ],
    image: "/images/wildlife/outamba-hippos.jpg",
    alt: "Pygmy hippos in Outamba-Kilimi National Park, Sierra Leone",
    filter: "wildlife",
    cta: "See wildlife experiences",
  },
  {
    id: "culture",
    n: "04",
    title: "Culture & Heritage",
    icon: "landmark",
    short: "Discover destinations through their stories, traditions and heritage.",
    body: "We encourage respect for local customs and route travelers through heritage sites, markets, food and local storytelling, so the character and identity of each place stay in view.",
    points: [
      "Respect for local customs",
      "Cultural experiences",
      "Heritage sites",
      "Local food and storytelling",
      "Arts and crafts",
    ],
    image: "/images/culture/sierra-leone-big-market.jpg",
    alt: "The Big Market in Freetown, Sierra Leone",
    filter: "culture",
    cta: "See culture experiences",
  },
];

export const IMPACT_STRIP: { title: string; body: string; icon: IconKey }[] = [
  { title: "Local expertise", body: "Destination-led knowledge", icon: "compass" },
  { title: "Responsible experiences", body: "Nature, culture, community", icon: "sprout" },
  { title: "Wildlife & conservation", body: "Responsible encounters", icon: "paw" },
  { title: "West Africa", body: "Local destination knowledge", icon: "map" },
];

export const WHY: { id: string; title: string; body: string }[] = [
  {
    id: "people",
    title: "People",
    body: "Local participation and community connections. A destination is someone's home first, and the best journeys are shaped by the people who live there.",
  },
  {
    id: "places",
    title: "Places",
    body: "Respect for natural and cultural environments. Forests, coastlines and heritage sites last only when visitors treat them with care.",
  },
  {
    id: "travelers",
    title: "Travelers",
    body: "Helping visitors make responsible choices. Most people want to travel well. They need clear, practical guidance to do it.",
  },
];

/** Experiences pulled from the catalogue by slug. `relevance` restates a rule or practical note already on that tour's page. */
export const EXPERIENCES: { slug: string; tags: ExperienceFilter[]; relevance: string }[] = [
  {
    slug: "tacugama-chimpanzee-sanctuary",
    tags: ["wildlife"],
    relevance: "Visitors follow the sanctuary's viewing rules and wear closed shoes.",
  },
  {
    slug: "gola-rainforest",
    tags: ["nature", "wildlife"],
    relevance: "A national park explored on foot, so the forest sets the pace.",
  },
  {
    slug: "freetown-city-tour",
    tags: ["culture", "heritage", "community"],
    relevance: "Modest dress is asked for at religious sites.",
  },
  {
    slug: "bunce-tasso-island",
    tags: ["heritage", "culture"],
    relevance: "Uneven ruins call for steady footing and an unhurried visit.",
  },
  {
    slug: "banana-island",
    tags: ["coastal"],
    relevance: "Reached by boat from Kent, so travel light and leave the shore as you found it.",
  },
  {
    slug: "freetown-peninsula",
    tags: ["coastal", "nature"],
    relevance: "Sun protection and care at the water, and leave the coves as you found them.",
  },
  {
    slug: "bo-city",
    tags: ["community", "culture"],
    relevance: "A multi-day stay in a working city, with time to eat, shop and learn locally.",
  },
  {
    slug: "bintumani-mountain",
    tags: ["nature"],
    relevance: "Altitude and remote conditions mean preparing properly and travelling with insurance.",
  },
  {
    slug: "wara-wara-mountain",
    tags: ["nature"],
    relevance: "Prior trekking experience is recommended so the group moves carefully on the trail.",
  },
];

export const FILTERS: { id: ExperienceFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "nature", label: "Nature" },
  { id: "wildlife", label: "Wildlife" },
  { id: "culture", label: "Culture" },
  { id: "community", label: "Community" },
  { id: "heritage", label: "Heritage" },
  { id: "coastal", label: "Coastal" },
];

export const GUIDE: { id: string; label: string; items: string[] }[] = [
  {
    id: "before",
    label: "Before you travel",
    items: [
      "Learn about local customs",
      "Pack thoughtfully",
      "Consider reusable items",
      "Understand the destination",
    ],
  },
  {
    id: "while",
    label: "While you travel",
    items: [
      "Respect local communities",
      "Follow wildlife guidelines",
      "Reduce unnecessary waste",
      "Respect protected areas",
      "Support local businesses",
      "Ask before photographing people",
    ],
  },
  {
    id: "after",
    label: "After your journey",
    items: [
      "Share responsible travel experiences",
      "Continue supporting local businesses where appropriate",
      "Encourage respectful travel",
      "Promote responsible tourism",
    ],
  },
];

export const CHECKLIST = [
  "Respect local customs",
  "Follow wildlife guidelines",
  "Reduce unnecessary waste",
  "Ask before photographing people",
  "Respect protected areas",
  "Support local businesses",
  "Leave natural spaces responsibly",
];

export const PARTNER_CARDS: { title: string; body: string; icon: IconKey }[] = [
  {
    title: "Local destination expertise",
    body: "A Freetown DMC that knows Sierra Leone from the inside, with Guinea and Liberia available on request.",
    icon: "compass",
  },
  {
    title: "Responsible itinerary design",
    body: "Tell us the responsible-travel expectations of your programme and we will plan around them.",
    icon: "route",
  },
  {
    title: "Local supplier connections",
    body: "Where appropriate, we work with local businesses and service providers rather than around them.",
    icon: "handshake",
  },
  {
    title: "Traveler education",
    body: "Clear, practical guidance for your guests, so they arrive knowing how to behave in each place.",
    icon: "book",
  },
  {
    title: "On-the-ground DMC support",
    body: "Ground handling, manifests and group logistics from a team based in the destination.",
    icon: "headset",
  },
];

export const PRINCIPLES: { word: string; line: string; more: string }[] = [
  {
    word: "We respect",
    line: "People, communities, cultures and wildlife.",
    more: "Respect comes first: for the people who live in a destination, for their customs, and for the wildlife that shares the land.",
  },
  {
    word: "We source locally",
    line: "Where appropriate, we work with local businesses and service providers.",
    more: "Local guides, drivers and businesses know their own places best, and working with them keeps more of the value of travel where it happens.",
  },
  {
    word: "We protect",
    line: "We encourage responsible behavior in natural and protected environments.",
    more: "In parks, sanctuaries and other protected places, the rules of the site come before the itinerary.",
  },
  {
    word: "We educate",
    line: "We help travelers understand the destinations they visit.",
    more: "Each tour page lists the practical rules travelers are asked to follow, so guidance arrives before the trip, not during it.",
  },
  {
    word: "We improve",
    line: "We continue reviewing and improving responsible tourism practices.",
    more: "Responsible tourism is never finished. We keep reviewing how we work and where we can do better.",
  },
];

export type TimelineStatus = "In place" | "Ongoing" | "Planned";

export const TIMELINE: { step: string; title: string; status: TimelineStatus; body: string }[] = [
  {
    step: "01",
    title: "Current practices",
    status: "In place",
    body: "Journeys use licensed guides, and each tour page lists the practical rules travelers are asked to follow, such as sanctuary viewing rules and modest dress at religious sites.",
  },
  {
    step: "02",
    title: "Ongoing review",
    status: "Ongoing",
    body: "We keep reviewing operational and environmental practices, listening to local partners and improving traveler guidance.",
  },
  {
    step: "03",
    title: "Measurable goals",
    status: "Planned",
    body: "We intend to develop measurable sustainability goals over time. None are set or published yet.",
  },
  {
    step: "04",
    title: "Long-term improvement",
    status: "Planned",
    body: "The aim is greater local participation and more responsible practice year on year. This is a direction, not a claim of results.",
  },
];
