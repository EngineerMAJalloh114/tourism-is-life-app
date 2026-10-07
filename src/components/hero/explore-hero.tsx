import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SlidePauseButton } from "@/components/carousel/slide-controls";
import { Button } from "@/components/ui/button";
import { useSlideRotation } from "@/lib/use-slide-rotation";
import { cn } from "@/lib/utils";

/** One hero state. Everything the hero shows is data, so a CMS can supply it. */
export interface ExploreSlide {
  id: string;
  /** The giant headline. */
  title: string;
  /** The line that rides beside the active thumbnail. */
  heading: string;
  description: string;
  /** Accessible name of this state's thumbnail. */
  label: string;
  image: { src: string; alt: string; position?: string };
  /** Optional call to action for this state. `href` is an internal path. */
  cta?: { label: string; href: string };
}

/** A slide holds ~6s, imagery crossfades ~1.1s, text settles ~0.7s. */
export const EXPLORE_SLIDE_MS = 6000;
const IMAGE_FADE_MS = 1100;
const TEXT_MS = 700;

function SubBlock({ slide }: { slide: ExploreSlide }) {
  return (
    <div className="flex gap-3">
      <span aria-hidden className="w-px shrink-0 self-stretch bg-ivory/70" />
      <div>
        <p className="font-display text-xl leading-tight sm:text-2xl">{slide.heading}</p>
        <p className="mt-1.5 max-w-[15rem] text-[13px] leading-snug text-ivory/90">{slide.description}</p>
      </div>
    </div>
  );
}

/**
 * The shared "explore" hero: one large rounded container, a giant headline over
 * a full-bleed photograph, and a column of circular thumbnails on the right. The
 * active thumbnail is enlarged and ringed, and its sub-heading rides beside it.
 * Used by the homepage and by the Stay and Dine preview, so both feel like the
 * same product.
 *
 * Motion: images crossfade with a slow Ken Burns drift; the headline and
 * sub-heading of the leaving state fade up and out while the next settles in;
 * thumbnails resize on the same clock. Advancing is timer-driven (never
 * transitionend), so the reduced-motion rule that zeroes transition durations
 * cannot stall it, and `useSlideRotation` never starts the timer for visitors
 * who ask for reduced motion. A chosen thumbnail pauses rotation and a pause
 * control is always present (WCAG 2.2.2).
 *
 * Inactive text and call-to-action cells are `inert`, so a hidden link can never
 * take keyboard focus.
 */
export function ExploreHero({
  slides,
  topSlot,
  ariaLabel,
  className,
}: {
  slides: readonly ExploreSlide[];
  /** Sits top-left inside the container: a category switch, an eyebrow, and so on. */
  topSlot?: ReactNode;
  ariaLabel: string;
  className?: string;
}) {
  const { active, paused, animate, multiple, select, togglePause } = useSlideRotation({
    count: slides.length,
    slideMs: EXPLORE_SLIDE_MS,
  });
  const hasCta = slides.some((s) => s.cta);

  return (
    <section aria-roledescription="carousel" aria-label={ariaLabel} className={cn("container-page pt-4 sm:pt-6", className)}>
      <div className="carousel-panel-in relative isolate flex min-h-[25rem] flex-col overflow-hidden rounded-3xl bg-brand-dark text-ivory sm:min-h-[26rem] lg:min-h-[28rem]">
        {slides.map((s, i) => (
          <div
            key={s.id}
            aria-hidden={i !== active}
            className={cn("absolute inset-0 -z-20 transition-opacity ease-out motion-reduce:transition-none", i === active ? "opacity-100" : "opacity-0")}
            style={{ transitionDuration: `${IMAGE_FADE_MS}ms` }}
          >
            <img
              src={s.image.src}
              alt={i === active ? s.image.alt : ""}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "low"}
              decoding="async"
              className={cn("size-full object-cover", i === active && animate && "hero-kenburns")}
              style={{ objectPosition: s.image.position ?? "center" }}
            />
          </div>
        ))}
        {/* Darkening scrims keep the headline and sub-heading legible over any photograph. */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-dark/66 via-brand-dark/46 to-brand-dark/82" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-dark/62 via-brand-dark/34 to-brand-dark/16" />

        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-6 lg:px-9 lg:pt-6">
          <div>{topSlot}</div>
          {multiple && animate ? <SlidePauseButton paused={paused} onToggle={togglePause} label="hero slideshow" /> : null}
        </div>

        <div className="flex flex-1 flex-col justify-end gap-4 px-4 pb-5 sm:px-6 md:pb-11 lg:justify-center lg:px-9 lg:pb-14">
          <h1 className="grid max-w-3xl" aria-live="off">
            {slides.map((s, i) => (
              <span
                key={s.id}
                aria-hidden={i !== active}
                className={cn(
                  "col-start-1 row-start-1 font-display text-[clamp(1.85rem,4.4vw,3.6rem)] font-medium uppercase leading-[0.98] tracking-normal [word-spacing:0.14em] [text-shadow:0_2px_24px_rgb(0_0_0/0.35)] transition-[opacity,transform] ease-out motion-reduce:transition-none",
                  i === active ? "translate-y-0 opacity-100 delay-[250ms]" : "pointer-events-none -translate-y-4 opacity-0",
                )}
                style={{ transitionDuration: `${TEXT_MS}ms` }}
              >
                {s.title}
              </span>
            ))}
          </h1>

          {/* Below lg the sub-heading sits under the headline. */}
          <div className="grid lg:hidden">
            {slides.map((s, i) => (
              <div
                key={s.id}
                aria-hidden={i !== active}
                className={cn(
                  "col-start-1 row-start-1 transition-[opacity,transform] ease-out motion-reduce:transition-none",
                  i === active ? "translate-y-0 opacity-100 delay-[350ms]" : "pointer-events-none translate-y-3 opacity-0",
                )}
                style={{ transitionDuration: `${TEXT_MS}ms` }}
              >
                <SubBlock slide={s} />
              </div>
            ))}
          </div>

          {hasCta ? (
            <div className="grid">
              {slides.map((s, i) => (
                <div
                  key={s.id}
                  aria-hidden={i !== active}
                  inert={i !== active}
                  className={cn(
                    "col-start-1 row-start-1 transition-[opacity,transform] ease-out motion-reduce:transition-none",
                    i === active ? "translate-y-0 opacity-100 delay-[450ms]" : "pointer-events-none translate-y-3 opacity-0",
                  )}
                  style={{ transitionDuration: `${TEXT_MS}ms` }}
                >
                  {s.cta ? (
                    <Button asChild>
                      <Link to={s.cta.href}>{s.cta.label}</Link>
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {/* Below lg the selector is a horizontal strip. */}
          {multiple ? (
            <div role="group" aria-label="Choose a hero image" className="flex items-center gap-2.5 overflow-x-auto py-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {slides.map((s, i) => (
                <ThumbButton key={s.id} slide={s} active={i === active} onSelect={() => select(i)} size="strip" />
              ))}
            </div>
          ) : null}
        </div>

        {/* lg and up: the orbit. Each row holds a thumbnail and, when active, its sub-heading. */}
        {multiple ? (
          <div role="group" aria-label="Choose a hero image" className="pointer-events-none absolute inset-y-0 right-6 z-10 hidden flex-col items-end justify-center gap-3 pb-10 lg:flex xl:right-10">
            {slides.map((s, i) => {
              const current = i === active;
              return (
                <div key={s.id} className="relative flex items-center justify-end">
                  {/* Out of the row's layout on purpose: a hidden sub-heading must not add height, or
                      the column grows with the number of states and runs into the pause control. */}
                  <div className="pointer-events-none absolute right-[calc(100%+2.5rem)] top-1/2 w-[16rem] -translate-y-1/2">
                    <div
                      aria-hidden={!current}
                      className={cn(
                        "transition-[opacity,transform] ease-out motion-reduce:transition-none",
                        current ? "translate-x-0 opacity-100 delay-[350ms]" : "translate-x-3 opacity-0",
                      )}
                      style={{ transitionDuration: `${TEXT_MS}ms` }}
                    >
                      <SubBlock slide={s} />
                    </div>
                  </div>
                  <span
                    aria-hidden
                    className={cn(
                      "absolute right-[calc(100%+0.5rem)] top-1/2 h-px w-8 bg-ivory/70 transition-opacity duration-700 motion-reduce:transition-none",
                      current ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="pointer-events-auto relative">
                    <span aria-hidden className={cn("pointer-events-none absolute left-1/2 top-1/2 size-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ivory/20 transition-opacity duration-[900ms] motion-reduce:transition-none", current ? "opacity-100" : "opacity-0")} />
                    <span aria-hidden className={cn("pointer-events-none absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ivory/12 transition-opacity duration-[900ms] motion-reduce:transition-none", current ? "opacity-100" : "opacity-0")} />
                    <ThumbButton slide={s} active={current} onSelect={() => select(i)} size="orbit" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ThumbButton({
  slide,
  active,
  onSelect,
  size,
}: {
  slide: ExploreSlide;
  active: boolean;
  onSelect: () => void;
  size: "orbit" | "strip";
}) {
  const dims = size === "orbit" ? (active ? "size-24" : "size-10") : active ? "size-14" : "size-10";
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={slide.label}
      aria-pressed={active}
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border-2 transition-[width,height,border-color,box-shadow] duration-700 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold motion-reduce:transition-none",
        dims,
        active ? "border-ivory shadow-[0_8px_30px_rgb(0_0_0/0.35)]" : "border-ivory/55 hover:border-ivory",
      )}
    >
      <img src={slide.image.src} alt="" loading="lazy" decoding="async" draggable={false} className="size-full object-cover" style={{ objectPosition: slide.image.position ?? "center" }} />
    </button>
  );
}
