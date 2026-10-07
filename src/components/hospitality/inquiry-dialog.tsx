import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, X } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { submitEnquiry } from "@/lib/server/ops";

/**
 * Request availability / request a table. It sends through the existing
 * enquiry flow (`submitEnquiry`, type B2C): the row is written to the database
 * first and the desk is emailed, exactly like every other enquiry on the site.
 * It never claims the place is booked, held or available.
 */
export function InquiryDialog({
  trigger,
  title,
  summary,
  details,
  context,
  messageLabel = "Message",
  messageHint,
  cta,
}: {
  trigger: ReactNode;
  title: string;
  /** Human-readable lines shown back to the visitor, e.g. "5 Oct to 8 Oct". */
  summary: string[];
  /** Structured fields added to the enquiry payload. */
  details: Record<string, string>;
  /** Tells the desk where the enquiry came from. */
  context: string;
  messageLabel?: string;
  messageHint?: string;
  cta: string;
}) {
  const { user } = useCurrentUserState();
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Capture the form now: React clears currentTarget after the first await.
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload: Record<string, string> = { ...details, context };
    fd.forEach((v, k) => {
      const value = String(v).trim();
      if (value) payload[k] = value;
    });
    if (user?.primaryEmail && !payload.email) payload.email = user.primaryEmail;
    setStatus("saving");
    setError("");
    try {
      await submitEnquiry({ data: { type: "B2C", payload } });
      setStatus("ok");
      form.reset();
    } catch (err) {
      setStatus("err");
      setError(err instanceof Error ? err.message : "Could not send.");
    }
  }

  return (
    <Dialog.Root onOpenChange={(o) => o && setStatus("idle")}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="carousel-panel-in fixed inset-0 z-[60] bg-brand-dark/70 backdrop-blur-sm" />
        <Dialog.Content className="sus-rise fixed inset-x-3 bottom-3 z-[60] mx-auto max-h-[92vh] max-w-lg overflow-y-auto rounded-3xl border border-line bg-page p-5 text-ink shadow-[var(--shadow-lift)] focus:outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="font-display text-2xl text-heading">{title}</Dialog.Title>
            <Dialog.Close aria-label="Close" className="grid size-11 shrink-0 place-items-center rounded-full border border-line focus-visible:outline-2 focus-visible:outline-gold">
              <X className="size-5" aria-hidden />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-muted">
            This sends an enquiry to our team. Nothing is booked or paid online, and availability is confirmed with the place.
          </Dialog.Description>

          {summary.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Your request">
              {summary.map((s) => (
                <li key={s} className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink">
                  {s}
                </li>
              ))}
            </ul>
          ) : null}

          {status === "ok" ? (
            <div role="status" className="mt-6 flex items-start gap-3 rounded-2xl bg-surface p-4 text-sm">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
              <p>
                <strong className="font-medium text-heading">Enquiry sent.</strong> Our team will reply by email with what the place
                confirms.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              {!user ? (
                <div>
                  <Label htmlFor="inq-name">Your name</Label>
                  <Input id="inq-name" name="name" required autoComplete="name" />
                </div>
              ) : null}
              <div>
                <Label htmlFor="inq-email">Email</Label>
                <Input id="inq-email" name="email" type="email" required autoComplete="email" defaultValue={user?.primaryEmail ?? ""} />
              </div>
              <div>
                <Label htmlFor="inq-phone">Phone (optional)</Label>
                <Input id="inq-phone" name="phone" type="tel" autoComplete="tel" />
              </div>
              <div>
                <Label htmlFor="inq-message">{messageLabel}</Label>
                <Textarea id="inq-message" name="message" required placeholder={messageHint} />
              </div>
              {status === "err" ? (
                <p role="alert" className="text-sm text-danger">
                  {error}
                </p>
              ) : null}
              <Button type="submit" size="lg" className="w-full" disabled={status === "saving"}>
                {status === "saving" ? "Sending…" : cta}
              </Button>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
