import { useCallback, useEffect, useState } from "react";

/**
 * The active-index/timer/pause/reduced-motion logic shared by every rotating
 * slideshow on the site. Extracted from `HeroMediaLayer` so a second carousel
 * (`LayeredTravelCarousel`) doesn't duplicate it — the brief this was built
 * for explicitly warns against duplicating a carousel engine.
 *
 * Three things carried over from the hero, unchanged, because they were each
 * a real bug once:
 *
 * 1. Advancing is driven by a timer, never `transitionend`. The site's global
 *    `prefers-reduced-motion` rule forces `transition-duration: 0.01ms`, so a
 *    transition-driven timer would silently freeze forever for exactly the
 *    visitors least able to tolerate it.
 * 2. `active` always starts at 0 regardless of motion preference, so the
 *    server render and the first client render agree and hydration stays
 *    clean. Motion preference only decides whether the timer ever starts.
 * 3. Selecting a slide directly (`select`) also pauses rotation — the visitor
 *    has taken over, so the timer should not immediately move them elsewhere.
 */
export function useSlideRotation({
  count,
  slideMs,
  /**
   * Called with the active index before each auto-advance; return true to
   * skip it — e.g. a video slide that drives its own timing through
   * `onEnded`. A function rather than a plain boolean because `active` is
   * this hook's own internal state, not something the caller has yet when it
   * calls this hook.
   */
  skipAutoAdvance,
  /**
   * False for a carousel that should only move when the visitor drives it —
   * a full catalogue (e.g. 15 places), where auto-cycling would fight
   * scanning and comparing rather than help it. Defaults to true, so the
   * hero and the curated featured carousels are unaffected.
   */
  autoplay = true,
  /**
   * A second, caller-controlled pause condition, OR'd with the `paused`
   * state `select`/`togglePause` already manage — e.g. "the pointer is over
   * the carousel" or "a card has focus". Kept separate from `paused` itself
   * so a transient hover/focus pause can't clobber an explicit pause-button
   * press (or vice versa): each clears independently, and autoplay only
   * runs when neither is true. Defaults to false, a no-op for every caller
   * that doesn't pass it.
   */
  externalPause = false,
}: {
  count: number;
  slideMs: number;
  skipAutoAdvance?: (active: number) => boolean;
  autoplay?: boolean;
  externalPause?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [animate, setAnimate] = useState(false);
  const multiple = count > 1;

  const go = useCallback(
    (next: number) => setActive(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setAnimate(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!autoplay || !multiple || paused || externalPause || !animate || skipAutoAdvance?.(active)) return;
    const id = window.setTimeout(() => go(active + 1), slideMs);
    return () => window.clearTimeout(id);
  }, [active, animate, autoplay, externalPause, go, multiple, paused, skipAutoAdvance, slideMs]);

  const select = useCallback(
    (i: number) => {
      go(i);
      setPaused(true);
    },
    [go],
  );

  const togglePause = useCallback(() => setPaused((p) => !p), []);

  return { active, paused, animate, multiple, go, select, togglePause, setPaused };
}
