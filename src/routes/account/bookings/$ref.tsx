import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listMyBookings, submitReview } from "@/lib/server/ops";
import { getTour } from "@/data/catalog";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";

export const Route = createFileRoute("/account/bookings/$ref")({
  component: BookingDetail,
});

function BookingDetail() {
  const { ref } = Route.useParams();
  const [booking, setBooking] = useState<Awaited<ReturnType<typeof listMyBookings>>[number] | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void listMyBookings().then((rows) => setBooking(rows.find((b) => b.id === ref) ?? null));
  }, [ref]);

  if (!booking) return <p className="text-sm text-muted">Loading booking…</p>;
  const tour = getTour(booking.tour_slug);

  async function onReview(form: HTMLFormElement) {
    const fd = new FormData(form);
    try {
      await submitReview({
        data: {
          bookingId: booking.id,
          rating: Number(fd.get("rating")),
          body: String(fd.get("body") ?? ""),
        },
      });
      setStatus("Review submitted for moderation.");
      form.reset();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not send review");
    }
  }

  return (
    <article>
      <p className="text-sm">
        <Link to="/account/bookings" className="text-brand hover:text-gold">
          All bookings
        </Link>
      </p>
      <h2 className="mt-2 font-display text-3xl text-brand">{tour?.title ?? booking.tour_slug}</h2>
      <p className="mt-2 text-sm text-muted">
        {booking.id} · {booking.status} · {booking.travel_date} · {booking.guests} guests
      </p>
      {booking.voucher_code ? <p className="mt-3 font-medium">Voucher {booking.voucher_code}</p> : null}
      {booking.status === "CONFIRMED" ? (
        <form
          className="mt-8 max-w-md space-y-3 rounded-lg border border-line bg-surface p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void onReview(e.currentTarget);
          }}
        >
          <h3 className="font-display text-xl text-brand">Leave a review</h3>
          <Label htmlFor="rating">Rating</Label>
          <select
            id="rating"
            name="rating"
            className="min-h-11 w-full rounded-md border border-line bg-ivory px-3 text-sm"
            defaultValue="5"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <Label htmlFor="body">Comments</Label>
          <Textarea id="body" name="body" required minLength={12} />
          {status ? <p className="text-sm text-muted">{status}</p> : null}
          <Button type="submit">Submit for moderation</Button>
        </form>
      ) : null}
    </article>
  );
}
