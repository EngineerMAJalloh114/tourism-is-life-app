import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { IMG_FOREST } from "@/data/catalog";

export const Route = createFileRoute("/about/sustainability")({ component: Page });

function Page() {
  return (
    <>
      <PageHero
        kicker="Stewardship"
        title="Sustainability"
        lede="Eco-tourism is part of how the company talks about Sierra Leone. Formal certifications are not listed here."
        image={IMG_FOREST}
        imageAlt="Rainforest"
      />
      <div className="container-page max-w-2xl py-16 text-sm leading-relaxed text-muted">
        <p>
          Public interviews emphasise community guiding (including Bassie’s work) and nature sites
          such as Tacugama, Tiwai, and Gola. Specific audit certificates, carbon claims, and fleet
          emissions data: [CONTENT REQUIRED].
        </p>
      </div>
    </>
  );
}
