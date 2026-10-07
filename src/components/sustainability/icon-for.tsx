import {
  BookOpen,
  Compass,
  Handshake,
  Headset,
  Landmark,
  Map as MapIcon,
  Mountain,
  PawPrint,
  Route as RouteIcon,
  Sprout,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { IconKey } from "@/data/sustainability";

const ICONS: Record<IconKey, LucideIcon> = {
  mountain: Mountain,
  users: Users,
  paw: PawPrint,
  landmark: Landmark,
  compass: Compass,
  sprout: Sprout,
  map: MapIcon,
  handshake: Handshake,
  route: RouteIcon,
  book: BookOpen,
  headset: Headset,
};

/** Data files name icons by key (they must not import React); this resolves the key. */
export function IconFor({ name, className }: { name: IconKey; className?: string }) {
  const Icon = ICONS[name];
  return <Icon className={className} strokeWidth={1.5} aria-hidden />;
}
