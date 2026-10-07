import type { ExploreSlide } from "@/components/hero/explore-hero";

/**
 * Hero media types and the homepage sequence.
 *
 * The site has two hero media modes and the distinction is enforced by these
 * types rather than by convention:
 *
 * - `HeroImage` is the only variant `PageHero` accepts, so an internal page
 *   cannot be handed a video even by mistake. That is a compile error.
 * - `HeroVideo` is accepted only by the homepage hero, once it supports video again.
 *
 * `HeroVideo` is defined but currently unused. The three clips supplied in
 * September 2026 were set aside because they do not depict Sierra Leone (one is
 * an alpine meadow, one a coral reef) and the site must never present another
 * country as Sierra Leone. Keeping the type here means adding real footage later
 * is mostly a data change. NOTE: the homepage hero is now the shared image-only
 * `ExploreHero`, so video needs that component extended first (it carried video
 * support in its previous form, `HeroMediaLayer`, which `HomeHero` no longer uses).
 */

export type HeroImage = {
  kind: "image";
  src: string;
  /** Describes what is actually in the frame. Stand-ins must say so. */
  alt: string;
  /** CSS object-position — override for portrait or off-centre sources. */
  position?: string;
};

export type HeroVideo = {
  kind: "video";
  src: string;
  /** Shown while the video loads, and instead of it when autoplay is refused. */
  poster: string;
  alt: string;
  position?: string;
};

export type HeroMedia = HeroImage | HeroVideo;

/** Narrowing helper so the media layer can branch without casting. */
export function isVideo(media: HeroMedia): media is HeroVideo {
  return media.kind === "video";
}

/** How long each slide holds before the crossfade to the next one begins. */
export const HERO_SLIDE_MS = 7000;

/** Crossfade length. Kept well under HERO_SLIDE_MS so slides settle between moves. */
export const HERO_FADE_MS = 1400;

/**
 * The homepage hero states: welcome, the capital, heritage, coast and islands.
 *
 * Each state is a full `ExploreSlide` (headline, sub-heading, description, an
 * internal call to action and one photograph), so the hero reads as a guided
 * start rather than a bare slideshow. Slide 1 keeps the Tokeh Beach image the
 * homepage has always opened on. Every photograph is Sierra Leone photography
 * with provenance in `public/images/image-sources.json`. Copy only restates what
 * the catalogue already says: no claim here is new.
 *
 * The island aerial (slide 4) is nearly square and its location is not
 * independently confirmed, so its alt describes the frame without naming a place
 * and its copy speaks of the coast and islands in general.
 */
export const HOME_HERO_SLIDES: readonly ExploreSlide[] = [
  {
    id: "welcome",
    title: "Welcome to Sierra Leone",
    heading: "Discover the heart of West Africa",
    description: "A Freetown-based destination management company for travellers, tour operators and cruise ships.",
    label: "Welcome to Sierra Leone",
    image: {
      src: "/images/beaches/tokeh-beach-hero.jpg",
      alt: "Palms leaning over the empty sand at Tokeh Beach on the Freetown Peninsula",
      position: "center 58%",
    },
    cta: { label: "Explore Our Tours", href: "/tours" },
  },
  {
    id: "freetown",
    title: "Discover Freetown",
    heading: "Start in the capital",
    description: "City tours and the Freetown Peninsula, arranged by a local team.",
    label: "Discover Freetown",
    image: {
      src: "/images/cities/freetown-aerial.jpg",
      alt: "Freetown seen from above, the city spreading between green hills and the Atlantic",
      position: "center 45%",
    },
    cta: { label: "Explore Destinations", href: "/destinations" },
  },
  {
    id: "heritage",
    title: "Walk through history",
    heading: "Heritage sites",
    description: "Visit Bunce Island, a former slave-trading fort in the Sierra Leone River, on a journey we arrange.",
    label: "Walk through history",
    image: {
      src: "/images/heritage/bunce-island-wall.jpg",
      alt: "The standing stone wall of the ruined fortress on Bunce Island",
      position: "center 50%",
    },
    cta: { label: "See the Bunce Island tour", href: "/tours/bunce-tasso-island" },
  },
  {
    id: "coast",
    title: "Explore the coast and islands",
    heading: "By land and by boat",
    description: "Beaches on the Freetown Peninsula and island trips such as the Banana Islands.",
    label: "Explore the coast and islands",
    image: {
      src: "/images/islands/island-aerial-settlement.jpg",
      alt: "A small wooded island ringed by turquoise water, with huts and a jetty on its shore",
      position: "center 42%",
    },
    cta: { label: "Explore Our Tours", href: "/tours" },
  },
];
