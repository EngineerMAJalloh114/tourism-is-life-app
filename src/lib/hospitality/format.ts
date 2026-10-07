import { format, parseISO } from "date-fns";
import type { Money } from "@/lib/hospitality/types";

export function formatMoney(m: Money): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: m.currency, maximumFractionDigits: 0 }).format(m.amount);
  } catch {
    return `${m.currency} ${m.amount}`;
  }
}

/** A `Date` as the local calendar day, `YYYY-MM-DD`. */
export const toIso = (d: Date) => format(d, "yyyy-MM-dd");

/** `2026-10-05` as "Mon 5 Oct"; empty for an empty value. */
export const show = (iso: string) => (iso ? format(parseISO(iso), "EEE d MMM") : "");
