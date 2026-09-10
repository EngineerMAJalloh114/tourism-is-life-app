import { Link } from "@tanstack/react-router";
import { type Vehicle } from "@/data/vehicle-rental";
import { Button } from "@/components/ui/button";

export function VehicleDetail({ vehicle }: { vehicle: Vehicle }) {
  return (
    <>
      <section className="bg-surface py-12">
        <div className="container-page grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gold">{vehicle.category.replace("-", " ")}</p>
            <h1 className="mt-2 font-display text-4xl text-brand lg:text-5xl">{vehicle.name}</h1>
            <p className="mt-4 text-muted leading-relaxed">{vehicle.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {vehicle.features.map((f) => (
                <span key={f} className="rounded-full border border-line bg-ivory px-3 py-1.5 text-xs text-muted">{f}</span>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Spec label="Seats" value={String(vehicle.seats)} />
              <Spec label="Doors" value={String(vehicle.doors)} />
              <Spec label="Luggage" value={String(vehicle.luggage)} />
              <Spec label="Transmission" value={vehicle.transmission} />
              <Spec label="Fuel" value={vehicle.fuelType} />
              <Spec label="AC" value={vehicle.ac ? "Yes" : "No"} />
            </div>
            <div className="mt-8">
              <h2 className="font-display text-2xl text-brand">Rental Conditions</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
                {vehicle.rentalConditions.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div className="mt-8">
              <h2 className="font-display text-2xl text-brand">Available Destinations</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {vehicle.destinations.map((d) => (
                  <span key={d} className="rounded-full border border-line bg-ivory px-3 py-1.5 text-xs text-muted">{d.replace(/-/g, " ")}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-line bg-ivory p-6 shadow-[var(--shadow-card)]">
              <img src={vehicle.image} alt={vehicle.imageAlt} className="aspect-[4/3] w-full rounded-md object-cover" />
              <div className="mt-6">
                <p className="font-display text-3xl text-brand">
                  From {new Intl.NumberFormat("en-US", { style: "currency", currency: vehicle.pricing.currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format((vehicle.pricing.dailyRateCents ?? 0) / 100)}
                  <span className="text-sm font-sans text-muted">/day</span>
                </p>
                <p className="mt-1 text-xs text-muted">Fuel not included. Driver available on request.</p>
                <Button asChild className="mt-4 w-full" size="lg">
                  <Link to="/services/vehicle-rental/book/$vehicleId" params={{ vehicleId: vehicle.id }}>Book This Vehicle</Link>
                </Button>
                <Button asChild variant="outline" className="mt-2 w-full">
                  <Link to="/services/vehicle-rental">Back to search</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-surface p-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 font-medium text-brand">{value}</p>
    </div>
  );
}
