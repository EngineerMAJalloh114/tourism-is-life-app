import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { IMG_CRUISE } from "@/data/catalog";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/cruise/shore-excursions")({
  head: () =>
    pageHead(
      "Shore Excursions",
      "Half-day and full-day Freetown, peninsula, and heritage excursions timed to cruise ship schedules.",
      "/cruise/shore-excursions",
    ),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHero
        kicker="Cruise"
        title="Shore excursions"
        lede="Half-day and full-day Freetown, peninsula, and history programmes timed to ship schedules."
        image={IMG_CRUISE}
        imageAlt="Ship"
      />
      <div className="container-page py-16">
        <p className="max-w-2xl text-muted">
          Exact excursion menus are issued per call. Use the quote form with ship name, arrival, and
          passenger count.
        </p>
        <Button asChild className="mt-6">
          <Link to="/cruise/quote">Request a quote</Link>
        </Button>
      </div>
    </>
  );
}
