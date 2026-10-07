import * as Accordion from "@radix-ui/react-accordion";
import * as Tabs from "@radix-ui/react-tabs";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { IconFor } from "@/components/sustainability/icon-for";
import { Reveal } from "@/components/reveal";
import { PILLARS, type ExperienceFilter, type Pillar, type PillarId } from "@/data/sustainability";
import { cn } from "@/lib/utils";

function PillarCta({ pillar, onSeeExperiences }: { pillar: Pillar; onSeeExperiences: (f: ExperienceFilter) => void }) {
  return (
    <a
      href="#experiences"
      onClick={() => onSeeExperiences(pillar.filter)}
      className="group/cta mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-gold-ink focus-visible:outline-2 focus-visible:outline-gold"
    >
      <span className="underline-offset-4 group-hover/cta:underline">{pillar.cta}</span>
      <ArrowRight className="size-4 transition-transform duration-200 group-hover/cta:translate-x-1 motion-reduce:transition-none" aria-hidden />
    </a>
  );
}

function PillarBody({ pillar, onSeeExperiences }: { pillar: Pillar; onSeeExperiences: (f: ExperienceFilter) => void }) {
  return (
    <>
      <h3 className="font-display text-2xl text-heading sm:text-3xl">{pillar.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{pillar.body}</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {pillar.points.map((pt) => (
          <li key={pt} className="rounded-full border border-line bg-page px-3 py-1 text-xs text-ink">
            {pt}
          </li>
        ))}
      </ul>
      <PillarCta pillar={pillar} onSeeExperiences={onSeeExperiences} />
    </>
  );
}

/**
 * Four pillars as a real explorer. Desktop: a vertical tab list with a
 * sliding active indicator beside one large photograph that crossfades while
 * the content card re-enters. Below `lg` it becomes an accordion, since a
 * tall tab list beside a photograph does not fit a phone.
 *
 * Selection is controlled by the page so the hero's floating cards can open
 * a specific pillar, and each pillar's CTA can open the matching experience
 * filter further down.
 */
export function PillarExplorer({
  active,
  onActiveChange,
  onSeeExperiences,
}: {
  active: PillarId;
  onActiveChange: (id: PillarId) => void;
  onSeeExperiences: (f: ExperienceFilter) => void;
}) {
  const index = Math.max(0, PILLARS.findIndex((p) => p.id === active));
  const current = PILLARS[index];
  // The accordion keeps its own open value so a phone user can collapse the
  // open pillar; it still follows selections made elsewhere on the page.
  const [openItem, setOpenItem] = useState<string>(active);
  useEffect(() => setOpenItem(active), [active]);

  return (
    <section id="pillars" aria-labelledby="pillars-title" className="scroll-mt-48 py-14 lg:py-20">
      <div className="container-page">
        <Reveal className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-gold-ink">Four pillars</p>
          <h2 id="pillars-title" className="mt-3 font-display text-3xl text-heading sm:text-4xl lg:text-5xl">
            Our approach to responsible tourism
          </h2>
        </Reveal>

        {/* Desktop: tabs beside a crossfading photograph */}
        <Tabs.Root
          value={active}
          onValueChange={(v) => onActiveChange(v as PillarId)}
          orientation="vertical"
          className="mt-10 hidden gap-8 lg:grid lg:grid-cols-12"
        >
          <Tabs.List aria-label="Sustainability pillars" className="relative col-span-4 grid grid-rows-4 gap-0 self-stretch">
            <span
              aria-hidden
              className="absolute left-0 top-0 w-1 rounded-full bg-gold-ink transition-transform duration-500 ease-out motion-reduce:transition-none"
              style={{ height: "25%", transform: `translateY(${index * 100}%)` }}
            />
            {PILLARS.map((p) => (
              <Tabs.Trigger
                key={p.id}
                value={p.id}
                className={cn(
                  "flex min-h-24 flex-col justify-center border-l border-line pl-6 text-left transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-gold motion-reduce:transition-none",
                  active === p.id ? "text-heading" : "text-muted hover:text-heading",
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="font-display text-lg text-gold-ink">{p.n}</span>
                  <IconFor name={p.icon} className="size-5" />
                  <span className="font-display text-xl">{p.title}</span>
                </span>
                <span className="mt-1 pl-1 text-xs leading-snug">{p.short}</span>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <div className="relative col-span-8 min-h-[32rem] overflow-hidden rounded-3xl shadow-[var(--shadow-lift)]">
            {PILLARS.map((p) => (
              <img
                key={p.id}
                src={p.image}
                alt={active === p.id ? p.alt : ""}
                loading={p.id === PILLARS[0].id ? "eager" : "lazy"}
                decoding="async"
                className={cn(
                  "absolute inset-0 size-full object-cover transition-opacity duration-700 ease-out motion-reduce:transition-none",
                  active === p.id ? "opacity-100" : "opacity-0",
                )}
              />
            ))}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-dark/45 via-transparent to-transparent" />
            {PILLARS.map((p) => (
              <Tabs.Content
                key={p.id}
                value={p.id}
                className="sus-rise absolute bottom-5 left-5 max-w-md rounded-2xl bg-page/95 p-6 shadow-[var(--shadow-lift)] backdrop-blur-md"
              >
                <PillarBody pillar={p} onSeeExperiences={onSeeExperiences} />
              </Tabs.Content>
            ))}
          </div>
        </Tabs.Root>

        {/* Below lg: accordion */}
        <Accordion.Root
          type="single"
          collapsible
          value={openItem}
          onValueChange={(v) => {
            setOpenItem(v);
            if (v) onActiveChange(v as PillarId);
          }}
          className="mt-8 grid gap-3 lg:hidden"
        >
          {PILLARS.map((p) => (
            <Accordion.Item key={p.id} value={p.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
              <Accordion.Header>
                <Accordion.Trigger className="group flex min-h-16 w-full items-center gap-3 px-4 text-left focus-visible:outline-2 focus-visible:outline-gold">
                  <span className="font-display text-lg text-gold-ink">{p.n}</span>
                  <IconFor name={p.icon} className="size-5 text-heading" />
                  <span className="flex-1 font-display text-xl text-heading">{p.title}</span>
                  <ChevronDown
                    className="size-5 text-muted transition-transform duration-300 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                    aria-hidden
                  />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="acc-content">
                <img
                  src={p.image}
                  alt={p.alt}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[16/10] w-full object-cover"
                />
                <div className="p-4 pb-5">
                  <PillarBody pillar={p} onSeeExperiences={onSeeExperiences} />
                </div>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
        <p className="sr-only" aria-live="polite">
          {current.title} selected
        </p>
      </div>
    </section>
  );
}
