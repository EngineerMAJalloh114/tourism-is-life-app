import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { articles, IMG_CRUISE } from "@/data/catalog";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/cruise/case-studies")({
  head: () =>
    pageHead(
      "Cruise Case Studies",
      "Journal coverage of cruise shore programmes Tourism Is Life has handled in Freetown and along the Sierra Leone coast.",
      "/cruise/case-studies",
    ),
  component: Page,
});

function Page() {
  const cases = articles.filter((a) => a.category === "case-studies");
  return (
    <>
      <PageHero
        kicker="Cruise"
        title="Case studies"
        lede="Only public journal titles are listed. Detailed cruise case studies: [CONTENT REQUIRED]."
        image={IMG_CRUISE}
        imageAlt="Ship"
      />
      <div className="container-page py-16">
        <ul className="space-y-3">
          {cases.map((a) => (
            <li key={a.slug}>
              <Link to="/journal/$slug" params={{ slug: a.slug }} className="text-heading hover:text-gold-ink">
                {a.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
