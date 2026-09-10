import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { getVehicle } from "@/data/vehicle-rental";

const steps = ["Vehicle", "Journey", "Services", "Details", "Review"];

type FormData = {
  pickup: string;
  destination: string;
  date: string;
  driver: string;
  name: string;
  email: string;
  phone: string;
};

export function VehicleBooking() {
  const { vehicleId } = useParams({ from: "/services/vehicle-rental/book/$vehicleId" });
  const vehicle = getVehicle(vehicleId);
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    pickup: "",
    destination: "",
    date: "",
    driver: vehicle?.driverOption === "self-drive" ? "self-drive" : "with-driver",
    name: "",
    email: "",
    phone: "",
  });

  if (!vehicle) {
    return (
      <div className="container-page py-24 text-center">
        <p className="font-display text-2xl text-brand">Vehicle not found</p>
        <Button asChild className="mt-4">
          <Link to="/services/vehicle-rental">Back to search</Link>
        </Button>
      </div>
    );
  }

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function next() {
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (step < steps.length - 1) {
      next();
      return;
    }
    navigate({ to: "/services/vehicle-rental/book/$vehicleId/confirmation", params: { vehicleId } });
  }

  return (
    <div className="bg-surface py-12">
      <div className="container-page">
        <div className="mb-8">
          <Link to="/services/vehicle-rental" className="text-sm text-brand hover:text-gold">← Back to search</Link>
          <h1 className="mt-2 font-display text-4xl text-brand">Book {vehicle.name}</h1>
        </div>

        <div className="mb-8 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn("flex size-8 items-center justify-center rounded-full text-xs font-medium", i <= step ? "bg-gold text-brand-dark" : "bg-line text-muted")}>
                {i + 1}
              </div>
              <span className={cn("hidden text-sm sm:inline", i <= step ? "text-brand" : "text-muted")}>{s}</span>
              {i < steps.length - 1 ? <div className="mx-2 h-px w-8 bg-line" /> : null}
            </div>
          ))}
        </div>

        <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-lg border border-line bg-ivory p-6">
            {step === 0 && (
              <div>
                <h2 className="font-display text-2xl text-brand">Vehicle Summary</h2>
                <div className="mt-4 flex gap-4 rounded-md bg-surface p-4">
                  <img src={vehicle.image} alt={vehicle.imageAlt} className="aspect-[4/3] w-32 rounded-md object-cover" />
                  <div>
                    <p className="font-medium text-brand">{vehicle.name}</p>
                    <p className="mt-1 text-sm text-muted">{vehicle.seats} seats · {vehicle.luggage} bags · {vehicle.transmission}</p>
                    <p className="mt-2 font-display text-xl text-brand">
                      From {new Intl.NumberFormat("en-US", { style: "currency", currency: vehicle.pricing.currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format((vehicle.pricing.dailyRateCents ?? 0) / 100)}/day
                    </p>
                  </div>
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-display text-2xl text-brand">Journey Details</h2>
                <Field name="pickup" label="Pickup Location" value={form.pickup} onChange={(v: string) => update("pickup", v)} required />
                <Field name="destination" label="Destination" value={form.destination} onChange={(v: string) => update("destination", v)} required />
                <Field name="date" label="Pickup Date" type="date" value={form.date} onChange={(v: string) => update("date", v)} required />
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-display text-2xl text-brand">Additional Services</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {["Professional driver", "Airport pickup", "Child seat", "Extra luggage", "Fuel package", "Tour guide"].map((svc) => (
                    <label key={svc} className="flex items-center gap-2 rounded-md border border-line bg-surface p-3 cursor-pointer">
                      <input type="checkbox" className="size-4 rounded border-line accent-gold" />
                      <span className="text-sm text-ink">{svc}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="font-display text-2xl text-brand">Your Details</h2>
                <Field name="name" label="Full Name" value={form.name} onChange={(v: string) => update("name", v)} required />
                <Field name="email" label="Email" type="email" value={form.email} onChange={(v: string) => update("email", v)} required />
                <Field name="phone" label="Phone" value={form.phone} onChange={(v: string) => update("phone", v)} />
              </div>
            )}
            {step === 4 && (
              <div>
                <h2 className="font-display text-2xl text-brand">Review & Confirm</h2>
                <div className="mt-4 space-y-3 rounded-md bg-surface p-4 text-sm text-muted">
                  <p><strong className="text-brand">Vehicle:</strong> {vehicle.name}</p>
                  <p><strong className="text-brand">Pickup:</strong> {form.pickup || "Not provided"}</p>
                  <p><strong className="text-brand">Destination:</strong> {form.destination || "Not provided"}</p>
                  <p><strong className="text-brand">Date:</strong> {form.date || "Not provided"}</p>
                  <p><strong className="text-brand">Driver:</strong> {form.driver}</p>
                  <p><strong className="text-brand">Contact:</strong> {form.name} · {form.email}</p>
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-between">
              {step > 0 ? <Button type="button" variant="outline" onClick={back}>Back</Button> : <div />}
              <Button type="submit">{step < steps.length - 1 ? "Continue" : "Confirm Booking"}</Button>
            </div>
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-line bg-surface p-6">
              <h3 className="font-display text-xl text-brand">Booking Summary</h3>
              <div className="mt-4 flex gap-4">
                <img src={vehicle.image} alt={vehicle.imageAlt} className="aspect-[4/3] w-24 rounded-md object-cover" />
                <div>
                  <p className="font-medium text-brand">{vehicle.name}</p>
                  <p className="mt-1 text-sm text-muted">Daily rate from</p>
                  <p className="font-display text-xl text-brand">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: vehicle.pricing.currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format((vehicle.pricing.dailyRateCents ?? 0) / 100)}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted">Fuel, additional services, and driver fees (if applicable) are calculated at confirmation.</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ name, label, value, onChange, type = "text", required }: { name: string; label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  );
}

function cn(...inputs: (string | boolean | undefined | null)[]) {
  return inputs.filter(Boolean).join(" ");
}
