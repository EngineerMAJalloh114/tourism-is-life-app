import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { EnquiryForm } from "@/components/enquiry-form";
import { IMG_FOREST } from "@/data/catalog";

export const Route = createFileRoute("/contact/partner")({ component: Page });

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
