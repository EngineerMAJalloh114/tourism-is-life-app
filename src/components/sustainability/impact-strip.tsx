import { IMPACT_STRIP } from "@/data/sustainability";
import { IconFor } from "@/components/sustainability/icon-for";
import { cn } from "@/lib/utils";

/**
 * The reference's stat cards, without numbers: no verified figures exist, so
 * each card names a real part of the approach instead. If verified figures
 * are ever published, change the strings in `IMPACT_STRIP`; the layout holds.
 */
export function ImpactStrip({ className }: { className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3", className)}>
      {IMPACT_STRIP.map((item) => (
        <li
          key={item.title}
          className="rounded-2xl border border-line bg-page/95 p-3.5 shadow-[var(--shadow-card)] backdrop-blur-sm"
        >
          <IconFor name={item.icon} className="size-5 text-gold-ink" />
          <p className="mt-2 text-sm font-medium leading-tight text-heading">{item.title}</p>
          <p className="mt-0.5 text-xs leading-snug text-muted">{item.body}</p>
        </li>
      ))}
    </ul>
  );
}
