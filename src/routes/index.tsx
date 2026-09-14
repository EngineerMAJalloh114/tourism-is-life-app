import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Compass, Leaf, Shield, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { TourCard } from "@/components/tour-card";
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
  IMG_HERO,
  IMG_WILDLIFE,
  services,
  testimonial,
  tours,
} from "@/data/catalog";

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

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const needle = [q, place].filter(Boolean).join(" ");
    void navigate({ to: "/tours/search", search: { q: needle } });
  }

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <section className="relative isolate min-h-[92vh] overflow-hidden bg-brand-dark text-ivory">
        <img
          src={IMG_HERO}
          alt="West African tropical coastline, editorial stand-in"
          className="absolute inset-0 size-full object-cover object-[center_78%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/90 via-brand-dark/55 to-brand-dark/20" />
        <div className="film-grain pointer-events-none absolute inset-0" />
        <div className="container-page relative flex min-h-[92vh] flex-col justify-end pb-16 pt-28">
          <p className="text-xs uppercase tracking-[0.28em] text-gold">Sierra Leone · Guinea · Liberia</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
            Discover the Heart of West Africa
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ivory/80">
            A Freetown-based destination management company for travellers, tour operators, and cruise ships.
            Local experts. Global standards.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/tours">Explore Our Tours</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-ivory/40 text-ivory hover:bg-ivory/10">
              <Link to="/partner">Partner With Us</Link>
            </Button>
          </div>
          <form
            onSubmit={onSearch}
            className="mt-10 grid w-full max-w-4xl gap-2 rounded-lg bg-ivory p-3 text-ink shadow-[var(--shadow-lift)] sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_8rem_auto]"
          >
            <label className="sr-only" htmlFor="home-search">
              Search tours
            </label>
            <input
              id="home-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Banana Island, Gola, Bintumani…"
              className="min-h-12 rounded-md px-3 text-sm"
            />
            <label className="sr-only" htmlFor="home-place">
              Destination
            </label>
            <select
              id="home-place"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              className="min-h-12 rounded-md border border-line bg-ivory px-3 text-sm"
            >
              <option value="">Any destination</option>
              {destinations.map((d) => (
                <option key={d.slug} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="home-when">
              Month
            </label>
            <input
              id="home-when"
              type="month"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="min-h-12 rounded-md border border-line px-3 text-sm"
            />
            <div className="flex gap-2">
              <label className="sr-only" htmlFor="home-pax">
                Travelers
              </label>
              <input
                id="home-pax"
                type="number"
                min={1}
                max={16}
                value={travelers}
                onChange={(e) => setTravelers(e.target.value)}
                className="min-h-12 w-20 rounded-md border border-line px-3 text-sm"
              />
              <Button type="submit" variant="dark">
                Search
              </Button>
            </div>
          </form>
        </div>
      </section>

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
                <p className="font-medium text-brand">{item.t}</p>
                <p className="mt-1 text-sm text-muted">{item.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-20">
        <p className="text-xs uppercase tracking-[0.22em] text-gold-ink">The four circuits</p>
        <h2 className="mt-2 font-display text-4xl text-brand">Sierra Leone, mapped as we travel it</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {circuits.map((c) => (
            <Link
              key={c.id}
              to="/destinations/$circuit"
              params={{ circuit: c.id }}
              className="group relative min-h-72 overflow-hidden rounded-lg"
            >
              <img
                src={c.image}
                alt={c.imageAlt}
                className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/30 to-transparent" />
              <div className="relative flex h-full flex-col justify-end p-6 text-ivory">
                <p className="text-[11px] uppercase tracking-[0.18em] text-gold">{c.bestTime}</p>
                <h3 className="mt-1 font-display text-3xl">{c.name}</h3>
                <p className="mt-2 max-w-md text-sm text-ivory/80">{c.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-surface py-20">
        <div className="container-page">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gold-ink">Featured journeys</p>
              <h2 className="mt-2 font-display text-4xl text-brand">Tours from the public catalogue</h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/tours">All tours</Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((t) => (
              <TourCard key={t.slug} tour={t} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden py-24 text-ivory">
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

      <section className="container-page py-20">
        <h2 className="font-display text-4xl text-brand">Travel by experience</h2>
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

      <section className="bg-surface py-20">
        <div className="container-page">
          <p className="text-xs uppercase tracking-[0.22em] text-gold-ink">Signature experiences</p>
          <h2 className="mt-2 font-display text-4xl text-brand">Islands, chimps, rainforest, summit</h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-4">
            {signatures.map((t) => (
              <TourCard key={t.slug} tour={t} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand text-ivory">
        <div className="container-page grid gap-10 py-20 lg:grid-cols-2">
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
            <div className="absolute inset-0 bg-brand-dark/50 p-8">
              <p className="text-xs uppercase tracking-[0.22em] text-gold">Cruise</p>
              <h3 className="mt-2 font-display text-3xl">Shore excursions & group handling</h3>
              <Button asChild variant="ivory" className="mt-6">
                <Link to="/cruise">Cruise desk</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="font-display text-3xl text-brand">Seven DMC services</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <Link
              key={s.slug}
              to="/services/$slug"
              params={{ slug: s.slug }}
              className="rounded-md border border-line px-4 py-5 hover:border-gold"
            >
              <p className="font-medium text-brand">{s.name}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="container-page">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-3xl text-brand">Journal</h2>
            <Link to="/journal" className="text-sm text-brand hover:text-gold">
              All stories
            </Link>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {articles.slice(0, 3).map((a) => (
              <Link key={a.slug} to="/journal/$slug" params={{ slug: a.slug }} className="block">
                <img src={a.image} alt={a.imageAlt} className="aspect-[16/10] w-full rounded-md object-cover" />
                <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-muted">{a.date}</p>
                <h3 className="mt-1 font-display text-2xl text-brand">{a.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-dark py-16 text-ivory">
        <div className="container-page grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl">Notes from Freetown</h2>
            <p className="mt-3 text-ivory/70">Occasional itinerary notes. No invented offers.</p>
          </div>
          <NewsletterForm variant="dark" />
        </div>
      </section>

      <section className="container-page py-20 text-center">
        <h2 className="font-display text-4xl text-brand">Plan your journey</h2>
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
