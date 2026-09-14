import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/about/")({
  head: () =>
    pageHead(
      "About Tourism Is Life",
      "Tourism Is Life Tours is a Freetown-based DMC planning trips across Sierra Leone's coast, forests, and heritage sites.",
      "/about",
    ),
  component: About,
});

function About() {
  return (
    <>
      <PageHero
        kicker="The company"
        title="Tourism Is Life Tours"
        lede="A Sierra Leone destination management company based on State Avenue, Freetown."
        image="/images/culture/pepper-seller.jpg"
        imageAlt="A market vendor selling peppers, Sierra Leone"
        imagePosition="center 12%"
      />
      <div className="container-page max-w-3xl py-16">
        <p className="text-lg leading-relaxed">
          We help travellers and operators explore Sierra Leone’s cultural heritage and landscapes,
          including Freetown, the peninsula, Gola Rainforest, and Mount Bintumani. The public site
          describes the company as a reliable local operator that plans itineraries from on-the-ground
          knowledge.
        </p>
        <p className="mt-4 leading-relaxed text-muted">
          CEO Alieya Alie Kargbo, speaking to Travel And Tour World in 2024, described Tourism Is Life
          Tours as a DMC and a member partner of 1 DCM World. Guide and part-owner Peter Momoh Bassie
          has been featured in AFAR Magazine.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/about/team">Our team</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/about/what-we-offer">What we offer</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
