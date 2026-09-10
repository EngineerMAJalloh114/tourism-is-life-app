import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MessageCircle, MessageSquare } from "lucide-react";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/services/vehicle-rental/book/$vehicleId/confirmation")({
  component: Confirmation,
});

function Confirmation() {
  const { vehicleId } = Route.useParams();
  const ref = `TIL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  return (
    <div className="container-page py-24">
      <div className="mx-auto max-w-xl text-center">
        <CheckCircle2 className="mx-auto size-16 text-ok" aria-hidden />
        <h1 className="mt-6 font-display text-4xl text-brand">Booking Request Received</h1>
        <p className="mt-4 text-muted">
          Thank you for your booking request. Our team will confirm availability and pricing within 24 hours.
        </p>
        <div className="mt-6 rounded-lg border border-line bg-surface p-6 text-left">
          <p className="text-xs uppercase tracking-[0.16em] text-gold">Booking Reference</p>
          <p className="mt-2 font-mono text-lg text-brand">{ref}</p>
          <p className="mt-4 text-sm text-muted">
            A confirmation email will be sent shortly. For urgent requests, contact us at{" "}
            <a href={SITE.phoneHref} className="text-brand underline" aria-label="Call Tourism Is Life">{SITE.phone}</a>,{" "}
            <a href={SITE.whatsappHref} className="text-brand underline inline-flex items-center gap-1" aria-label="Chat with Tourism Is Life on WhatsApp" target="_blank" rel="noopener noreferrer"><MessageCircle className="size-3.5" />WhatsApp</a>, or{" "}
            <a href={SITE.smsHref} className="text-brand underline inline-flex items-center gap-1" aria-label="Message Tourism Is Life"><MessageSquare className="size-3.5" />SMS</a>.
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
