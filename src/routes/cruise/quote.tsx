import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { EnquiryForm } from "@/components/enquiry-form";
import { IMG_CRUISE } from "@/data/catalog";

export const Route = createFileRoute("/cruise/quote")({ component: Page });

function Page() {
  return (
    <>
      <PageHero kicker="Cruise" title="Quote request" image={IMG_CRUISE} imageAlt="Ship" />
      <div className="container-page max-w-xl py-16">
        <EnquiryForm type="CRUISE" />
      </div>
    </>
  );
}
