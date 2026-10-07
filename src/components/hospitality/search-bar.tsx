import * as Popover from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { parseISO, startOfToday } from "date-fns";
import { CalendarDays, Check, Clock, MapPin, Minus, Plus, Search, Users, UtensilsCrossed } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { Button } from "@/components/ui/button";
import { show, toIso } from "@/lib/hospitality/format";
import { isValidRange, searchDestinations } from "@/lib/hospitality/search";
import type { DestinationOption, HospitalitySearch } from "@/lib/hospitality/types";
import { cn } from "@/lib/utils";

const TIMES = Array.from({ length: 23 }, (_, i) => {
  const mins = 11 * 60 + i * 30;
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
});

type OpenId = "" | "dest" | "in" | "out" | "guests" | "date" | "party" | "cuisine";


/** One cell of the floating bar: a small label over a value, opening its own popover. */
export function Field({
  label,
  value,
  placeholder,
  icon,
  open,
  onOpenChange,
  className,
  children,
  contentClassName,
}: {
  label: string;
  value: string;
  placeholder: string;
  icon: ReactNode;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  className?: string;
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            "group flex min-h-12 w-full min-w-0 items-center gap-2.5 lg:w-auto lg:flex-1 rounded-full px-3.5 py-1.5 text-left transition-colors duration-200 hover:bg-surface focus-visible:outline-2 focus-visible:outline-gold data-[state=open]:bg-surface motion-reduce:transition-none lg:px-4",
            className,
          )}
        >
          <span className="text-gold-ink" aria-hidden>
            {icon}
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-muted">{label}</span>
            <span className={cn("block truncate text-sm", value ? "font-medium text-heading" : "text-muted")}>{value || placeholder}</span>
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={10}
          collisionPadding={12}
          className={cn(
            "sus-rise z-50 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-line bg-page p-3 text-ink shadow-[var(--shadow-lift)] focus:outline-none",
            contentClassName,
          )}
        >
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function DestinationList({
  options,
  value,
  onPick,
}: {
  options: readonly DestinationOption[];
  value: string;
  onPick: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const matches = searchDestinations(options, query);
  return (
    <Command shouldFilter={false} label="Choose a destination" className="w-[min(20rem,calc(100vw-3rem))]">
      <Command.Input
        value={query}
        onValueChange={setQuery}
        placeholder="Search Sierra Leone"
        aria-label="Search destinations"
        className="mb-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted focus-visible:border-gold focus-visible:outline-none"
      />
      <Command.List className="max-h-64 overflow-y-auto">
        <Command.Item
          value="any"
          onSelect={() => onPick("")}
          className="flex min-h-11 cursor-pointer items-center justify-between rounded-lg px-3 text-sm data-[selected=true]:bg-surface"
        >
          Anywhere in Sierra Leone
          {value === "" ? <Check className="size-4 text-gold-ink" aria-hidden /> : null}
        </Command.Item>
        {matches.map((d) => (
          <Command.Item
            key={d.id}
            value={d.id}
            onSelect={() => onPick(d.id)}
            className="flex min-h-11 cursor-pointer items-center justify-between rounded-lg px-3 text-sm data-[selected=true]:bg-surface"
          >
            {d.name}
            {value === d.id ? <Check className="size-4 text-gold-ink" aria-hidden /> : null}
          </Command.Item>
        ))}
        {matches.length === 0 ? <p className="px-3 py-3 text-sm text-muted">No matching place. Try a town or region.</p> : null}
      </Command.List>
    </Command>
  );
}

export function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-6 py-2">
      <div>
        <p id={id} className="text-sm font-medium text-heading">
          {label}
        </p>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>
      <div role="group" aria-labelledby={id} className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Fewer ${label.toLowerCase()}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="grid size-10 place-items-center rounded-full border border-line text-heading transition-colors hover:border-gold disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-gold"
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <output aria-live="polite" className="w-6 text-center text-sm font-medium tabular-nums text-heading">
          {value}
        </output>
        <button
          type="button"
          aria-label={`More ${label.toLowerCase()}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="grid size-10 place-items-center rounded-full border border-line text-heading transition-colors hover:border-gold disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-gold"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

/** react-day-picker, themed through its CSS variables so it follows the active site theme. */
export function Calendar({
  mode,
  checkIn,
  checkOut,
  date,
  onRange,
  onDate,
}: {
  mode: "range" | "single";
  checkIn?: string;
  checkOut?: string;
  date?: string;
  onRange?: (r: DateRange | undefined) => void;
  onDate?: (d: Date | undefined) => void;
}) {
  const today = startOfToday();
  const [months, setMonths] = useState(1);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setMonths(mq.matches ? 2 : 1);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const style = {
    "--rdp-accent-color": "var(--color-brand)",
    "--rdp-accent-background-color": "var(--color-surface)",
    "--rdp-range_middle-background-color": "var(--color-surface)",
    "--rdp-range_middle-color": "var(--color-ink)",
    "--rdp-selected-border": "2px solid var(--color-gold-ink)",
    "--rdp-today-color": "var(--color-gold-ink)",
    "--rdp-day_button-height": "2.5rem",
    "--rdp-day_button-width": "2.5rem",
    color: "var(--color-ink)",
  } as React.CSSProperties;
  return (
    <div style={style} className="text-sm">
      {mode === "range" ? (
        <DayPicker
          mode="range"
          numberOfMonths={months}
          startMonth={today}
          disabled={{ before: today }}
          selected={checkIn ? { from: parseISO(checkIn), to: checkOut ? parseISO(checkOut) : undefined } : undefined}
          onSelect={onRange}
          defaultMonth={checkIn ? parseISO(checkIn) : today}
        />
      ) : (
        <DayPicker
          mode="single"
          numberOfMonths={1}
          startMonth={today}
          disabled={{ before: today }}
          selected={date ? parseISO(date) : undefined}
          onSelect={onDate}
          defaultMonth={date ? parseISO(date) : today}
        />
      )}
    </div>
  );
}

/**
 * The floating white search pill. It edits a local draft and commits on Search,
 * so the results underneath only change when the visitor asks. Stays and Dining
 * use different fields, not the same hotel fields relabelled. Nothing here
 * checks live availability, because none exists: dates and guests travel with
 * the enquiry, and the copy says so.
 */
export function SearchBar({
  value,
  destinations,
  cuisines,
  onSearch,
  className,
}: {
  value: HospitalitySearch;
  destinations: readonly DestinationOption[];
  cuisines: readonly string[];
  onSearch: (next: HospitalitySearch) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState<OpenId>("");
  const stays = value.kind === "stays";

  // Follow the committed search (a reset, a shared link, a mode switch).
  useEffect(() => setDraft(value), [value]);

  const set = (patch: Partial<HospitalitySearch>) => setDraft((d) => ({ ...d, ...patch }));
  const toggle = (name: OpenId) => (o: boolean) => setOpen((cur) => (o ? name : cur === name ? "" : cur));
  const destName = destinations.find((d) => d.id === draft.dest)?.name ?? "";
  const guests = draft.adults + draft.children;
  const rangeBad = Boolean(draft.checkIn && draft.checkOut && !isValidRange(draft.checkIn, draft.checkOut));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = { ...draft };
    if (next.kind === "stays" && !isValidRange(next.checkIn, next.checkOut)) next.checkOut = "";
    setOpen("");
    onSearch(next);
  }

  const Divider = () => <span aria-hidden className="hidden h-8 w-px shrink-0 bg-line lg:block" />;

  return (
    <form
      onSubmit={submit}
      role="search"
      aria-label={stays ? "Search places to stay" : "Search places to dine"}
      className={cn(
        "grid gap-0.5 rounded-[1.25rem] border border-line/70 bg-page p-1.5 shadow-[var(--shadow-lift)] sm:grid-cols-2 lg:flex lg:items-center lg:gap-0 lg:rounded-full",
        className,
      )}
    >
      <Field
        label="Destination"
        value={destName}
        placeholder="Anywhere in Sierra Leone"
        icon={<MapPin className="size-4" />}
        open={open === "dest"}
        onOpenChange={toggle("dest")}
        className="lg:flex-[1.5]"
      >
        <DestinationList
          options={destinations}
          value={draft.dest}
          onPick={(id) => {
            set({ dest: id });
            setOpen("");
          }}
        />
      </Field>
      <Divider />

      {stays ? (
        <>
          <Field
            label="Check in"
            value={show(draft.checkIn)}
            placeholder="Add date"
            icon={<CalendarDays className="size-4" />}
            open={open === "in"}
            onOpenChange={toggle("in")}
            contentClassName="w-auto"
          >
            <Calendar
              mode="range"
              checkIn={draft.checkIn}
              checkOut={draft.checkOut}
              onRange={(r) => {
                const from = r?.from ? toIso(r.from) : "";
                const to = r?.to ? toIso(r.to) : "";
                // A range that ends the day it starts is not a stay: wait for a later check-out.
                if (from && to && !isValidRange(from, to)) set({ checkIn: from, checkOut: "" });
                else {
                  set({ checkIn: from, checkOut: to });
                  if (from && to) setOpen("");
                }
              }}
            />
          </Field>
          <Divider />
          <Field
            label="Check out"
            value={show(draft.checkOut)}
            placeholder="Add date"
            icon={<CalendarDays className="size-4" />}
            open={open === "out"}
            onOpenChange={toggle("out")}
            contentClassName="w-auto"
          >
            <Calendar
              mode="range"
              checkIn={draft.checkIn}
              checkOut={draft.checkOut}
              onRange={(r) => {
                const from = r?.from ? toIso(r.from) : "";
                const to = r?.to ? toIso(r.to) : "";
                if (from && to && !isValidRange(from, to)) set({ checkIn: from, checkOut: "" });
                else {
                  set({ checkIn: from, checkOut: to });
                  if (from && to) setOpen("");
                }
              }}
            />
          </Field>
          <Divider />
          <Field
            label="Guests"
            value={guests === 2 && draft.children === 0 ? "2 adults" : `${guests} ${guests === 1 ? "guest" : "guests"}`}
            placeholder="Add guests"
            icon={<Users className="size-4" />}
            open={open === "guests"}
            onOpenChange={toggle("guests")}
          >
            <div className="w-[min(18rem,calc(100vw-3rem))]">
              <Stepper label="Adults" hint="Age 13 or above" value={draft.adults} min={1} max={12} onChange={(n) => set({ adults: n })} />
              <Stepper label="Children" hint="Under 13" value={draft.children} min={0} max={8} onChange={(n) => set({ children: n })} />
            </div>
          </Field>
        </>
      ) : (
        <>
          <Field
            label="Date"
            value={show(draft.date)}
            placeholder="Add date"
            icon={<CalendarDays className="size-4" />}
            open={open === "date"}
            onOpenChange={toggle("date")}
            contentClassName="w-auto"
          >
            <Calendar
              mode="single"
              date={draft.date}
              onDate={(d) => {
                set({ date: d ? toIso(d) : "" });
                if (d) setOpen("");
              }}
            />
          </Field>
          <Divider />
          <label className="group flex min-h-12 min-w-0 cursor-pointer items-center gap-2.5 lg:flex-1 rounded-full px-3.5 py-1.5 transition-colors duration-200 hover:bg-surface focus-within:outline-2 focus-within:outline-gold motion-reduce:transition-none lg:px-4">
            <Clock className="size-4 shrink-0 text-gold-ink" aria-hidden />
            <span className="min-w-0">
              <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-muted">Time</span>
              <select
                value={draft.time}
                onChange={(e) => set({ time: e.target.value })}
                className="block w-full cursor-pointer appearance-none bg-transparent text-sm font-medium text-heading focus:outline-none"
              >
                <option value="">Any time</option>
                {TIMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <Divider />
          <Field
            label="Party size"
            value={`${draft.party} ${draft.party === 1 ? "guest" : "guests"}`}
            placeholder="Add guests"
            icon={<Users className="size-4" />}
            open={open === "party"}
            onOpenChange={toggle("party")}
          >
            <div className="w-[min(18rem,calc(100vw-3rem))]">
              <Stepper label="Guests" value={draft.party} min={1} max={20} onChange={(n) => set({ party: n })} />
            </div>
          </Field>
          <Divider />
          <Field
            label="Cuisine"
            value={draft.cuisines[0] ? draft.cuisines[0].replace(/^./, (c) => c.toUpperCase()) : ""}
            placeholder="Any cuisine"
            icon={<UtensilsCrossed className="size-4" />}
            open={open === "cuisine"}
            onOpenChange={toggle("cuisine")}
          >
            <ul className="w-[min(16rem,calc(100vw-3rem))]" aria-label="Cuisine">
              {["", ...cuisines].map((c) => {
                const on = (draft.cuisines[0] ?? "") === c.toLowerCase();
                return (
                  <li key={c || "any"}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        set({ cuisines: c ? [c.toLowerCase()] : [] });
                        setOpen("");
                      }}
                      className="flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-left text-sm hover:bg-surface focus-visible:outline-2 focus-visible:outline-gold"
                    >
                      {c || "Any cuisine"}
                      {on ? <Check className="size-4 text-gold-ink" aria-hidden /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Field>
        </>
      )}

      <div className="sm:col-span-2 lg:col-span-1 lg:pl-2">
        <Button type="submit" disabled={rangeBad} aria-label={stays ? "Search places to stay" : "Search places to dine"} className="w-full rounded-full lg:size-10 lg:min-h-10 lg:w-10 lg:px-0">
          <Search className="size-4" aria-hidden />
          <span className="lg:sr-only">Search</span>
        </Button>
      </div>
    </form>
  );
}
