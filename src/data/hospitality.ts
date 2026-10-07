import type {
  AmenityId,
  DestinationOption,
  DiningStyle,
  FeatureId,
  HeroSlide,
  Photo,
  Restaurant,
  Stay,
  StayType,
} from "@/lib/hospitality/types";

/**
 * SAMPLE CONTENT. Tourism Is Life has no confirmed hotel or restaurant data
 * yet, and the project rules forbid inventing listings, prices, ratings or
 * reviews. Everything below exists only so the discovery experience can be
 * previewed end to end. Every record is `status: "sample"`, every price and
 * rating is null, and the routes that show it are noindex and left out of the
 * navigation. Replace this file (or swap the provider in
 * `src/lib/hospitality/provider.ts`) with confirmed records to go live.
 *
 * Photographs are existing Sierra Leone images from the site's own library.
 * None was taken at these (sample) properties, and each alt says what the frame
 * actually shows.
 */

export const HOSPITALITY_PREVIEW = true;

export const SAMPLE_LISTING_NOTE =
  "Sample listing. It previews the layout only. Its details are illustrative and no real property is confirmed.";

export const SAMPLE_DESCRIPTION =
  "This is a sample listing used to preview how a property page will look. Real details, photographs and pricing will replace it once a property is confirmed with Tourism Is Life.";

export const DESTINATION_OPTIONS: DestinationOption[] = [
  { id: "freetown", name: "Freetown", keywords: ["lumley", "aberdeen", "capital", "western area"] },
  { id: "peninsula", name: "Freetown Peninsula", keywords: ["tokeh", "river number two", "western area", "beach"] },
  { id: "bo", name: "Bo", keywords: ["southern"] },
  { id: "kenema", name: "Kenema", keywords: ["eastern"] },
  { id: "makeni", name: "Makeni", keywords: ["northern"] },
  { id: "kabala", name: "Kabala", keywords: ["koinadugu", "northern", "highlands"] },
  { id: "banana-islands", name: "Banana Islands", keywords: ["island", "kent"] },
  { id: "gola", name: "Gola Rainforest", keywords: ["eastern", "forest"] },
  { id: "outamba-kilimi", name: "Outamba-Kilimi", keywords: ["northern", "park", "river"] },
  { id: "bintumani", name: "Mount Bintumani", keywords: ["loma", "northern", "mountain"] },
];

export const STAY_TYPE_LABELS: Record<StayType, string> = {
  hotel: "Hotel",
  resort: "Resort",
  villa: "Villa",
  guesthouse: "Guesthouse",
  lodge: "Lodge",
  apartment: "Apartment",
};

export const AMENITY_LABELS: Record<AmenityId, string> = {
  wifi: "Wi-Fi",
  restaurant: "Restaurant",
  parking: "Parking",
  "air-conditioning": "Air conditioning",
  "room-service": "Room service",
  pool: "Swimming pool",
  "airport-transfer": "Airport transfer",
  "reception-24h": "24-hour reception",
  beachfront: "Beachfront",
  generator: "Backup power",
};

export const DINING_STYLE_LABELS: Record<DiningStyle, string> = {
  casual: "Casual",
  cafe: "Café",
  "fine-dining": "Fine dining",
  beachfront: "Beachfront",
  "street-food": "Street food",
};

export const FEATURE_LABELS: Record<FeatureId, string> = {
  "outdoor-seating": "Outdoor seating",
  takeaway: "Takeaway",
  "vegetarian-options": "Vegetarian options",
  parking: "Parking",
  wifi: "Wi-Fi",
  "live-music": "Live music",
};

const p = (src: string, alt: string, position?: string): Photo => ({ src, alt, position });

/** Stand-in photographs, grouped so a sample listing never repeats a frame. */
const PHOTO = {
  atlantic: p("/images/mice/atlantic-hotel.jpg", "The Atlantic Lumley Hotel building on a road in Freetown, Sierra Leone, photographed with a wide-angle lens", "center 88%"),
  lumley: p("/images/beaches/lumley-beach.jpg", "Lumley Beach in Freetown, Sierra Leone, with people on the sand", "center 60%"),
  tokehHero: p("/images/beaches/tokeh-beach-hero.jpg", "Tokeh Beach on the Freetown Peninsula, Sierra Leone, with golden sand and boats offshore", "center 80%"),
  tokeh: p("/images/beaches/tokeh-beach.jpg", "Palm trees and a thatched shelter on Tokeh Beach, Sierra Leone", "center"),
  laterite: p("/images/beaches/river-number-two-laterite.jpg", "Red laterite rock and a forested headland at River Number Two beach, Sierra Leone", "center"),
  canoe: p("/images/general/outamba-canoe.jpg", "Forest and a tall tree on the bank of the Kaba River in Outamba-Kilimi National Park, Sierra Leone", "center 62%"),
  hippos: p("/images/wildlife/outamba-hippos.jpg", "Hippos in the water at Outamba-Kilimi National Park, Sierra Leone", "center"),
  forest: p("/images/rainforest/hofstra-trees-hills-299.jpg", "Forested hills in Sierra Leone", "center"),
  picket: p("/images/rainforest/picket-hill-national-parks.jpg", "A trail through dense forest at Picket Hill, Sierra Leone", "center"),
  kabala: p("/images/culture/kabala-village.jpg", "People outside a thatched house in Kabala, Koinadugu District, Sierra Leone", "center 30%"),
  wara: p("/images/mountains/wara-wara-mountains.jpg", "Forested hills of the Wara-Wara Mountains near Bafodia in northern Sierra Leone", "center"),
  bo: p("/images/culture/bo-rice-farming.jpg", "Rice farmland in the countryside around Bo, Sierra Leone", "center"),
  bananas: p("/images/islands/banana-island-rainbow.jpg", "The Banana Islands seen across the sea off the Freetown Peninsula, Sierra Leone", "center"),
  bintumani: p("/images/mountains/mount-bintumani.jpg", "A rocky peak in the highlands of northern Sierra Leone, editorial stand-in", "center 40%"),
  freetownAerial: p("/images/cities/freetown-aerial.jpg", "Freetown seen from above, with houses on the hills, Sierra Leone", "center 40%"),
  freetownStreet: p("/images/cities/freetown-street.jpg", "A busy market street in Freetown, Sierra Leone", "center"),
  bigMarket: p("/images/culture/sierra-leone-big-market.jpg", "The City Council building and market stalls in Freetown, Sierra Leone", "center"),
  koiduMarket: p("/images/culture/koidu-market.jpg", "A busy market street in Koidu, Sierra Leone", "center"),
  pepper: p("/images/culture/pepper-seller.jpg", "A market seller with a bowl of fresh peppers in Sierra Leone", "center 80%"),
  makeni: p("/images/culture/makeni-sunset.jpg", "Rooftops and hills at sunset in Makeni, Sierra Leone", "center"),
  kenema: p("/images/culture/kenema-aerial.jpg", "Kenema seen from above, Sierra Leone", "center"),
};

const SAMPLE_BASE = {
  price: null,
  rating: null,
  coordinates: null,
  availability: "on-request" as const,
  status: "sample" as const,
  description: SAMPLE_DESCRIPTION,
};

export const SAMPLE_STAYS: Stay[] = [
  {
    ...SAMPLE_BASE,
    id: "stay-atlantic-lumley",
    slug: "atlantic-lumley-hotel",
    name: "Atlantic Lumley Hotel",
    type: "hotel",
    destination: "freetown",
    area: "Lumley",
    summary: "A hotel building on the road at Lumley, Freetown. Sample listing.",
    images: [PHOTO.atlantic, PHOTO.lumley, PHOTO.freetownAerial],
    amenities: ["restaurant", "wifi", "reception-24h"],
    featured: true,
  },
  {
    ...SAMPLE_BASE,
    id: "stay-beachfront-resort",
    slug: "sample-beachfront-resort",
    name: "Sample Beachfront Resort",
    type: "resort",
    destination: "peninsula",
    area: "Tokeh",
    summary: "A sample beach resort listing on the Freetown Peninsula.",
    images: [PHOTO.tokehHero, PHOTO.tokeh, PHOTO.laterite],
    amenities: ["beachfront", "restaurant", "pool", "airport-transfer", "wifi"],
    featured: true,
  },
  {
    ...SAMPLE_BASE,
    id: "stay-riverside-lodge",
    slug: "sample-riverside-lodge",
    name: "Sample Riverside Lodge",
    type: "lodge",
    destination: "outamba-kilimi",
    summary: "A sample lodge listing near Outamba-Kilimi National Park.",
    images: [PHOTO.canoe, PHOTO.hippos],
    amenities: ["restaurant", "generator"],
    featured: true,
  },
  {
    ...SAMPLE_BASE,
    id: "stay-rainforest-lodge",
    slug: "sample-rainforest-lodge",
    name: "Sample Rainforest Lodge",
    type: "lodge",
    destination: "gola",
    summary: "A sample lodge listing on the edge of the Gola Rainforest.",
    images: [PHOTO.picket, PHOTO.forest],
    amenities: ["restaurant", "generator", "parking"],
    featured: true,
  },
  {
    ...SAMPLE_BASE,
    id: "stay-highland-guesthouse",
    slug: "sample-highland-guesthouse",
    name: "Sample Highland Guesthouse",
    type: "guesthouse",
    destination: "kabala",
    summary: "A sample guesthouse listing in Kabala, Koinadugu District.",
    images: [PHOTO.wara, PHOTO.kabala],
    amenities: ["wifi", "parking"],
    featured: true,
  },
  {
    ...SAMPLE_BASE,
    id: "stay-city-guesthouse",
    slug: "sample-city-guesthouse",
    name: "Sample City Guesthouse",
    type: "guesthouse",
    destination: "bo",
    summary: "A sample guesthouse listing in Bo, in the southern circuit.",
    images: [PHOTO.bo],
    amenities: ["wifi", "air-conditioning", "parking"],
    featured: false,
  },
  {
    ...SAMPLE_BASE,
    id: "stay-island-retreat",
    slug: "sample-island-retreat",
    name: "Sample Island Retreat",
    type: "villa",
    destination: "banana-islands",
    summary: "A sample villa listing on the Banana Islands, reached by boat.",
    images: [PHOTO.bananas, PHOTO.tokeh],
    amenities: ["beachfront", "generator"],
    featured: false,
  },
  {
    ...SAMPLE_BASE,
    id: "stay-mountain-camp",
    slug: "sample-mountain-camp",
    name: "Sample Mountain Camp",
    type: "lodge",
    destination: "bintumani",
    summary: "A sample basecamp listing for trekkers near Mount Bintumani.",
    images: [PHOTO.bintumani, PHOTO.wara],
    amenities: ["generator"],
    featured: false,
  },
  {
    ...SAMPLE_BASE,
    id: "stay-coastal-apartments",
    slug: "sample-coastal-apartments",
    name: "Sample Coastal Apartments",
    type: "apartment",
    destination: "freetown",
    area: "Lumley",
    summary: "A sample apartment listing near the beach in Freetown.",
    images: [PHOTO.lumley, PHOTO.freetownAerial],
    amenities: ["wifi", "air-conditioning", "parking", "generator"],
    featured: false,
  },
];

const DINING_BASE = {
  priceRange: null,
  rating: null,
  hours: null,
  menuUrl: null,
  coordinates: null,
  reservation: "on-request" as const,
  status: "sample" as const,
  description: SAMPLE_DESCRIPTION,
};

export const SAMPLE_DINING: Restaurant[] = [
  {
    ...DINING_BASE,
    id: "dine-seafood",
    slug: "sample-seafood-restaurant",
    name: "Sample Seafood Restaurant",
    cuisines: ["Seafood", "Sierra Leonean"],
    destination: "freetown",
    area: "Lumley",
    summary: "A sample seafood restaurant listing by the beach in Freetown.",
    style: "beachfront",
    features: ["outdoor-seating", "takeaway"],
    images: [PHOTO.lumley, PHOTO.tokeh],
    featured: true,
  },
  {
    ...DINING_BASE,
    id: "dine-local-kitchen",
    slug: "sample-local-kitchen",
    name: "Sample Local Kitchen",
    cuisines: ["Sierra Leonean"],
    destination: "freetown",
    summary: "A sample listing for everyday Sierra Leonean cooking in Freetown.",
    style: "casual",
    features: ["takeaway", "vegetarian-options"],
    images: [PHOTO.freetownStreet, PHOTO.bigMarket],
    featured: true,
  },
  {
    ...DINING_BASE,
    id: "dine-beach-grill",
    slug: "sample-beach-grill",
    name: "Sample Beach Grill",
    cuisines: ["Seafood", "Grill"],
    destination: "peninsula",
    area: "Tokeh",
    summary: "A sample grill listing on the beach at Tokeh.",
    style: "beachfront",
    features: ["outdoor-seating", "live-music"],
    images: [PHOTO.tokehHero, PHOTO.laterite],
    featured: true,
  },
  {
    ...DINING_BASE,
    id: "dine-rooftop",
    slug: "sample-rooftop-dining",
    name: "Sample Rooftop Dining",
    cuisines: ["International"],
    destination: "freetown",
    summary: "A sample rooftop restaurant listing with a view over Freetown.",
    style: "fine-dining",
    features: ["outdoor-seating", "wifi"],
    images: [PHOTO.freetownAerial],
    featured: true,
  },
  {
    ...DINING_BASE,
    id: "dine-market-cafe",
    slug: "sample-market-cafe",
    name: "Sample Market Café",
    cuisines: ["Café", "Sierra Leonean"],
    destination: "makeni",
    summary: "A sample café listing in Makeni.",
    style: "cafe",
    features: ["wifi", "vegetarian-options"],
    images: [PHOTO.makeni, PHOTO.pepper],
    featured: true,
  },
  {
    ...DINING_BASE,
    id: "dine-highland-cafe",
    slug: "sample-highland-cafe",
    name: "Sample Highland Café",
    cuisines: ["Café"],
    destination: "kabala",
    summary: "A sample café listing in Kabala, Koinadugu District.",
    style: "cafe",
    features: ["outdoor-seating", "takeaway"],
    images: [PHOTO.kabala],
    featured: false,
  },
  {
    ...DINING_BASE,
    id: "dine-street-food",
    slug: "sample-street-food-corner",
    name: "Sample Street Food Corner",
    cuisines: ["Sierra Leonean", "Street food"],
    destination: "kenema",
    summary: "A sample street food listing in Kenema.",
    style: "street-food",
    features: ["takeaway"],
    images: [PHOTO.kenema, PHOTO.koiduMarket],
    featured: false,
  },
  {
    ...DINING_BASE,
    id: "dine-island-table",
    slug: "sample-island-table",
    name: "Sample Island Table",
    cuisines: ["Seafood"],
    destination: "banana-islands",
    summary: "A sample listing for a meal on the Banana Islands.",
    style: "casual",
    features: ["outdoor-seating"],
    images: [PHOTO.bananas],
    featured: false,
  },
];

/** Hero states. Each is a real photograph from the site's library. */
export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "welcome",
    kind: "stays",
    title: "Welcome to Sierra Leone",
    heading: "Stay and dine",
    description: "Discover places to stay and dine across Sierra Leone.",
    label: "Welcome to Sierra Leone",
    image: p("/images/beaches/tokeh-beach-hero.jpg", "Tokeh Beach on the Freetown Peninsula, Sierra Leone, with golden sand and boats offshore", "center 60%"),
  },
  {
    id: "find-a-stay",
    kind: "stays",
    title: "Find your place to stay",
    heading: "Places to stay",
    description: "Discover hotels, lodges, villas and guesthouses.",
    label: "Find your place to stay",
    image: p("/images/mice/atlantic-hotel.jpg", "The Atlantic Lumley Hotel building on a road in Freetown, Sierra Leone", "center 78%"),
  },
  {
    id: "discover",
    kind: "stays",
    title: "Discover Sierra Leone",
    heading: "Where to go",
    description: "Explore accommodation and dining experiences across the country.",
    label: "Discover Sierra Leone",
    image: p("/images/cities/freetown-aerial.jpg", "Freetown seen from above, with houses on the hills, Sierra Leone", "center 35%"),
  },
  {
    id: "taste",
    kind: "dining",
    title: "Taste the destination",
    heading: "Places to dine",
    description: "Discover restaurants and dining experiences shaped by local flavors.",
    label: "Taste the destination",
    image: p("/images/culture/pepper-seller.jpg", "A market seller with a bowl of fresh peppers in Sierra Leone", "center 78%"),
  },
  {
    id: "find-a-table",
    kind: "dining",
    title: "Find a table",
    heading: "Restaurants and cafés",
    description: "Browse dining by area, cuisine and style of place.",
    label: "Find a table",
    image: p("/images/beaches/lumley-beach.jpg", "Lumley Beach in Freetown, Sierra Leone, with people on the sand", "center 55%"),
  },
  {
    id: "dine-across",
    kind: "dining",
    title: "Dine across Sierra Leone",
    heading: "Across the country",
    description: "See where a meal can be part of the trip, in the capital and in the highlands.",
    label: "Dine across Sierra Leone",
    image: p("/images/culture/makeni-sunset.jpg", "Rooftops and hills at sunset in Makeni, Sierra Leone", "center 55%"),
  },
];
