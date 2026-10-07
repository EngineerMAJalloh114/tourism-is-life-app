import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/cookies")({
  head: () =>
    pageHead(
      "Cookies and browser storage",
      "The cookies and browser storage the Tourism Is Life website uses, and what each one is for.",
      "/cookies",
    ),
  component: Page,
});

function Page() {
  return (
    <LegalPage
      title="Cookies and browser storage"
      lede="What this website keeps in your browser, and why."
    >
      <LegalSection heading="What we use">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="text-heading">Sign-in cookie.</span> If you sign in to an account, a
            session cookie keeps you signed in. It is needed for the account to work, and it is not set
            if you never sign in.
          </li>
          <li>
            <span className="text-heading">Display preferences.</span> Your browser&rsquo;s local
            storage holds a small record called <code>til-prefs</code> that remembers choices you make
            on the site, such as the colour theme, so they are still there next time.
          </li>
        </ul>
        <p>
          We do not use advertising cookies, and we do not run analytics or tracking tools on this
          website.
        </p>
      </LegalSection>

      <LegalSection heading="Other services">
        <p>
          Two services load content from their own servers, so they receive your IP address when a page
          uses them and may set their own cookies: Google Fonts, which serves the fonts, and
          OpenStreetMap, which provides the map on some tour pages. Their own policies describe what
          they do.
        </p>
      </LegalSection>

      <LegalSection heading="Managing them">
        <p>
          You can clear cookies and site data in your browser settings at any time. If you do, you will
          be signed out and the site will forget your display choices. For how we handle your personal
          information, see our{" "}
          <Link to="/privacy" className="underline hover:text-heading">
            privacy policy
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
