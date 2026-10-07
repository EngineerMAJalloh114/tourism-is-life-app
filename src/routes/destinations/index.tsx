import { createFileRoute, Link } from "@tanstack/react-router";
import { circuits, destinations } from "@/data/catalog";
import { PageHero } from "@/components/page-hero";
import { DestinationCard } from "@/components/cards/destination-card";
import { LayeredTravelCarousel, type TravelCarouselItem } from "@/components/carousel/layered-travel-carousel";
import { PlacePeekCarousel } from "@/components/carousel/place-peek-carousel";
import type { HeroImage } from "@/lib/hero-media";
import { pageHead } from "@/lib/seo";

/**
 * Curated for the Attractions carousel below. Deliberately excludes two
 * destinations whose photography doesn't match their name: `tiwai`'s image is
 * recorded in image-sources.json as a River Number Two canoe scene, not Tiwai
 * Island, and `turtle-islands` uses a Tokeh Beach photo captioned as merely
 * "representative of" the Turtle Islands coastline. Both entries hedge this
 * honestly in their own alt text ("editorial stand-in"), which is exactly why
 * they shouldn't anchor a section whose whole purpose is showing visitors
 * what a place actually looks like.
 */
const ATTRACTION_SLUGS = ["tacugama", "banana-island", "bunce-island", "gola", "bintumani"];

/** One image per region, so the hero previews the range the page then lists. */
const HERO_IMAGES: readonly HeroImage[] = [
  {
    kind: "image",
    src: "/images/beaches/river-number-two-laterite.jpg",
    alt: "Laterite rock and the mangrove-lined river mouth at River Number Two Beach",
  },
  {
    kind: "image",
    src: "/images/mountains/wara-wara-mountains.jpg",
    alt: "The Wara-Wara Mountains near Bafodia in northern Sierra Leone",
  },
  {
    kind: "image",
    src: "/images/islands/sherbro-island.jpg",
    alt: "Sherbro Island off the southern coast of Sierra Leone",
  },
];

export const Route = createFileRoute("/destinations/")({
  head: () =>
    pageHead(
      "Destinations",
      "Four Sierra Leone circuits (Western, Northern, Southern, and Eastern) plus published places.",
      "/destinations",
    ),
  component: DestinationsPage,
});

function DestinationsPage() {
  const circuitByCircuit = Object.fromEntries(circuits.map((c) => [c.id, c]));
  const attractions = ATTRACTION_SLUGS.map((slug) => destinations.find((d) => d.slug === slug)).filter(
    (d): d is NonNullable<typeof d> => Boolean(d),
  );
  const attractionItems: TravelCarouselItem[] = attractions.map((d) => ({
    key: d.slug,
    image: d.image,
    imageAlt: d.imageAlt,
    kicker: circuitByCircuit[d.circuit]?.name,
    title: d.name,
    summary: d.summary,
    cta: "Explore this place",
    href: `/destinations/${d.circuit}/${d.slug}`,
  }));
  // Every published place, not just the five curated above — the "Places"
  // section below must keep the complete catalogue reachable.
  const allPlaceItems: TravelCarouselItem[] = destinations.map((d) => ({
    key: d.slug,
    image: d.image,
    imageAlt: d.imageAlt,
    kicker: circuitByCircuit[d.circuit]?.name,
    title: d.name,
    summary: d.summary,
    cta: "Explore this place",
    href: `/destinations/${d.circuit}/${d.slug}`,
  }));

  return (
    <>
      <PageHero
        kicker="Sierra Leone"
        title="Destinations"
        lede="Four regional circuits, the way Tourism Is Life already frames the country, plus the places published on the public catalogue."
        images={HERO_IMAGES}
      />
      <div className="container-page py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {circuits.map((c) => (
            <Link key={c.id} to="/destinations/$circuit" params={{ circuit: c.id }} className="group">
              <DestinationCard
                title={c.name}
                summary={c.summary}
                image={c.image}
                imageAlt={c.imageAlt}
                meta={c.bestTime}
                className="min-h-48 sm:min-h-56"
              />
            </Link>
          ))}
        </div>

        {attractionItems.length > 0 ? (
          <>
            <h2 className="mt-16 font-display text-3xl text-heading">Places worth the detour</h2>
            <p className="mt-2 max-w-2xl text-muted">
              A sanctuary, an island, a fortress, a rainforest and the country's highest peak —
              five places from the catalogue below, picked for what they actually look like on
              the ground.
            </p>
            <div className="mt-8">
              <LayeredTravelCarousel label="featured place" items={attractionItems} />
            </div>
          </>
        ) : null}

        <div className="mt-16 flex flex-col items-center text-center">
          <p className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-gold-ink">
            <span className="h-px w-6 bg-line" aria-hidden />
            Places
            <span className="h-px w-6 bg-line" aria-hidden />
          </p>
          <h2 className="mt-3 font-display text-4xl text-heading">
            The Places <span className="text-gold-ink">You’ll Meet</span>
          </h2>
          <p className="mt-3 max-w-xl text-muted">
            From vibrant towns to pristine islands, all {destinations.length} places on the
            public catalogue, in the four circuits Tourism Is Life already uses to frame the
            country.
          </p>
        </div>
        <div className="mt-10">
          <PlacePeekCarousel label="place" items={allPlaceItems} />
        </div>
      </div>
    </>
  );
}
