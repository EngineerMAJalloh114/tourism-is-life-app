import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/cruise/logistics")({
  head: () =>
    pageHead(
      "Cruise Logistics",
      "Ground transport, timing, and on-shore coordination for cruise calls at Freetown, arranged by Tourism Is Life.",
      "/cruise/logistics",
    ),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHero kicker="Cruise" title="Logistics" image="/images/cruise/freetown-port.jpg" imageAlt="Container ships entering the port of Freetown, Sierra Leone" />
      <div className="container-page py-10">
        <p className="max-w-2xl text-muted">
          Ground transport, timing, and on-shore coordination. Customs facilitation is discussed per
          call, but not guaranteed in this copy.
        </p>
        <Button asChild className="mt-6">
          <Link to="/cruise/quote">Request a quote</Link>
        </Button>
      </div>
    </>
  );
}
