import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { HeroFrame } from "@/components/hero/hero-frame";
import { JsonLd } from "@/components/json-ld";
import { ExperienceExplorer } from "@/components/sustainability/experience-explorer";
import { ImprovementTimeline } from "@/components/sustainability/improvement-timeline";
import { PartnerSection } from "@/components/sustainability/partner-section";
import { PillarExplorer } from "@/components/sustainability/pillar-explorer";
import { PolicySection } from "@/components/sustainability/policy-section";
import { PrinciplesSection } from "@/components/sustainability/principles-section";
import { SectionNav } from "@/components/sustainability/section-nav";
import { SustainabilityHero } from "@/components/sustainability/sustainability-hero";
import { TravelGuide } from "@/components/sustainability/travel-guide";
import { WhySection } from "@/components/sustainability/why-section";
import { Button } from "@/components/ui/button";
import { SECTION_NAV, type ExperienceFilter, type PillarId } from "@/data/sustainability";
import { breadcrumbJsonLd, pageHead } from "@/lib/seo";

export const Route = createFileRoute("/about/sustainability")({
  head: () =>
    pageHead(
      "Sustainability",
      "How Tourism Is Life approaches responsible tourism in Sierra Leone and West Africa: local communities, wildlife, culture and sustainable travel.",
      "/about/sustainability",
    ),
  component: Page,
});

function Page() {
  // Shared so the hero cards can open a pillar, and each pillar's CTA can
  // open the matching experience filter.
  const [pillar, setPillar] = useState<PillarId>("environment");
  const [filter, setFilter] = useState<ExperienceFilter>("all");

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
          { name: "Sustainability", path: "/about/sustainability" },
        ])}
      />
      <SustainabilityHero onSelectPillar={setPillar} />
      <SectionNav items={SECTION_NAV} label="Sustainability page sections" />
      <WhySection />
      <PillarExplorer active={pillar} onActiveChange={setPillar} onSeeExperiences={setFilter} />
      <ExperienceExplorer filter={filter} onFilterChange={setFilter} />
      <TravelGuide />
      <PartnerSection />
      <PrinciplesSection />
      <ImprovementTimeline />
      <PolicySection />

      <div className="mt-10">
        <HeroFrame
          media={[
            {
              kind: "image",
              src: "/images/beaches/river-number-two-beach.jpg",
              alt: "A painted wooden boat on the white sand at River Number Two beach, Sierra Leone, with forested hills behind",
              position: "center 78%",
            },
          ]}
          height="tall"
          contentClassName="py-16 sm:py-20"
        >
          <h2 className="max-w-3xl font-display text-4xl sm:text-5xl lg:text-6xl">
            Travel With Purpose. Discover With Meaning.
          </h2>
          <p className="mt-5 max-w-2xl text-base text-ivory/85 sm:text-lg">
            Explore Sierra Leone and West Africa through meaningful experiences shaped by local knowledge,
            culture, nature and responsible travel.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/tours">Explore Experiences</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link to="/contact">Plan Your Journey</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link to="/contact/partner">Talk to Our DMC Team</Link>
            </Button>
          </div>
        </HeroFrame>
      </div>
    </>
  );
}
