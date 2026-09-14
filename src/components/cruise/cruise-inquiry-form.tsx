import { useState, type FormEvent } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { submitEnquiry } from "@/lib/server/ops";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { excursions } from "@/data/cruise";

export function CruiseInquiryForm({
  preferredExcursion,
}: {
  preferredExcursion?: string;
}) {
  const { user, isPending } = useCurrentUserState();
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload: Record<string, string> = {};
    fd.forEach((value, key) => {
      payload[key] = String(value);
    });
    if (user?.primaryEmail && !payload.email) payload.email = user.primaryEmail;
    payload.context = "Cruise ship page: request a cruise plan";
    setStatus("saving");
    setMessage("");
    try {
      await submitEnquiry({ data: { type: "CRUISE", payload } });
      setStatus("ok");
      form.reset();
    } catch (err) {
      setStatus("err");
      setMessage(
        err instanceof Error ? err.message : "We couldn't submit your request. Please try again.",
      );
    }
  }

  if (isPending) {
    return <div className="h-48 animate-pulse rounded-lg bg-surface" aria-hidden />;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8 rounded-lg border border-line bg-surface p-6">
      <p className="text-xs uppercase tracking-[0.16em] text-gold-ink">
        {user ? "Saved to your account" : "Guest request, no account required"}
      </p>
      <p className="text-sm text-muted">
        This is a planning request, not live inventory. The desk confirms programmes in writing.
      </p>

      <fieldset>
        <legend className="font-display text-2xl text-brand">Cruise information</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field name="ship" label="Cruise / vessel name" required />
          <Field name="arrival" label="Expected arrival date" type="date" required />
          <Field name="departureDate" label="Departure date" type="date" />
          <Field name="passengers" label="Number of passengers" type="number" required />
          <div className="sm:col-span-2">
            <Label htmlFor="excursions">Preferred shore excursion</Label>
            <select
              id="excursions"
              name="excursions"
              defaultValue={preferredExcursion ?? ""}
              className="min-h-11 w-full rounded-md border border-line bg-ivory px-3 text-sm"
            >
              <option value="">Not sure yet</option>
              {excursions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-display text-2xl text-brand">Traveler requirements</legend>
        <div className="mt-4 grid gap-4">
          <Field name="preferredActivities" label="Preferred activities" />
          <div>
            <Label htmlFor="specialRequirements">Special requirements</Label>
            <Textarea id="specialRequirements" name="specialRequirements" />
          </div>
          <Field name="mealRequirements" label="Meal requirements" />
          <Field name="transportationRequirements" label="Transportation requirements" />
          <Field name="additionalServices" label="Additional services" />
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-display text-2xl text-brand">Contact</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field name="name" label="Name" required={!user} defaultValue={user?.displayName ?? ""} />
          <Field name="company" label="Company / organization" />
          <Field
            name="email"
            label="Email"
            type="email"
            required
            defaultValue={user?.primaryEmail ?? ""}
          />
          <Field name="phone" label="Phone" />
          <Field name="country" label="Country" />
        </div>
      </fieldset>

      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" required placeholder="Ship schedule, passenger mix, or operational notes." />
      </div>

      {status === "ok" ? (
        <p className="text-sm text-ok" role="status">
          Request received. The desk follows up in writing. This is not a live booking confirmation.
        </p>
      ) : null}
      {status === "err" ? (
        <p className="text-sm text-danger" role="alert">
          {message || "We couldn't submit your request. Please try again."}
        </p>
      ) : null}

      <Button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Sending…" : "Request a cruise plan"}
      </Button>
    </form>
  );
}

function Field({
  name,
  label,
  required,
  type = "text",
  defaultValue,
}: {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} defaultValue={defaultValue} />
    </div>
  );
}
