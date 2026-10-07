import {
  Armchair,
  Bed,
  BellRing,
  Car,
  ChefHat,
  Clock,
  Coffee,
  Fan,
  Flame,
  Home,
  Music,
  PlaneLanding,
  ShoppingBag,
  Sprout,
  Store,
  Trees,
  Umbrella,
  UtensilsCrossed,
  Waves,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { AmenityId, DiningStyle, FeatureId, StayType } from "@/lib/hospitality/types";

/** Icons are chosen here, never in the data file, so data stays free of React. */
const AMENITY_ICONS: Record<AmenityId, LucideIcon> = {
  wifi: Wifi,
  restaurant: UtensilsCrossed,
  parking: Car,
  "air-conditioning": Fan,
  "room-service": BellRing,
  pool: Waves,
  "airport-transfer": PlaneLanding,
  "reception-24h": Clock,
  beachfront: Umbrella,
  generator: Zap,
};

const FEATURE_ICONS: Record<FeatureId, LucideIcon> = {
  "outdoor-seating": Trees,
  takeaway: ShoppingBag,
  "vegetarian-options": Sprout,
  parking: Car,
  wifi: Wifi,
  "live-music": Music,
};

const STAY_ICONS: Record<StayType, LucideIcon> = {
  hotel: Bed,
  resort: Umbrella,
  villa: Home,
  guesthouse: Armchair,
  lodge: Trees,
  apartment: Store,
};

const STYLE_ICONS: Record<DiningStyle, LucideIcon> = {
  casual: UtensilsCrossed,
  cafe: Coffee,
  "fine-dining": ChefHat,
  beachfront: Umbrella,
  "street-food": Flame,
};

export function AmenityIcon({ id, className }: { id: AmenityId; className?: string }) {
  const Icon = AMENITY_ICONS[id];
  return <Icon className={className} aria-hidden />;
}

export function FeatureIcon({ id, className }: { id: FeatureId; className?: string }) {
  const Icon = FEATURE_ICONS[id];
  return <Icon className={className} aria-hidden />;
}

export function StayTypeIcon({ id, className }: { id: StayType; className?: string }) {
  const Icon = STAY_ICONS[id];
  return <Icon className={className} aria-hidden />;
}

export function DiningStyleIcon({ id, className }: { id: DiningStyle; className?: string }) {
  const Icon = STYLE_ICONS[id];
  return <Icon className={className} aria-hidden />;
}
