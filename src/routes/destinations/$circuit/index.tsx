import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { destinations, getCircuit, toursForCircuit, type CircuitId } from "@/data/catalog";
import { PageHero } from "@/components/page-hero";
import { TourCard } from "@/components/tour-card";
import { DestinationCard } from "@/components/cards/destination-card";
import { pageHead } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/destinations/$circuit/")({
  head: ({ params }) => {
    const data = getCircuit(params.circuit);
    return pageHead(
      data?.name ?? "Circuit",
      data?.summary ?? "Sierra Leone travel circuit.",
      `/destinations/${params.circuit}`,
    );
  },
  component: CircuitPage,
});

function CircuitPage() {
  const { circuit } = Route.useParams();
  const data = getCircuit(circuit);
  if (!data) throw notFound();
  const list = toursForCircuit(circuit as CircuitId);
  const places = destinations.filter((d) => d.circuit === data.id);
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Destinations", path: "/destinations" },
          { name: data.name, path: `/destinations/${data.id}` },
        ])}
      />
      <PageHero kicker="Circuit" title={data.name} lede={data.summary} image={data.image} imageAlt={data.imageAlt} />
      <div className="container-page py-12">
        <p className="text-sm text-muted">
          Best time: {data.bestTime}. {data.region}.
        </p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {data.highlights.map((h) => (
            <li key={h} className="rounded-full border border-line bg-surface px-3 py-1 text-sm">
              {h}
            </li>
          ))}
        </ul>
        <h2 className="mt-12 font-display text-3xl text-heading">Places</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {places.map((d) => (
            <Link
              key={d.slug}
              to="/destinations/$circuit/$slug"
              params={{ circuit: data.id, slug: d.slug }}
              className="group"
            >
              <DestinationCard title={d.name} summary={d.summary} image={d.image} imageAlt={d.imageAlt} className="min-h-40" />
            </Link>
          ))}
        </div>
        <h2 className="mt-12 font-display text-3xl text-heading">Tours in this circuit</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <TourCard key={t.slug} tour={t} />
          ))}
        </div>
      </div>
    </>
  );
}
