/**
 * The hospitality data model. UI components depend on these types only, never
 * on where the records come from, so a property API, CMS or database can
 * replace the sample provider without touching a component.
 *
 * Honesty rules baked into the shape:
 * - `price`, `rating`, `priceRange`, `hours`, `coordinates` and `menuUrl` are
 *   nullable. Null means "not published", and the UI shows nothing (or "on
 *   request") rather than a made-up value.
 * - `availability` is always "on-request". No live availability system exists.
 * - `status: "sample"` marks a listing that exists only to preview the layout.
 */

export type Kind = "stays" | "dining";

export type ListingStatus = "sample" | "verified";

export interface Photo {
  src: string;
  /** Describes what is in the frame. Say so when the photo is a stand-in. */
  alt: string;
  /** CSS object-position. */
  position?: string;
}

export interface Money {
  amount: number;
  currency: string;
}

export interface Rating {
  value: number;
  count: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export type StayType = "hotel" | "resort" | "villa" | "guesthouse" | "lodge" | "apartment";

export type AmenityId =
  | "wifi"
  | "restaurant"
  | "parking"
  | "air-conditioning"
  | "room-service"
  | "pool"
  | "airport-transfer"
  | "reception-24h"
  | "beachfront"
  | "generator";

export interface Stay {
  id: string;
  slug: string;
  name: string;
  type: StayType;
  destination: string;
  area?: string;
  summary: string;
  description: string;
  price: Money | null;
  rating: Rating | null;
  images: Photo[];
  amenities: AmenityId[];
  coordinates: Coordinates | null;
  availability: "on-request";
  featured: boolean;
  status: ListingStatus;
}

export type DiningStyle = "casual" | "cafe" | "fine-dining" | "beachfront" | "street-food";

export type FeatureId = "outdoor-seating" | "takeaway" | "vegetarian-options" | "parking" | "wifi" | "live-music";

export type PriceRange = "$" | "$$" | "$$$" | "$$$$";

export interface OpeningHours {
  days: string;
  hours: string;
}

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  cuisines: string[];
  destination: string;
  area?: string;
  summary: string;
  description: string;
  priceRange: PriceRange | null;
  rating: Rating | null;
  images: Photo[];
  style: DiningStyle;
  features: FeatureId[];
  hours: OpeningHours[] | null;
  menuUrl: string | null;
  coordinates: Coordinates | null;
  reservation: "on-request";
  featured: boolean;
  status: ListingStatus;
}

export interface HeroSlide {
  id: string;
  kind: Kind;
  /** The large headline. */
  title: string;
  /** The line beside the orbit selector. */
  heading: string;
  description: string;
  image: Photo;
  /** Short label used for the thumbnail's accessible name. */
  label: string;
}

export interface DestinationOption {
  id: string;
  name: string;
  /** Extra words the destination search also matches. */
  keywords?: string[];
}

export type SortId = "featured" | "name-asc" | "name-desc" | "price-asc" | "rating-desc";

/** Everything that defines a discovery view, and everything kept in the URL. */
export interface HospitalitySearch {
  kind: Kind;
  dest: string;
  q: string;
  /** Stays */
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  types: string[];
  amenities: string[];
  /** Dining */
  date: string;
  time: string;
  party: number;
  cuisines: string[];
  styles: string[];
  features: string[];
  sort: SortId;
}
