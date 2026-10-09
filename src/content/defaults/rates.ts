/**
 * The prices and ratings in the data files, as rate and rating rows (task
 * A10). Every one is seeded as a draft: none has both a source and a date, so
 * none may be shown (rule 2). Recording a source and date in the admin and
 * publishing is what makes one appear (from task B5).
 *
 *   - 6 shore excursion prices, per person, source note "Cruiseship Proposal 2024" (no date)
 *   - 8 vehicle daily rates, no source
 *   - 16 tour ratings, no source
 */
import { tours } from "@/data/catalog";
import { excursions } from "@/data/cruise";
import { vehicles } from "@/data/vehicle-rental";
import type { Currency } from "@/lib/money";

export const CRUISE_PRICE_SOURCE = "Cruiseship Proposal 2024";

export type RateSeed = {
  subjectCollection: "cruise-excursions" | "vehicles";
  subjectKey: string;
  label: string;
  currency: Currency;
  amountMinor: number;
  unit: "per-person" | "per-day";
  sourceNote: string;
};

export type RatingSeed = { tourKey: string; valueTenths: number; reviewCount: number };

export function rateDefaults(): { rates: RateSeed[]; ratings: RatingSeed[] } {
  const rates: RateSeed[] = [
    ...excursions.map((e) => ({
      subjectCollection: "cruise-excursions" as const,
      subjectKey: e.id,
      label: "Per person",
      currency: "USD" as const,
      // Whole dollars in the data file; integer arithmetic only.
      amountMinor: e.priceUsdPerPerson * 100,
      unit: "per-person" as const,
      sourceNote: CRUISE_PRICE_SOURCE,
    })),
    ...vehicles.flatMap((v) =>
      v.pricing.dailyRateCents === undefined
        ? []
        : [
            {
              subjectCollection: "vehicles" as const,
              subjectKey: v.id,
              label: "Daily rate",
              currency: v.pricing.currency as Currency,
              amountMinor: v.pricing.dailyRateCents,
              unit: "per-day" as const,
              sourceNote: "",
            },
          ],
    ),
  ];
  const ratings: RatingSeed[] = tours
    .filter((t) => t.rating > 0 || t.reviewCount > 0)
    .map((t) => ({ tourKey: t.slug, valueTenths: Math.round(t.rating * 10), reviewCount: t.reviewCount }));
  return { rates, ratings };
}
