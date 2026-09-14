import { createFileRoute } from "@tanstack/react-router";
import { JsonLd } from "@/components/json-ld";
import { pageHead, organizationJsonLd } from "@/lib/seo";
import { VehicleHero } from "@/components/vehicle-rental/vehicle-hero";
import { VehicleCategoryCard } from "@/components/vehicle-rental/vehicle-category-card";
import { VehicleGrid } from "@/components/vehicle-rental/vehicle-grid";
import { WhyChooseUs } from "@/components/vehicle-rental/why-choose-us";
import { HowItWorks } from "@/components/vehicle-rental/how-it-works";
import { AirportTransfers } from "@/components/vehicle-rental/airport-transfers";
import { DestinationVehicles } from "@/components/vehicle-rental/destination-vehicles";
import { vehicleCategories, vehicles, getPopularVehicles } from "@/data/vehicle-rental";

export const Route = createFileRoute("/services/vehicle-rental/")({
  head: () =>
    pageHead(
      "Vehicle Rental in Sierra Leone · Tourism Is Life",
      "Chauffeured and self-drive vehicles for tours, airport transfers, and overland travel in Sierra Leone.",
      "/services/vehicle-rental",
    ),
  component: Page,
});

function Page() {
  const popular = getPopularVehicles();

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <VehicleHero />
      <section id="vehicle-results" className="container-page py-16 scroll-mt-24">
        <p className="text-xs uppercase tracking-[0.22em] text-gold-ink">Vehicles For Every Journey</p>
        <h2 className="mt-2 font-display text-4xl text-brand">Choose your vehicle</h2>
        <p className="mt-3 max-w-2xl text-muted">
          Economy cars, 4x4s, and group coaches, all maintained for Sierra Leone's roads and conditions.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {vehicleCategories.map((cat) => (
            <VehicleCategoryCard key={cat.slug} category={cat} onClick={(slug) => {
              const el = document.getElementById("vehicle-results");
              el?.scrollIntoView({ behavior: "smooth" });
              setTimeout(() => {
                const input = document.getElementById("vehicle-type") as HTMLSelectElement | null;
                if (input) input.value = slug;
                const event = new Event("change", { bubbles: true });
                input?.dispatchEvent(event);
              }, 500);
            }} />
          ))}
        </div>

        <div className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gold-ink">Popular Choices</p>
              <h3 className="mt-2 font-display text-3xl text-brand">Tour-ready vehicles</h3>
            </div>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((v) => (
              <div key={v.id} className="vehicle-card-anchor">
                {/* VehicleGrid handles rendering; we reuse the same filter logic inline for the popular section */}
                <article className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
                  <a href={`/services/vehicle-rental/vehicles/${v.id}`} className="relative block aspect-[4/3] overflow-hidden">
                    <img src={v.image} alt={v.imageAlt} className="size-full object-cover transition duration-700 hover:scale-105" loading="lazy" />
                    <span className="absolute left-3 top-3 rounded-sm bg-brand/90 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-ivory">{v.category.replace("-", " ")}</span>
                    {v.popular ? <span className="absolute right-3 top-3 rounded-sm bg-gold px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-brand-dark">Popular</span> : null}
                  </a>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-2xl text-brand">
                      <a href={`/services/vehicle-rental/vehicles/${v.id}`} className="hover:text-gold">{v.name}</a>
                    </h3>
                    <p className="mt-2 text-sm text-muted">{v.description.slice(0, 120)}…</p>
                    <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                      <p className="font-display text-xl text-brand">
                        From {new Intl.NumberFormat("en-US", { style: "currency", currency: v.pricing.currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format((v.pricing.dailyRateCents ?? 0) / 100)}
                        <span className="text-sm font-sans text-muted">/day</span>
                      </p>
                      <a href={`/services/vehicle-rental/vehicles/${v.id}`} className="text-sm font-medium text-gold hover:text-brand">View Details</a>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <h3 className="font-display text-3xl text-brand">All Available Vehicles</h3>
          <VehicleGrid initialVehicles={vehicles} />
        </div>
      </section>
      <WhyChooseUs />
      <HowItWorks />
      <AirportTransfers />
      <DestinationVehicles />
    </>
  );
}
