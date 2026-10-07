import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSlideRotation } from "@/lib/use-slide-rotation";
import { SlidePauseButton } from "@/components/carousel/slide-controls";
import type { TravelCarouselItem } from "@/components/carousel/layered-travel-carousel";

const SLIDE_MS = 3000;

/**
 * Center-peek carousel for a full catalogue (`/destinations`' "Places"
 * section, all 15 entries) — a different shape from `LayeredTravelCarousel`'s
 * "hero + upcoming column", because the reference for this component was a
 * symmetric centred card with neighbours peeking on both sides, and because a
 * hero-sized single panel doesn't suit paging through fifteen items the way
 * it suits a curated four or five.
 *
 * Reuses `TravelCarouselItem` and `useSlideRotation` rather than defining a
 * near-duplicate type or a second timer/pause engine. Autoplays every 3s, by
 * explicit request — `useSlideRotation`'s own `select()` already pauses
 * rotation the moment a visitor drives it directly (click, drag, wheel, or
 * arrow key), so autoplay only ever moves a card the visitor hasn't already
 * taken over, and the pause button (shown whenever `animate` is true, same
 * as StackedCardCarousel) covers WCAG 2.2.2 for anyone who wants it stopped.
 *
 * Every item is real DOM at all times (not virtualised) — with 15 entries
 * that's a small, fixed cost, and it keeps "select a peeking neighbour"
 * trivial: no window to slide, just an offset-from-active per card.
 */
export function PlacePeekCarousel({
  items,
  label,
}: {
  items: readonly TravelCarouselItem[];
  /** Used in control labels, e.g. "place" -> "Previous place". */
  label: string;
}) {
  const { active, paused, animate, multiple, select, togglePause } = useSlideRotation({
    count: items.length,
    slideMs: SLIDE_MS,
  });
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});
  // Pointer Events cover a finger, a mouse click-and-drag, and a pen in one
  // path — same approach as LayeredTravelCarousel's drag-to-advance.
  const drag = useRef<{ x: number; y: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // Re-read on every render rather than re-subscribing the wheel listener on
  // every `active` change — same pattern as StackedCardCarousel's own wheel
  // handler, which this mirrors so trackpad/shift-wheel scroll advances this
  // carousel exactly the way it does that one.
  const latest = useRef({ active, select, multiple });
  latest.current = { active, select, multiple };

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let locked = false;
    function onWheel(e: WheelEvent) {
      const { active, select, multiple } = latest.current;
      if (!multiple) return;
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      if (Math.abs(e.deltaX) < 12) return;
      e.preventDefault();
      if (locked) return;
      locked = true;
      select(e.deltaX > 0 ? active + 1 : active - 1);
      window.setTimeout(() => {
        locked = false;
      }, 550);
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  if (items.length === 0) return null;

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      select(active + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      select(active - 1);
    }
  }

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

  // Shortest signed distance from `active` on a circular track of `items.length`,
  // e.g. with 15 items, index 14 is offset -1 from active 0, not +14.
  function offsetOf(i: number) {
    const n = items.length;
    let d = (i - active) % n;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  }

  // `rotate` matches StackedCardCarousel's own SLOT degrees exactly — the
  // slight fanned tilt is as much a part of that carousel's motion as its
  // 700ms ease-out, so reproducing the transition timing without it would
  // still read as a different, flatter movement.
  const SLOT: Record<number, { left: string; scale: number; opacity: number; rotate: number; z: number }> = {
    [-2]: { left: "4%", scale: 0.68, opacity: 0.45, rotate: -9, z: 1 },
    [-1]: { left: "25%", scale: 0.84, opacity: 0.82, rotate: -5, z: 2 },
    [0]: { left: "50%", scale: 1, opacity: 1, rotate: 0, z: 3 },
    [1]: { left: "75%", scale: 0.84, opacity: 0.82, rotate: 5, z: 2 },
    [2]: { left: "96%", scale: 0.68, opacity: 0.45, rotate: 9, z: 1 },
  };

  return (
    <div>
      <div
        ref={stageRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        onKeyDown={onKeyDown}
        onPointerDown={multiple ? onPointerDown : undefined}
        onPointerUp={multiple ? onPointerUp : undefined}
        className={cn(
          // Matches StackedCardCarousel's stage height exactly, now that the
          // cards themselves are the same size as that carousel's — see the
          // card sizing note below.
          "relative h-72 touch-pan-y select-none overflow-hidden sm:h-96 lg:h-[28rem]",
          multiple && "cursor-grab active:cursor-grabbing",
        )}
      >
        {items.map((item, i) => {
          const offset = offsetOf(i);
          const visible = Math.abs(offset) <= 2;
          if (!visible) return null;
          const slot = SLOT[offset];
          const isActive = offset === 0;
          const visibleAtWidth = Math.abs(offset) <= 1 ? "" : "hidden lg:block";

          const cardInner = (
            <>
              <img
                src={imgFailed[item.key] ? "/images/cruise/freetown-port.jpg" : item.image}
                alt={isActive ? item.imageAlt : ""}
                loading={isActive ? "eager" : "lazy"}
                draggable={false}
                onError={() => setImgFailed((f) => ({ ...f, [item.key]: true }))}
                className="absolute inset-0 size-full object-cover"
              />
              {item.kicker ? (
                <span className="absolute left-3 top-3 z-10 rounded-full bg-brand-dark/90 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-ivory backdrop-blur-sm">
                  {item.kicker}
                </span>
              ) : null}
              {/* Glassmorphism panel, not a gradient fade: a near-opaque
                  blurred surface, so its own contrast doesn't depend on how
                  bright any one of these 15 photos happens to be — measured
                  per pixel against all 15 destination images before shipping.
                  `/85` still let the gold CTA text fail on 8 of the 15 real
                  photos (down to 3.87:1, need 4.5:1); `/92` clears every image
                  on every theme at 4.5:1+ with margin. */}
              <div className="absolute inset-x-0 bottom-0 border-t border-ivory/10 bg-brand-dark/92 p-3 backdrop-blur-md sm:p-4 lg:p-5">
                <h3 className="font-display text-base text-ivory sm:text-lg lg:text-xl">{item.title}</h3>
                {isActive ? (
                  <>
                    {item.summary ? (
                      <p className="mt-1 line-clamp-2 text-xs text-ivory/85 sm:mt-1.5 sm:text-sm">{item.summary}</p>
                    ) : null}
                    <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-gold sm:mt-3 sm:text-sm">
                      {item.cta} <ArrowRight className="size-3.5" aria-hidden />
                    </span>
                  </>
                ) : null}
              </div>
            </>
          );

          // Same fixed box on every card, active or not — h-56/w-44 up to
          // lg:h-80/w-64, identical to StackedCardCarousel's cards. The
          // "smaller neighbour" look comes entirely from `slot.scale` below,
          // the same way that carousel does it, rather than a second set of
          // height classes fighting the transform's own scale.
          // `transition-[left,transform,opacity] duration-700 ease-out` is
          // StackedCardCarousel's own transition line verbatim — `left` has
          // to be in the animated list (not just transform/opacity), or a
          // slot change snaps the card sideways instantly and only its
          // scale/fade eases, which reads as a jump-cut, not a slide.
          const cardClassName = cn(
            "absolute top-1/2 h-56 w-44 overflow-hidden rounded-xl transition-[left,transform,opacity] duration-700 ease-out motion-reduce:transition-none sm:h-72 sm:w-56 lg:h-80 lg:w-64",
            isActive
              ? "shadow-[var(--shadow-lift)] ring-2 ring-gold"
              : "shadow-[var(--shadow-card)] ring-1 ring-ivory/15",
            visibleAtWidth,
          );
          // Centered both axes (translate -50%/-50%) then offset sideways,
          // scaled, and tilted per slot, so shorter neighbour cards float
          // vertically centred against the taller active one rather than
          // hugging the top.
          const cardStyle = {
            left: slot.left,
            transform: `translate(-50%, -50%) scale(${slot.scale}) rotate(${slot.rotate}deg)`,
            opacity: slot.opacity,
            zIndex: slot.z,
          };

          return isActive ? (
            <Link key={item.key} to={item.href} className={cardClassName} style={cardStyle}>
              {cardInner}
            </Link>
          ) : (
            <button
              key={item.key}
              type="button"
              onClick={() => select(i)}
              aria-label={`Show ${item.title}`}
              className={cardClassName}
              style={cardStyle}
            >
              {cardInner}
            </button>
          );
        })}
      </div>

      {multiple ? (
        <div className="mt-5 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => select(active - 1)}
            aria-label={`Previous ${label}`}
            className="glass-btn glass-btn-tint grid size-10 place-items-center rounded-full border border-line text-ink transition-colors hover:border-gold hover:text-heading"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </button>
          <p className="min-w-[4.5rem] text-center text-sm text-muted" aria-live="polite">
            {active + 1} / {items.length}
          </p>
          <button
            type="button"
            onClick={() => select(active + 1)}
            aria-label={`Next ${label}`}
            className="glass-btn glass-btn-tint grid size-10 place-items-center rounded-full border border-line text-ink transition-colors hover:border-gold hover:text-heading"
          >
            <ArrowRight className="size-4" aria-hidden />
          </button>
          {animate ? (
            <SlidePauseButton paused={paused} onToggle={togglePause} label={`${label} rotation`} surface="light" />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
