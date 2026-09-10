import { getTour, type Tour } from "@/data/catalog";

export type Quote =
  | { kind: "quote"; amountCents: 0; currency: "USD" }
  | { kind: "fixed"; amountCents: number; currency: string };

/**
 * Server-side pricing. The browser never supplies an amount.
 * Tours without a published fare stay quote-only — we do not invent prices.
 */
export function quoteForTour(tour: Tour, _guests: number): Quote {
  const cents = tour.priceCents;
  const currency = (tour.currency ?? "USD").toUpperCase();
  if (typeof cents === "number" && Number.isInteger(cents) && cents > 0) {
    return { kind: "fixed", amountCents: cents, currency };
  }
  return { kind: "quote", amountCents: 0, currency: "USD" };
}

export function quoteForSlug(slug: string, guests: number): Quote {
  const tour = getTour(slug);
  if (!tour) return { kind: "quote", amountCents: 0, currency: "USD" };
  return quoteForTour(tour, guests);
}

export function liveChargeAllowed(quote: Quote): boolean {
  return quote.kind === "fixed" && quote.amountCents > 0;
}
