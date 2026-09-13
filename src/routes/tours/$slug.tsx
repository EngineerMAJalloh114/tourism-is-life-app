import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getDestination, getTour, relatedTours } from "@/data/catalog";
import { TourCard } from "@/components/tour-card";
import { Button } from "@/components/ui/button";
import { EnquiryForm } from "@/components/enquiry-form";
import { Breadcrumb } from "@/components/breadcrumb";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd, pageHead, tourJsonLd } from "@/lib/seo";
import { isTourSaved, listApprovedReviews, toggleSavedTour } from "@/lib/server/ops";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/tours/$slug")({
  head: ({ params }) => {
    const tour = getTour(params.slug);
    return pageHead(tour?.title ?? "Tour", tour?.summary ?? "Sierra Leone tour.", `/tours/${params.slug}`);
  },
  component: TourDetail,
});

function TourDetail() {
  const { slug } = Route.useParams();
  const { user } = useCurrentUserState();
  const [saved, setSaved] = useState(false);
  const [reviews, setReviews] = useState<Awaited<ReturnType<typeof listApprovedReviews>>>([]);
  const tour = getTour(slug);

  useEffect(() => {
    void isTourSaved({ data: { slug } })
      .then((r) => setSaved(r.saved))
      .catch(() => setSaved(false));
    void listApprovedReviews({ data: { slug } })
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [slug]);

  if (!tour) throw notFound();
  const related = relatedTours(tour);
  const dest = getDestination(tour.destinationSlug);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Tours", path: "/tours" },
            { name: tour.title, path: `/tours/${tour.slug}` },
          ]),
          tourJsonLd(tour),
        ]}
      />
      <section className="relative isolate min-h-[52vh] bg-brand-dark text-ivory">
        <img src={tour.image} alt={tour.imageAlt} className="absolute inset-0 size-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark" />
        <div className="container-page relative pb-12 pt-24">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Tours", href: "/tours" },
              { label: tour.title },
            ]}
          />
          <h1 className="mt-4 max-w-3xl font-display text-4xl sm:text-6xl">{tour.title}</h1>
          <p className="mt-3 text-ivory/80">
            {tour.duration} · {tour.difficulty} · {tour.languages.join(", ")}
            {tour.reviewCount ? ` · ${tour.rating} / 5 (${tour.reviewCount} reviews on the public catalogue)` : ""}
          </p>
        </div>
      </section>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_20rem]">
        <article>
          <p className="text-lg leading-relaxed">{tour.summary}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 text-sm">
            <li>
              <strong>Duration:</strong> {tour.duration}
            </li>
            <li>
              <strong>Group:</strong> {tour.groupMin}–{tour.groupMax}
            </li>
            <li>
              <strong>Difficulty:</strong> {tour.difficulty}
            </li>
            <li>
              <strong>Languages:</strong> {tour.languages.join(", ")}
            </li>
          </ul>
          <h2 className="mt-10 font-display text-3xl text-brand">Highlights</h2>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
            {tour.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <h2 className="mt-10 font-display text-3xl text-brand">Itinerary</h2>
          <ol className="mt-4 space-y-4">
            {tour.itinerary.map((d) => (
              <li key={d.day} className="rounded-md border border-line bg-surface p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-gold-ink">Day {d.day}</p>
                <h3 className="mt-1 font-display text-xl text-brand">{d.title}</h3>
                <p className="mt-1 text-sm text-muted">{d.description}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl text-brand">Inclusions</h2>
              <ul className="mt-3 list-disc pl-5 text-sm">
                {tour.inclusions.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-display text-2xl text-brand">Exclusions</h2>
              <ul className="mt-3 list-disc pl-5 text-sm">
                {tour.exclusions.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
          <h2 className="mt-10 font-display text-3xl text-brand">Practicalities</h2>
          <p className="mt-3 text-sm">
            <strong>Meeting point:</strong> {tour.meetingPoint}
          </p>
          <p className="mt-2 text-sm">
            <strong>Requirements:</strong> {tour.requirements}
          </p>
          {dest ? (
            <p className="mt-2 text-sm">
              <strong>Destination:</strong>{" "}
              <Link
                to="/destinations/$circuit/$slug"
                params={{ circuit: dest.circuit, slug: dest.slug }}
                className="text-brand hover:text-gold"
              >
                {dest.name}
              </Link>
            </p>
          ) : null}
          <div className="mt-8 overflow-hidden rounded-md border border-line">
            <iframe
              title="Freetown, Sierra Leone"
              className="h-64 w-full"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-13.35,8.35,-13.1,8.55&layer=mapnik"
            />
            <p className="bg-surface px-3 py-2 text-xs text-muted">
              Map centres on Freetown for orientation. Exact pickup is on the voucher.
            </p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {tour.gallery.map((g) => (
              <img key={g.src + g.alt} src={g.src} alt={g.alt} className="h-52 w-full rounded-md object-cover" />
            ))}
          </div>
          <h2 className="mt-10 font-display text-3xl text-brand">Reviews</h2>
          <p className="mt-2 text-sm text-muted">
            Catalogue ratings come from the public website. Guest reviews appear only after moderation.
          </p>
          <ul className="mt-4 space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-md border border-line bg-surface p-4 text-sm">
                <p className="font-medium">{r.rating}/5</p>
                <p className="mt-1">{r.body}</p>
              </li>
            ))}
            {reviews.length === 0 ? <li className="text-sm text-muted">No moderated reviews yet.</li> : null}
          </ul>
          <h2 className="mt-10 font-display text-3xl text-brand">FAQs</h2>
          <div className="mt-4 space-y-3">
            {tour.faqs.map((f) => (
              <details key={f.q} className="rounded-md border border-line bg-surface p-4">
                <summary className="cursor-pointer font-medium">{f.q}</summary>
                <p className="mt-2 text-sm text-muted">{f.a}</p>
              </details>
            ))}
          </div>
          {!tour.bookable ? (
            <div className="mt-12">
              <h2 className="font-display text-3xl text-brand">Request a quote</h2>
              <EnquiryForm type="B2C" contextLabel={tour.title} />
            </div>
          ) : null}
          <h2 className="mt-12 font-display text-3xl text-brand">Related tours</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {related.map((t) => (
              <TourCard key={t.slug} tour={t} />
            ))}
          </div>
        </article>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-lg border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">From</p>
            <p className="mt-1 font-display text-2xl text-brand">
              {tour.bookable ? "Quote on request" : "Custom / quote"}
            </p>
            <p className="mt-2 text-sm text-muted">No public prices. Confirm in writing before payment.</p>
            {tour.bookable ? (
              <Button asChild className="mt-5 w-full">
                <Link to="/booking/$slug" params={{ slug: tour.slug }}>
                  Select dates
                </Link>
              </Button>
            ) : (
              <Button asChild variant="dark" className="mt-5 w-full">
                <Link to="/contact">Request a quote</Link>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="mt-2 w-full"
              onClick={async () => {
                if (!user) {
                  window.location.href = "/login";
                  return;
                }
                const r = await toggleSavedTour({ data: { slug: tour.slug } });
                setSaved(r.saved);
              }}
            >
              {saved ? "Saved" : "Save tour"}
            </Button>
          </div>
        </aside>
      </div>

      {tour.bookable ? (
        <div className="sticky bottom-0 z-30 border-t border-line bg-ivory/95 p-3 lg:hidden">
          <Button asChild className="w-full">
            <Link to="/booking/$slug" params={{ slug: tour.slug }}>
              Select dates
            </Link>
          </Button>
        </div>
      ) : null}
    </>
  );
}
