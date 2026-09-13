import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { IMG_CRUISE } from "@/data/catalog";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/cruise/group-handling")({
  head: () =>
    pageHead(
      "Cruise Group Handling",
      "Coordinated shore movements for cruise passenger groups in Freetown, sized and confirmed per ship.",
      "/cruise/group-handling",
    ),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHero kicker="Cruise" title="Group handling" image={IMG_CRUISE} imageAlt="Ship" />
      <div className="container-page py-16">
        <p className="max-w-2xl text-muted">
          Group movements on shore. Maximum simultaneous passengers: confirmed per ship, not published
          as a marketing number.
        </p>
        <Button asChild className="mt-6">
          <Link to="/cruise/quote">Request a quote</Link>
        </Button>
      </div>
    </>
  );
}
