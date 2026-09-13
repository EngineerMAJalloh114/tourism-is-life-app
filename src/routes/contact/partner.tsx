import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { EnquiryForm } from "@/components/enquiry-form";
import { IMG_FOREST } from "@/data/catalog";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/contact/partner")({
  head: () =>
    pageHead(
      "Partner Enquiry",
      "Tour operators and agencies: send a ground-handling enquiry to Tourism Is Life's Freetown DMC desk.",
      "/contact/partner",
    ),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHero kicker="Operators" title="Partner enquiry" image={IMG_FOREST} imageAlt="Landscape" />
      <div className="container-page max-w-xl py-16">
        <EnquiryForm type="B2B" />
      </div>
    </>
  );
}
