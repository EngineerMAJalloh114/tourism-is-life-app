import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MessageCircle, MessageSquare } from "lucide-react";
import { SITE } from "@/lib/site";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/services/vehicle-rental/book/$vehicleId/confirmation")({
  validateSearch: (s: Record<string, unknown>) => ({
    ref: typeof s.ref === "string" ? s.ref : undefined,
  }),
  head: () => pageHead("Enquiry Received", "Your vehicle rental enquiry has been sent to Tourism Is Life.", "/services/vehicle-rental"),
  component: Confirmation,
});

function Confirmation() {
  const { ref } = Route.useSearch();

  if (!ref) {
    return (
      <div className="container-page py-24">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="font-display text-3xl text-brand">No enquiry to show</h1>
          <p className="mt-4 text-muted">
            This page only shows a reference right after you submit a vehicle rental enquiry. If you meant to send
            one, start from the vehicle you're interested in.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/services/vehicle-rental">Browse vehicles</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-24">
      <div className="mx-auto max-w-xl text-center">
        <CheckCircle2 className="mx-auto size-16 text-ok" aria-hidden />
        <h1 className="mt-6 font-display text-4xl text-brand">Enquiry Received</h1>
        <p className="mt-4 text-muted">
          Thank you. Your enquiry has been sent to the Freetown desk. The team will confirm vehicle availability
          and pricing directly with you, usually within 24 hours.
        </p>
        <div className="mt-6 rounded-lg border border-line bg-surface p-6 text-left">
          <p className="text-xs uppercase tracking-[0.16em] text-gold-ink">Enquiry Reference</p>
          <p className="mt-2 font-mono text-lg text-brand">{ref}</p>
          <p className="mt-4 text-sm text-muted">
            For urgent requests, contact us directly at{" "}
            <a href={SITE.phoneHref} className="text-brand underline">{SITE.phone}</a>,{" "}
            <a href={SITE.whatsappHref} className="text-brand underline inline-flex items-center gap-1" aria-label={`WhatsApp ${SITE.phone}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-3.5" />WhatsApp</a>, or{" "}
            <a href={SITE.smsHref} className="text-brand underline inline-flex items-center gap-1"><MessageSquare className="size-3.5" />SMS</a>.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/services/vehicle-rental">Browse More Vehicles</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
