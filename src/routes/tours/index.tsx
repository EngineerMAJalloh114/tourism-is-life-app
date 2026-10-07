import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { StackedCardCarousel, type StackedCardItem } from "@/components/carousel/stacked-card-carousel";
import { tours, type CountryId } from "@/data/catalog";
import type { HeroImage } from "@/lib/hero-media";
import { pageHead } from "@/lib/seo";

/** Highland, rainforest and island: the three kinds of trip the catalogue lists. */
const HERO_IMAGES: readonly HeroImage[] = [
  {
    kind: "image",
    src: "/images/mountains/adventure-bintumani-fb.jpg",
    alt: "An expedition group on Mount Bintumani in the Loma Mountains, Sierra Leone",
  },
  {
    kind: "image",
    src: "/images/rainforest/gola-national-parks.jpg",
    alt: "A forested hill ringed by palms in the Gola Rainforest, Sierra Leone",
  },
  {
    kind: "image",
    src: "/images/islands/banana-island-rainbow.jpg",
    alt: "The Banana Islands seen from the air off the Freetown Peninsula",
  },
];

type Search = { country?: CountryId };

export const Route = createFileRoute("/tours/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    country: typeof s.country === "string" ? (s.country as CountryId) : undefined,
  }),
  head: () => pageHead("Tours", "Sierra Leone and West Africa tours from the public Tourism Is Life catalogue.", "/tours"),
  component: ToursIndex,
});

function ToursIndex() {
  const { country } = Route.useSearch();
  const navigate = useNavigate({ from: "/tours/" });
  const list = country ? tours.filter((t) => t.country === country) : tours;
  const stackItems: StackedCardItem[] = list.map((t) => ({
    key: t.slug,
    image: t.image,
    imageAlt: t.imageAlt,
    kicker: `${t.category.replace("-", " ")} · ${t.duration}`,
    title: t.title,
    summary: t.summary,
    cta: t.bookable ? "Check availability" : "Request a quote",
    href: `/tours/${t.slug}`,
  }));

  return (
    <>
      <PageHero
        kicker="Catalogue"
        title="Tours across Sierra Leone and West Africa"
        lede="Names, durations, and circuits taken from the public Tourism Is Life catalogue. Prices are quoted, never invented."
        images={HERO_IMAGES}
      />
      <div className="container-page py-8">
        <div className="flex flex-wrap gap-2">
          {(
            [
              [undefined, "All"],
              ["sierra-leone", "Sierra Leone"],
              ["guinea", "Guinea"],
              ["liberia", "Liberia"],
              ["west-africa", "West Africa"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => navigate({ search: { country: id } })}
              className={`glass-btn min-h-10 rounded-full border px-4 text-sm transition-colors ${
                country === id ? "border-brand bg-brand/92 text-ivory" : "border-line bg-surface/85"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {list.length > 0 ? (
          <div className="mt-6">
            <StackedCardCarousel label="tour" items={stackItems} />
          </div>
        ) : null}
        {list.length === 0 ? (
          <p className="mt-10 text-muted">No tours in this filter. Try another country.</p>
        ) : null}
      </div>
    </>
  );
}
