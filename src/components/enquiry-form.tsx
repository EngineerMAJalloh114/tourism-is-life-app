import { useState, type FormEvent } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { submitEnquiry } from "@/lib/server/ops";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

type Kind = "B2C" | "B2B" | "CRUISE" | "MICE";

export function EnquiryForm({
  type,
  contextLabel,
}: {
  type: Kind;
  contextLabel?: string;
}) {
  const { user, isPending } = useCurrentUserState();
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Capture the form element now — React nulls out a SyntheticEvent's
    // currentTarget once the native event has finished dispatching, so
    // reading e.currentTarget after the `await submitEnquiry` below throws.
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload: Record<string, string> = {};
    fd.forEach((v, k) => {
      payload[k] = String(v);
    });
    if (contextLabel) payload.context = contextLabel;
    if (user?.primaryEmail && !payload.email) payload.email = user.primaryEmail;
    setStatus("saving");
    try {
      await submitEnquiry({ data: { type, payload } });
      setStatus("ok");
      form.reset();
    } catch (err) {
      setStatus("err");
      setMessage(err instanceof Error ? err.message : "Could not send.");
    }
  }

  if (isPending) {
    return <div className="h-48 animate-pulse rounded-lg bg-surface" aria-hidden />;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-line bg-surface p-6">
      <p className="text-xs uppercase tracking-[0.16em] text-gold">
        {user ? "Saved to your account" : "Guest enquiry — no account required"}
      </p>
      {type === "B2B" ? (
        <>
          <Field name="company" label="Company" required />
          <Field name="contact" label="Contact person" required />
          <Field name="volume" label="Estimated volume" />
          <Field name="destinations" label="Destinations of interest" />
        </>
      ) : null}
      {type === "CRUISE" ? (
        <>
          <Field name="ship" label="Ship name" required />
          <Field name="arrival" label="Arrival date & time" required />
          <Field name="passengers" label="Passenger count" required />
          <Field name="excursions" label="Shore excursion requirements" />
          <Field name="logistics" label="Logistics notes" />
        </>
      ) : null}
      {type === "MICE" ? (
        <>
          <Field name="eventType" label="Event type" required />
          <Field name="attendees" label="Attendees" required />
          <Field name="dates" label="Dates" required />
        </>
      ) : null}
      {type === "B2C" ? (
        <>
          <Field name="name" label="Your name" required={!user} />
          <Field name="destination" label="Preferred destination" />
          <Field name="dates" label="Travel dates" />
          <Field name="travelers" label="Number of travelers" />
        </>
      ) : null}
      <Field
        name="email"
        label="Email"
        required
        type="email"
        defaultValue={user?.primaryEmail ?? ""}
      />
      <Field name="phone" label="Phone" />
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" required />
      </div>
      {status === "ok" ? (
        <p className="text-sm text-ok" role="status">
          Received. The public site describes replies within 24 hours.
        </p>
      ) : null}
      {status === "err" ? (
        <p className="text-sm text-danger" role="alert">
          {message}
        </p>
      ) : null}
      <Button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Sending…" : "Submit enquiry"}
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
