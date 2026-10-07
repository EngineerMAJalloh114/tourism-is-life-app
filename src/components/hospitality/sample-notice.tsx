import { Info } from "lucide-react";
import { HOSPITALITY_PREVIEW } from "@/data/hospitality";
import { cn } from "@/lib/utils";

/**
 * Shown on every hospitality page while the data is sample content. It is the
 * visible half of the honesty rule: a visitor who lands here can never mistake
 * a layout preview for confirmed hotels and restaurants.
 */
export function SampleNotice({ className }: { className?: string }) {
  if (!HOSPITALITY_PREVIEW) return null;
  return (
    <div className={cn("container-page pt-3", className)}>
      <p
        role="note"
        className="flex items-start gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-[13px] leading-snug text-muted"
      >
        <Info className="mt-px size-4 shrink-0 text-gold-ink" aria-hidden />
        <span>
          <strong className="font-medium text-heading">Preview with sample listings.</strong> Tourism Is Life has not yet
          confirmed the hotels and restaurants shown here, so every name, photo and detail is illustrative. There are no
          prices, ratings, reviews or live availability.
        </span>
      </p>
    </div>
  );
}
