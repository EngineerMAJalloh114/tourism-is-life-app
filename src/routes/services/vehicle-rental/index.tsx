import { createFileRoute } from "@tanstack/react-router";
import { JsonLd } from "@/components/json-ld";
import { pageHead, organizationJsonLd } from "@/lib/seo";
import { VehicleHero } from "@/components/vehicle-rental/vehicle-hero";
import { VehicleCategoryCard } from "@/components/vehicle-rental/vehicle-category-card";
import { VehicleCard } from "@/components/vehicle-rental/vehicle-card";
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
      <section id="vehicle-results" className="container-page py-10 scroll-mt-24">
        <p className="text-xs uppercase tracking-[0.22em] text-gold-ink">Vehicles For Every Journey</p>
        <h2 className="mt-2 font-display text-4xl text-heading">Choose your vehicle</h2>
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
              <h3 className="mt-2 font-display text-3xl text-heading">Tour-ready vehicles</h3>
            </div>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        </div>

        <div className="mt-16">
          <h3 className="font-display text-3xl text-heading">All Available Vehicles</h3>
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
