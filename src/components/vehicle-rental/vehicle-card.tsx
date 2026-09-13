import { Link } from "@tanstack/react-router";
import { Car, MapPin, Users, Luggage, Gauge, Fuel, Settings, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/data/vehicle-rental";

const specIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  seats: Users,
  doors: Car,
  luggage: Luggage,
  transmission: Settings,
  fuel: Fuel,
  ac: Snowflake,
};

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const availabilityColor =
    vehicle.availability === "available" ? "text-ok" : vehicle.availability === "limited" ? "text-warn" : "text-danger";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <Link to="/services/vehicle-rental/vehicles/$vehicleId" params={{ vehicleId: vehicle.id }} className="relative block aspect-[4/3] overflow-hidden">
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
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-2xl text-brand">
          <Link to="/services/vehicle-rental/vehicles/$vehicleId" params={{ vehicleId: vehicle.id }} className="hover:text-gold">
            {vehicle.name}
          </Link>
        </h3>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1"><Users className="size-3.5" aria-hidden /> {vehicle.seats} seats</span>
          <span className="inline-flex items-center gap-1"><Luggage className="size-3.5" aria-hidden /> {vehicle.luggage} bags</span>
          <span className="inline-flex items-center gap-1"><Settings className="size-3.5" aria-hidden /> {vehicle.transmission}</span>
          <span className="inline-flex items-center gap-1"><Fuel className="size-3.5" aria-hidden /> {vehicle.fuelType}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {vehicle.features.slice(0, 4).map((f) => (
            <span key={f} className="rounded-full bg-ivory px-2.5 py-1 text-[11px] text-muted">{f}</span>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <MapPin className="size-3.5 text-gold" aria-hidden />
          <span className="text-muted">{vehicle.location}</span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          <div>
            <p className={cn("text-xs font-medium uppercase tracking-[0.14em]", availabilityColor)}>
              {vehicle.availability === "available" ? "Available" : vehicle.availability === "limited" ? "Limited" : "Unavailable"}
            </p>
            <p className="mt-1 font-display text-xl text-brand">
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

function Button({ className, variant, size, asChild, ...props }: any) {
  const base = "inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-wide transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 min-h-11 px-5 text-sm";
  const variants: Record<string, string> = {
    primary: "bg-gold text-brand-dark hover:bg-gold/90",
    dark: "bg-brand text-ivory hover:bg-brand-dark",
    outline: "border border-line bg-transparent text-ink hover:border-gold hover:text-brand",
    ghost: "text-ivory hover:bg-ivory/10",
    ivory: "bg-ivory text-brand hover:bg-surface",
  };
  const sizes: Record<string, string> = {
    default: "min-h-11 px-5",
    sm: "min-h-9 px-3 text-xs uppercase tracking-[0.14em]",
    lg: "min-h-12 px-7 text-base",
  };
  const Comp = asChild ? "span" : "button";
  return <Comp className={cn(base, variants[variant || "primary"], sizes[size || "default"], className)} {...props} />;
}
