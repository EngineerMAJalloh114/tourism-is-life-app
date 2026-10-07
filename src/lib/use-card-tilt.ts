import { useCallback, useRef, useState, type CSSProperties, type MouseEvent } from "react";

const MAX_DEG = 5;
const REST_STYLE: CSSProperties = {
  transform: "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)",
};

/**
 * A card that subtly tilts toward the cursor, in place of a flat hover
 * state — the "cursor control" a supplied reference video showed on its own
 * card carousel. Only responds to an actual mouse/trackpad: `(hover: hover)`
 * gates it out on touch, where a tap can't supply the continuous pointer
 * position a tilt needs and would otherwise leave the card stuck mid-tilt
 * after the finger lifts. `prefers-reduced-motion` doesn't need its own
 * check here — the project's global rule in styles.css already forces every
 * transition to 0.01ms, so the tilt still applies but snaps rather than
 * eases, the same de-escalation every other animation on this site gets.
 */
export function useCardTilt<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [style, setStyle] = useState<CSSProperties>(REST_STYLE);
  const hoverCapable = useRef<boolean | null>(null);

  const onMouseMove = useCallback((e: MouseEvent<T>) => {
    if (hoverCapable.current === null) {
      hoverCapable.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    }
    if (!hoverCapable.current) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * MAX_DEG * 2;
    const rotateX = (0.5 - py) * MAX_DEG * 2;
    setStyle({
      transform: `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px) scale(1.015)`,
    });
  }, []);

  const onMouseLeave = useCallback(() => setStyle(REST_STYLE), []);

  return { ref, style, onMouseMove, onMouseLeave };
}
