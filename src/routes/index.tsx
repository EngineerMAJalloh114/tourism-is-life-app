import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Compass, Leaf, MapPin, Search, Shield, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { CompactStoryCard } from "@/components/cards/compact-story-card";
import { LayeredTravelCarousel, type TravelCarouselItem } from "@/components/carousel/layered-travel-carousel";
import { CircuitShowcase, type CircuitShowcaseItem } from "@/components/carousel/circuit-showcase";
import { StackedCardCarousel, type StackedCardItem } from "@/components/carousel/stacked-card-carousel";
import { HomeHero } from "@/components/hero/home-hero";
import { Button } from "@/components/ui/button";
import { NewsletterForm } from "@/components/newsletter-form";
import { JsonLd } from "@/components/json-ld";
import { organizationJsonLd, pageHead, websiteJsonLd } from "@/lib/seo";
import {
  articles,
  circuits,
  destinations,
  IMG_CRUISE,
  IMG_FOREST,
  IMG_WILDLIFE,
  services,
  testimonial,
  tours,
} from "@/data/catalog";

const pillCell =
  "flex min-h-12 min-w-0 cursor-pointer items-center gap-2.5 rounded-full px-3.5 py-1.5 transition-colors duration-200 hover:bg-ivory/10 focus-within:bg-ivory/10 focus-within:outline-2 focus-within:outline-gold motion-reduce:transition-none lg:px-4";
const pillLabel = "block text-[10px] font-medium uppercase tracking-[0.14em] text-ivory/80";
// Shared by every field so the native controls read on the smoked glass: ivory text,
// a dark colour scheme for the month picker's own icon, and an ink-on-page dropdown list.
const pillField =
  "block w-full bg-transparent text-sm font-medium text-ivory [color-scheme:dark] placeholder:font-normal placeholder:text-ivory/70 focus:outline-none [&_option]:bg-page [&_option]:text-ink";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Tourism Is Life · Discover the Heart of West Africa",
      "Sierra Leone destination management company for tours, cruise shore excursions, and West Africa travel.",
      "/",
    ),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [place, setPlace] = useState("");
  const [when, setWhen] = useState("");
  const [travelers, setTravelers] = useState("2");
  const featured = tours.filter((t) => t.bookable).slice(0, 6);
  const signatures = tours.filter((t) =>
    ["banana-island", "tacugama-chimpanzee-sanctuary", "bintumani-mountain", "gola-rainforest"].includes(t.slug),
  );
  const signatureCarouselItems: TravelCarouselItem[] = signatures.map((t) => ({
    key: t.slug,
    image: t.image,
    imageAlt: t.imageAlt,
    kicker: `${t.category.replace("-", " ")} · ${t.duration}`,
    title: t.title,
    summary: t.summary,
    cta: t.bookable ? "Check availability" : "Request a quote",
    href: `/tours/${t.slug}`,
  }));
  const circuitShowcaseItems: CircuitShowcaseItem[] = circuits.map((c) => ({
    key: c.id,
    image: c.image,
    imageAlt: c.imageAlt,
    region: c.region,
    name: c.name,
    summary: c.summary,
    cta: "Explore this circuit",
    href: `/destinations/${c.id}`,
  }));
  const featuredStackItems: StackedCardItem[] = featured.map((t) => ({
    key: t.slug,
    image: t.image,
    imageAlt: t.imageAlt,
    kicker: `${t.category.replace("-", " ")} · ${t.duration}`,
    title: t.title,
    summary: t.summary,
    cta: t.bookable ? "Check availability" : "Request a quote",
    href: `/tours/${t.slug}`,
  }));
  const serviceStackItems: StackedCardItem[] = services.map((s) => ({
    key: s.slug,
    image: s.image,
    imageAlt: s.imageAlt,
    kicker: "Tourism Is Life service",
    title: s.name,
    summary: s.summary,
    cta: "Learn more",
    href: `/services/${s.slug}`,
  }));

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const needle = [q, place].filter(Boolean).join(" ");
    void navigate({ to: "/tours/search", search: { q: needle } });
  }

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <HomeHero>
          <form
            onSubmit={onSearch}
            role="search"
            aria-label="Search tours"
            // Dimmer than the default clear glass: this pill straddles the hero photograph and the
            // cream page beneath it, and over the light theme's page the default dimming leaves
            // the small labels under 4.5:1. Inline because unlayered `.glass-clear` beats a utility.
            style={{ "--glass-dim": 0.37 } as React.CSSProperties}
            className="glass-clear glass-text grid gap-0.5 rounded-[1.25rem] p-1.5 text-ivory sm:grid-cols-2 lg:flex lg:items-center lg:gap-0 lg:rounded-full"
          >
            <label htmlFor="home-search" className={pillCell + " lg:flex-[1.4]"}>
              <Search className="size-4 shrink-0 text-gold" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className={pillLabel}>Search tours</span>
                <input
                  id="home-search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Banana Island, Gola, Bintumani"
                  className={pillField}
                />
              </span>
            </label>
            <span aria-hidden className="hidden h-8 w-px shrink-0 bg-ivory/25 lg:block" />
            <label htmlFor="home-place" className={pillCell + " lg:flex-1"}>
              <MapPin className="size-4 shrink-0 text-gold" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className={pillLabel}>Destination</span>
                <select
                  id="home-place"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  className={pillField + " cursor-pointer appearance-none"}
                >
                  <option value="">Any destination</option>
                  {destinations.map((d) => (
                    <option key={d.slug} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </span>
            </label>
            <span aria-hidden className="hidden h-8 w-px shrink-0 bg-ivory/25 lg:block" />
            <label htmlFor="home-when" className={pillCell + " lg:flex-1"}>
              <CalendarDays className="size-4 shrink-0 text-gold" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className={pillLabel}>Month</span>
                <input
                  id="home-when"
                  type="month"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                  className={pillField}
                />
              </span>
            </label>
            <span aria-hidden className="hidden h-8 w-px shrink-0 bg-ivory/25 lg:block" />
            <label htmlFor="home-pax" className={pillCell + " lg:flex-[0.6]"}>
              <Users className="size-4 shrink-0 text-gold" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className={pillLabel}>Travelers</span>
                <input
                  id="home-pax"
                  type="number"
                  min={1}
                  max={16}
                  value={travelers}
                  onChange={(e) => setTravelers(e.target.value)}
                  className={pillField}
                />
              </span>
            </label>
            <div className="sm:col-span-2 lg:col-span-1 lg:pl-2">
              <Button type="submit" aria-label="Search tours" className="w-full rounded-full lg:size-10 lg:min-h-10 lg:w-10 lg:px-0">
                <Search className="size-4" aria-hidden />
                <span className="lg:sr-only">Search</span>
              </Button>
            </div>
          </form>
      </HomeHero>

      <section className="border-b border-line bg-surface">
        <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Shield, t: "Local experts", d: "Freetown-based DMC, founder-led." },
            { icon: Compass, t: "Tailor-made", d: "Circuits across four regions plus Guinea and Liberia." },
            { icon: Users, t: "B2B & B2C", d: "Independent travellers, operators, cruise, MICE." },
            { icon: Leaf, t: "Full-service", d: "Tours, visas, vehicles, hotels, insurance, ticketing." },
          ].map((item) => (
            <div key={item.t} className="flex gap-3">
              <item.icon className="mt-0.5 size-5 text-gold" aria-hidden />
              <div>
                <p className="font-medium text-heading">{item.t}</p>
                <p className="mt-1 text-sm text-muted">{item.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-12">
        <p className="text-xs uppercase tracking-[0.22em] text-gold-ink">The four circuits</p>
        <h2 className="mt-2 font-display text-4xl text-heading">Sierra Leone, mapped as we travel it</h2>
        <div className="mt-10">
          <CircuitShowcase label="circuit" items={circuitShowcaseItems} />
        </div>
      </section>

      <section className="bg-surface py-12">
        <div className="container-page">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gold-ink">Featured journeys</p>
              <h2 className="mt-2 font-display text-4xl text-heading">Tours from the public catalogue</h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/tours">All tours</Link>
            </Button>
          </div>
          <div className="mt-10">
            <StackedCardCarousel label="tour" items={featuredStackItems} />
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden py-14 text-ivory">
        <img src={IMG_FOREST} alt="Rainforest canopy" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-brand-dark/75" />
        <div className="container-page relative grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gold">Why Tourism Is Life</p>
            <h2 className="mt-3 font-display text-4xl">A Sierra Leone story, told on the ground</h2>
            <p className="mt-5 text-ivory/80">
              Founded by Alieya Alie Kargbo and shaped by guides such as Peter Momoh Bassie, featured in AFAR
              Magazine, the company builds thoughtful Freetown days and harder expeditions to Gola Rainforest
              and Mount Bintumani.
            </p>
            <Button asChild className="mt-8">
              <Link to="/about/team">
                Meet the team <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <blockquote className="self-end rounded-lg border border-ivory/15 bg-brand/50 p-8">
            <p className="font-display text-2xl">“{testimonial.quote}”</p>
            <footer className="mt-4 text-sm text-ivory/70">
              {testimonial.name} · {testimonial.handle}
            </footer>
          </blockquote>
        </div>
      </section>

      <section className="container-page py-12">
        <h2 className="font-display text-4xl text-heading">Travel by experience</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["wildlife", "Wildlife", IMG_WILDLIFE],
              ["beaches", "Beaches & Islands", "/images/beaches/tokeh-beach.jpg"],
              ["culture", "Culture & Heritage", "/images/culture/kings-gate-freetown.jpg"],
              ["adventure", "Adventure & Trekking", "/images/mountains/adventure-bintumani-fb.jpg"],
            ] as const
          ).map(([id, label, img]) => (
            <Link
              key={id}
              to="/tours/search"
              search={{ category: id }}
              className="group relative min-h-48 overflow-hidden rounded-lg"
            >
              <img src={img} alt={label} className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-brand-dark/45" />
              <div className="relative flex h-full flex-col justify-end p-5 text-ivory">
                <p className="font-display text-2xl">{label}</p>
                <p className="mt-1 text-sm text-ivory/75">Filter the catalogue</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-surface py-12">
        <div className="container-page">
          <p className="text-xs uppercase tracking-[0.22em] text-gold-ink">Signature experiences</p>
          <h2 className="mt-2 font-display text-4xl text-heading">Islands, chimps, rainforest, summit</h2>
          <div className="mt-10">
            <LayeredTravelCarousel label="featured experience" items={signatureCarouselItems} />
          </div>
        </div>
      </section>

      <section className="bg-brand text-ivory">
        <div className="container-page grid gap-10 py-12 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gold">Operators</p>
            <h2 className="mt-2 font-display text-4xl">Your DMC partner in Sierra Leone & West Africa</h2>
            <p className="mt-4 text-ivory/75">
              Ground handling, manifests, multi-country Mano River itineraries, and a 1 DCM World network
              affiliation as stated by the CEO in 2024.
            </p>
            <Button asChild className="mt-8">
              <Link to="/partner">Partner enquiry</Link>
            </Button>
          </div>
          <div
            className="relative min-h-64 overflow-hidden rounded-lg bg-cover bg-center"
            style={{ backgroundImage: `url(${IMG_CRUISE})` }}
          >
            {/* /70, not /50: measured against the actual photo, gold and even
                ivory both fell as low as 1.28:1 / 3.14:1 at /50 because part of
                this image is bright. /70 clears 4.5:1 with margin. */}
            <div className="absolute inset-0 bg-brand-dark/70 p-8">
              <p className="text-xs uppercase tracking-[0.22em] text-ivory">Cruise</p>
              <h3 className="mt-2 font-display text-3xl">Shore excursions & group handling</h3>
              <Button asChild variant="ivory" className="mt-6">
                <Link to="/cruise">Cruise desk</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gold-ink">What we handle</p>
            <h2 className="mt-2 font-display text-4xl text-heading">Seven DMC services</h2>
          </div>
          <Button asChild variant="outline">
            <Link to="/services">All services</Link>
          </Button>
        </div>
        <div className="mt-10">
          <StackedCardCarousel label="service" items={serviceStackItems} />
        </div>
      </section>

      <section className="bg-surface py-10">
        <div className="container-page">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-3xl text-heading">Journal</h2>
            <Link to="/journal" className="text-sm text-heading hover:text-gold-ink">
              All stories
            </Link>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {articles.slice(0, 3).map((a) => (
              <Link key={a.slug} to="/journal/$slug" params={{ slug: a.slug }}>
                <CompactStoryCard image={a.image} imageAlt={a.imageAlt} eyebrow={a.date} title={a.title} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-dark py-10 text-ivory">
        <div className="container-page grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl">Notes from Freetown</h2>
            <p className="mt-3 text-ivory/70">Occasional itinerary notes. No invented offers.</p>
          </div>
          <NewsletterForm variant="dark" />
        </div>
      </section>

      <section className="container-page py-12 text-center">
        <h2 className="font-display text-4xl text-heading">Plan your journey</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">Quotes are confirmed in writing. Published pages do not invent prices.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/contact">Plan Your Journey</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/contact/partner">Request a Quote</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
