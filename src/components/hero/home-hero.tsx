import type { ReactNode } from "react";
import { ExploreHero } from "@/components/hero/explore-hero";
import { HOME_HERO_SLIDES } from "@/lib/hero-media";

/**
 * The homepage hero: the shared explore hero (giant headline, circular
 * thumbnail selector, sub-heading, per-state call to action) with the tour
 * search form pulled up over its lower edge like a floating pill.
 *
 * `children` carries that form and keeps its own behaviour. It sits after the
 * hero in the page flow with a negative margin, so it overlaps the photograph
 * without living inside the carousel's clipped container.
 */
export function HomeHero({ children }: { children?: ReactNode }) {
  return (
    <>
      <ExploreHero
        slides={HOME_HERO_SLIDES}
        ariaLabel="Discover Sierra Leone and West Africa"
        topSlot={
          <p className="inline-flex min-h-9 items-center rounded-full bg-brand-dark/55 px-4 text-[11px] font-medium uppercase tracking-[0.2em] text-ivory ring-1 ring-ivory/25 backdrop-blur-md">
            Sierra Leone · Guinea · Liberia
          </p>
        }
      />
      {children ? <div className="container-page relative z-30 mt-3 md:-mt-8 lg:-mt-10">{children}</div> : null}
    </>
  );
}
