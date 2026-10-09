/**
 * Money for rates (task A10): typed in major units as text, stored as integer
 * minor units, shown with string formatting. No floating point anywhere: the
 * parser works on the digits. USD and SLE both use 100 minor units.
 *
 * Amounts in different currencies are never added together; `addSameCurrency`
 * is the only addition and refuses a mix. Nothing here feeds `priceCents` or
 * the dormant booking engine (a test checks they never import rates).
 */
export const CURRENCIES = ["USD", "SLE"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** 999,999,999.99 in minor units: far above any real rate, and exact in a JS number. */
export const MAX_MINOR = 99_999_999_999;

export type Parsed = { ok: true; minor: number } | { ok: false; error: string };

const PLAIN = /^\d+(?:\.(\d{1,2}))?$/;
const GROUPED = /^\d{1,3}(?:,\d{3})+(?:\.(\d{1,2}))?$/;

/** "12.50", "12.5", "0.07", "1,000" are accepted; "-1", "1.234", "1e3", "" and anything else are refused. */
export function parseMajor(input: string): Parsed {
  const text = input.trim();
  if (!text) return { ok: false, error: "Enter an amount." };
  if (text.startsWith("-")) return { ok: false, error: "An amount cannot be negative." };
  if (/^[\d,]+\.\d{3,}$/.test(text)) return { ok: false, error: "Use at most two decimal places." };
  if (!PLAIN.test(text) && !GROUPED.test(text)) return { ok: false, error: "Enter an amount like 12.50 or 1,000." };
  const [whole, fraction = ""] = text.replace(/,/g, "").split(".");
  const digits = `${whole.replace(/^0+(?=\d)/, "")}${fraction.padEnd(2, "0")}`;
  if (digits.length > String(MAX_MINOR).length || (digits.length === String(MAX_MINOR).length && digits > String(MAX_MINOR))) {
    return { ok: false, error: "That amount is too large." };
  }
  return { ok: true, minor: Number(digits) };
}

/** "USD 1,250.00": built from the digits, never by dividing. */
export function formatMinor(minor: number, currency: Currency): string {
  if (!Number.isSafeInteger(minor) || minor < 0) throw new Error("Not an amount in minor units.");
  const s = String(minor).padStart(3, "0");
  const whole = s.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${currency} ${whole}.${s.slice(-2)}`;
}

export type Money = { minor: number; currency: Currency };

/** The only addition: refuses amounts in different currencies. */
export function addSameCurrency(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error(`Cannot add ${a.currency} and ${b.currency}.`);
  const minor = a.minor + b.minor;
  if (minor > MAX_MINOR) throw new Error("That amount is too large.");
  return { minor, currency: a.currency };
}

/** A rating typed as "4.1" stored as tenths (41). 0 to 5, at most one decimal. */
export function parseRating(input: string): { ok: true; tenths: number } | { ok: false; error: string } {
  const text = input.trim();
  const m = /^(\d)(?:\.(\d))?$/.exec(text);
  if (!m) return { ok: false, error: "Enter a rating like 4.1 (0 to 5, one decimal)." };
  const tenths = Number(m[1]) * 10 + Number(m[2] ?? "0");
  if (tenths > 50) return { ok: false, error: "A rating is at most 5." };
  return { ok: true, tenths };
}

export const formatRating = (tenths: number) => `${Math.floor(tenths / 10)}.${tenths % 10}`;
