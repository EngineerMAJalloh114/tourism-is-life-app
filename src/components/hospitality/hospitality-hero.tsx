import { BedDouble, UtensilsCrossed } from "lucide-react";
import { ExploreHero, EXPLORE_SLIDE_MS } from "@/components/hero/explore-hero";
import type { HeroSlide, Kind } from "@/lib/hospitality/types";
import { cn } from "@/lib/utils";

export const HOSPITALITY_SLIDE_MS = EXPLORE_SLIDE_MS;

const KINDS: { id: Kind; label: string; icon: typeof BedDouble }[] = [
  { id: "stays", label: "Stays", icon: BedDouble },
  { id: "dining", label: "Dining", icon: UtensilsCrossed },
];

/** Stays | Dining switch. Same page, no reload. */
export function KindToggle({ kind, onChange, className }: { kind: Kind; onChange: (k: Kind) => void; className?: string }) {
  return (
    <div
      role="group"
      aria-label="Browse by category"
      className={cn("inline-flex rounded-full bg-brand-dark/55 p-1 ring-1 ring-ivory/25 backdrop-blur-md", className)}
    >
      {KINDS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-pressed={kind === id}
          onClick={() => kind !== id && onChange(id)}
          className={cn(
            "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-gold motion-reduce:transition-none",
            kind === id ? "bg-page text-heading" : "text-ivory hover:bg-ivory/12",
          )}
        >
          <Icon className="size-3.5" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}

/** The Stay and Dine hero: the shared explore hero with a Stays | Dining switch on top. */
export function HospitalityHero({
  kind,
  slides,
  onKindChange,
}: {
  kind: Kind;
  slides: HeroSlide[];
  onKindChange: (k: Kind) => void;
}) {
  return (
    <ExploreHero
      slides={slides}
      ariaLabel="Featured places to stay and dine"
      topSlot={<KindToggle kind={kind} onChange={onKindChange} />}
    />
  );
}
