import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { pageHead } from "@/lib/seo";
import { ENQUIRY_TEAM_EMAILS, SITE } from "@/lib/site";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageHead(
      "Privacy policy",
      "What personal information Tourism Is Life collects through this website, why, who receives it, and how to ask for it to be corrected or deleted.",
      "/privacy",
    ),
  component: Page,
});

function Page() {
  return (
    <LegalPage
      title="Privacy policy"
      lede="What we collect when you use this website, why we collect it, and what you can ask us to do with it."
    >
      <LegalSection heading="Who we are">
        <p>
          This website is run by {SITE.legalName}, {SITE.address}. If you have a question about your
          information, write to{" "}
          <a href={SITE.emailHref} className="underline hover:text-heading">
            {SITE.email}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="What we collect and why">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="text-heading">Enquiries.</span> When you send an enquiry we collect what
            you type into the form: your name, email address, phone number if you give one, the
            details of the trip you are asking about, and your message. We use it to reply and to
            prepare a quote.
          </li>
          <li>
            <span className="text-heading">Newsletter.</span> If you subscribe we store your email
            address and the page you signed up from, so we can send you the newsletter.
          </li>
          <li>
            <span className="text-heading">Accounts.</span> If you create an account we store your
            email address, your name, and your password in hashed form, plus anything you save in
            the account, such as saved tours.
          </li>
          <li>
            <span className="text-heading">Technical data.</span> Our web host records standard
            technical information when a page is requested, such as your IP address and browser type,
            to keep the site running and secure.
          </li>
        </ul>
        <p>We do not run advertising or analytics tools on this website.</p>
      </LegalSection>

      <LegalSection heading="Who receives your information">
        <p>
          Enquiry notifications are sent by email to {ENQUIRY_TEAM_EMAILS.join(" and ")}. The first is
          the Tourism Is Life desk; the second is a contact we have chosen to receive them as well.
        </p>
        <p>We use these services to run the website, and they process information on our behalf:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Vercel, which hosts the website.</li>
          <li>Neon, which hosts the database where enquiries, subscribers and accounts are stored.</li>
          <li>Resend, which delivers our emails.</li>
          <li>Twilio, which sends text messages, only if we need to text you about your enquiry.</li>
        </ul>
        <p>
          Two other services receive your IP address when a page loads them: Google Fonts, which serves
          the fonts, and OpenStreetMap, which provides the map on some tour pages. We do not sell your
          information.
        </p>
        <p>
          Some of these providers may process information outside Sierra Leone, so your information may
          be transferred to other countries.
        </p>
      </LegalSection>

      <LegalSection heading="Cookies and browser storage">
        <p>
          The website stores a small amount of information in your browser. See our{" "}
          <Link to="/cookies" className="underline hover:text-heading">
            cookies page
          </Link>{" "}
          for the details.
        </p>
      </LegalSection>

      <LegalSection heading="How long we keep it">
        <p>
          We keep your details for as long as we need them to deal with your enquiry and to keep our
          business records. You can ask us to delete them at any time.
        </p>
      </LegalSection>

      <LegalSection heading="Your choices">
        <p>
          Depending on where you live, you may have legal rights over your personal information. In any
          case you can ask us to tell you what we hold about you, correct it, delete it, or stop
          contacting you. Email{" "}
          <a href={SITE.emailHref} className="underline hover:text-heading">
            {SITE.email}
          </a>{" "}
          and tell us which of these you want. To leave the newsletter, ask us to remove your address.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to this policy">
        <p>
          If we change how we handle your information we will update this page and the date at the top.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
