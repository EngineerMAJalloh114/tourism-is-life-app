import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { TeamOrbitCarousel } from "@/components/team/team-orbit-carousel";
import { team } from "@/data/catalog";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/about/team")({
  head: () =>
    pageHead(
      "Our Team",
      "Meet the guides and staff behind Tourism Is Life Tours, Freetown's Sierra Leone destination management company.",
      "/about/team",
    ),
  component: Team,
});

function Team() {
  return (
    <>
      <PageHero
        kicker="People"
        title="Our team"
        lede="The people named in public sources are listed here."
        image="/images/cities/freetown-street.jpg"
        imageAlt="A street scene in Freetown, where the Tourism Is Life team is based"
      />
      <div className="container-page py-10">
        <TeamOrbitCarousel members={team} />
      </div>
    </>
  );
}
