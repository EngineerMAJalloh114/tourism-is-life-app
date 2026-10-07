import { Reveal } from "@/components/reveal";
import { TIMELINE } from "@/data/sustainability";
import { cn } from "@/lib/utils";

/**
 * Current practice and future intent are drawn differently on purpose: what
 * is in place gets a solid marker and a filled badge; anything still planned
 * gets a dashed marker and an outlined badge, so a goal can never be read as
 * an achievement.
 */
export function ImprovementTimeline() {
  return (
    <section aria-labelledby="improve-title" className="container-page py-14 lg:py-20">
      <Reveal className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-gold-ink">Transparency</p>
        <h2 id="improve-title" className="mt-3 font-display text-3xl text-heading sm:text-4xl lg:text-5xl">
          Our commitment to continuous improvement
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted">
          We do not claim a formal sustainability certification. This is where we are, and where we intend to go.
        </p>
      </Reveal>

      <ol className="mt-10 grid gap-8 lg:grid-cols-4 lg:gap-6">
        {TIMELINE.map((t, i) => {
          const planned = t.status === "Planned";
          return (
            <li key={t.step} className="relative pl-10 lg:pl-0 lg:pt-10">
              <span
                aria-hidden
                className={cn(
                  "absolute left-3 top-8 h-[calc(100%+2rem)] border-l lg:left-0 lg:top-3 lg:h-0 lg:w-[calc(100%+1.5rem)] lg:border-l-0 lg:border-t",
                  planned ? "border-dashed border-line" : "border-solid border-gold-ink",
                  i === TIMELINE.length - 1 && "hidden",
                )}
              />
              <span
                aria-hidden
                className={cn(
                  "absolute left-0 top-1 grid size-7 place-items-center rounded-full border-2 bg-page text-[11px] font-medium lg:top-0",
                  planned ? "border-dashed border-muted text-muted" : "border-gold-ink bg-gold-ink text-ivory",
                )}
              >
                {t.step}
              </span>
              <Reveal delay={i * 90}>
                <span
                  className={cn(
                    "inline-block rounded-full px-3 py-0.5 text-[11px] uppercase tracking-[0.14em]",
                    planned ? "border border-dashed border-muted text-muted" : "bg-gold-ink/12 text-gold-ink ring-1 ring-gold-ink/40",
                  )}
                >
                  {t.status}
                </span>
                <h3 className="mt-3 font-display text-xl text-heading">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t.body}</p>
              </Reveal>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
