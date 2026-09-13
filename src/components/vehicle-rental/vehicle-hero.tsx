import { useState } from "react";
import { VehicleSearchForm } from "./vehicle-search-form";
import { type BookingSearch } from "@/data/vehicle-rental";

export function VehicleHero() {
  const [, setQuery] = useState<Partial<BookingSearch>>({});

  function handleSearch(search: Partial<BookingSearch>) {
    setQuery(search);
    const el = document.getElementById("vehicle-results");
    el?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="relative isolate min-h-[70vh] overflow-hidden bg-brand-dark text-ivory">
      <img
        src="/images/vehicles/hero-safari-savannah.webp"
        alt="4x4 vehicle on a dirt track through grassland — editorial stand-in for overland travel"
        className="absolute inset-0 size-full object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/60 to-brand-dark/20" />
      <div className="film-grain pointer-events-none absolute inset-0" />
      <div className="container-page relative pb-24 pt-28">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.28em] text-gold">Tourism Is Life Vehicle Rental</p>
          <h1 className="mt-4 font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            Explore More. Travel Freely.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ivory/80">
            Reliable vehicles for exploring Sierra Leone and your next destination. From airport transfers to overland adventures.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {["Flexible options", "Local destinations", "Professional drivers", "Quick enquiry", "Airport pickup", "Tour-ready"].map((benefit) => (
              <span key={benefit} className="rounded-full border border-ivory/20 bg-ivory/10 px-3 py-1.5 text-xs text-ivory/90 backdrop-blur-sm">
                {benefit}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-10 -mx-4 sm:mx-0">
          <VehicleSearchForm onSearch={handleSearch} />
        </div>
      </div>
    </section>
  );
}
