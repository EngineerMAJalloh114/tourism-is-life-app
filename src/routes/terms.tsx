import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { pageHead } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/terms")({
  head: () =>
    pageHead(
      "Terms of use",
      "The terms for using the Tourism Is Life website, and how enquiries, quotes and bookings work.",
      "/terms",
    ),
  component: Page,
});

function Page() {
  return (
    <LegalPage
      title="Terms of use"
      lede="The terms for using this website, and how an enquiry becomes a booking."
    >
      <LegalSection heading="About this website">
        <p>
          This website is run by {SITE.legalName}, {SITE.address}. By using it you agree to these terms.
          If you do not agree, please do not use it.
        </p>
      </LegalSection>

      <LegalSection heading="Information, not offers">
        <p>
          Tours, itineraries, places and services described here are a guide. Nothing on this website is
          a binding offer. Availability, itineraries and prices are confirmed in writing, and this
          website does not publish prices.
        </p>
        <p>
          We take care to keep the information accurate, but it can change, and some of it comes from
          public sources. Please confirm anything that matters to your plans with us before you rely on
          it.
        </p>
      </LegalSection>

      <LegalSection heading="Enquiries, quotes and bookings">
        <p>
          Sending an enquiry does not make a booking. A booking exists only when you accept a written
          quote from us. Payment and cancellation terms for your trip are the ones stated in that
          written quote. This website does not take online payments.
        </p>
      </LegalSection>

      <LegalSection heading="Travel and your responsibilities">
        <p>
          You are responsible for having a valid passport, any visa or entry permission, the health
          requirements for the countries you visit, and travel insurance that suits your trip. We can
          help with invitation letters and practical guidance, but we cannot guarantee a visa.
        </p>
        <p>
          Travel in Sierra Leone, Guinea and Liberia can involve conditions outside anyone&rsquo;s
          control, such as weather, road and river conditions and public health. Programmes may need to
          change for safety or availability.
        </p>
      </LegalSection>

      <LegalSection heading="Our content and images">
        <p>
          The text and design of this website belong to {SITE.legalName}. Many photographs are published
          by other people under Creative Commons licences; they are credited on our{" "}
          <Link to="/about/image-credits" className="underline hover:text-heading">
            image credits page
          </Link>{" "}
          and remain under those licences. Please do not copy our content for commercial use without
          asking us first.
        </p>
      </LegalSection>

      <LegalSection heading="Links to other websites">
        <p>
          This website links to other sites, such as social media pages and WhatsApp. We do not control
          them and are not responsible for their content or how they treat your information.
        </p>
      </LegalSection>

      <LegalSection heading="Liability">
        <p>
          We provide this website as it is. Nothing in these terms limits any liability that cannot be
          limited by law. Beyond that, we are not responsible for loss that comes from relying on
          information on this website without confirming it with us.
        </p>
      </LegalSection>

      <LegalSection heading="Privacy and cookies">
        <p>
          How we handle your information is set out in our{" "}
          <Link to="/privacy" className="underline hover:text-heading">
            privacy policy
          </Link>{" "}
          and{" "}
          <Link to="/cookies" className="underline hover:text-heading">
            cookies page
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection heading="Changes and contact">
        <p>
          We may update these terms and will change the date at the top when we do. Questions about them
          can go to{" "}
          <a href={SITE.emailHref} className="underline hover:text-heading">
            {SITE.email}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
