import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { IMG_FOREST } from "@/data/catalog";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/about/why-us")({
  head: () =>
    pageHead(
      "Why Travel With Us",
      "A Freetown-based, founder-led DMC with published circuits across Sierra Leone and dedicated cruise and group-handling desks.",
      "/about/why-us",
    ),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHero kicker="Trust" title="Why travel with us" image={IMG_FOREST} imageAlt="Landscape" />
      <div className="container-page max-w-2xl py-16">
        <ul className="list-disc space-y-3 pl-5 text-muted">
          <li>Freetown-based, founder-led DMC.</li>
          <li>Published circuits covering east, north, south, and west Sierra Leone.</li>
          <li>Cruise and group handling on a dedicated public page.</li>
          <li>1 DCM World membership as stated by the CEO in Travel And Tour World (2024).</li>
        </ul>
        <Button asChild className="mt-8">
          <Link to="/contact">Plan your journey</Link>
        </Button>
      </div>
    </>
  );
}
