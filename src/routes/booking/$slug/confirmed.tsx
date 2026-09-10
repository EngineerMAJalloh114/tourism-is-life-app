import { createFileRoute, Link } from "@tanstack/react-router";
import { getTour } from "@/data/catalog";
import { Button } from "@/components/ui/button";

type Search = { ref?: string; t?: string };

export const Route = createFileRoute("/booking/$slug/confirmed")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    ref: typeof s.ref === "string" ? s.ref : undefined,
    t: typeof s.t === "string" ? s.t : undefined,
  }),
  component: Confirmed,
});

function Confirmed() {
  const { slug } = Route.useParams();
  const { ref, t } = Route.useSearch();
  const tour = getTour(slug);
  const checkoutHref = ref ? `/checkout/${ref}/confirmation${t ? `?t=${encodeURIComponent(t)}` : ""}` : null;
  return (
    <div className="container-page py-20">
      <p className="text-xs uppercase tracking-[0.2em] text-gold">Booking</p>
      <h1 className="mt-2 font-display text-4xl text-brand">Continue to confirmation</h1>
      <p className="mt-4 max-w-xl text-muted">
        {tour?.title}. A seat hold is not a paid booking. Confirmation and the voucher are issued only after
        a verified payment event.
      </p>
      <div className="mt-8 flex gap-3">
        {checkoutHref ? (
          <Button asChild>
            <a href={checkoutHref}>Open checkout</a>
          </Button>
        ) : (
          <Button asChild>
            <Link to="/booking/$slug" params={{ slug }}>
              Check availability
            </Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link to="/tours">Keep exploring</Link>
        </Button>
      </div>
    </div>
  );
}
