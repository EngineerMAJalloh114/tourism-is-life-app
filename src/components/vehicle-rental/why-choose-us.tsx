import { Compass, Shield, Clock, Headphones } from "lucide-react";

const benefits = [
  {
    icon: Compass,
    title: "Local Expertise",
    description: "Travel with people who understand Sierra Leone's destinations, roads, and conditions.",
  },
  {
    icon: Shield,
    title: "Flexible Travel",
    description: "Choose a vehicle that matches your journey: economy cars, 4x4s, self-drive, or with a driver.",
  },
  {
    icon: Clock,
    title: "Transparent Pricing",
    description: "Clear per-day rates without confusing surprises. What you see is what you pay.",
  },
  {
    icon: Headphones,
    title: "Reliable Support",
    description: "Assistance throughout your journey. Local team, 24/7 emergency contact available.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="bg-surface py-20">
      <div className="container-page">
        <p className="text-xs uppercase tracking-[0.22em] text-gold-ink">Why Tourism Is Life</p>
        <h2 className="mt-2 font-display text-4xl text-heading">Built for tourism. Driven by local knowledge.</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((item) => (
            <div key={item.title} className="flex gap-4 rounded-lg border border-line bg-page p-6 transition duration-300 hover:shadow-[var(--shadow-card)]">
              <item.icon className="mt-0.5 size-6 text-gold" aria-hidden />
              <div>
                <p className="font-medium text-heading">{item.title}</p>
                <p className="mt-2 text-sm text-muted leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
