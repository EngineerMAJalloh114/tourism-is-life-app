import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { IMG_FOREST, services } from "@/data/catalog";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/about/what-we-offer")({
  head: () =>
    pageHead(
      "What We Offer",
      "Tours, visa facilitation, vehicle rental, hotel bookings, cruise handling, and MICE support from Sierra Leone's Freetown-based DMC.",
      "/about/what-we-offer",
    ),
  component: Offer,
});

function Offer() {
  return (
    <>
      <PageHero
        kicker="DMC"
        title="What we offer"
        lede="Tours and excursions, visa facilitation, travel insurance, vehicles, hotels, ticketing, MICE, and cruise handling — as described by the CEO in 2024 and on the public site."
        image={IMG_FOREST}
        imageAlt="Landscape"
      />
      <div className="container-page grid gap-4 py-16 sm:grid-cols-2">
        {services.map((s) => (
          <Link
            key={s.slug}
            to="/services/$slug"
            params={{ slug: s.slug }}
            className="rounded-lg border border-line bg-surface p-5 hover:border-gold"
          >
            <h2 className="font-display text-2xl text-brand">{s.name}</h2>
            <p className="mt-2 text-sm text-muted">{s.summary}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
