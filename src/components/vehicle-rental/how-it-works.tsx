import { Compass, Settings, Sliders, CheckCircle2 } from "lucide-react";

const steps = [
  { icon: Compass, num: "01", title: "Choose Your Journey", description: "Select pickup, destination and dates that fit your itinerary." },
  { icon: Sliders, num: "02", title: "Choose Your Vehicle", description: "Compare vehicles and find the right match for your group and terrain." },
  { icon: Settings, num: "03", title: "Send Your Enquiry", description: "Add driver, pickup services and any extras, then send it to the desk." },
  { icon: CheckCircle2, num: "04", title: "Confirm & Travel", description: "The team confirms availability and pricing directly with you before you travel." },
];

export function HowItWorks() {
  return (
    <section className="container-page py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold-ink">How It Works</p>
      <h2 className="mt-2 font-display text-4xl text-heading">Four steps to a confirmed vehicle</h2>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <div key={step.num} className="flex flex-col rounded-lg border border-line bg-surface p-6">
            <div className="flex items-center gap-3">
              <step.icon className="size-6 text-gold" aria-hidden />
              <span className="font-display text-sm text-gold-ink">{step.num}</span>
            </div>
            <h3 className="mt-4 font-display text-xl text-heading">{step.title}</h3>
            <p className="mt-2 text-sm text-muted leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
