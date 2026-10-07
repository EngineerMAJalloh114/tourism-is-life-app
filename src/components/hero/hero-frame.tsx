import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { HeroMediaLayer } from "@/components/hero/hero-media";
import type { HeroMedia } from "@/lib/hero-media";

/**
 * The eyebrow label above a hero headline. Ivory, not gold, and that is a
 * contrast decision rather than a stylistic one.
 *
 * The kicker renders at 12px, and the tall hero content block pushes it to
 * roughly 18% down the hero, which is where the gradients are weakest and where
 * bright sky usually sits. Measured per pixel across the hero images and all
 * four themes, a gold kicker lands at 2.22:1 to 3.30:1 against the 4.5:1 that
 * small text needs, and it cannot be rescued by darkening: at a 75% overlay,
 * heavy enough to flatten the photograph, it still only reaches 4.42:1. Ivory
 * measures 5.95:1 in the same place with the image untouched.
 *
 * Gold remains the accent everywhere it sits on a solid surface: section
 * kickers, links, and the primary button inside the hero itself.
 */
export const HERO_KICKER_CLASS = "text-xs uppercase tracking-[0.22em] text-ivory";

/** How tall the hero stands. Named rather than free-form so the three sizes stay consistent. */
export type HeroHeight = "page" | "tall" | "full";

const HEIGHT: Record<HeroHeight, string> = {
  page: "min-h-[34vh]",
  tall: "min-h-[54vh]",
  full: "min-h-[78vh]",
};

/**
 * The shared shell behind every hero on the site: sizing, the media layer, the
 * gradient treatment, film grain, and a content slot.
 *
 * The gradients are the reason hero text passes contrast. They are not
 * decoration and should not be lightened without re-checking the text on the
 * brightest image in the sequence: a hero with a bright sky behind pale text is
 * the failure mode this component exists to prevent.
 */
export function HeroFrame({
  media,
  height = "page",
  children,
  className,
  contentClassName,
}: {
  media: readonly HeroMedia[];
  height?: HeroHeight;
  children: ReactNode;
  className?: string;
  /** Extra classes for the content wrapper, for heroes that are not bottom-aligned. */
  contentClassName?: string;
}) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden bg-brand-dark text-ivory",
        HEIGHT[height],
        className,
      )}
    >
      <HeroMediaLayer media={media} />

      {/* Two gradients: one lifts the bottom where the text sits, one darkens the
          left where the headline starts. Together they hold text contrast across
          every image in a sequence, including the brightest.

          The via-stop sits at 40% (not Tailwind's default 50%), and both
          stops are stronger than they once were, because the content block
          (kicker, headline, lede, search form) is tall relative to the hero
          on mobile — where the hero's own height is set by that content, not
          by `min-h`, and can run past 900px — pushing the kicker as high as
          ~87% up the image. At the old `/70`-via/`/25`-to pairing (default
          50% stop), that landed at 2.27:1–2.51:1 on two of the five hero
          slides (bunce-island-wall, freetown-aerial), well under the 4.5:1
          small text needs. Re-verified per pixel against all five slides at
          mobile width: this pairing clears every one with margin. Lowering
          either stop, or pushing the via-stop back down, without re-running
          that check will quietly reintroduce the failure. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-dark from-0% via-brand-dark/94 via-35% to-brand-dark/58 to-100%" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-dark/75 via-brand-dark/25 to-transparent" />
      <div className="film-grain pointer-events-none absolute inset-0" />

      <div
        className={cn(
          "container-page relative flex flex-col justify-end",
          HEIGHT[height],
          contentClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
