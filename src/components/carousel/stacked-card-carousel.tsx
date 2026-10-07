import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSlideRotation } from "@/lib/use-slide-rotation";
import { SlidePauseButton } from "@/components/carousel/slide-controls";

export type StackedCardItem = {
  key: string;
  /** Omit only when there's genuinely no photo for this item (see `icon`) — never fill the gap with an unrelated stand-in photo. */
  image?: string;
  imageAlt?: string;
  /** Rendered in the fan slot in place of a photo, for items with no real photograph — same reasoning as `ServiceCard`'s icon panel: an unrelated stand-in image would misrepresent what the item actually is. */
  icon?: ReactNode;
  kicker?: string;
  title: string;
  summary?: string;
  cta?: string;
  href?: string;
};

const SLIDE_MS = 4200;

/**
 * A horizontal, layered stack of photo cards with one active item pulled
 * forward — behind it, every other card fans out to both sides at reduced
 * scale and opacity, partially covered by their neighbours, the featured
 * item cycling on a timer. Built to a supplied reference video of a payment-
 * card carousel: colour/photo cards fanned in depth, one item's own white
 * content card floating in front of its photo.
 *
 * That's the one structural difference from every other carousel in this
 * codebase (`LayeredTravelCarousel`'s side column, `PlacePeekCarousel`'s
 * symmetric peek, `CircuitShowcase`'s full-bleed background): here the
 * active item's photo *stays in the stack*, at the centre slot, full scale
 * — the content card is a second, smaller element layered on top of it, not
 * a replacement for it. `bg-ivory`/`text-brand-dark` on that content card
 * are deliberately theme-*independent* pairings — `ivory` stays a near-white
 * constant and `brand-dark` stays meaningfully dark in all four themes
 * (verified when each theme was built) — because a "white card" is the
 * brief's own explicit request, not a themed surface that should shift
 * with the site's palette the way `bg-surface` would.
 *
 * `cta`/`href` are optional per item: some data this feeds (the cruise
 * overview and destination lists) has no linkable page of its own, and a
 * card with nothing to click is still a complete card, not a broken one.
 */
export function StackedCardCarousel({
  items,
  label,
}: {
  items: readonly StackedCardItem[];
  /** Used in control labels, e.g. "tour" -> "Show tour 1 of 12". */
  label: string;
}) {
  const { active, paused, animate, multiple, select, togglePause } = useSlideRotation({
    count: items.length,
    slideMs: SLIDE_MS,
  });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // Re-read on every render rather than re-subscribing the wheel listener
  // each time `active` changes (which happens every few seconds on its
  // own from autoplay) — the effect below attaches the native listener
  // exactly once and reads through this ref for whatever's current.
  const latest = useRef({ active, select, multiple });
  latest.current = { active, select, multiple };

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    // Trackpad two-finger swipe and shift+wheel both report as `deltaX`,
    // the same axis a real horizontal scrollbar would use — native, not
    // React's synthetic `onWheel`, because a passive listener (React's
    // default for wheel, for scroll-performance reasons) can't call
    // `preventDefault()`; without that, the page would scroll sideways
    // underneath the carousel instead of the carousel consuming the
    // gesture. Only actually intercepts when the gesture is clearly
    // horizontal (`|deltaX| > |deltaY|`) — an ordinary vertical scroll
    // over the carousel while reading the page must keep scrolling the
    // page, not get eaten by this.
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
  const current = items[active];

  function offsetOf(i: number) {
    const n = items.length;
    let d = (i - active) % n;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
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

  const VISIBLE = 2;
  const SLOT: Record<number, { left: string; scale: number; opacity: number; rotate: number; z: number }> = {
    [-2]: { left: "14%", scale: 0.78, opacity: 0.32, rotate: -9, z: 10 },
    [-1]: { left: "30%", scale: 0.88, opacity: 0.62, rotate: -5, z: 20 },
    [0]: { left: "50%", scale: 1, opacity: 1, rotate: 0, z: 40 },
    [1]: { left: "70%", scale: 0.88, opacity: 0.62, rotate: 5, z: 20 },
    [2]: { left: "86%", scale: 0.78, opacity: 0.32, rotate: 9, z: 10 },
  };

  return (
    <div>
      <div
        ref={stageRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        className={cn(
          "relative isolate h-72 touch-pan-y select-none overflow-hidden sm:h-96 lg:h-[28rem]",
          multiple && "cursor-grab active:cursor-grabbing",
        )}
        onPointerDown={multiple ? onPointerDown : undefined}
        onPointerUp={multiple ? onPointerUp : undefined}
      >
        {items.map((item, i) => {
          const offset = offsetOf(i);
          const abs = Math.abs(offset);
          if (abs > VISIBLE) return null;
          const isActive = offset === 0;
          const slot = SLOT[offset];

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => !isActive && select(i)}
              aria-hidden={!isActive}
              tabIndex={isActive ? -1 : 0}
              aria-label={isActive ? undefined : `Show ${label} ${i + 1} of ${items.length}: ${item.title}`}
              style={{
                left: slot.left,
                transform: `translate(-50%, -50%) scale(${slot.scale}) rotate(${slot.rotate}deg)`,
                opacity: slot.opacity,
                zIndex: slot.z,
              }}
              className={cn(
                "absolute top-1/2 h-56 w-44 overflow-hidden rounded-2xl shadow-[var(--shadow-lift)] transition-[left,transform,opacity] duration-700 ease-out motion-reduce:transition-none sm:h-72 sm:w-56 lg:h-80 lg:w-64",
                isActive ? "cursor-default" : "cursor-pointer",
              )}
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={isActive ? (item.imageAlt ?? "") : ""}
                  loading={abs === 0 ? "eager" : "lazy"}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  className="size-full object-cover"
                />
              ) : (
                <div className="grid size-full place-items-center bg-page text-gold-ink">{item.icon}</div>
              )}
            </button>
          );
        })}

        {/* The active item's own white content card, layered on top of its
            (unobscured, full-scale) photo in the centre slot — not a
            replacement for it. Positioned lower and inset from the photo
            card's own edges so a frame of the real photograph stays
            visible on every side, the "white card floating in front"
            silhouette the reference video showed. */}
        <div
          className="pointer-events-none absolute inset-x-[8%] bottom-3 z-50 sm:inset-x-[12%] sm:bottom-5 lg:inset-x-[16%]"
        >
          {/* `key={current.key}` here, not lower: a fresh mount per active
              item is what resets `flipped` back to the name-only front face
              on every autoplay/manual change, instead of carrying a
              "still showing the back" state over from whatever the visitor
              last flipped. */}
          <StackedCardFace key={current.key} item={current} label={label} />
        </div>
      </div>

      {multiple ? (
        <div className="mt-5 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => select(active - 1)}
            aria-label={`Previous ${label}`}
            className="glass-btn glass-btn-tint grid size-9 place-items-center rounded-full border border-line text-ink transition-colors hover:border-gold hover:text-heading"
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
            className="glass-btn glass-btn-tint grid size-9 place-items-center rounded-full border border-line text-ink transition-colors hover:border-gold hover:text-heading"
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

/**
 * The active item's own content card, as a click-to-flip panel: the front
 * shows only the place name — "only the name of the place must show in
 * front... to allow visibility and readability" was the brief's own
 * instruction — everything else (kicker, summary, CTA) moved to a back
 * face revealed on click. The carousel's own stack/fan/autoplay/drag/wheel
 * behaviour is untouched; this only changes what the one floating content
 * card shows and how.
 *
 * The back face is the one kept in normal document flow (not absolutely
 * positioned) so it establishes the card's real height from its own
 * content — kicker, title, summary, and a CTA button add up to more than
 * the name alone needs — and the front face overlays it at `inset-0`,
 * matching that height exactly instead of a guessed fixed one. A CSS
 * `transform` (the `rotateY` both faces carry) doesn't remove an element
 * from flow, so the back face can be genuinely in-flow *and* pre-rotated
 * at the same time — this is what makes that work.
 *
 * `key`-remounted by the caller on every active-item change, so `flipped`
 * always starts false on a new item.
 */
function StackedCardFace({ item, label }: { item: StackedCardItem; label: string }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="[perspective:1400px]">
      <div
        className={cn(
          "carousel-panel-in relative transition-transform duration-700 ease-out [transform-style:preserve-3d] motion-reduce:transition-none",
          flipped && "[transform:rotateY(180deg)]",
        )}
      >
        {/* Back: kicker, title, summary, CTA — the content that used to be
            the whole card. Still on its own near-opaque strip inside the
            30% glass frame, for the same reason documented where that
            strip was added: real photography varies too much in brightness
            for a fixed low-opacity light tint to guarantee 4.5:1 against
            all of it (measured as low as 2.3:1 on a mid-toned photo). */}
        <div className="glass-panel pointer-events-auto relative isolate overflow-hidden rounded-xl bg-ivory/30 p-4 text-brand-dark shadow-[var(--shadow-lift)] [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-5">
          <button
            type="button"
            onClick={() => setFlipped(false)}
            aria-label={`Hide details, show only the name for ${item.title}`}
            className="glass-btn glass-btn-tint absolute right-2 top-2 z-20 grid size-7 place-items-center rounded-full border border-brand-dark/15 text-brand-dark/70 transition-colors hover:text-brand-dark"
          >
            <RotateCcw className="size-3.5" aria-hidden />
          </button>
          <div className="relative z-10 max-w-[calc(100%-2rem)] rounded-lg bg-ivory/94 p-3 sm:p-3.5">
            {item.kicker ? (
              <p className="text-[10px] uppercase tracking-[0.16em] text-brand-dark/70 sm:text-[11px]">
                {item.kicker}
              </p>
            ) : null}
            <h3 className="mt-1 line-clamp-1 font-display text-lg text-brand-dark sm:text-xl">{item.title}</h3>
            {item.summary ? (
              <p className="mt-1 line-clamp-2 text-xs text-brand-dark/75 sm:text-sm">{item.summary}</p>
            ) : null}
          </div>
          {item.cta && item.href ? (
            <Link
              to={item.href}
              className="glass-btn relative z-10 mt-3 inline-flex w-fit items-center gap-1.5 rounded-md bg-gold/92 px-4 py-2 text-xs font-medium text-brand-dark transition-colors hover:bg-gold/80 sm:text-sm"
            >
              {item.cta} <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          ) : null}
        </div>

        {/* Front: the name, and nothing else — overlays the back face
            exactly (`inset-0`), borrowing the height the back's real
            content established. Black text (`text-brand-dark`, the same
            theme-independent dark this whole component already uses
            elsewhere), not the theme's gold accent a first pass tried —
            that measured as low as 1.28:1 against real photos, gold being
            a medium-lightness colour with far less headroom against
            arbitrary photo brightness than a near-black or near-white
            does. `.glass-panel-text`'s light halo (built for exactly this
            dark-text-on-photo pairing) replaces the dark halo the gold
            version needed. Still on `.glass-chip` — flat, no depth, more
            transparent than the back's solid strip — on request; the halo
            is what keeps that transparency from reopening the same
            contrast problem the gold version had. */}
        <button
          type="button"
          onClick={() => setFlipped(true)}
          aria-label={`Show details for ${label}: ${item.title}`}
          className="glass-panel pointer-events-auto absolute inset-0 isolate flex items-center justify-center overflow-hidden rounded-xl bg-ivory/30 p-4 text-brand-dark shadow-[var(--shadow-lift)] [backface-visibility:hidden] sm:p-5"
        >
          <span className="glass-chip glass-panel-text relative z-10 line-clamp-2 rounded-lg bg-ivory/10 px-4 py-2.5 text-center font-display text-lg text-brand-dark sm:px-5 sm:py-3 sm:text-xl lg:text-2xl">
            {item.title}
          </span>
        </button>
      </div>
    </div>
  );
}
