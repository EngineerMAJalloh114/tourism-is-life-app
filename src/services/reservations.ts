/**
 * Temporary seat reservation.
 *
 * PostgreSQL remains the source of truth (atomic capacity + hold expiry).
 * When Upstash Redis credentials are present, a 15-minute NX lock is also
 * written so concurrent workers cannot oversell. Without credentials the
 * lock is a documented no-op — preview uses PGLite, which is single-connection.
 */

export const HOLD_SECONDS = 15 * 60;

export type ReservationBackend = "upstash" | "postgres-only";

export function reservationBackend(): ReservationBackend {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  return url && token ? "upstash" : "postgres-only";
}

function holdKey(tourSlug: string, travelDate: string, bookingId: string) {
  return `til:hold:${tourSlug}:${travelDate}:${bookingId}`;
}

function slotKey(tourSlug: string, travelDate: string) {
  return `til:slot:${tourSlug}:${travelDate}`;
}

async function upstash(command: (string | number)[]): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL!.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) {
    throw new Error(`Upstash ${res.status}`);
  }
  const json = (await res.json()) as { result?: unknown };
  return json.result;
}

export async function acquireHoldLock(opts: {
  tourSlug: string;
  travelDate: string;
  bookingId: string;
  guests: number;
}): Promise<{ backend: ReservationBackend; locked: boolean }> {
  const backend = reservationBackend();
  if (backend !== "upstash") {
    return { backend, locked: true };
  }
  try {
    const result = await upstash([
      "SET",
      holdKey(opts.tourSlug, opts.travelDate, opts.bookingId),
      String(opts.guests),
      "EX",
      HOLD_SECONDS,
      "NX",
    ]);
    await upstash(["INCRBY", slotKey(opts.tourSlug, opts.travelDate), opts.guests]);
    await upstash(["EXPIRE", slotKey(opts.tourSlug, opts.travelDate), HOLD_SECONDS]);
    return { backend, locked: result === "OK" };
  } catch {
    // Redis is an accelerator; PostgreSQL still decides capacity.
    return { backend: "postgres-only", locked: true };
  }
}

export async function releaseHoldLock(opts: {
  tourSlug: string;
  travelDate: string;
  bookingId: string;
  guests: number;
}): Promise<void> {
  if (reservationBackend() !== "upstash") return;
  try {
    await upstash(["DEL", holdKey(opts.tourSlug, opts.travelDate, opts.bookingId)]);
    await upstash(["INCRBY", slotKey(opts.tourSlug, opts.travelDate), -opts.guests]);
  } catch {
    /* preview / missing credentials */
  }
}
