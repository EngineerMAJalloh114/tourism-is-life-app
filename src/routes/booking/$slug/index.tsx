import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getTour } from "@/data/catalog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createHold, getAvailability } from "@/lib/server/ops";
import { storeCheckout } from "@/lib/checkout-session";
import { pageHead } from "@/lib/seo";
import { EnquiryForm } from "@/components/enquiry-form";

export const Route = createFileRoute("/booking/$slug/")({
  head: ({ params }) =>
    pageHead("Check availability", "Hold seats for a Sierra Leone tour.", `/booking/${params.slug}`),
  component: BookingPage,
});

function BookingPage() {
  const { slug } = Route.useParams();
  const tour = getTour(slug);
  const navigate = useNavigate();
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(2);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!tour) throw notFound();
  const activeTour = tour;

  useEffect(() => {
    if (!date || !tour.bookable) return;
    void getAvailability({ data: { tourSlug: tour.slug, travelDate: date } })
      .then((r) => setRemaining(r.remaining))
      .catch(() => setRemaining(null));
  }, [date, tour.bookable, tour.slug]);

  if (!tour.bookable) {
    return (
      <div className="container-page py-12">
        <h1 className="font-display text-4xl text-heading">Quote-only programme</h1>
        <p className="mt-3 text-muted">This itinerary is not self-serve. Send a quote request instead.</p>
        <div className="mt-8 max-w-lg">
          <EnquiryForm type="B2C" contextLabel={tour.title} />
        </div>
      </div>
    );
  }

  async function hold() {
    setBusy(true);
    setError(null);
    try {
      const r = await createHold({
        data: { tourSlug: activeTour.slug, travelDate: date, guests },
      });
      storeCheckout({ id: r.id, token: r.accessToken, tourSlug: activeTour.slug });
      void navigate({
        to: "/checkout/$ref/guests",
        params: { ref: r.id },
        search: { t: r.accessToken },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not hold";
      setError(msg.includes("CAPACITY") ? "That date is full. Choose another." : msg);
    } finally {
      setBusy(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="container-page py-12">
      <p className="text-sm text-muted">
        <Link to="/tours/$slug" params={{ slug: tour.slug }}>
          {tour.title}
        </Link>
      </p>
      <h1 className="mt-2 font-display text-4xl text-heading">Check availability</h1>
      <p className="mt-3 max-w-xl text-muted">
        Guest checkout is open. You can hold seats without creating an account, and holds last 15 minutes.
      </p>
      <ol className="mt-6 flex gap-4 text-xs uppercase tracking-[0.14em] text-muted">
        <li className="text-heading">1. Date</li>
        <li>2. Guests</li>
        <li>3. Payment</li>
      </ol>
      <div className="mt-8 max-w-md space-y-4">
        <div>
          <Label htmlFor="date">Travel date</Label>
          <Input id="date" type="date" min={today} required value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="guests">Guests</Label>
          <Input
            id="guests"
            type="number"
            min={tour.groupMin}
            max={tour.groupMax}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
          />
          <p className="mt-1 text-xs text-muted">
            Group size {tour.groupMin}–{tour.groupMax}.
          </p>
        </div>
        {remaining !== null ? (
          <p className="text-sm text-muted" aria-live="polite">
            {remaining} seat{remaining === 1 ? "" : "s"} remaining on this date.
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="button" disabled={!date || busy} onClick={() => void hold()}>
          {busy ? "Holding seats…" : "Hold seats for 15 minutes"}
        </Button>
      </div>
    </div>
  );
}
