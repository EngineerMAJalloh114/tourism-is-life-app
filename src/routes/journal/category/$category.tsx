import { createFileRoute, Link } from "@tanstack/react-router";
import { articleCategories, articlesForCategory } from "@/data/catalog";
import { PageHero } from "@/components/page-hero";
import { IMG_FOREST } from "@/data/catalog";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/journal/category/$category")({
  head: ({ params }) =>
    pageHead(
      articleCategories.find((c) => c.slug === params.category)?.label ?? "Journal",
      "Tourism Is Life journal.",
      `/journal/category/${params.category}`,
    ),
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useParams();
  const meta = articleCategories.find((c) => c.slug === category);
  const list = articlesForCategory(category);
  return (
    <>
      <PageHero
        kicker="Journal"
        title={meta?.label ?? "Category"}
        lede="Only verified public posts are listed. Empty categories are waiting on Tourism Is Life copy."
        image={IMG_FOREST}
        imageAlt="Forest"
      />
      <div className="container-page py-12">
        {list.map((a) => (
          <Link key={a.slug} to="/journal/$slug" params={{ slug: a.slug }} className="mb-8 block">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">{a.date}</p>
            <h2 className="mt-1 font-display text-3xl text-heading">{a.title}</h2>
            <p className="mt-2 text-sm text-muted">{a.excerpt}</p>
          </Link>
        ))}
        {list.length === 0 ? <p className="text-muted">No published pieces in this category yet.</p> : null}
      </div>
    </>
  );
}
