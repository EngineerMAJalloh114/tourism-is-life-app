import { Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { getTour } from "@/data/catalog";
import {
  cancelBooking,
  confirmDemoPayment,
  failPayment,
  getCheckoutBooking,
  initiatePayment,
  saveGuestDetails,
  type BookingRow,
} from "@/lib/server/ops";
import { readCheckout, storeCheckout } from "@/lib/checkout-session";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

type PaymentModeInfo = { provider: string; live: boolean; label: string };
type CheckoutBooking = BookingRow & { paymentMode?: PaymentModeInfo };

type Step =
  | "guests"
  | "review"
  | "payment"
  | "processing"
  | "confirmation"
  | "failed"
  | "expired"
  | "cancelled"
  | "voucher";

const STEPS: { id: Step; label: string }[] = [
  { id: "guests", label: "Guests" },
  { id: "review", label: "Review" },
  { id: "payment", label: "Payment" },
  { id: "confirmation", label: "Confirmed" },
];

export function CheckoutView({ step }: { step: Step }) {
  const { ref } = useParams({ strict: false }) as { ref: string };
  const search = useSearch({ strict: false }) as { t?: string };
  const navigate = useNavigate();
  const stored = readCheckout(ref);
  const token = search.t || stored?.token || "";
  const [booking, setBooking] = useState<CheckoutBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ref || !token) return;
    void getCheckoutBooking({ data: { id: ref, token } })
      .then((row) => {
        setBooking(row);
        storeCheckout({ id: row.id, token, tourSlug: row.tour_slug });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load booking"));
  }, [ref, token]);

  if (!token) {
    return (
      <div className="container-page py-20">
        <h1 className="font-display text-3xl text-brand">Resume checkout</h1>
        <p className="mt-3 text-muted">
          This hold lives in this browser. Start again from the tour if the link is missing its access token.
        </p>
        <Button asChild className="mt-6">
          <Link to="/tours">Browse tours</Link>
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-page py-20">
        <h1 className="font-display text-3xl text-brand">Checkout unavailable</h1>
        <p className="mt-3 text-danger">{error}</p>
      </div>
    );
  }

  if (!booking) {
    return <div className="container-page py-24 text-muted">Loading reservation…</div>;
  }

  const tour = getTour(booking.tour_slug);
  const q = `?t=${encodeURIComponent(token)}`;

  function go(next: Step) {
    void navigate({ href: `/checkout/${booking.id}/${next}${q}` });
  }

  return (
    <div className="container-page py-12">
      <p className="text-sm text-muted">
        <Link to="/tours/$slug" params={{ slug: booking.tour_slug }}>
          {tour?.title ?? booking.tour_slug}
        </Link>
        {" · "}
        {booking.id}
      </p>
      <h1 className="mt-2 font-display text-4xl text-brand">Checkout</h1>
      <ol className="mt-6 flex flex-wrap gap-4 text-xs uppercase tracking-[0.14em] text-muted">
        {STEPS.map((s, i) => (
          <li key={s.id} className={s.id === step ? "text-brand" : ""}>
            {i + 1}. {s.label}
          </li>
        ))}
      </ol>
      {booking.status === "EXPIRED" && step !== "expired" ? (
        <p className="mt-6 rounded-md border border-warn/40 bg-surface px-4 py-3 text-sm">
          This hold expired.{" "}
          <Link className="text-brand" to="/tours/$slug" params={{ slug: booking.tour_slug }}>
            Choose a new date
          </Link>
          .
        </p>
      ) : null}

      {step === "guests" ? <GuestsForm booking={booking} token={token} onDone={() => go("review")} /> : null}
      {step === "review" ? (
        <ReviewPanel booking={booking} tourTitle={tour?.title ?? booking.tour_slug} onPay={() => go("payment")} />
      ) : null}
      {step === "payment" ? (
        <PaymentPanel
          booking={booking}
          token={token}
          busy={busy}
          setBusy={setBusy}
          setError={setError}
          onOk={() => go("confirmation")}
          onFail={() => go("failed")}
        />
      ) : null}
      {step === "processing" ? (
        <p className="mt-10 text-muted">Waiting for a verified payment event…</p>
      ) : null}
      {step === "confirmation" ? <ConfirmPanel booking={booking} tourTitle={tour?.title ?? ""} token={token} /> : null}
      {step === "voucher" ? <VoucherPanel booking={booking} tourTitle={tour?.title ?? ""} /> : null}
      {step === "failed" ? (
        <StatusPanel
          title="Payment was not completed"
          body="The hold has been released. You can start a new reservation from the tour page."
        />
      ) : null}
      {step === "expired" ? (
        <StatusPanel title="This hold expired" body="Seats return to the pool after 15 minutes without payment." />
      ) : null}
      {step === "cancelled" ? (
        <StatusPanel title="Reservation cancelled" body="Nothing has been charged." />
      ) : null}

      {booking.status === "HOLD" || booking.status === "PENDING_PAYMENT" ? (
        <button
          type="button"
          className="mt-10 text-sm text-muted hover:text-danger"
          onClick={async () => {
            await cancelBooking({ data: { id: booking.id, token } });
            go("cancelled");
          }}
        >
          Cancel this reservation
        </button>
      ) : null}
    </div>
  );
}

function GuestsForm({
  booking,
  token,
  onDone,
}: {
  booking: BookingRow;
  token: string;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await saveGuestDetails({
        data: {
          id: booking.id,
          token,
          guestName: String(fd.get("guestName") ?? ""),
          guestEmail: String(fd.get("guestEmail") ?? ""),
          guestPhone: String(fd.get("guestPhone") ?? ""),
          notes: String(fd.get("notes") ?? ""),
        },
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-md space-y-4">
      <p className="text-sm text-muted">
        Guest checkout is available — you do not need an account to finish this booking.
      </p>
      <div>
        <Label htmlFor="guestName">Lead guest name</Label>
        <Input id="guestName" name="guestName" required defaultValue={booking.guest_name} minLength={2} />
      </div>
      <div>
        <Label htmlFor="guestEmail">Email</Label>
        <Input id="guestEmail" name="guestEmail" type="email" required defaultValue={booking.guest_email} />
      </div>
      <div>
        <Label htmlFor="guestPhone">Phone</Label>
        <Input id="guestPhone" name="guestPhone" defaultValue={booking.guest_phone ?? ""} />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={booking.notes ?? ""} />
      </div>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Continue to review"}
      </Button>
    </form>
  );
}

function ReviewPanel({
  booking,
  tourTitle,
  onPay,
}: {
  booking: BookingRow;
  tourTitle: string;
  onPay: () => void;
}) {
  return (
    <div className="mt-8 max-w-lg rounded-lg border border-line bg-surface p-6">
      <h2 className="font-display text-2xl text-brand">Review</h2>
      <ul className="mt-4 space-y-1 text-sm">
        <li>{tourTitle}</li>
        <li>
          {booking.travel_date} · {booking.guests} guests
        </li>
        <li>{booking.guest_name}</li>
        <li>{booking.guest_email}</li>
      </ul>
      <p className="mt-4 text-sm text-muted">
        Prices are quoted in writing. This reservation holds seats, not a published fare.
      </p>
      <Button className="mt-6" type="button" onClick={onPay}>
        Continue to payment
      </Button>
    </div>
  );
}

function PaymentPanel({
  booking,
  token,
  busy,
  setBusy,
  setError,
  onOk,
  onFail,
}: {
  booking: CheckoutBooking;
  token: string;
  busy: boolean;
  setBusy: (v: boolean) => void;
  setError: (v: string | null) => void;
  onOk: () => void;
  onFail: () => void;
}) {
  const mode = booking.paymentMode;
  async function demoPay() {
    setBusy(true);
    setError(null);
    try {
      await confirmDemoPayment({ data: { id: booking.id, token } });
      onOk();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
      onFail();
    } finally {
      setBusy(false);
    }
  }
  async function demoFail() {
    setBusy(true);
    try {
      await failPayment({ data: { id: booking.id, token } });
      onFail();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 max-w-lg rounded-lg border border-line bg-surface p-6">
      <p className="text-xs uppercase tracking-[0.16em] text-gold">{mode?.label ?? "Test settlement"}</p>
      <h2 className="mt-2 font-display text-2xl text-brand">Payment</h2>
      <p className="mt-3 text-sm text-muted">
        Card charges and Orange Money / Afrimoney confirm only after a signed Stripe or Moneroo webhook. No
        raw card data is collected on this site.
      </p>
      {mode?.provider === "demo" ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" disabled={busy} onClick={() => void demoPay()}>
            {busy ? "Confirming…" : "Confirm test settlement"}
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => void demoFail()}>
            Simulate failure
          </Button>
        </div>
      ) : (
        <Button
          className="mt-6"
          type="button"
          disabled={busy}
          onClick={() => {
            void (async () => {
              setBusy(true);
              setError(null);
              try {
                const started = await initiatePayment({ data: { id: booking.id, token } });
                if (started.redirectUrl) {
                  window.location.assign(started.redirectUrl);
                  return;
                }
                setError("The provider did not return a checkout URL. Credentials may be incomplete.");
              } catch (e) {
                setError(e instanceof Error ? e.message : "Could not start payment");
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          {busy ? "Opening provider…" : `Continue with ${mode?.label ?? "provider"}`}
        </Button>
      )}
    </div>
  );
}

function ConfirmPanel({
  booking,
  tourTitle,
  token,
}: {
  booking: BookingRow;
  tourTitle: string;
  token: string;
}) {
  return (
    <div className="mt-8 max-w-lg">
      <p className="text-xs uppercase tracking-[0.2em] text-ok">Confirmed</p>
      <h2 className="mt-2 font-display text-3xl text-brand">You’re booked</h2>
      <p className="mt-3 text-muted">
        {tourTitle}. Reference {booking.id}. Voucher {booking.voucher_code ?? "issuing…"}.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <a href={`/checkout/${booking.id}/voucher?t=${encodeURIComponent(token)}`}>View voucher</a>
        </Button>
        <Button asChild variant="outline">
          <Link to="/account">Account</Link>
        </Button>
      </div>
    </div>
  );
}

function VoucherPanel({ booking, tourTitle }: { booking: BookingRow; tourTitle: string }) {
  return (
    <div className="mt-8 max-w-xl rounded-lg border border-gold bg-surface p-8 print:border-ink">
      <p className="text-xs uppercase tracking-[0.2em] text-gold">Tourism Is Life · Voucher</p>
      <h2 className="mt-2 font-display text-3xl text-brand">{booking.voucher_code ?? "Pending voucher"}</h2>
      <p className="mt-4">{tourTitle}</p>
      <p className="mt-1 text-sm text-muted">
        {booking.travel_date} · {booking.guests} guests · {booking.guest_name}
      </p>
      <p className="mt-6 text-sm text-muted">Present this reference at pickup. Meeting point is confirmed on the itinerary.</p>
      <Button type="button" variant="outline" className="mt-6" onClick={() => window.print()}>
        Print
      </Button>
    </div>
  );
}

function StatusPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-8 max-w-lg">
      <h2 className="font-display text-3xl text-brand">{title}</h2>
      <p className="mt-3 text-muted">{body}</p>
      <Button asChild className="mt-6">
        <Link to="/tours">Browse tours</Link>
      </Button>
    </div>
  );
}
