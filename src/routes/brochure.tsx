import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/seo";
import {
  circuits,
  destinations,
  getTour,
  services,
  IMG_HERO,
} from "@/data/catalog";
import { excursions } from "@/data/cruise";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/brochure")({
  head: () =>
    pageHead(
      "DMC Brochure",
      "Tourism Is Life's destination management brochure: Sierra Leone circuits, shore excursions, and the Mano River Triangle across Guinea, Sierra Leone, and Liberia.",
      "/brochure",
    ),
  component: Brochure,
});

function Kicker({ children, dark }: { children: string; dark?: boolean }) {
  return (
    <p className={`text-xs uppercase tracking-[0.22em] ${dark ? "text-gold" : "text-gold-ink"}`}>{children}</p>
  );
}

function SectionHeading({ kicker, title, lede }: { kicker: string; title: string; lede?: string }) {
  return (
    <div className="max-w-2xl">
      <Kicker>{kicker}</Kicker>
      <h2 className="mt-2 font-display text-3xl text-brand sm:text-4xl">{title}</h2>
      {lede ? <p className="mt-3 text-muted">{lede}</p> : null}
    </div>
  );
}

function Brochure() {
  const manoRiver = getTour("mano-river-triangle");
  const shoreExcursionSample = excursions.slice(0, 3);

  return (
    <>
      <PageHero
        kicker="DMC brochure"
        title="Tourism Is Life, in one document"
        lede="A working DMC brochure for tour operators, cruise lines, and independent travellers: the circuits we run, the shore excursions we handle, and the three-country route through the Mano River basin."
        image={IMG_HERO}
        imageAlt="Sierra Leone coastline"
      />

      {/* 1. Welcome */}
      <section className="container-page max-w-3xl py-16">
        <Kicker>Welcome to Sierra Leone</Kicker>
        <h1 className="mt-2 font-display text-3xl text-brand sm:text-4xl">
          A small country with an outsized amount to see
        </h1>
        <p className="mt-4 text-lg leading-relaxed">
          Sierra Leone sits on the West African coast between Guinea and Liberia. It has beaches that
          once stood in for a Bounty chocolate advert, a rainforest that still holds pygmy hippos and
          forest elephants, and a capital, Freetown, whose Krio name, Romarong, meaning &ldquo;the place
          of the wailers,&rdquo; comes from the hills that rise straight out of the sea.
        </p>
        <p className="mt-4 leading-relaxed text-muted">
          Tourism Is Life is a Freetown-based destination management company. We plan the itinerary,
          brief the guides, and handle the logistics on the ground for independent travellers, tour
          operators, and cruise lines calling at Freetown.
        </p>
      </section>

      {/* 2. Why Tourism Is Life */}
      <section className="border-t border-line bg-surface py-16">
        <div className="container-page max-w-3xl">
          <SectionHeading kicker="Why Tourism Is Life" title="A local team, not a booking layer" />
          <p className="mt-4 leading-relaxed">
            CEO Alieya Alie Kargbo has described Tourism Is Life Tours, in an interview with Travel And
            Tour World, as a DMC and a member partner of 1 DCM World. Guide and part-owner Peter Momoh
            Bassie has been featured in AFAR Magazine for his work leading trips toward Gola Rainforest and
            Mount Bintumani. The people who plan your itinerary are the same people who can tell you which
            trail is passable after rain.
          </p>
          <div className="mt-6">
            <Button asChild variant="outline">
              <Link to="/about">More about the company</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 3. Circuits */}
      <section className="container-page py-16">
        <SectionHeading
          kicker="Our destination experiences"
          title="Four circuits, one country"
          lede="Sierra Leone is small enough that these four regions can be combined, or run on their own."
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {circuits.map((c) => (
            <Link
              key={c.id}
              to="/destinations/$circuit"
              params={{ circuit: c.id }}
              className="group overflow-hidden rounded-lg border border-line bg-surface"
            >
              <img
                src={c.image}
                alt={c.imageAlt}
                className="h-36 w-full object-cover transition group-hover:scale-105"
                loading="lazy"
              />
              <div className="p-4">
                <h3 className="font-display text-lg text-brand">{c.name}</h3>
                <p className="mt-1 text-xs text-muted">{c.region}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Shore Excursions */}
      <section id="shore-excursions" className="border-t border-line bg-brand-dark py-16 text-ivory">
        <div className="container-page">
          <Kicker dark>Shore excursions</Kicker>
          <h2 className="mt-2 max-w-2xl font-display text-3xl sm:text-4xl">
            For the desk, the cruise call is a few hours. For us, it&rsquo;s the whole job.
          </h2>
          <p className="mt-3 max-w-2xl text-ivory/80">
            Turnaround support, port-to-hotel logistics, and shore programmes built around how much time a
            call actually gives passengers: city heritage, rainforest, wildlife, or a peninsula beach.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {shoreExcursionSample.map((ex) => (
              <div key={ex.id} className="overflow-hidden rounded-lg border border-ivory/15 bg-ivory/5">
                <img src={ex.image} alt={ex.imageAlt} className="h-40 w-full object-cover" loading="lazy" />
                <div className="p-4">
                  <h3 className="font-display text-lg">{ex.name}</h3>
                  <p className="mt-1 text-sm text-ivory/75">{ex.summary}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Button asChild>
              <Link to="/cruise/shore-excursions">See the full shore excursion menu</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 6-9. Themed sections grounded in real brochure content */}
      <section className="container-page py-16">
        <SectionHeading kicker="Culture & history" title="Sites that carry real weight" />
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <article>
            <h3 className="font-display text-xl text-brand">Bunce Island</h3>
            <p className="mt-2 leading-relaxed text-muted">
              A former slave-trading fort on the Sierra Leone River, built in 1668 and operating until
              1807. It was declared a national monument in 1948. Tens of thousands of people were held and
              shipped from here, a documented number of them to the Carolinas and Georgia, one of the
              clearer historical threads between Sierra Leone and the United States.
            </p>
          </article>
          <article>
            <h3 className="font-display text-xl text-brand">Rogbonko Village</h3>
            <p className="mt-2 leading-relaxed text-muted">
              A working village retreat rather than a staged one. Visitors pay respects to the chief, then
              join in on cooking, basket making, or raffia work, with drumming and dance in the evening.
              It&rsquo;s a slower day, by design.
            </p>
          </article>
        </div>
      </section>

      <section className="border-t border-line bg-surface py-16">
        <div className="container-page">
          <SectionHeading kicker="Nature & wildlife" title="What's actually out there" />
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <article>
              <h3 className="font-display text-xl text-brand">Tacugama</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Forty minutes from Freetown, Tacugama Chimpanzee Sanctuary has rescued and rehabilitated
                orphaned and confiscated chimpanzees since 1995, across roughly 100 acres of rainforest and
                watershed.
              </p>
            </article>
            <article>
              <h3 className="font-display text-xl text-brand">Tiwai Island</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                A wildlife sanctuary on the Moa River. A forest walk by day, a boat ride up-river toward
                evening for a chance, never a guarantee, of a pygmy hippo.
              </p>
            </article>
            <article>
              <h3 className="font-display text-xl text-brand">Bird watching</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Around 630 recorded species across the country's important bird areas, 23 of them of global
                conservation concern, including the white-necked picathartes, which nests near River
                Number Two beach.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <SectionHeading kicker="Beaches & islands" title="The coast does a lot of the work" />
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <article>
            <h3 className="font-display text-xl text-brand">Banana Island & Turtle Islands</h3>
            <p className="mt-2 leading-relaxed text-muted">
              Banana Island pairs beaches with a former plantation settlement and a small Krio community.
              Further south, the eight low-lying Turtle Islands (Bakie, Bumpetuk, Chepo, Mut, Hoong,
              Nydgei, Sei, and Yele) are remote enough that getting there is most of the experience.
            </p>
          </article>
          <article>
            <h3 className="font-display text-xl text-brand">River Number Two, Bureh, Tokeh</h3>
            <p className="mt-2 leading-relaxed text-muted">
              Turquoise water and pale sand at River Number Two; a reliable surf break at Bureh Beach;
              sailing out of Tokeh. Different beaches for different moods, all within reach of Freetown.
            </p>
          </article>
        </div>
      </section>

      {/* 11-13. Mano River Triangle */}
      {manoRiver ? (
        <section id="mano-river-triangle" className="border-t border-line bg-brand-dark py-16 text-ivory">
          <div className="container-page">
            <Kicker dark>Mano River Triangle</Kicker>
            <h2 className="mt-2 max-w-2xl font-display text-3xl sm:text-4xl">
              Guinea, Sierra Leone, and Liberia: one route, three guides
            </h2>
            <p className="mt-4 max-w-2xl text-ivory/80">{manoRiver.summary}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-ivory/15 bg-ivory/5 p-5">
                <h3 className="font-display text-lg">Guinea</h3>
                <p className="mt-2 text-sm text-ivory/75">
                  Conakry&rsquo;s museums and markets, a boat out to the Îles de Los, and the Kilissi
                  waterfall near Kindia.
                </p>
              </div>
              <div className="rounded-lg border border-ivory/15 bg-ivory/5 p-5">
                <h3 className="font-display text-lg">Sierra Leone</h3>
                <p className="mt-2 text-sm text-ivory/75">
                  Bunce Island, Banana Island, Bo, and Kenema: the same heritage and coast sold to
                  independent travellers, worked into the middle of a longer route.
                </p>
              </div>
              <div className="rounded-lg border border-ivory/15 bg-ivory/5 p-5">
                <h3 className="font-display text-lg">Liberia</h3>
                <p className="mt-2 text-sm text-ivory/75">
                  Robertsport&rsquo;s WWII submarine base and surf, Monrovia&rsquo;s Waterside Market, and
                  Providence Island, where Liberia&rsquo;s first settlers landed.
                </p>
              </div>
            </div>
            <div className="mt-8">
              <Button asChild>
                <Link to="/tours/$slug" params={{ slug: manoRiver.slug }}>
                  See the full route
                </Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {/* 14. Tailor-made / DMC services */}
      <section className="container-page py-16">
        <SectionHeading
          kicker="Tailor-made"
          title="Ground handling beyond the published catalogue"
          lede="The same team plans custom work for operators and corporate groups."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Link
              key={s.slug}
              to="/services/$slug"
              params={{ slug: s.slug }}
              className="rounded-lg border border-line bg-surface p-5 hover:border-gold"
            >
              <h3 className="font-display text-lg text-brand">{s.name}</h3>
              <p className="mt-2 text-sm text-muted">{s.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 15. Destinations quick index */}
      <section className="border-t border-line bg-surface py-16">
        <div className="container-page">
          <SectionHeading kicker="Where we go" title="The full destination list" />
          <div className="mt-6 flex flex-wrap gap-2">
            {destinations.map((d) => (
              <Link
                key={d.slug}
                to="/destinations/$circuit/$slug"
                params={{ circuit: d.circuit, slug: d.slug }}
                className="rounded-full border border-line bg-ivory px-4 py-1.5 text-sm hover:border-gold"
              >
                {d.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 16. Contact */}
      <section className="container-page py-16 text-center">
        <h2 className="font-display text-3xl text-brand sm:text-4xl">Talk to the Freetown desk</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Guest enquiries, operator ground handling, or a cruise call: the same desk handles all three.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
          <a href={SITE.emailHref} className="underline decoration-gold underline-offset-4">
            {SITE.email}
          </a>
          <span className="text-muted">·</span>
          <a href={SITE.phoneHref} className="underline decoration-gold underline-offset-4">
            {SITE.phone}
          </a>
          <span className="text-muted">·</span>
          <a href={SITE.mobileHref} className="underline decoration-gold underline-offset-4">
            {SITE.mobile}
          </a>
        </div>
        <div className="mt-8">
          <Button asChild>
            <Link to="/contact">Send an enquiry</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
