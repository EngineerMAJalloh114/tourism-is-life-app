import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/cruise/vip-meet-and-greet")({
  head: () =>
    pageHead(
      "VIP Meet & Greet",
      "A port welcome team for cruise VIP guests arriving in Freetown, staffed on request.",
      "/cruise/vip-meet-and-greet",
    ),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHero kicker="Cruise" title="VIP meet & greet" image="/images/culture/kings-gate-freetown.jpg" imageAlt="Aberdeen beach road in Freetown, Sierra Leone" />
      <div className="container-page py-10">
        <p className="max-w-2xl text-muted">Port welcome team on request. Staffing levels confirmed per call.</p>
        <Button asChild className="mt-6">
          <Link to="/cruise/quote">Request a quote</Link>
        </Button>
      </div>
    </>
  );
}
