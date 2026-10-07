import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { StackedCardCarousel, type StackedCardItem } from "@/components/carousel/stacked-card-carousel";
import { services } from "@/data/catalog";
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
  const stackItems: StackedCardItem[] = services.map((s) => ({
    key: s.slug,
    image: s.image,
    imageAlt: s.imageAlt,
    kicker: "Tourism Is Life service",
    title: s.name,
    summary: s.summary,
    cta: "Learn more",
    href: `/services/${s.slug}`,
  }));

  return (
    <>
      <PageHero
        kicker="DMC services"
        title="Ground handling beyond the tour catalogue"
        image="/images/mice/atlantic-hotel.jpg"
        imageAlt="The Atlantic Hotel in Freetown, a conference and events venue"
      />
      <div className="container-page py-10">
        <StackedCardCarousel label="service" items={stackItems} />
      </div>
    </>
  );
}
