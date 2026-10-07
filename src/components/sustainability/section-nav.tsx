import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A sticky in-page nav with scroll-spy. It sits directly under the site
 * header, whose height changes (utility bar wrapping, scrolled state, phone
 * vs desktop), so the offset is measured from the real header rather than
 * guessed. Below `md` the row scrolls horizontally and keeps the active
 * item in view.
 */
export function SectionNav({
  items,
  label,
}: {
  items: readonly { id: string; label: string }[];
  label: string;
}) {
  const [active, setActive] = useState(items[0].id);
  const [top, setTop] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const update = () => setTop(Math.round(header.getBoundingClientRect().height));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const nodes = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (nodes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.1, 0.25, 0.5] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!list || !el) return;
    list.scrollTo({ left: el.offsetLeft - list.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  return (
    <nav
      aria-label={label}
      style={{ top }}
      className="sticky z-30 mt-6 border-y border-line/80 bg-page/95 backdrop-blur-sm"
    >
      <ul
        ref={listRef}
        className="container-page flex gap-1 overflow-x-auto py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:justify-center"
      >
        {items.map((item) => (
          <li key={item.id} className="shrink-0">
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? "location" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full px-4 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-gold",
                active === item.id ? "bg-brand text-ivory" : "text-muted hover:text-heading",
              )}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
