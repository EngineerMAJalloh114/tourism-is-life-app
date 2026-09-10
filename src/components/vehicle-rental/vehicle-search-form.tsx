import { useState, type FormEvent } from "react";
import { Calendar, Clock, Users, Car, MapPin, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { BookingSearch } from "@/data/vehicle-rental";
import { pickupLocations, destinationsList, vehicleTypeOptions, driverOptions } from "@/data/vehicle-rental";

export function VehicleSearchForm({ onSearch }: { onSearch: (search: Partial<BookingSearch>) => void }) {
  const [form, setForm] = useState<Partial<BookingSearch>>({
    pickupLocation: "",
    destination: "",
    pickupDate: "",
    pickupTime: "",
    returnDate: "",
    returnTime: "",
    vehicleType: "any",
    passengers: 1,
    driverOption: "both",
    airportPickup: false,
  });

  function update<K extends keyof BookingSearch>(key: K, value: BookingSearch[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    onSearch(form);
  }

  function reset() {
    setForm({
      pickupLocation: "",
      destination: "",
      pickupDate: "",
      pickupTime: "",
      returnDate: "",
      returnTime: "",
      vehicleType: "any",
      passengers: 1,
      driverOption: "both",
      airportPickup: false,
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-line bg-surface p-4 shadow-[var(--shadow-lift)] sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="pickup">Pickup Location</Label>
          <div className="relative mt-1.5">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" aria-hidden />
            <select
              id="pickup"
              value={form.pickupLocation}
              onChange={(e) => update("pickupLocation", e.target.value)}
              className="min-h-11 w-full rounded-md border border-line bg-ivory pl-10 pr-3 text-sm focus-visible:border-gold"
            >
              <option value="">Select pickup</option>
              {pickupLocations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label htmlFor="destination">Destination</Label>
          <div className="relative mt-1.5">
            <Car className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" aria-hidden />
            <select
              id="destination"
              value={form.destination}
              onChange={(e) => update("destination", e.target.value)}
              className="min-h-11 w-full rounded-md border border-line bg-ivory pl-10 pr-3 text-sm focus-visible:border-gold"
            >
              <option value="">Select destination</option>
              {destinationsList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label htmlFor="pickup-date">Pickup Date</Label>
          <div className="relative mt-1.5">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" aria-hidden />
            <input
              id="pickup-date"
              type="date"
              value={form.pickupDate}
              onChange={(e) => update("pickupDate", e.target.value)}
              className="min-h-11 w-full rounded-md border border-line bg-ivory pl-10 pr-3 text-sm focus-visible:border-gold"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="pickup-time">Pickup Time</Label>
          <div className="relative mt-1.5">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" aria-hidden />
            <input
              id="pickup-time"
              type="time"
              value={form.pickupTime}
              onChange={(e) => update("pickupTime", e.target.value)}
              className="min-h-11 w-full rounded-md border border-line bg-ivory pl-10 pr-3 text-sm focus-visible:border-gold"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="return-date">Return Date</Label>
          <div className="relative mt-1.5">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" aria-hidden />
            <input
              id="return-date"
              type="date"
              value={form.returnDate}
              onChange={(e) => update("returnDate", e.target.value)}
              className="min-h-11 w-full rounded-md border border-line bg-ivory pl-10 pr-3 text-sm focus-visible:border-gold"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="return-time">Return Time</Label>
          <div className="relative mt-1.5">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" aria-hidden />
            <input
              id="return-time"
              type="time"
              value={form.returnTime}
              onChange={(e) => update("returnTime", e.target.value)}
              className="min-h-11 w-full rounded-md border border-line bg-ivory pl-10 pr-3 text-sm focus-visible:border-gold"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="vehicle-type">Vehicle Type</Label>
          <div className="relative mt-1.5">
            <Car className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" aria-hidden />
            <select
              id="vehicle-type"
              value={form.vehicleType}
              onChange={(e) => update("vehicleType", e.target.value as any)}
              className="min-h-11 w-full rounded-md border border-line bg-ivory pl-10 pr-3 text-sm focus-visible:border-gold"
            >
              {vehicleTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label htmlFor="passengers">Passengers</Label>
          <div className="relative mt-1.5">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" aria-hidden />
            <input
              id="passengers"
              type="number"
              min={1}
              max={40}
              value={form.passengers}
              onChange={(e) => update("passengers", parseInt(e.target.value, 10) || 1)}
              className="min-h-11 w-full rounded-md border border-line bg-ivory pl-10 pr-3 text-sm focus-visible:border-gold"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="driver">Driver Option</Label>
          <div className="relative mt-1.5">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" aria-hidden />
            <select
              id="driver"
              value={form.driverOption}
              onChange={(e) => update("driverOption", e.target.value as any)}
              className="min-h-11 w-full rounded-md border border-line bg-ivory pl-10 pr-3 text-sm focus-visible:border-gold"
            >
              {driverOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 rounded-md border border-line bg-ivory px-3 py-2.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.airportPickup}
              onChange={(e) => update("airportPickup", e.target.checked)}
              className="size-4 rounded border-line accent-gold"
            />
            <Plane className="size-4 text-muted" aria-hidden />
            <span className="text-muted">Airport pickup</span>
          </label>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="submit" size="lg" className="flex-1 sm:flex-none">Find Vehicles</Button>
        <Button type="button" variant="outline" onClick={reset}>Reset</Button>
      </div>
    </form>
  );
}
