import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";

export const Route = createFileRoute("/coming-soon")({ component: Page });

function Page() {
  return (
    <>
      <PageHero
        kicker="Roadmap"
        title="Coming soon"
        lede="Publicly discussed directions: deeper Guinea and Senegal product, French-language site, eco-lodge partnerships. None of these are live bookable products here."
        image="/images/culture/makeni-sunset.jpg"
        imageAlt="Sunset over Makeni in northern Sierra Leone"
      />
      <div className="container-page py-10 text-muted">
        <p>Leave an enquiry if you want notice when a listed programme opens.</p>
      </div>
    </>
  );
}
