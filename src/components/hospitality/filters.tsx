import * as Dialog from "@radix-ui/react-dialog";
import { SlidersHorizontal, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { activeFilterCount } from "@/lib/hospitality/search";
import type { HospitalitySearch } from "@/lib/hospitality/types";
import { cn } from "@/lib/utils";

export interface FacetOption {
  id: string;
  label: string;
  count: number;
}

export interface FacetGroup {
  key: "types" | "amenities" | "cuisines" | "styles" | "features";
  label: string;
  options: FacetOption[];
}

function Group({
  group,
  selected,
  onToggle,
}: {
  group: FacetGroup;
  selected: string[];
  onToggle: (key: FacetGroup["key"], id: string) => void;
}) {
  if (group.options.length === 0) return null;
  return (
    <fieldset className="border-t border-line pt-4 first:border-t-0 first:pt-0">
      <legend className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted">{group.label}</legend>
      <ul className="space-y-0.5">
        {group.options.map((o) => {
          const id = `f-${group.key}-${o.id}`;
          return (
            <li key={o.id}>
              <label htmlFor={id} className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-lg px-1 text-[13px] text-ink hover:bg-surface">
                <input
                  id={id}
                  type="checkbox"
                  checked={selected.includes(o.id)}
                  onChange={() => onToggle(group.key, o.id)}
                  className="size-4 shrink-0 cursor-pointer accent-[var(--color-brand)]"
                />
                <span className="flex-1">{o.label}</span>
                <span className="text-xs tabular-nums text-muted">{o.count}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

function Body({
  value,
  groups,
  onChange,
  onReset,
}: {
  value: HospitalitySearch;
  groups: FacetGroup[];
  onChange: (next: HospitalitySearch) => void;
  onReset: () => void;
}) {
  const toggle = (key: FacetGroup["key"], id: string) => {
    const cur = value[key];
    onChange({ ...value, [key]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] });
  };
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="f-q" className="mb-1.5 block text-xs font-medium uppercase tracking-[0.16em] text-muted">
          Search by name or place
        </label>
        <input
          id="f-q"
          type="search"
          value={value.q}
          onChange={(e) => onChange({ ...value, q: e.target.value })}
          placeholder={value.kind === "stays" ? "For example, beach" : "For example, seafood"}
          className="min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted focus-visible:border-gold"
        />
      </div>
      {groups.map((g) => (
        <Group key={g.key} group={g} selected={value[g.key]} onToggle={toggle} />
      ))}
      <Button type="button" variant="outline" size="sm" onClick={onReset} disabled={activeFilterCount(value) === 0} className="w-full">
        Clear all filters
      </Button>
    </div>
  );
}

/** Sidebar from lg; a bottom sheet below it. Every control here changes the results. */
export function FilterPanel({
  value,
  groups,
  onChange,
  onReset,
  resultCount,
  children,
}: {
  value: HospitalitySearch;
  groups: FacetGroup[];
  onChange: (next: HospitalitySearch) => void;
  onReset: () => void;
  resultCount: number;
  children?: ReactNode;
}) {
  const n = activeFilterCount(value);
  return (
    <>
      <aside aria-label="Filters" className="hidden lg:block">
        <div className="sticky top-[var(--hosp-sticky,8rem)] max-h-[calc(100vh-9rem)] overflow-y-auto rounded-xl border border-line bg-surface p-4">
          <p className="mb-3 font-display text-lg text-heading">Filters</p>
          <Body value={value} groups={groups} onChange={onChange} onReset={onReset} />
          {children}
        </div>
      </aside>

      <Dialog.Root>
        <Dialog.Trigger asChild>
          <Button type="button" variant="outline" className="mb-5 w-full sm:w-auto lg:hidden">
            <SlidersHorizontal className="size-4" aria-hidden />
            Filters{n > 0 ? ` (${n})` : ""}
          </Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="carousel-panel-in fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-sm" />
          <Dialog.Content
            className={cn(
              "sus-rise fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-3xl border-t border-line bg-page p-5 text-ink shadow-[var(--shadow-lift)] focus:outline-none",
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <Dialog.Title className="font-display text-2xl text-heading">Filters</Dialog.Title>
              <Dialog.Close aria-label="Close filters" className="grid size-11 place-items-center rounded-full border border-line focus-visible:outline-2 focus-visible:outline-gold">
                <X className="size-5" aria-hidden />
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">Narrow the places shown. Results update as you choose.</Dialog.Description>
            <div className="-mx-1 flex-1 overflow-y-auto px-1 pb-4">
              <Body value={value} groups={groups} onChange={onChange} onReset={onReset} />
            </div>
            <Dialog.Close asChild>
              <Button type="button" size="lg" className="w-full">
                Show {resultCount} {resultCount === 1 ? "place" : "places"}
              </Button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
