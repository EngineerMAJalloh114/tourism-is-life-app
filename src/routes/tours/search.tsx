import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TourCard } from "@/components/tour-card";
import { PageHero } from "@/components/page-hero";
import { IMG_HERO, tours, type Difficulty, type TourCategory } from "@/data/catalog";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/lib/seo";

type Search = { q?: string; category?: TourCategory };

export const Route = createFileRoute("/tours/search")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    category: typeof s.category === "string" ? (s.category as TourCategory) : undefined,
  }),
  head: () => pageHead("Search tours", "Filter Sierra Leone and West Africa tours.", "/tours/search"),
  component: SearchPage,
});

function SearchPage() {
  const initial = Route.useSearch();
  const [q, setQ] = useState(initial.q ?? "");
  const [category, setCategory] = useState<TourCategory | "all">(initial.category ?? "all");
  const [circuit, setCircuit] = useState("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [bookable, setBookable] = useState<"all" | "yes" | "quote">("all");
  const [sort, setSort] = useState<"featured" | "duration" | "name">("featured");

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = tours.filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      if (circuit !== "all" && t.circuit !== circuit) return false;
      if (difficulty !== "all" && t.difficulty !== difficulty) return false;
      if (bookable === "yes" && !t.bookable) return false;
      if (bookable === "quote" && t.bookable) return false;
      if (!needle) return true;
      return (
        t.title.toLowerCase().includes(needle) ||
        t.summary.toLowerCase().includes(needle) ||
        t.destinationSlug.includes(needle)
      );
    });
    return [...list].sort((a, b) => {
      if (sort === "duration") return a.durationDays - b.durationDays;
      if (sort === "name") return a.title.localeCompare(b.title);
      return Number(b.bookable) - Number(a.bookable);
    });
  }, [q, category, circuit, difficulty, bookable, sort]);

  return (
    <>
      <PageHero
        kicker="Search"
        title="Find a tour"
        lede="Filter the published Sierra Leone catalogue. Custom Guinea, Liberia, and multi-country trips remain quote-only."
        image={IMG_HERO}
        imageAlt="Coastal search mood"
      />
      <div className="container-page py-12">
        <div className="grid gap-4 rounded-lg border border-line bg-surface p-4 lg:grid-cols-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Keyword" aria-label="Keyword" />
          <select
            className="min-h-11 rounded-md border border-line bg-page px-3 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value as TourCategory | "all")}
            aria-label="Category"
          >
            <option value="all">All categories</option>
            <option value="wildlife">Wildlife</option>
            <option value="beaches">Beaches</option>
            <option value="culture">Culture</option>
            <option value="adventure">Adventure</option>
          </select>
          <select
            className="min-h-11 rounded-md border border-line bg-page px-3 text-sm"
            value={circuit}
            onChange={(e) => setCircuit(e.target.value)}
            aria-label="Circuit"
          >
            <option value="all">All circuits</option>
            <option value="western-circuit">Western</option>
            <option value="northern-circuit">Northern</option>
            <option value="southern-circuit">Southern</option>
            <option value="eastern-circuit">Eastern</option>
          </select>
          <select
            className="min-h-11 rounded-md border border-line bg-page px-3 text-sm"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty | "all")}
            aria-label="Difficulty"
          >
            <option value="all">Any difficulty</option>
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="challenging">Challenging</option>
          </select>
          <select
            className="min-h-11 rounded-md border border-line bg-page px-3 text-sm"
            value={bookable}
            onChange={(e) => setBookable(e.target.value as "all" | "yes" | "quote")}
            aria-label="Bookability"
          >
            <option value="all">Bookable and quote</option>
            <option value="yes">Self-serve bookable</option>
            <option value="quote">Quote only</option>
          </select>
          <select
            className="min-h-11 rounded-md border border-line bg-page px-3 text-sm"
            value={sort}
            onChange={(e) => setSort(e.target.value as "featured" | "duration" | "name")}
            aria-label="Sort"
          >
            <option value="featured">Featured</option>
            <option value="duration">Duration</option>
            <option value="name">Name</option>
          </select>
        </div>
        <p className="mt-6 text-sm text-muted" aria-live="polite">
          {results.length} result{results.length === 1 ? "" : "s"}
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((t) => (
            <TourCard key={t.slug} tour={t} />
          ))}
        </div>
        {results.length === 0 ? (
          <p className="mt-10 text-muted">Nothing matches those filters. Clear a filter or browse the full catalogue.</p>
        ) : null}
      </div>
    </>
  );
}
