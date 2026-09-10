import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { destinations } from "@/data/catalog";

const destVehicles: Record<string, string[]> = {
  freetown: ["Sedan", "SUV", "Economy", "Luxury"],
  "freetown-peninsula": ["SUV", "Van", "Economy"],
  "banana-island": ["Van", "Minibus"],
  tacugama: ["SUV", "Van"],
  "bumbuna-falls": ["SUV", "4x4"],
  bintumani: ["4x4", "SUV"],
  "wara-wara": ["4x4", "SUV"],
  bo: ["Sedan", "SUV", "Van"],
  tiwai: ["SUV", "Van"],
  "turtle-islands": ["Van", "Minibus"],
  gola: ["SUV", "4x4"],
  kenema: ["Sedan", "SUV"],
  kono: ["4x4", "SUV"],
};

export function DestinationVehicles() {
  return (
    <section className="bg-surface py-20">
      <div className="container-page">
        <p className="text-xs uppercase tracking-[0.22em] text-gold">Explore More of Sierra Leone</p>
        <h2 className="mt-2 font-display text-4xl text-brand">Vehicles for every destination</h2>
        <p className="mt-3 max-w-2xl text-muted">
          From Freetown's peninsula to remote northern circuits, the right vehicle makes the journey easier.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {destinations
            .filter((d) => destVehicles[d.slug])
            .slice(0, 6)
            .map((d) => (
              <Link
                key={d.slug}
                to="/destinations/$circuit/$slug"
                params={{ circuit: d.circuit, slug: d.slug }}
                className="group flex flex-col rounded-lg border border-line bg-ivory p-5 transition duration-300 hover:border-gold"
              >
                <div className="flex items-center gap-2 text-gold">
                  <MapPin className="size-4" aria-hidden />
                  <span className="text-sm font-medium">{d.name}</span>
                </div>
                <p className="mt-2 text-xs text-muted">{d.summary.slice(0, 120)}…</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(destVehicles[d.slug] || []).map((v) => (
                    <span key={v} className="rounded-full bg-surface px-2.5 py-1 text-[11px] text-muted">{v}</span>
                  ))}
                </div>
                <p className="mt-3 text-sm font-medium text-brand group-hover:text-gold">Explore destination</p>
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
}
