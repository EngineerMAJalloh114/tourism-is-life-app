import { createFileRoute, notFound } from "@tanstack/react-router";
import { getService, IMG_MICE } from "@/data/catalog";
import { PageHero } from "@/components/page-hero";
import { EnquiryForm } from "@/components/enquiry-form";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/services/$slug")({
  head: ({ params }) => {
    const service = getService(params.slug);
    if (!service) return pageHead("Service", "", "/services");
    return pageHead(service.name, service.summary, `/services/${service.slug}`);
  },
  component: ServicePage,
});

function ServicePage() {
  const { slug } = Route.useParams();
  const service = getService(slug);
  if (!service) throw notFound();
  const type = slug === "mice" ? "MICE" : "B2C";
  return (
    <>
      <PageHero kicker="Service" title={service.name} lede={service.summary} image={IMG_MICE} imageAlt="" />
      <div className="container-page grid gap-10 py-16 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl text-heading">Benefits</h2>
          <ul className="mt-3 list-disc pl-5 text-sm">
            {service.benefits.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <h2 className="mt-8 font-display text-2xl text-heading">Process</h2>
          <ol className="mt-3 list-decimal pl-5 text-sm">
            {service.process.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ol>
        </div>
        <EnquiryForm type={type} contextLabel={service.name} />
      </div>
    </>
  );
}
