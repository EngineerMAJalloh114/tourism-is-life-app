import { TourCard } from "@/components/tour-card";
import { PageHero } from "@/components/page-hero";
import { tours, type CountryId } from "@/data/catalog";

const HERO_IMAGE = "/images/rainforest/hofstra-trees-hills-299.jpg";

const COPY: Record<CountryId, { title: string; lede: string }> = {
  "sierra-leone": {
    title: "Sierra Leone tours",
    lede: "The published catalogue: city, peninsula, islands, rainforest, and highland programmes from a Freetown DMC.",
  },
  guinea: {
    title: "Guinea programmes",
    lede: "Quote-only highland and overland work. Logistics are confirmed per departure, so never treat this page as a guaranteed date.",
  },
  liberia: {
    title: "Liberia programmes",
    lede: "Custom Sapo and Monrovia-linked itineraries. Entry formalities sit with the traveller; we handle ground arrangements on quote.",
  },
  "west-africa": {
    title: "West Africa circuits",
    lede: "Multi-country Mano River work for operators and private groups. Visas and flights are excluded.",
  },
};

export function CountryToursPage({ country }: { country: CountryId }) {
  const meta = COPY[country];
  const list = tours.filter((t) => t.country === country);
  return (
    <>
      <PageHero
        kicker="Tours"
        title={meta.title}
        lede={meta.lede}
        image={HERO_IMAGE}
        imageAlt={
          country === "sierra-leone"
            ? "Forested hills in Sierra Leone"
            : // The only verified photography in the library is Sierra Leonean, and
              // this page also covers Guinea, Liberia and multi-country circuits.
              // Say so rather than letting the alt text imply the wrong country.
              "Forested hills in Sierra Leone, an editorial stand-in for the wider region"
        }
      />
      <div className="container-page py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <TourCard key={t.slug} tour={t} />
          ))}
        </div>
        {list.length === 0 ? (
          <p className="mt-10 text-muted">No published tour in this country filter yet. Request a custom itinerary.</p>
        ) : null}
      </div>
    </>
  );
}
