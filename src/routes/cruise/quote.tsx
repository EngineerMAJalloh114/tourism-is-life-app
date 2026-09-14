import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { EnquiryForm } from "@/components/enquiry-form";
import { IMG_CRUISE } from "@/data/catalog";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/cruise/quote")({
  head: () =>
    pageHead(
      "Cruise Quote Request",
      "Request a shore excursion quote for your ship's Freetown call. Send the ship name, arrival time, and passenger count.",
      "/cruise/quote",
    ),
  component: Page,
});

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
