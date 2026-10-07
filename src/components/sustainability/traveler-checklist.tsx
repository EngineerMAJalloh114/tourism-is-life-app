import * as Checkbox from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { useState } from "react";
import { CHECKLIST } from "@/data/sustainability";
import { cn } from "@/lib/utils";

/**
 * Held in component state only: nothing is stored, sent or remembered, so
 * no personal data is involved and a reload starts fresh.
 */
export function TravelerChecklist() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const complete = done.size === CHECKLIST.length;

  function toggle(item: string, checked: boolean) {
    setDone((prev) => {
      const next = new Set(prev);
      if (checked) next.add(item);
      else next.delete(item);
      return next;
    });
  }

  return (
    <div className="h-full rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
      <h3 className="font-display text-2xl text-heading">A few simple ways to travel responsibly</h3>
      <ul className="mt-5 divide-y divide-line">
        {CHECKLIST.map((item) => {
          const id = `check-${item.replace(/\W+/g, "-").toLowerCase()}`;
          const checked = done.has(item);
          return (
            <li key={item} className="flex items-center gap-3">
              <Checkbox.Root
                id={id}
                checked={checked}
                onCheckedChange={(v) => toggle(item, v === true)}
                className="grid size-6 shrink-0 place-items-center rounded-md border border-ink/40 bg-page transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-gold data-[state=checked]:border-brand data-[state=checked]:bg-brand motion-reduce:transition-none"
              >
                <Checkbox.Indicator>
                  <Check className="size-4 text-ivory" strokeWidth={2.5} aria-hidden />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <label
                htmlFor={id}
                className={cn(
                  "min-h-12 flex-1 cursor-pointer py-3 text-sm transition-colors duration-200 motion-reduce:transition-none",
                  checked ? "text-muted line-through decoration-gold-ink/60" : "text-ink",
                )}
              >
                {item}
              </label>
            </li>
          );
        })}
      </ul>

      <div className="mt-5">
        <div
          className="h-1 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-label="Checklist progress"
          aria-valuemin={0}
          aria-valuemax={CHECKLIST.length}
          aria-valuenow={done.size}
        >
          <div
            className="h-full origin-left rounded-full bg-gold-ink transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{ transform: `scaleX(${done.size / CHECKLIST.length})` }}
          />
        </div>
        <div className="mt-3 flex min-h-6 items-center justify-between gap-3 text-sm" aria-live="polite">
          <p className={cn("transition-colors", complete ? "font-medium text-heading" : "text-muted")}>
            {complete ? "You’re ready to travel responsibly." : `${done.size} of ${CHECKLIST.length}`}
          </p>
          {done.size > 0 ? (
            <button
              type="button"
              onClick={() => setDone(new Set())}
              className="min-h-11 text-xs uppercase tracking-[0.14em] text-muted underline-offset-4 hover:text-heading hover:underline focus-visible:outline-2 focus-visible:outline-gold"
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
