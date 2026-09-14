import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { EnquiryForm } from "@/components/enquiry-form";
import { IMG_FOREST } from "@/data/catalog";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/partner")({
  head: () =>
    pageHead(
      "Become a Partner",
      "Ground handling in Sierra Leone for tour operators, covering Freetown day programmes and Mano River Triangle overlands.",
      "/partner",
    ),
  component: Partner,
});

function Partner() {
  return (
    <>
      <PageHero
        kicker="B2B"
        title="Your reliable DMC partner in Sierra Leone & West Africa"
        lede="Ground handling for tour operators, from Freetown days to Mano River overlands."
        image={IMG_FOREST}
        imageAlt="Landscape"
      />
      <div className="container-page grid gap-12 py-16 lg:grid-cols-2">
        <div className="space-y-4 text-sm leading-relaxed">
          <p>
            Tourism Is Life Tours is a Freetown DMC. The CEO has publicly described the firm as a
            member partner of 1 DCM World, a network of destination companies.
          </p>
          <p>
            Operators listed on the public journal include Oasis Overland and KE Adventure programmes.
            Detailed commercial case studies remain [CONTENT REQUIRED] beyond those titles.
          </p>
          <ul className="list-disc pl-5">
            <li>Sierra Leone circuits plus Guinea and Liberia on request</li>
            <li>Cruise and MICE desks</li>
            <li>Manifest and group logistics</li>
          </ul>
          <p>
            <Link to="/brochure" className="underline decoration-gold underline-offset-4">
              Read the full DMC brochure
            </Link>{" "}
            for the complete circuit and shore excursion catalogue.
          </p>
        </div>
        <EnquiryForm type="B2B" />
      </div>
    </>
  );
}
