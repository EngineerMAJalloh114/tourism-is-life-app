import { createFileRoute, Link } from "@tanstack/react-router";
import { articleCategories, articles, IMG_FOREST } from "@/data/catalog";
import { PageHero } from "@/components/page-hero";
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
        image={IMG_FOREST}
        imageAlt="Forest"
      />
      <div className="container-page py-16">
        <div className="flex flex-wrap gap-2">
          {articleCategories.map((c) => (
            <Link
              key={c.slug}
              to="/journal/category/$category"
              params={{ category: c.slug }}
              className="rounded-full border border-line px-4 py-2 text-sm hover:border-gold"
            >
              {c.label}
            </Link>
          ))}
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {articles.map((a) => (
            <Link key={a.slug} to="/journal/$category/$slug" params={{ category: a.category, slug: a.slug }} className="block">
              <img src={a.image} alt={a.imageAlt} className="aspect-[16/9] w-full rounded-md object-cover" />
              <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-muted">
                {a.categoryLabel} · {a.date}
              </p>
              <h2 className="mt-1 font-display text-3xl text-brand">{a.title}</h2>
              <p className="mt-2 text-sm text-muted">{a.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
