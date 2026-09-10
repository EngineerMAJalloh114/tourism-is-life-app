import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getCircuit, getDestination, toursForDestination } from "@/data/catalog";
import { PageHero } from "@/components/page-hero";
import { TourCard } from "@/components/tour-card";
import { Button } from "@/components/ui/button";
import { pageHead, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";

export const Route = createFileRoute("/destinations/$circuit/$slug")({
  head: ({ params }) => {
    const d = getDestination(params.slug);
    return pageHead(d?.name ?? "Destination", d?.summary ?? "Sierra Leone destination.", `/destinations/${params.circuit}/${params.slug}`);
  },
  component: DestinationPage,
});

function DestinationPage() {
  const { circuit, slug } = Route.useParams();
  const dest = getDestination(slug);
  const circ = getCircuit(circuit);
  if (!dest || dest.circuit !== circuit) throw notFound();
  const related = toursForDestination(dest.slug);
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Destinations", path: "/destinations" },
            { name: circ?.name ?? circuit, path: `/destinations/${circuit}` },
            { name: dest.name, path: `/destinations/${circuit}/${slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "TouristDestination",
            name: dest.name,
            description: dest.summary,
            image: dest.image,
          },
        ]}
      />
      <PageHero kicker={circ?.name} title={dest.name} lede={dest.summary} image={dest.image} imageAlt={dest.imageAlt} />
      <div className="container-page py-12">
        <p className="text-sm text-muted">
          {circ?.region}. Best time for the circuit: {circ?.bestTime}.
        </p>
        <p className="mt-6 max-w-2xl leading-relaxed">
          {dest.summary} Editorial photography on this page is licensed stock, not an official Tourism Is Life
          archive image.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/tours">Browse tours</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/contact">Plan this journey</Link>
          </Button>
        </div>
        <h2 className="mt-14 font-display text-3xl text-brand">Tours that visit {dest.name}</h2>
        {related.length ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((t) => (
              <TourCard key={t.slug} tour={t} />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-muted">No published tour is tagged to this place yet. Request a custom itinerary.</p>
        )}
      </div>
    </>
  );
}
