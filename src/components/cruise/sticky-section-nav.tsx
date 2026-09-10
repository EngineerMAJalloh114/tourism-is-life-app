import { useEffect, useState } from "react";
import { SECTION_NAV } from "@/data/cruise";
import { cn } from "@/lib/utils";

export function StickySectionNav() {
  const [active, setActive] = useState(SECTION_NAV[0].id);

  useEffect(() => {
    const nodes = SECTION_NAV.map((item) => document.getElementById(item.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0.1, 0.25, 0.5] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Cruise page sections"
      className="sticky top-[6.35rem] z-30 border-b border-line/80 bg-ivory/95 backdrop-blur-sm lg:top-[7.1rem]"
    >
      <ul className="container-page flex gap-1 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SECTION_NAV.map((item) => (
          <li key={item.id} className="shrink-0">
            <a
              href={`#${item.id}`}
              className={cn(
                "inline-flex min-h-11 items-center rounded-md px-3 text-[11px] font-medium uppercase tracking-[0.16em]",
                active === item.id ? "bg-brand text-ivory" : "text-muted hover:text-brand",
              )}
              aria-current={active === item.id ? "location" : undefined}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
