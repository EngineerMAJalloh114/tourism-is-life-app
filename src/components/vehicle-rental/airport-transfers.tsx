import { Plane, Car, Users, Briefcase, Star, Shield } from "lucide-react";
import { Link } from "@tanstack/react-router";

const scenarios = [
  {
    icon: Plane,
    title: "Airport Transfers",
    description: "Comfortable airport-to-hotel transportation. Meet-and-greet available at Freetown International.",
    image: "/images/vehicles/van-airport-minivan.webp",
    link: "/contact",
  },
  {
    icon: Users,
    title: "Family Tours",
    description: "Spacious vehicles for families. SUVs and vans with extra luggage and child seat options.",
    image: "/images/vehicles/suv-coastal-family.webp",
    link: "/tours",
  },
  {
    icon: Shield,
    title: "Adventure Trips",
    description: "4x4 vehicles for difficult destinations like Mount Bintumani, Gola Rainforest, and northern circuits.",
    image: "/images/vehicles/4x4-desert-dunes.webp",
    link: "/tours",
  },
  {
    icon: Car,
    title: "Group Tours",
    description: "Vans and minibuses for groups. From 7-seaters to 40-seater coaches for large parties.",
    image: "/images/vehicles/minibus-group-boarding.webp",
    link: "/tours",
  },
  {
    icon: Briefcase,
    title: "Business Travel",
    description: "Professional transportation for corporate visits, meetings, and business travel across Sierra Leone.",
    image: "/images/vehicles/luxury-black-city.webp",
    link: "/contact",
  },
  {
    icon: Star,
    title: "Luxury Experiences",
    description: "Premium vehicles for special journeys. First-class comfort and style for VIP travel.",
    image: "/images/vehicles/luxury-chauffeur-umbrella.webp",
    link: "/contact",
  },
];

export function AirportTransfers() {
  return (
    <section className="container-page py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold-ink">Tour-Ready Transportation</p>
      <h2 className="mt-2 font-display text-4xl text-heading">Vehicles Made For Your Journey</h2>
      <p className="mt-3 max-w-2xl text-muted">
        Every vehicle is selected for Sierra Leone's roads and your itinerary. From airport runs to remote overland, we match the vehicle to the journey.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((item) => (
          <Link
            key={item.title}
            to={item.link}
            className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img src={item.image} alt={item.title} className="size-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/70 to-transparent" />
              <div className="absolute bottom-3 left-3">
                <span className="inline-flex items-center gap-1.5 rounded-sm bg-brand/90 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-ivory">
                  <item.icon className="size-3" aria-hidden />
                  {item.title}
                </span>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <p className="text-sm text-muted leading-relaxed">{item.description}</p>
              <p className="mt-4 text-sm font-medium text-gold-ink group-hover:text-heading">Learn more</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
