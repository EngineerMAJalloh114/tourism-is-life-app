import * as Tabs from "@radix-ui/react-tabs";
import { useState } from "react";
import { Reveal } from "@/components/reveal";
import { WHY } from "@/data/sustainability";
import { cn } from "@/lib/utils";

/**
 * Editorial split after the reference's "mission" band: the argument on the
 * left as three selectable ideas, one large photograph on the right with the
 * selected idea captioned over it.
 */
export function WhySection() {
  const [active, setActive] = useState(WHY[0].id);
  const current = WHY.find((w) => w.id === active) ?? WHY[0];

  return (
    <section id="approach" aria-labelledby="why-title" className="container-page scroll-mt-48 py-14 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-14">
        <Reveal className="lg:col-span-6">
          <p className="text-xs uppercase tracking-[0.22em] text-gold-ink">Why it matters</p>
          <h2 id="why-title" className="mt-3 font-display text-3xl text-heading sm:text-4xl lg:text-5xl">
            Tourism should benefit the places we visit
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">
            Responsible tourism is part of how Tourism Is Life designs and runs its journeys, not a
            layer added afterwards. Three ideas hold it together.
          </p>

          <Tabs.Root value={active} onValueChange={setActive} orientation="vertical" className="mt-8">
            <Tabs.List aria-label="Three ideas behind responsible tourism" className="grid gap-2">
              {WHY.map((w, i) => (
                <Tabs.Trigger
                  key={w.id}
                  value={w.id}
                  className={cn(
                    "group flex min-h-14 items-center gap-4 rounded-2xl border px-5 text-left transition-[background-color,border-color,box-shadow] duration-300 focus-visible:outline-2 focus-visible:outline-gold motion-reduce:transition-none",
                    active === w.id
                      ? "border-gold-ink/50 bg-surface shadow-[var(--shadow-card)]"
                      : "border-line bg-transparent hover:border-gold-ink/40",
                  )}
                >
                  <span className="font-display text-xl text-gold-ink">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-display text-2xl text-heading">{w.title}</span>
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            {WHY.map((w) => (
              <Tabs.Content
                key={w.id}
                value={w.id}
                className="sus-rise mt-5 max-w-lg text-sm leading-relaxed text-muted sm:text-base"
              >
                {w.body}
              </Tabs.Content>
            ))}
          </Tabs.Root>
        </Reveal>

        <Reveal delay={120} className="lg:col-span-6">
          <div className="group relative overflow-hidden rounded-3xl shadow-[var(--shadow-lift)]">
            <img
              src="/images/culture/kabala-village.jpg"
              alt="A village scene in Kamamodia, Sierra Leone"
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none sm:aspect-[5/4] lg:aspect-[4/5]"
            />
            <div
              key={current.id}
              className="sus-rise absolute bottom-4 left-4 right-4 rounded-2xl bg-page/92 p-4 shadow-[var(--shadow-card)] backdrop-blur-md sm:right-auto sm:max-w-xs"
              aria-hidden
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-gold-ink">{current.title}</p>
              <p className="mt-1 text-sm leading-snug text-heading">{current.body.split(". ")[0]}.</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
