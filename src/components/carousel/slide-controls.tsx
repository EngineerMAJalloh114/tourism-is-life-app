import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The dot row and pause button shared by every rotating slideshow. Extracted
 * from the hero's `HeroControls` — unchanged in markup, ARIA and styling, so
 * this is a pure move, not a redesign — because `LayeredTravelCarousel` needs
 * the same "stop motion that runs past five seconds" control WCAG 2.2.2
 * requires, and duplicating it verbatim would drift the two out of sync.
 */
export function SlideDots({
  count,
  active,
  onSelect,
  label,
  itemNoun = "",
  surface = "dark",
}: {
  count: number;
  active: number;
  onSelect: (index: number) => void;
  /** Accessible name for the group, e.g. "Hero image" or "Featured experience". */
  label: string;
  /** Interpolated into each tab's label, e.g. "image" -> "Show image 1 of 5". */
  itemNoun?: string;
  /** "dark" (default) is ivory dots for floating over photography. "light" is
   * for a control row on an ordinary page surface, where ivory would be
   * nearly invisible against the page's own near-ivory background. */
  surface?: "dark" | "light";
}) {
  return (
    <div className="flex items-center gap-2" role="tablist" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === active}
          aria-label={itemNoun ? `Show ${itemNoun} ${i + 1} of ${count}` : `Show ${i + 1} of ${count}`}
          onClick={() => onSelect(i)}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            // A 1.5px line is the visible mark; the tap target around it is
            // padded out to meet the 24px minimum.
            "relative before:absolute before:-inset-x-1 before:-inset-y-3 before:content-['']",
            surface === "dark"
              ? i === active
                ? "w-7 bg-ivory"
                : "w-3 bg-ivory/45 hover:bg-ivory/70"
              : i === active
                ? "w-7 bg-brand"
                : "w-3 bg-line hover:bg-brand/50",
          )}
        />
      ))}
    </div>
  );
}

/**
 * "dark" (the default) is for floating over photography — a translucent dark
 * chip, ivory icon, proven legible on any image because the chip supplies its
 * own backdrop. "light" is for a control row on an ordinary page surface: the
 * dark chip would composite into a washed-out smudge there instead of reading
 * as a control, so it uses the same border/ink treatment as the carousel's
 * prev/next arrows next to it.
 */
export function SlidePauseButton({
  paused,
  onToggle,
  label,
  surface = "dark",
}: {
  paused: boolean;
  onToggle: () => void;
  /** What's being paused, e.g. "hero slideshow" or "featured experiences". */
  label: string;
  surface?: "dark" | "light";
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={paused ? `Resume ${label}` : `Pause ${label}`}
      className={cn(
        "glass-btn grid size-8 place-items-center rounded-full border transition-colors",
        surface === "dark"
          ? "border-ivory/30 bg-brand-dark/50 text-ivory hover:bg-brand-dark/80"
          : "glass-btn-tint border-line text-ink hover:border-gold hover:text-heading",
      )}
    >
      {paused ? <Play className="size-3.5" aria-hidden /> : <Pause className="size-3.5" aria-hidden />}
    </button>
  );
}
