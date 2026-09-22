import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TourCard } from "@/components/tour-card";
import { EnquiryForm } from "@/components/enquiry-form";
import { JsonLd } from "@/components/json-ld";
import { TourFilterBar } from "@/components/tours/tour-filters";
import { EMPTY_FILTERS, filterTours, type TourFilters } from "@/lib/tour-filters";
import { getTour, tours } from "@/data/catalog";
import { organizationJsonLd, pageHead } from "@/lib/seo";

const HERO_IMAGE = "/images/mountains/loma-mountains-hike.jpg";

/** The three itineraries documented in the official Tourism Is Life tour papers. */
const FEATURED_SLUGS = [
  "heart-of-sierra-leone-expedition",
  "sierra-breeze-adventure",
  "taste-of-west-africa",
] as const;

const ENQUIRY_STEPS = [
  {
    title: "Tell us what you have in mind",
    body: "Pick one of the published itineraries or describe the trip you want. Dates, rough group size, and what you care about seeing are enough to start.",
  },
  {
    title: "We check what's actually possible",
    body: "The Freetown desk confirms availability with lodges, guides and boats before quoting anything, so the plan you get back is one we can run.",
  },
  {
    title: "You get a written quote",
    body: "Costs are quoted per trip and per group rather than listed as fixed prices, because accommodation, vehicles and group size all move the number.",
  },
  {
    title: "We handle the ground",
    body: "Once you confirm, we take on guides, transport, entrance fees, accommodation and the airport pickup. Nothing is charged through this website.",
  },
];

export const Route = createFileRoute("/services/tours-excursions")({
  head: () =>
    pageHead(
      "Tours & Excursions",
      "Guided day trips and multi-day expeditions across Sierra Leone and West Africa, planned and run on the ground by a Freetown-based team.",
      "/services/tours-excursions",
    ),
  component: ToursExcursionsPage,
});

function ToursExcursionsPage() {
  const [filters, setFilters] = useState<TourFilters>(EMPTY_FILTERS);
  const visible = useMemo(() => filterTours(tours, filters), [filters]);
  const featured = FEATURED_SLUGS.map((slug) => getTour(slug)).filter(
    (tour): tour is NonNullable<ReturnType<typeof getTour>> => Boolean(tour),
  );

  return (
    <>
      <JsonLd data={organizationJsonLd()} />

      <section className="relative isolate min-h-[68vh] overflow-hidden bg-brand-dark text-ivory">
        <img
          src={HERO_IMAGE}
          alt="A guide crossing a log bridge on a forest trail in Sierra Leone"
          className="absolute inset-0 size-full object-cover object-[center_45%] opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/70 to-brand-dark/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-transparent" />
        <div className="container-page relative flex min-h-[68vh] flex-col justify-end pb-16 pt-28">
          <p className="text-xs uppercase tracking-[0.28em] text-gold">Services</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.05] sm:text-6xl">
            Tours &amp; Excursions
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-ivory/85">
            Half-day city tours, island crossings, rainforest walks and multi-week overland routes.
            Every itinerary here is one we run ourselves, with local guides and transport arranged
            from the Freetown desk.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/contact">Send an enquiry</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-ivory/40 text-ivory hover:bg-ivory/10"
            >
              <a href="#all-tours">Browse the catalogue</a>
            </Button>
          </div>
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="container-page py-16">
          <p className="text-xs uppercase tracking-[0.22em] text-gold-ink">Signature itineraries</p>
          <h2 className="mt-2 max-w-2xl font-display text-3xl text-brand sm:text-4xl">
            Three routes we plan end to end
          </h2>
          <p className="mt-3 max-w-2xl text-muted">
            Documented day by day, from the airport pickup to the final departure, with what is
            included and what is not set out in writing before anyone travels.
          </p>

          <div className="mt-10 flex flex-col gap-8">
            {featured.map((tour, index) => (
              <article
                key={tour.slug}
                className="grid gap-6 overflow-hidden rounded-lg border border-line bg-surface md:grid-cols-[minmax(0,22rem)_1fr]"
              >
                <Link
                  to="/tours/$slug"
                  params={{ slug: tour.slug }}
                  className="relative block aspect-[4/3] overflow-hidden md:aspect-auto"
                >
                  <img
                    src={tour.image}
                    alt={tour.imageAlt}
                    loading={index === 0 ? "eager" : "lazy"}
                    className="size-full object-cover transition duration-700 hover:scale-105"
                  />
                </Link>
                <div className="flex flex-col p-6 md:py-8 md:pr-8">
                  <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5" aria-hidden /> {tour.duration}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5" aria-hidden />
                      {tour.country === "west-africa" ? "West Africa" : "Sierra Leone"}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-2xl text-brand sm:text-3xl">
                    <Link to="/tours/$slug" params={{ slug: tour.slug }} className="hover:text-gold-ink">
                      {tour.title}
                    </Link>
                  </h3>
                  <p className="mt-3 leading-relaxed text-ink/80">{tour.summary}</p>
                  <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
                    {tour.highlights.slice(0, 3).map((highlight) => (
                      <li key={highlight} className="flex gap-2">
                        <span className="text-gold-ink" aria-hidden>
                          •
                        </span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button asChild>
                      <Link to="/tours/$slug" params={{ slug: tour.slug }}>
                        See the full itinerary <ArrowRight className="size-4" aria-hidden />
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link to="/contact">Ask about this trip</Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section id="all-tours" className="scroll-mt-24 border-t border-line bg-surface py-16">
        <div className="container-page">
          <p className="text-xs uppercase tracking-[0.22em] text-gold-ink">The catalogue</p>
          <h2 className="mt-2 font-display text-3xl text-brand sm:text-4xl">Find a tour</h2>
          <p className="mt-3 max-w-2xl text-muted">
            Filter by what you want to do and how long you have. Prices are quoted per trip, so every
            tour here leads to a written quote rather than an online checkout.
          </p>

          <div className="mt-8">
            <TourFilterBar filters={filters} onChange={setFilters} resultCount={visible.length} />
          </div>

          {visible.length > 0 ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((tour) => (
                <TourCard key={tour.slug} tour={tour} />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-lg border border-line bg-ivory p-8 text-center">
              <p className="font-display text-2xl text-brand">Nothing matches that combination</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                Try a different length or experience, or clear the filters. If what you want is not
                in the catalogue, the desk still plans custom itineraries.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Button type="button" variant="outline" onClick={() => setFilters(EMPTY_FILTERS)}>
                  Clear filters
                </Button>
                <Button asChild>
                  <Link to="/contact">Request a custom trip</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="container-page py-16">
        <p className="text-xs uppercase tracking-[0.22em] text-gold-ink">How it works</p>
        <h2 className="mt-2 max-w-2xl font-display text-3xl text-brand sm:text-4xl">
          From first message to landing in Freetown
        </h2>
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ENQUIRY_STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3">
              <span className="font-display text-4xl text-gold-ink">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="font-display text-xl text-brand">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-line bg-surface py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_minmax(0,28rem)]">
          <div>
            <h2 className="font-display text-3xl text-brand sm:text-4xl">Plan your trip</h2>
            <p className="mt-3 max-w-xl leading-relaxed text-muted">
              Tell us roughly when you want to travel and what you would like to see. The Freetown
              desk replies within 24 hours, and a person reads every message.
            </p>
            <dl className="mt-8 flex flex-col gap-4 text-sm">
              <div>
                <dt className="font-medium text-brand">Custom itineraries</dt>
                <dd className="mt-1 text-muted">
                  Published tours are a starting point. Routes get rebuilt around your dates, pace
                  and interests.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-brand">Groups and operators</dt>
                <dd className="mt-1 text-muted">
                  The same circuits run for tour operators and private groups, quoted per group.
                </dd>
              </div>
            </dl>
          </div>
          <EnquiryForm type="B2C" contextLabel="Tours & Excursions" />
        </div>
      </section>
    </>
  );
}
