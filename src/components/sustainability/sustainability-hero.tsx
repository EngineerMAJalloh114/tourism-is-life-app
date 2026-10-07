import { Sprout } from "lucide-react";
import { IconFor } from "@/components/sustainability/icon-for";
import { ImpactStrip } from "@/components/sustainability/impact-strip";
import { Button } from "@/components/ui/button";
import { PILLARS, type PillarId } from "@/data/sustainability";

const rise = (ms: number) => ({ animationDelay: `${ms}ms` });

/**
 * Composition follows the supplied reference: one large rounded container,
 * text on the left, a photograph fading in from the right, four floating
 * cards over the photograph, and a strip of small cards overlapping the
 * lower edge. Below `md` it recomposes as photo, text, cards, strip, because
 * floating cards over a phone-width photo would cover it.
 */
export function SustainabilityHero({ onSelectPillar }: { onSelectPillar: (id: PillarId) => void }) {
  return (
    <section id="overview" aria-labelledby="hero-title" className="container-page scroll-mt-48 pt-4 sm:pt-6">
      <div className="relative isolate rounded-3xl bg-surface shadow-[var(--shadow-card)] lg:mb-14">
        <div className="relative aspect-[16/10] overflow-hidden rounded-t-3xl md:absolute md:inset-y-0 md:right-0 md:aspect-auto md:w-[62%] md:rounded-l-none md:rounded-r-3xl">
          <img
            src="/images/general/outamba-canoe.jpg"
            alt="Forest and a tall tree on the bank of the Kaba River in Outamba-Kilimi National Park, Sierra Leone"
            fetchPriority="high"
            decoding="async"
            className="size-full object-cover object-[center_62%]"
          />
          <div className="pointer-events-none absolute inset-y-0 -left-1 right-0 hidden bg-gradient-to-r from-surface via-surface/55 to-transparent md:block" />
        </div>

        <div className="relative grid gap-8 p-5 sm:p-8 md:min-h-[34rem] md:grid-cols-12 md:p-10 lg:min-h-[36rem] lg:p-14 lg:pb-32">
          <div className="md:col-span-6 lg:col-span-6">
            <p
              className="sus-rise inline-flex items-center gap-2 rounded-full border border-line bg-page/80 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted"
              style={rise(0)}
            >
              <Sprout className="size-3.5 text-gold-ink" aria-hidden />
              Responsible tourism
            </p>
            <h1
              id="hero-title"
              className="sus-rise mt-5 font-display text-5xl leading-[1.02] text-heading sm:text-6xl lg:text-7xl"
              style={rise(90)}
            >
              Travel With <span className="text-gold-ink">Purpose</span>
            </h1>
            <p className="sus-rise mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg" style={rise(180)}>
              Tourism Is Life believes travel should create meaningful experiences while respecting the
              people, communities, culture, wildlife and landscapes that make West Africa unique.
            </p>
            <div className="sus-rise mt-7 flex flex-wrap gap-3" style={rise(270)}>
              <Button asChild size="lg">
                <a href="#approach">Explore Our Approach</a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#experiences">Explore Responsible Experiences</a>
              </Button>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-3 md:absolute md:right-6 md:top-1/2 md:w-60 md:-translate-y-1/2 md:grid-cols-1 lg:right-10 lg:w-72">
            {PILLARS.map((p, i) => (
              <li key={p.id} className="sus-rise" style={rise(360 + i * 90)}>
                <a
                  href="#pillars"
                  onClick={() => onSelectPillar(p.id)}
                  className="group flex h-full items-center gap-3 rounded-2xl border border-line bg-page/90 p-3 shadow-[var(--shadow-card)] backdrop-blur-md transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] focus-visible:outline-2 focus-visible:outline-gold motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <span className="hidden size-12 shrink-0 overflow-hidden rounded-xl sm:block">
                    <img src={p.image} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-medium leading-tight text-heading">
                      <IconFor name={p.icon} className="size-4 shrink-0 text-gold-ink sm:hidden" />
                      {p.title}
                    </span>
                    <span className="mt-0.5 hidden text-xs leading-snug text-muted md:line-clamp-2 md:block">{p.short}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <ImpactStrip className="md:col-span-12 lg:absolute lg:-bottom-12 lg:left-14 lg:w-[36rem]" />
        </div>
      </div>
    </section>
  );
}
