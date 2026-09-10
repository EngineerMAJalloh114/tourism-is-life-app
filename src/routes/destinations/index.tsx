import { createFileRoute, Link } from "@tanstack/react-router";
import { circuits, destinations, IMG_HERO } from "@/data/catalog";
import { PageHero } from "@/components/page-hero";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/destinations/")({
  head: () =>
    pageHead(
      "Destinations",
      "Four Sierra Leone circuits — Western, Northern, Southern, and Eastern — plus published places.",
      "/destinations",
    ),
  component: DestinationsPage,
});

function DestinationsPage() {
  return (
    <>
      <PageHero
        kicker="Sierra Leone"
        title="Destinations"
        lede="Four regional circuits — the way Tourism Is Life already frames the country — plus the places published on the public catalogue."
        image={IMG_HERO}
        imageAlt="Coastal Sierra Leone"
      />
      <div className="container-page py-16">
        <div className="grid gap-5 sm:grid-cols-2">
          {circuits.map((c) => (
            <Link
              key={c.id}
              to="/destinations/$circuit"
              params={{ circuit: c.id }}
              className="overflow-hidden rounded-lg border border-line bg-surface"
            >
              <img src={c.image} alt={c.imageAlt} className="h-48 w-full object-cover" />
              <div className="p-5">
                <h2 className="font-display text-2xl text-brand">{c.name}</h2>
                <p className="mt-2 text-sm text-muted">{c.summary}</p>
              </div>
            </Link>
          ))}
        </div>
        <h2 className="mt-16 font-display text-3xl text-brand">Places</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d) => (
            <li key={d.slug} className="rounded-md border border-line px-4 py-3">
              <Link
                to="/destinations/$circuit/$slug"
                params={{ circuit: d.circuit, slug: d.slug }}
                className="font-medium text-brand hover:text-gold"
              >
                {d.name}
              </Link>
              <p className="text-sm text-muted">{d.summary}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
