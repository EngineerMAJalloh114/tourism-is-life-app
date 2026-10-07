import { createFileRoute, Link } from "@tanstack/react-router";
import { articleCategories, articles } from "@/data/catalog";
import { PageHero } from "@/components/page-hero";
import { CompactStoryCard } from "@/components/cards/compact-story-card";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/journal/")({
  head: () => pageHead("Journal", "Notes from the public Tourism Is Life log.", "/journal"),
  component: Journal,
});

function Journal() {
  return (
    <>
      <PageHero
        kicker="Journal"
        title="From the public log"
        lede="Titles and dates taken from tourismislife.com. Bodies are conservative summaries, not invented reportage."
        image="/images/culture/makeni-sunset.jpg"
        imageAlt="Sunset over Makeni in northern Sierra Leone"
      />
      <div className="container-page py-10">
        <div className="flex flex-wrap gap-2">
          {articleCategories.map((c) => (
            <Link
              key={c.slug}
              to="/journal/category/$category"
              params={{ category: c.slug }}
              className="glass-btn glass-btn-tint rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-gold"
            >
              {c.label}
            </Link>
          ))}
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {articles.map((a) => (
            <Link key={a.slug} to="/journal/$category/$slug" params={{ category: a.category, slug: a.slug }}>
              <CompactStoryCard
                image={a.image}
                imageAlt={a.imageAlt}
                eyebrow={`${a.categoryLabel} · ${a.date}`}
                title={a.title}
                excerpt={a.excerpt}
              />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
