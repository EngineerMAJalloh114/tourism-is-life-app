import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { IMG_HERO } from "@/data/catalog";

export const Route = createFileRoute("/coming-soon")({ component: Page });

function Page() {
  return (
    <>
      <PageHero
        kicker="Roadmap"
        title="Coming soon"
        lede="Publicly discussed directions: deeper Guinea and Senegal product, French-language site, eco-lodge partnerships. None of these are live bookable products here."
        image={IMG_HERO}
        imageAlt="Horizon"
      />
      <div className="container-page py-16 text-muted">
        <p>Leave an enquiry if you want notice when a listed programme opens.</p>
      </div>
    </>
  );
}
