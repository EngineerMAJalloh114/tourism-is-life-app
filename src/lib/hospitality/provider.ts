import {
  DESTINATION_OPTIONS,
  HERO_SLIDES,
  SAMPLE_DINING,
  SAMPLE_STAYS,
} from "@/data/hospitality";
import type { DestinationOption, HeroSlide, Kind, Restaurant, Stay } from "@/lib/hospitality/types";

/**
 * The seam between the UI and wherever hospitality data lives. Routes and
 * components call these methods only. To connect a property API, a CMS or the
 * database, implement this interface and change `hospitality` below. Nothing
 * else needs to move. Methods are async so a network-backed implementation
 * drops in unchanged. An availability or reservation API would be added here as
 * further methods; none exists yet, so none is pretended.
 */
export interface HospitalityProvider {
  listStays(): Promise<Stay[]>;
  getStay(slug: string): Promise<Stay | null>;
  listDining(): Promise<Restaurant[]>;
  getRestaurant(slug: string): Promise<Restaurant | null>;
  destinations(): Promise<DestinationOption[]>;
  heroSlides(kind: Kind): Promise<HeroSlide[]>;
}

const sampleProvider: HospitalityProvider = {
  async listStays() {
    return SAMPLE_STAYS;
  },
  async getStay(slug) {
    return SAMPLE_STAYS.find((s) => s.slug === slug) ?? null;
  },
  async listDining() {
    return SAMPLE_DINING;
  },
  async getRestaurant(slug) {
    return SAMPLE_DINING.find((r) => r.slug === slug) ?? null;
  },
  async destinations() {
    return DESTINATION_OPTIONS;
  },
  async heroSlides(kind) {
    return HERO_SLIDES.filter((s) => s.kind === kind);
  },
};

export const hospitality: HospitalityProvider = sampleProvider;
