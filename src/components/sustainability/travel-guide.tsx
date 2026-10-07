import * as Tabs from "@radix-ui/react-tabs";
import { Check } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { TravelerChecklist } from "@/components/sustainability/traveler-checklist";
import { GUIDE } from "@/data/sustainability";

/** The three-stage guide (tabs) beside the interactive checklist. */
export function TravelGuide() {
  return (
    <section
      id="travel-responsibly"
      aria-labelledby="guide-title"
      className="container-page scroll-mt-48 py-14 lg:py-20"
    >
      <div className="rounded-3xl bg-surface p-5 sm:p-8 lg:p-12">
        <Reveal className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-gold-ink">How you can take part</p>
          <h2 id="guide-title" className="mt-3 font-display text-3xl text-heading sm:text-4xl lg:text-5xl">
            Travel responsibly
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Small, practical habits, before, during and after a journey.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <Tabs.Root defaultValue={GUIDE[0].id} className="flex h-full flex-col">
              <Tabs.List aria-label="Responsible travel guide" className="flex gap-1 overflow-x-auto rounded-full border border-line bg-page p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {GUIDE.map((g) => (
                  <Tabs.Trigger
                    key={g.id}
                    value={g.id}
                    className="min-h-11 flex-1 shrink-0 rounded-full px-4 text-xs font-medium uppercase tracking-[0.14em] text-muted transition-colors duration-300 hover:text-heading focus-visible:outline-2 focus-visible:outline-gold data-[state=active]:bg-brand data-[state=active]:text-ivory motion-reduce:transition-none"
                  >
                    {g.label}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
              {GUIDE.map((g) => (
                <Tabs.Content key={g.id} value={g.id} className="sus-rise mt-4 flex-1">
                  <ul className="grid h-full gap-4 sm:auto-rows-fr sm:grid-cols-2">
                    {g.items.map((it, i) => (
                      <li
                        key={it}
                        className="flex flex-col justify-between gap-6 rounded-2xl border border-line bg-page p-5 shadow-[var(--shadow-card)] sm:min-h-32"
                      >
                        <span className="flex items-center justify-between text-xs tracking-[0.18em] text-gold-ink">
                          {String(i + 1).padStart(2, "0")}
                          <Check className="size-4" aria-hidden />
                        </span>
                        <span className="font-display text-xl leading-snug text-heading">{it}</span>
                      </li>
                    ))}
                  </ul>
                </Tabs.Content>
              ))}
            </Tabs.Root>
          </Reveal>
          <Reveal delay={120} className="lg:col-span-5">
            <TravelerChecklist />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
