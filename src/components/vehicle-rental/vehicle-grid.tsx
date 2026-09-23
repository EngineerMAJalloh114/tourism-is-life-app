import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { VehicleCard } from "./vehicle-card";
import { VehicleFilters } from "./vehicle-filters";
import { sortVehicles, filterVehicles, type Vehicle, type VehicleCategory, type DriverOption } from "@/data/vehicle-rental";

const sortOptions = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "seats-desc", label: "Most Seats" },
];

export function VehicleGrid({ initialVehicles: _initialVehicles }: { initialVehicles: Vehicle[] }) {
  const [sortBy, setSortBy] = useState("recommended");
  const [filters, setFilters] = useState({
    type: "any" as VehicleCategory | "any",
    driver: "both" as DriverOption,
    maxPrice: 400,
    minSeats: 1,
    ac: false,
  });

  const filtered = useMemo(() => {
    let list = filterVehicles({
      vehicleType: filters.type,
      passengers: filters.minSeats,
      driverOption: filters.driver,
    });
    if (filters.ac) {
      list = list.filter((v) => v.ac);
    }
    list = list.filter((v) => (v.pricing.dailyRateCents ?? 0) / 100 <= filters.maxPrice);
    return sortVehicles(list, sortBy);
  }, [filters, sortBy]);

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      <VehicleFilters
        filters={filters}
        onChange={setFilters}
        resultCount={filtered.length}
      />
      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted">
            {filtered.length} {filtered.length === 1 ? "vehicle" : "vehicles"} available
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="min-h-10 rounded-md border border-line bg-page px-3 text-sm focus-visible:border-gold"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface p-12 text-center">
            <p className="font-display text-2xl text-heading">No vehicles match your search</p>
            <p className="mt-2 text-sm text-muted">Try adjusting your dates, location, or filters.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() =>
                setFilters({
                  type: "any",
                  driver: "both",
                  maxPrice: 400,
                  minSeats: 1,
                  ac: false,
                })
              }
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
