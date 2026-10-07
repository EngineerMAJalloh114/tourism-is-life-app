import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { VehicleCategory, DriverOption } from "@/data/vehicle-rental";
import { vehicleTypeOptions, driverOptions } from "@/data/vehicle-rental";

type Filters = {
  type: VehicleCategory | "any";
  driver: DriverOption;
  maxPrice: number;
  minSeats: number;
  ac: boolean;
};

export function VehicleFilters({
  filters,
  onChange,
  resultCount,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
  resultCount: number;
}) {
  const [open, setOpen] = useState(false);

  const content = (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg text-heading">Filters</h3>
        <p className="mt-1 text-sm text-muted">{resultCount} vehicles</p>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted">Vehicle Type</label>
        <select
          value={filters.type}
          onChange={(e) => onChange({ ...filters, type: e.target.value as Filters["type"] })}
          className="min-h-11 w-full rounded-md border border-line bg-page px-3 text-sm focus-visible:border-gold"
        >
          {vehicleTypeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted">Driver Option</label>
        <select
          value={filters.driver}
          onChange={(e) => onChange({ ...filters, driver: e.target.value as DriverOption })}
          className="min-h-11 w-full rounded-md border border-line bg-page px-3 text-sm focus-visible:border-gold"
        >
          {driverOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted">Max Daily Rate (USD)</label>
        <input
          type="range"
          min={20}
          max={400}
          step={10}
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-gold"
        />
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span>$20</span>
          <span className="font-medium text-heading">${filters.maxPrice}</span>
          <span>$400</span>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted">Min Seats</label>
        <input
          type="range"
          min={1}
          max={40}
          step={1}
          value={filters.minSeats}
          onChange={(e) => onChange({ ...filters, minSeats: Number(e.target.value) })}
          className="w-full accent-gold"
        />
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span>1</span>
          <span className="font-medium text-heading">{filters.minSeats} seats</span>
          <span>40</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="ac-filter"
          type="checkbox"
          checked={filters.ac}
          onChange={(e) => onChange({ ...filters, ac: e.target.checked })}
          className="size-4 rounded border-line accent-gold"
        />
        <label htmlFor="ac-filter" className="text-sm text-ink">Air Conditioning</label>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:border-gold"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          Filters
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">{content}</aside>

      {/* Mobile bottom sheet */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-brand-dark/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-page p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl text-heading">Filters</h3>
              <button onClick={() => setOpen(false)} className="rounded-md p-2 text-muted hover:text-heading">
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="mt-4">{content}</div>
            <button
              onClick={() => setOpen(false)}
              className="mt-6 w-full rounded-md bg-gold py-3 text-sm font-medium text-brand-dark"
            >
              Apply Filters
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
