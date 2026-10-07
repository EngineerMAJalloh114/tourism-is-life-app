import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSlideRotation } from "@/lib/use-slide-rotation";
import { SlidePauseButton } from "@/components/carousel/slide-controls";
import type { TeamMember } from "@/data/catalog";

const SLIDE_MS = 5000;
const TRANSITION_MS = 800;

type Slot = { xPct: number; scale: number; opacity: number; blur: number; z: number };

/**
 * Five conceptual positions — FAR_LEFT..FAR_RIGHT, offset -2..2 from the
 * active member at 0 — the same circular-shortest-path system this
 * codebase's other two carousels already use (`PlacePeekCarousel`,
 * `StackedCardCarousel`), tuned here for a calmer, non-rotated "queue in
 * space" read appropriate to portrait headshots rather than fanned photo
 * cards. With fewer than 5 members some offsets are simply never reached —
 * `offsetOf`'s modulo math already guarantees that — so three members (the
 * roster this ships with) naturally renders as LEFT/ACTIVE/RIGHT with the
 * far slots unpopulated, no separate small-roster code path needed. `blur`
 * is the one dimension neither prior carousel used: a `filter` (composited,
 * not layout-affecting, so cheap to animate) that thickens with distance
 * from centre as an extra depth cue on top of scale/opacity.
 *
 * `xPct` is distance from the stage's own centre, as a percentage of stage
 * width (negative = left of centre) — NOT a `left` offset. Position is
 * expressed entirely through `transform: translateX()` (see `cardStyle`
 * below), never through the `left` CSS property. `left` is a layout
 * property; animating it on several sibling elements that swap target
 * values in the same frame (exactly what happens here on every advance —
 * one card's target becomes another's old value) is a known source of
 * browsers "sticking" one element at its pre-transition position while its
 * inline `style.left` attribute has already updated — confirmed
 * reproducing in this exact component before the fix. `transform` doesn't
 * have that failure mode: it's compositor-driven, not layout, so multiple
 * elements swapping translate targets simultaneously animate reliably.
 *
 * Three separate tables, not one set of numbers reused at every size: a
 * mobile stage keeps ±1 close in and ±2 always hidden (a shrunk-down copy
 * of the desktop spacing would either clip the active card's own edges or
 * push neighbours fully off-stage with no peek at all); tablet opens that
 * up slightly; only the desktop table spaces things out enough for ±2 to
 * be worth showing (`visibleAtWidth` below still gates ±2 to `lg:`, so
 * those numbers only ever apply there in practice).
 */
const SLOT_MOBILE: Record<number, Slot> = {
  [-2]: { xPct: -40, scale: 0.55, opacity: 0.18, blur: 2, z: 1 },
  [-1]: { xPct: -21, scale: 0.74, opacity: 0.5, blur: 1, z: 2 },
  [0]: { xPct: 0, scale: 1, opacity: 1, blur: 0, z: 5 },
  [1]: { xPct: 21, scale: 0.74, opacity: 0.5, blur: 1, z: 2 },
  [2]: { xPct: 40, scale: 0.55, opacity: 0.18, blur: 2, z: 1 },
};
const SLOT_TABLET: Record<number, Slot> = {
  [-2]: { xPct: -43, scale: 0.6, opacity: 0.2, blur: 2, z: 1 },
  [-1]: { xPct: -24, scale: 0.8, opacity: 0.6, blur: 1, z: 2 },
  [0]: { xPct: 0, scale: 1, opacity: 1, blur: 0, z: 5 },
  [1]: { xPct: 24, scale: 0.8, opacity: 0.6, blur: 1, z: 2 },
  [2]: { xPct: 43, scale: 0.6, opacity: 0.2, blur: 2, z: 1 },
};
const SLOT_DESKTOP: Record<number, Slot> = {
  [-2]: { xPct: -46, scale: 0.58, opacity: 0.22, blur: 2, z: 1 },
  [-1]: { xPct: -25, scale: 0.78, opacity: 0.55, blur: 1, z: 2 },
  [0]: { xPct: 0, scale: 1, opacity: 1, blur: 0, z: 5 },
  [1]: { xPct: 25, scale: 0.78, opacity: 0.55, blur: 1, z: 2 },
  [2]: { xPct: 46, scale: 0.58, opacity: 0.22, blur: 2, z: 1 },
};

// Matches Tailwind's own `sm`/`lg` breakpoints (640px/1024px) — measured
// against the stage's own width (inside `container-page`'s padding), not
// `window.innerWidth`, so it tracks the space actually available to the
// carousel rather than the viewport.
function slotTableFor(stageWidth: number) {
  if (stageWidth < 640) return SLOT_MOBILE;
  if (stageWidth < 1024) return SLOT_TABLET;
  return SLOT_DESKTOP;
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * The "Our Team" section's card system: every member's card is real DOM
 * that physically travels between the five slots above as `active` changes,
 * rather than a fixed frame whose photo/text swap out — the whole point of
 * the brief this was built from. Autoplay is the primary experience (not an
 * afterthought the way it is for `PlacePeekCarousel`'s full 15-place
 * catalogue): manual navigation (next/prev, a side-card click, arrow keys,
 * swipe, wheel) calls `go()` directly rather than `select()`, so it jumps
 * the active member immediately and — because `go` changing `active` is
 * exactly what restarts `useSlideRotation`'s own timer — autoplay resumes
 * on a fresh interval afterward instead of stopping for good the way a
 * manual interaction does on the other two carousels. The pause button is
 * the one thing that stops it persistently, kept deliberately separate
 * (see `externalPause` below and its doc comment on the hook itself).
 */
export function TeamOrbitCarousel({ members }: { members: readonly TeamMember[] }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  // Starts true (not false) so autoplay isn't gated off for the entire time
  // between mount and the observer's first callback — the section is
  // presumed visible until proven otherwise, matching how `IntersectionObserver`
  // callbacks are inherently async and would otherwise cost a frame or two
  // of "wrongly paused" on every mount.
  const [sectionVisible, setSectionVisible] = useState(true);
  const { active, paused, animate, multiple, go, togglePause } = useSlideRotation({
    count: members.length,
    slideMs: SLIDE_MS,
    // A transient pause — the visitor is hovering, has focused a card, is
    // mid-swipe, or the section has scrolled out of view — separate from
    // `paused` (the persistent pause button), so neither can clobber the
    // other; autoplay only runs once all of these clear.
    externalPause: hovered || focused || dragging || !sectionVisible,
  });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const latest = useRef({ active, go, multiple });
  latest.current = { active, go, multiple };
  const [stageWidth, setStageWidth] = useState(0);

  // Measured synchronously (before paint) so the very first render already
  // has a real width instead of a one-frame flash at `xPct: 0` for every
  // card. Re-measures on resize/breakpoint changes via ResizeObserver.
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => setStageWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Stops burning timers (and, more to the point, stops the visitor
  // scrolling back up to a team member that isn't the one they left) while
  // the section is scrolled well out of view. A third of the stage on
  // screen counts as "meaningfully visible" — low enough that autoplay
  // doesn't stutter on/off right at the section's own top/bottom edge.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setSectionVisible(entry.isIntersecting), {
      threshold: 0.33,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    // Same native non-passive wheel listener as StackedCardCarousel/
    // PlacePeekCarousel, for trackpad two-finger swipe and shift+wheel.
    let locked = false;
    function onWheel(e: WheelEvent) {
      const { active, go, multiple } = latest.current;
      if (!multiple) return;
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      if (Math.abs(e.deltaX) < 12) return;
      e.preventDefault();
      if (locked) return;
      locked = true;
      go(e.deltaX > 0 ? active + 1 : active - 1);
      window.setTimeout(() => {
        locked = false;
      }, 550);
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  if (members.length === 0) return null;

  function offsetOf(i: number) {
    const n = members.length;
    let d = (i - active) % n;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(active + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(active - 1);
    }
  }

  // Pointer capture (unlike the other two carousels) so a fast swipe that
  // ends outside the card's own bounds still delivers its pointerup here
  // instead of leaving `drag.current` — and `dragging` — stuck.
  function onPointerDown(e: PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
  }
  function onPointerUp(e: PointerEvent) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = null;
    setDragging(false);
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      go(dx < 0 ? active + 1 : active - 1);
    }
  }
  function onPointerCancel() {
    drag.current = null;
    setDragging(false);
  }

  const SLOT = slotTableFor(stageWidth);

  return (
    <div>
      <div
        ref={stageRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Our team"
        onKeyDown={onKeyDown}
        onPointerDown={multiple ? onPointerDown : undefined}
        onPointerUp={multiple ? onPointerUp : undefined}
        onPointerCancel={multiple ? onPointerCancel : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          "relative h-80 touch-pan-y select-none overflow-hidden sm:h-96 lg:h-[26rem]",
          multiple && "cursor-grab active:cursor-grabbing",
        )}
      >
        {members.map((member, i) => {
          const offset = offsetOf(i);
          if (Math.abs(offset) > 2) return null;
          const slot = SLOT[offset];
          const isActive = offset === 0;
          const visibleAtWidth = Math.abs(offset) <= 1 ? "" : "hidden lg:block";

          const cardInner = (
            <>
              <div className="group/photo absolute inset-0 overflow-hidden">
                {member.image ? (
                  <img
                    src={member.image}
                    alt={isActive ? (member.imageAlt ?? "") : ""}
                    loading={isActive ? "eager" : "lazy"}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    className="size-full object-cover transition-transform duration-700 ease-out group-hover/photo:scale-[1.04] motion-reduce:transition-none"
                  />
                ) : (
                  // Never a stand-in photo for a named, real person — an
                  // initials monogram instead, same spirit as ServiceCard's
                  // icon fallback for a service with no genuine photograph.
                  <div className="grid size-full place-items-center bg-brand text-3xl font-display text-ivory/80">
                    {initialsOf(member.name)}
                  </div>
                )}
              </div>
              {/* Ultra-clear liquid glass (styles.css `.glass-clear`), inset so it reads as a
                  floating pane over the portrait. Ivory, not gold, for the role: gold is a
                  mid-lightness colour and cannot reach 4.5:1 at this size on a see-through pane. */}
              <div className="glass-clear glass-text absolute inset-x-2 bottom-2 rounded-lg p-3 sm:inset-x-3 sm:bottom-3 sm:p-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-ivory/90 sm:text-[11px]">{member.role}</p>
                <h3 className="mt-1 line-clamp-2 font-display text-base leading-tight text-ivory sm:text-lg lg:text-xl">
                  {member.name}
                </h3>
              </div>
            </>
          );

          // `transform`/`opacity`/`filter` are the whole position system
          // (inline, so every slot change transitions) — deliberately NOT
          // `left` (see the SLOT comment above for why). `shadow`/`ring`
          // stay as ordinary Tailwind classes because they're a different
          // CSS property (box-shadow), so `hover:` on them composes cleanly
          // instead of losing to the inline styles the way a `hover:scale`
          // or `hover:opacity` utility would.
          const cardClassName = cn(
            "absolute top-1/2 left-1/2 h-56 w-48 overflow-hidden rounded-xl transition-[transform,opacity,filter] ease-out motion-reduce:transition-none sm:h-72 sm:w-64 lg:h-80 lg:w-72",
            isActive
              ? "shadow-[var(--shadow-lift)] ring-2 ring-gold"
              : "cursor-pointer shadow-[var(--shadow-card)] ring-1 ring-ivory/15 transition-[transform,opacity,filter,box-shadow] hover:shadow-[var(--shadow-lift)] hover:ring-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2",
            visibleAtWidth,
          );
          const offsetPx = (slot.xPct / 100) * stageWidth;
          // Three plain transform functions, not one `translate(calc(-50%
          // + Npx), -50%)` — calc() mixing a percentage and a pixel value
          // inside a single translate() argument parses and renders fine as
          // a static value, but was confirmed (in this exact component) to
          // fail to interpolate correctly as a CSS *transition* target: the
          // percentage term applied, the pixel term silently didn't, so
          // every card converged on the stage's centre regardless of its
          // actual slot. Each function below carries only one unit type, an
          // animation pattern browsers handle reliably.
          const cardStyle = {
            transform: `translate(-50%, -50%) translateX(${offsetPx}px) scale(${slot.scale})`,
            opacity: slot.opacity,
            filter: slot.blur ? `blur(${slot.blur}px)` : undefined,
            zIndex: slot.z,
            transitionDuration: `${TRANSITION_MS}ms`,
          };

          // Always a <button> — never a <div> for the active card and a
          // <button> for everyone else. Switching element type on the one
          // member whose `isActive` just flipped is exactly what breaks the
          // travel animation for that member: React can't animate a card
          // between two DOM nodes, only update one in place, so a type
          // switch unmounts the old node and mounts a fresh one with no
          // "before" state to transition from — confirmed as the actual
          // cause of the teleporting card found in review. The active
          // card simply isn't given a click handler or a tab stop.
          return (
            <button
              key={member.slug}
              type="button"
              onClick={isActive ? undefined : () => go(i)}
              tabIndex={isActive ? -1 : 0}
              aria-label={isActive ? undefined : `Show ${member.name}, ${member.role}`}
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
            onClick={() => go(active - 1)}
            aria-label="Previous team member"
            className="glass-btn glass-btn-tint grid size-10 place-items-center rounded-full border border-line text-ink transition-colors hover:border-gold hover:text-heading"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </button>
          <p className="min-w-[9rem] text-center text-sm text-muted" aria-live="polite">
            {members[active].name}
          </p>
          <button
            type="button"
            onClick={() => go(active + 1)}
            aria-label="Next team member"
            className="glass-btn glass-btn-tint grid size-10 place-items-center rounded-full border border-line text-ink transition-colors hover:border-gold hover:text-heading"
          >
            <ArrowRight className="size-4" aria-hidden />
          </button>
          {animate ? (
            <SlidePauseButton paused={paused} onToggle={togglePause} label="team rotation" surface="light" />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
