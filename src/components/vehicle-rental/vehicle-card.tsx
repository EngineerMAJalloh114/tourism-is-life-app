import { Link } from "@tanstack/react-router";
import { MapPin, Users, Luggage, Fuel, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Vehicle } from "@/data/vehicle-rental";

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  // "Limited" uses gold-ink, not --color-warn: --color-warn (#B8862F) measures
  // 2.75:1 on --color-surface, well under the 4.5:1 small text needs, and this
  // is its only call site in the codebase, so a global token retune wasn't
  // worth the wider risk. gold-ink is already proven AA-safe here (5.29:1+).
  const availabilityColor =
    vehicle.availability === "available" ? "text-ok" : vehicle.availability === "limited" ? "text-gold-ink" : "text-danger";

  return (
    <article className="glass-card group relative isolate flex h-full flex-col overflow-hidden rounded-lg shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <Link
        to="/services/vehicle-rental/vehicles/$vehicleId"
        params={{ vehicleId: vehicle.id }}
        className="relative z-10 block aspect-[16/9] overflow-hidden sm:aspect-[3/2]"
      >
        <img src={vehicle.image} alt={vehicle.imageAlt} className="size-full object-cover transition duration-700 hover:scale-105" loading="lazy" />
        <span className="absolute left-3 top-3 rounded-sm bg-brand/90 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-ivory">
          {vehicle.category.replace("-", " ")}
        </span>
        {vehicle.popular ? (
          <span className="absolute right-3 top-3 rounded-sm bg-gold px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-brand-dark">
            Popular
          </span>
        ) : null}
      </Link>
      <div className="relative z-10 flex flex-1 flex-col p-3.5 sm:p-4">
        <h3 className="font-display text-lg text-heading sm:text-xl">
          <Link to="/services/vehicle-rental/vehicles/$vehicleId" params={{ vehicleId: vehicle.id }} className="hover:text-gold-ink">
            {vehicle.name}
          </Link>
        </h3>
        <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1"><Users className="size-3.5" aria-hidden /> {vehicle.seats} seats</span>
          <span className="inline-flex items-center gap-1"><Luggage className="size-3.5" aria-hidden /> {vehicle.luggage} bags</span>
          <span className="inline-flex items-center gap-1"><Settings className="size-3.5" aria-hidden /> {vehicle.transmission}</span>
          <span className="inline-flex items-center gap-1"><Fuel className="size-3.5" aria-hidden /> {vehicle.fuelType}</span>
        </div>
        {/* Feature tags are the least essential row here — the seats/luggage/
            transmission/fuel line above already carries the facts a visitor
            compares vehicles on — so they drop out below sm, where every row
            costs the most relative to how little of the page is visible. */}
        <div className="mt-2 hidden flex-wrap gap-2 sm:flex">
          {vehicle.features.slice(0, 3).map((f) => (
            <span key={f} className="rounded-full bg-page px-2.5 py-1 text-[11px] text-muted">{f}</span>
          ))}
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-sm sm:mt-2">
          <MapPin className="size-3.5 text-gold" aria-hidden />
          <span className="text-muted">{vehicle.location}</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2.5">
          <div>
            <p className={cn("text-xs font-medium uppercase tracking-[0.14em]", availabilityColor)}>
              {vehicle.availability === "available" ? "Available" : vehicle.availability === "limited" ? "Limited" : "Unavailable"}
            </p>
            <p className="mt-0.5 font-display text-lg text-heading">
              From {new Intl.NumberFormat("en-US", { style: "currency", currency: vehicle.pricing.currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format((vehicle.pricing.dailyRateCents ?? 0) / 100)}
              <span className="text-sm font-sans text-muted">/day</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/services/vehicle-rental/vehicles/$vehicleId" params={{ vehicleId: vehicle.id }}>Details</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/services/vehicle-rental/book/$vehicleId" params={{ vehicleId: vehicle.id }}>Enquire</Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
