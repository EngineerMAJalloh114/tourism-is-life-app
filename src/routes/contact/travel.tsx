import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { EnquiryForm } from "@/components/enquiry-form";
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
      <PageHero kicker="Travellers" title="B2C enquiry" image="/images/beaches/river-number-two-beach.jpg" imageAlt="A wooden canoe marked 'No 2 River' on the sand at River Number Two Beach" />
      <div className="container-page max-w-xl py-10">
        <EnquiryForm type="B2C" />
      </div>
    </>
  );
}
