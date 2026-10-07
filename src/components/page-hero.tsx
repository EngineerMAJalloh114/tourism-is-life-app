import { HeroFrame, HERO_KICKER_CLASS } from "@/components/hero/hero-frame";
import type { HeroImage } from "@/lib/hero-media";

/**
 * The hero used by every page except the homepage.
 *
 * It accepts `HeroImage` only. `HeroImage` carries `kind: "image"`, so passing a
 * `HeroVideo` here is a type error rather than something a reviewer has to
 * notice. That is what keeps internal pages image-only: the rule is in the type
 * system, not in a comment.
 *
 * Both call styles work. A single `image`/`imageAlt` pair is the common case;
 * `images` takes a sequence for landing pages that benefit from showing range.
 */
export function PageHero({
  kicker,
  title,
  lede,
  image,
  imageAlt,
  imagePosition = "center",
  images,
}: {
  kicker?: string;
  title: string;
  lede?: string;
  /** Single background image. Ignored when `images` is supplied. */
  image?: string;
  imageAlt?: string;
  /** CSS object-position for the hero image — override for tall/portrait source photos. */
  imagePosition?: string;
  /** A sequence to crossfade through. Images only, by type. */
  images?: readonly HeroImage[];
}) {
  const media: readonly HeroImage[] =
    images && images.length > 0
      ? images
      : [{ kind: "image", src: image ?? "", alt: imageAlt ?? "", position: imagePosition }];

  return (
    <HeroFrame media={media} height="page" contentClassName="pb-8 pt-16">
      {kicker ? <p className={HERO_KICKER_CLASS}>{kicker}</p> : null}
      <h1 className="mt-3 max-w-3xl font-display text-4xl sm:text-5xl lg:text-6xl">{title}</h1>
      {lede ? <p className="mt-4 max-w-2xl text-base text-ivory/80 sm:text-lg">{lede}</p> : null}
    </HeroFrame>
  );
}
