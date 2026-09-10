import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getArticle } from "@/data/catalog";
import { JsonLd } from "@/components/json-ld";
import { articleJsonLd, pageHead } from "@/lib/seo";

export const Route = createFileRoute("/journal/$category/$slug")({
  head: ({ params }) => {
    const article = getArticle(params.slug);
    return pageHead(
      article?.title ?? "Journal",
      article?.excerpt ?? "Tourism Is Life journal.",
      `/journal/${params.category}/${params.slug}`,
    );
  },
  component: NestedArticle,
});

function NestedArticle() {
  const { category, slug } = Route.useParams();
  const article = getArticle(slug);
  if (!article || article.category !== category) throw notFound();
  return (
    <article className="container-page max-w-3xl py-16">
      <JsonLd data={articleJsonLd(article)} />
      <p className="text-sm text-muted">
        <Link to="/journal">Journal</Link> /{" "}
        <Link to="/journal/category/$category" params={{ category: article.category }}>
          {article.categoryLabel}
        </Link>
      </p>
      <h1 className="mt-3 font-display text-4xl text-brand">{article.title}</h1>
      <p className="mt-2 text-sm text-muted">{article.date}</p>
      <img src={article.image} alt={article.imageAlt} className="mt-8 w-full rounded-lg object-cover" />
      {article.body.split("\n\n").map((p) => (
        <p key={p.slice(0, 24)} className="mt-5 leading-relaxed">
          {p}
        </p>
      ))}
    </article>
  );
}
