import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TourCard } from "@/components/tour-card";
import { PageHero } from "@/components/page-hero";
import { IMG_FOREST, tours, type CountryId } from "@/data/catalog";
import { pageHead } from "@/lib/seo";

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

  return (
    <>
      <PageHero
        kicker="Catalogue"
        title="Tours across Sierra Leone and West Africa"
        lede="Names, durations, and circuits taken from the public Tourism Is Life catalogue. Prices are quoted, never invented."
        image={IMG_FOREST}
        imageAlt="Forest expedition"
      />
      <div className="container-page py-12">
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
              className={`min-h-10 rounded-full border px-4 text-sm ${
                country === id ? "border-brand bg-brand text-ivory" : "border-line bg-surface"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <TourCard key={t.slug} tour={t} />
          ))}
        </div>
        {list.length === 0 ? (
          <p className="mt-10 text-muted">No tours in this filter. Try another country.</p>
        ) : null}
      </div>
    </>
  );
}
