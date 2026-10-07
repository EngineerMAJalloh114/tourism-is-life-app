import { useRef, type PointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSlideRotation } from "@/lib/use-slide-rotation";
import { SlidePauseButton } from "@/components/carousel/slide-controls";
import { HERO_KICKER_CLASS } from "@/components/hero/hero-frame";

export type CircuitShowcaseItem = {
  key: string;
  image: string;
  imageAlt: string;
  region: string;
  name: string;
  summary: string;
  cta: string;
  href: string;
};

const SLIDE_MS = 4500;
const FADE_MS = 900;

/**
 * Cinematic circuit picker built to a supplied reference video: a full-bleed
 * crossfading background, a left text panel, and a lower-right row of small
 * overlapping thumbnails that double as slide selectors. Purpose-built for
 * this one section (homepage "Four Circuits") — its literal composition
 * (thumbnails floating over the hero photo, not beside it in their own
 * column) is deliberately different from `LayeredTravelCarousel`, which
 * exists precisely to avoid that layout. Don't reach for this a second time
 * without re-reading why that one made the opposite choice.
 *
 * Background crossfade reuses `HeroMediaLayer`'s pattern (stack every image,
 * fade opacity on the active one) rather than swapping `src` on one `<img>`,
 * so a slide never shows a flash of the wrong photo while the next one
 * decodes. Text uses a remount-on-`key` fade+settle instead, same trick as
 * `LayeredTravelCarousel`'s `carousel-panel-in`, because there are only ever
 * four short text blocks to swap, not decoded photographs.
 */
export function CircuitShowcase({
  items,
  label,
}: {
  items: readonly CircuitShowcaseItem[];
  /** Used in control labels, e.g. "circuit" -> "Show circuit 1 of 4: Western Circuit". */
  label: string;
}) {
  const { active, paused, animate, multiple, select, togglePause } = useSlideRotation({
    count: items.length,
    slideMs: SLIDE_MS,
  });
  // Pointer Events, not separate touch/mouse handlers, same as
  // LayeredTravelCarousel: one path covers a finger, a mouse drag, and a pen.
  const drag = useRef<{ x: number; y: number } | null>(null);

  if (items.length === 0) return null;
  const current = items[active];

  function onPointerDown(e: PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerUp(e: PointerEvent) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      select(dx < 0 ? active + 1 : active - 1);
    }
  }

  return (
    <div
      className={cn(
        "group relative isolate flex min-h-[22rem] touch-pan-y select-none flex-col overflow-hidden rounded-lg bg-brand-dark text-ivory sm:min-h-[26rem] lg:min-h-[30rem]",
        multiple && "cursor-grab active:cursor-grabbing",
      )}
      onPointerDown={multiple ? onPointerDown : undefined}
      onPointerUp={multiple ? onPointerUp : undefined}
    >
      {items.map((item, i) => (
        <img
          key={item.key}
          src={item.image}
          alt={i === active ? item.imageAlt : ""}
          aria-hidden={i !== active}
          loading={i === 0 ? "eager" : "lazy"}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity ease-out motion-reduce:transition-none",
            i === active ? "opacity-100" : "opacity-0",
            i === active && animate && "hero-kenburns",
          )}
          style={{ transitionDuration: `${FADE_MS}ms` }}
        />
      ))}

      {/* Vertical gradient carries contrast on its own; the horizontal one is
          a bonus, not a dependency. Below `lg` the text column and the
          thumbnail row stack (flex-col), so the kicker/heading can span the
          card's full width — unlike HeroFrame or LayeredTravelCarousel,
          where text always sits in a fixed-width left column, a horizontal
          "darken the left" gradient can't be trusted to reach it here. The
          via-stop is pulled up to 35% (from Tailwind's 50% default) because
          this panel is taller than either of those (30-40rem vs. 20-28rem)
          and content is bottom-anchored, so the kicker sits much higher up
          the image — as high as ~85% of the panel's height at the sm tier —
          squarely in the weak end of a default-positioned gradient. Verified
          per pixel against all four circuit images (tokeh-beach,
          mount-bintumani, sherbro-island, hofstra-trees) at mobile/tablet/
          desktop: sherbro-island's kicker measured 3.58:1 under the old /70
          pairing (needs 4.5:1); this pairing clears every image at every
          tier with margin. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-dark from-0% via-brand-dark/92 via-35% to-brand-dark/55 to-100%" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-dark/70 via-brand-dark/20 to-transparent" />
      <div className="film-grain pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex flex-1 flex-col justify-end p-5 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div key={current.key} className={cn("max-w-xl", animate && "circuit-text-in")}>
            <p className={HERO_KICKER_CLASS}>{current.region}</p>
            <h3 className="mt-2 font-display text-3xl leading-[1.05] sm:text-4xl lg:text-5xl">{current.name}</h3>
            <p className="mt-3 max-w-md text-sm text-ivory/85 sm:text-base">{current.summary}</p>
            <Link
              to={current.href}
              className="glass-btn mt-5 inline-flex w-fit items-center gap-1.5 rounded-md bg-gold/92 px-5 py-2.5 text-sm font-medium text-brand-dark transition-colors hover:bg-gold/80"
            >
              {current.cta} <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>

          {/* Lower-right thumbnail row: doubles as the slide picker (the
              reference video's thumbnails are the only way it shows what's
              next). Sized close to the video's own on-screen proportions;
              allowed to scroll horizontally on narrow phones rather than
              shrink further, so they stay legible at every width instead of
              becoming illegible postage stamps. */}
          <div
            role="tablist"
            aria-label={label}
            className="flex gap-3 overflow-x-auto pb-1 sm:gap-4 lg:shrink-0 lg:gap-5"
          >
            {items.map((item, i) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Show ${label} ${i + 1} of ${items.length}: ${item.name}`}
                onClick={() => select(i)}
                className={cn(
                  "group/card relative h-32 w-20 shrink-0 overflow-hidden rounded-md ring-1 ring-ivory/25 transition-shadow duration-300 sm:h-36 sm:w-24 lg:h-[168px] lg:w-28",
                  i === active && "ring-2 ring-gold",
                )}
              >
                <img
                  src={item.image}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  className="absolute inset-0 size-full object-cover transition duration-500 group-hover/card:scale-105"
                />
                {/* Small, narrow cards where the label sits close to the
                    bottom edge: verified /95-/60 clears 4.5:1 for the 9px
                    label against all four images, with margin to spare. */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-dark/95 via-brand-dark/60 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-2 text-left">
                  <span aria-hidden className="h-px w-4 bg-gold" />
                  <span className="text-[9px] font-medium uppercase leading-tight tracking-[0.08em] text-ivory">
                    {item.name}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {multiple ? (
          <div className="mt-6 flex items-center gap-4">
            <button
              type="button"
              onClick={() => select(active - 1)}
              aria-label={`Previous ${label}`}
              className="glass-btn glass-btn-tint grid size-9 shrink-0 place-items-center rounded-full border border-ivory/30 text-ivory transition-colors hover:border-gold hover:text-gold"
            >
              <ArrowLeft className="size-4" aria-hidden />
            </button>
            <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-ivory/25">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gold transition-[width] ease-out motion-reduce:transition-none"
                style={{ width: `${((active + 1) / items.length) * 100}%`, transitionDuration: `${FADE_MS}ms` }}
              />
            </div>
            <span className="shrink-0 text-xs tabular-nums text-ivory/70">
              {String(active + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => select(active + 1)}
              aria-label={`Next ${label}`}
              className="glass-btn glass-btn-tint grid size-9 shrink-0 place-items-center rounded-full border border-ivory/30 text-ivory transition-colors hover:border-gold hover:text-gold"
            >
              <ArrowRight className="size-4" aria-hidden />
            </button>
            {animate ? (
              <SlidePauseButton paused={paused} onToggle={togglePause} label={`${label} rotation`} />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
