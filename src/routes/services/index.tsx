import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { IMG_MICE, services } from "@/data/catalog";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/services/")({
  head: () =>
    pageHead(
      "DMC Services",
      "Ground handling beyond the tour catalogue: visas, vehicles, hotels, ticketing, MICE, and cruise support in Sierra Leone.",
      "/services",
    ),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHero
        kicker="DMC services"
        title="Ground handling beyond the tour catalogue"
        image={IMG_MICE}
        imageAlt="Professional gathering"
      />
      <div className="container-page grid gap-5 py-16 sm:grid-cols-2">
        {services.map((s) => (
          <Link
            key={s.slug}
            to="/services/$slug"
            params={{ slug: s.slug }}
            className="rounded-lg border border-line bg-surface p-6 hover:border-gold"
          >
            <h2 className="font-display text-2xl text-brand">{s.name}</h2>
            <p className="mt-2 text-sm text-muted">{s.summary}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
