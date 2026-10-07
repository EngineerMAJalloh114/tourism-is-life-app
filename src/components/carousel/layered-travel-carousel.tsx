import { useRef, type PointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSlideRotation } from "@/lib/use-slide-rotation";
import { SlideDots, SlidePauseButton } from "@/components/carousel/slide-controls";
import { HERO_KICKER_CLASS } from "@/components/hero/hero-frame";

export type TravelCarouselItem = {
  key: string;
  image: string;
  imageAlt: string;
  kicker?: string;
  title: string;
  summary?: string;
  cta: string;
  href: string;
};

const SLIDE_MS = 2000;

/**
 * Layered destination-discovery carousel: a prominent active panel with a
 * column of upcoming items beside it on desktop. Built for small, curated
 * collections (homepage Signature Experiences today) — not a general-purpose
 * catalogue browser. `TourCard`/`DestinationCard` grids stay the right choice
 * for anything a visitor needs to scan, filter or compare.
 *
 * Adapted from a supplied travel-template video, not copied: that reference
 * overlaps upcoming thumbnails directly on the hero photo. This keeps them in
 * a separate column instead — one less surface to re-verify contrast on, and
 * it avoids the deeply-nested-interactive-elements problem that comes with
 * stacking clickable cards on top of a clickable hero.
 *
 * `href` is a plain string, not a typed `to`/`params` pair: TanStack Router's
 * typed `Link` infers `params` from a literal `to` at the JSX call site, and
 * that breaks through a generic prop (same issue `DestinationCard` hit).
 * Unlike that component, this one works with a plain `href: string` on
 * `Link`'s `to` — confirmed against this project's router version — so
 * callers pass a resolved path rather than wrapping their own `<Link>`.
 *
 * Advancing by drag is Pointer Events, not separate touch/mouse handlers —
 * one code path covers a finger on a touchscreen, a mouse click-and-drag, and
 * a pen. `touch-pan-y` on the panel leaves vertical page scroll to the
 * browser and horizontal gesture detection to this component, and the image
 * has native browser drag (the "pick up and drop this image" ghost) turned
 * off so it doesn't compete with the custom drag-to-advance gesture.
 */
export function LayeredTravelCarousel({
  items,
  label,
  slideMs = SLIDE_MS,
}: {
  items: readonly TravelCarouselItem[];
  /** Used in control labels, e.g. "featured experience" -> "Show featured experience 1 of 4". */
  label: string;
  slideMs?: number;
}) {
  const { active, paused, animate, multiple, select, togglePause } = useSlideRotation({
    count: items.length,
    slideMs,
  });
  // Pointer Events, not separate touch/mouse handlers: one path covers a
  // finger on a touchscreen, a mouse cursor click-and-drag, and a pen, so
  // "swipe with a finger" and "drag with a cursor" are the same gesture here.
  const drag = useRef<{ x: number; y: number } | null>(null);

  if (items.length === 0) return null;
  const current = items[active];
  const upcoming = items.filter((_, i) => i !== active).slice(0, 3);

  function onPointerDown(e: PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return; // primary button only
    drag.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerUp(e: PointerEvent) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = null;
    // A mostly-horizontal drag past a real threshold, so a click or a
    // vertical page scroll doesn't get mistaken for a swipe.
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      select(dx < 0 ? active + 1 : active - 1);
    }
  }

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div
          className={cn(
            // A three-tier scale, not one flat height: on a phone this panel
            // was previously 384px, nearly half a typical viewport, before a
            // visitor had scrolled past a single card. 320px still holds the
            // kicker/title/summary/CTA stack comfortably (checked at both
            // font sizes below) while giving the page room to show more than
            // one section per scroll.
            "group relative isolate flex min-h-72 touch-pan-y select-none overflow-hidden rounded-lg bg-brand-dark text-ivory sm:min-h-[22rem] lg:min-h-[24rem]",
            multiple && "cursor-grab active:cursor-grabbing",
          )}
          onPointerDown={multiple ? onPointerDown : undefined}
          onPointerUp={multiple ? onPointerUp : undefined}
        >
          <img
            key={current.key}
            src={current.image}
            alt={current.imageAlt}
            loading="lazy"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            className={cn(
              "absolute inset-0 size-full object-cover",
              animate && "hero-kenburns carousel-panel-in",
            )}
          />
          {/* Responsive, not one flat value: shrinking this panel for mobile
              (see below) pushed the kicker/title/summary block higher up the
              image — proportionally more of a shorter panel — into the
              gradient's weaker zone. `/60` (this pairing's previous value)
              measured 2.91:1 on mount-bintumani.jpg at the new mobile size,
              well under 4.5:1; re-verified per pixel at all three size tiers
              against all four signature-tour images, mobile needs /85+ and
              sm/lg both need only /65+ — a single shared value would either
              fail mobile or over-darken the larger desktop panel for no
              reason. `/88` and `/70` clear their tiers with margin. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/88 to-transparent sm:via-brand-dark/70" />
          <div className="relative mt-auto flex w-full flex-col p-5 sm:p-6 lg:p-8">
            {current.kicker ? <p className={HERO_KICKER_CLASS}>{current.kicker}</p> : null}
            <h3 className="mt-2 max-w-md font-display text-2xl sm:text-3xl lg:text-4xl">{current.title}</h3>
            {current.summary ? (
              <p className="mt-2 max-w-md line-clamp-2 text-sm text-ivory/85 sm:text-base">{current.summary}</p>
            ) : null}
            <Link
              to={current.href}
              className="glass-btn mt-4 inline-flex w-fit items-center gap-1.5 rounded-md bg-gold/92 px-5 py-2.5 text-sm font-medium text-brand-dark transition-colors hover:bg-gold/80 sm:mt-5"
            >
              {current.cta} <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </div>

        {/* Upcoming column: desktop only. Mobile and tablet get one clear
            active panel and the controls below, per the brief's own rule not
            to shrink the desktop layout down. */}
        <div className="hidden flex-col gap-4 lg:flex">
          {upcoming.map((item) => {
            const i = items.indexOf(item);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => select(i)}
                className="group relative flex min-h-[8.25rem] flex-1 overflow-hidden rounded-lg text-left"
              >
                <img
                  src={item.image}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"
                />
                {/* /70, stronger than the active panel's /60: this card is
                    shorter, so its text sits higher up (closer to the weak end
                    of the gradient) at the same relative position. Measured:
                    /60 with a translucent kicker still failed at 3.29:1-4.46:1
                    on two of the four signature-tour images; /70 with the
                    kicker at full opacity (below) clears 4.58:1+ everywhere. */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/70 to-transparent" />
                <div className="relative mt-auto flex flex-col p-4 text-ivory">
                  {item.kicker ? (
                    <p className="text-[10px] uppercase tracking-[0.16em]">{item.kicker}</p>
                  ) : null}
                  <p className="mt-0.5 font-display text-lg leading-tight">{item.title}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {multiple ? (
        <div className="mt-5 flex items-center justify-between gap-4">
          <SlideDots count={items.length} active={active} onSelect={select} label={label} surface="light" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => select(active - 1)}
              aria-label={`Previous ${label}`}
              className="glass-btn glass-btn-tint grid size-9 place-items-center rounded-full border border-line text-ink transition-colors hover:border-gold hover:text-heading"
            >
              <ArrowLeft className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => select(active + 1)}
              aria-label={`Next ${label}`}
              className="glass-btn glass-btn-tint grid size-9 place-items-center rounded-full border border-line text-ink transition-colors hover:border-gold hover:text-heading"
            >
              <ArrowRight className="size-4" aria-hidden />
            </button>
            {animate ? (
              <SlidePauseButton paused={paused} onToggle={togglePause} label={`${label} rotation`} surface="light" />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
