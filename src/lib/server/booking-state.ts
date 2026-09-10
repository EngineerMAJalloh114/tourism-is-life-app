export const HOLD_MS = 15 * 60 * 1000;

export const BOOKING_STATUSES = [
  "HOLD",
  "PENDING_PAYMENT",
  "CONFIRMED",
  "FAILED",
  "EXPIRED",
  "CANCELLED",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  HOLD: ["PENDING_PAYMENT", "EXPIRED", "CANCELLED"],
  PENDING_PAYMENT: ["CONFIRMED", "FAILED", "EXPIRED", "CANCELLED"],
  CONFIRMED: ["CANCELLED"],
  FAILED: ["PENDING_PAYMENT", "EXPIRED", "CANCELLED"],
  EXPIRED: [],
  CANCELLED: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: BookingStatus, to: BookingStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid booking transition ${from} → ${to}`);
  }
}

export function isHoldExpired(holdExpiresAt: Date | string | null, now = new Date()): boolean {
  if (!holdExpiresAt) return false;
  const t = typeof holdExpiresAt === "string" ? new Date(holdExpiresAt) : holdExpiresAt;
  return t.getTime() <= now.getTime();
}

export function remainingSeats(maxCapacity: number, bookedSeats: number, reservedSeats: number): number {
  return maxCapacity - bookedSeats - reservedSeats;
}

export function hasCapacity(
  maxCapacity: number,
  bookedSeats: number,
  reservedSeats: number,
  guests: number,
): boolean {
  if (guests < 1) return false;
  return remainingSeats(maxCapacity, bookedSeats, reservedSeats) >= guests;
}

export function parseStatus(value: string): BookingStatus {
  if ((BOOKING_STATUSES as readonly string[]).includes(value)) return value as BookingStatus;
  throw new Error(`Unknown booking status ${value}`);
}
