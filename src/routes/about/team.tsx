import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { IMG_FOREST, team } from "@/data/catalog";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/about/team")({
  head: () =>
    pageHead(
      "Our Team",
      "Meet the guides and staff behind Tourism Is Life Tours, Freetown's Sierra Leone destination management company.",
      "/about/team",
    ),
  component: Team,
});

function Team() {
  return (
    <>
      <PageHero
        kicker="People"
        title="Our team"
        lede="Only people named in public sources are listed. Full guide roster: [CONTENT REQUIRED]."
        image={IMG_FOREST}
        imageAlt="Landscape"
      />
      <div className="container-page grid gap-6 py-16 sm:grid-cols-2">
        {team.map((p) => (
          <article key={p.slug} className="rounded-lg border border-line bg-surface p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-gold-ink">{p.role}</p>
            <h2 className="mt-2 font-display text-3xl text-heading">{p.name}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">{p.bio}</p>
          </article>
        ))}
      </div>
    </>
  );
}
