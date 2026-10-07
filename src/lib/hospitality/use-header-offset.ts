import { useEffect, useState } from "react";

/**
 * Height of the site's sticky header, so a second sticky element (the docked
 * search bar, the booking card) can sit just below it. Measured, not assumed:
 * the header is taller on a phone than on a desktop and changes when it
 * collapses. Returns 0 until mounted, so the server render is unaffected.
 */
export function useHeaderOffset(gap = 12): number {
  const [top, setTop] = useState(0);
  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const measure = () => setTop(Math.round(header.getBoundingClientRect().bottom > 0 ? header.offsetHeight : 0) + gap);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(header);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [gap]);
  return top;
}
