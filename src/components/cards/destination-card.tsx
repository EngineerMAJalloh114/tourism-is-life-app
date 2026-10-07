import { cn } from "@/lib/utils";

/**
 * Replaces three near-identical hand-rolled destination/circuit cards
 * (homepage circuits, the destinations-index circuits grid, and a circuit's
 * places grid). All three showed a photo, a name and a short summary; the
 * only real differences were the image-overlay treatment and an optional
 * "best time" line, both handled here as props.
 *
 * Presentational only — no `<Link>` inside. TanStack Router's typed `Link`
 * infers its `params` shape from the literal `to` string at the JSX call
 * site; passed through a generic wrapper prop that inference breaks. So,
 * same as `VehicleCategoryCard` elsewhere in this codebase, the caller wraps
 * this in its own `<Link>` and keeps full route type-checking:
 *
 *   <Link to="/destinations/$circuit" params={{ circuit: c.id }} className="group">
 *     <DestinationCard title={c.name} ... />
 *   </Link>
 */
export function DestinationCard({
  title,
  summary,
  image,
  imageAlt,
  meta,
  className,
}: {
  title: string;
  summary: string;
  image: string;
  imageAlt: string;
  /** A short line above the title, e.g. a circuit's best-time-to-visit. */
  meta?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative flex min-h-44 overflow-hidden rounded-lg", className)}>
      <img
        src={image}
        alt={imageAlt}
        loading="lazy"
        className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"
      />
      {/* A faint whole-image darkening for mood, not for contrast — the text
          below sits on its own frosted glass shelf, not directly on the
          photo, so this doesn't need to carry legibility on its own. */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/25 to-transparent" />
      {/* Glass shelf, not a gradient-only fade: a near-opaque blurred bar
          under the text, same `/92` alpha `PlacePeekCarousel` verified
          per pixel against all 15 real destination photos (see that
          component's own note) — reused here rather than re-derived,
          since it's the same "small panel of text over unpredictable
          photography" problem. Position-independent by construction, so
          it doesn't need its own re-check the way a gradient would. */}
      <div className="relative mt-auto flex w-full flex-col border-t border-ivory/10 bg-brand-dark/92 p-4 text-ivory backdrop-blur-md sm:p-5">
        {meta ? <p className="text-[11px] uppercase tracking-[0.18em] text-gold">{meta}</p> : null}
        <h3 className={cn("font-display text-xl sm:text-2xl", meta && "mt-1")}>{title}</h3>
        <p className="mt-1 line-clamp-1 max-w-md text-sm text-ivory/80 sm:mt-1.5 sm:line-clamp-2">{summary}</p>
      </div>
    </div>
  );
}
