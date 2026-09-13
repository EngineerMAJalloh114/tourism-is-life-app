import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { EnquiryForm } from "@/components/enquiry-form";
import { IMG_HERO } from "@/data/catalog";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/contact/travel")({
  head: () =>
    pageHead(
      "Traveller Enquiry",
      "Planning a trip to Sierra Leone? Send your travel enquiry directly to the Tourism Is Life team.",
      "/contact/travel",
    ),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHero kicker="Travellers" title="B2C enquiry" image={IMG_HERO} imageAlt="Coast" />
      <div className="container-page max-w-xl py-16">
        <EnquiryForm type="B2C" />
      </div>
    </>
  );
}
