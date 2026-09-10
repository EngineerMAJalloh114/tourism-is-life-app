/**
 * Seat-inventory algebra. Postgres conditional UPDATEs implement the same
 * predicates so concurrent requests cannot oversell even if a caller forgets
 * an application-level lock.
 */

export type Slot = {
  maxCapacity: number;
  bookedSeats: number;
  reservedSeats: number;
};

export function remainingSeats(slot: Slot): number {
  return slot.maxCapacity - slot.bookedSeats - slot.reservedSeats;
}

export function canReserve(slot: Slot, guests: number): boolean {
  return guests > 0 && remainingSeats(slot) >= guests;
}

export function reserve(slot: Slot, guests: number): Slot {
  if (!canReserve(slot, guests)) {
    throw new Error("CAPACITY_EXCEEDED");
  }
  return { ...slot, reservedSeats: slot.reservedSeats + guests };
}

export function releaseReservation(slot: Slot, guests: number): Slot {
  if (guests < 0) throw new Error("INVALID_GUESTS");
  if (slot.reservedSeats < guests) {
    throw new Error("RESERVATION_UNDERFLOW");
  }
  return { ...slot, reservedSeats: slot.reservedSeats - guests };
}

export function settleReservation(slot: Slot, guests: number): Slot {
  if (guests <= 0) throw new Error("INVALID_GUESTS");
  if (slot.reservedSeats < guests) throw new Error("HOLD_MISSING");
  if (slot.bookedSeats + guests > slot.maxCapacity) throw new Error("CAPACITY_EXCEEDED");
  return {
    maxCapacity: slot.maxCapacity,
    bookedSeats: slot.bookedSeats + guests,
    reservedSeats: slot.reservedSeats - guests,
  };
}

/** Simulate exclusive row locks: operations on a slot run one at a time. */
export function withSlotLock<T>(slot: Slot, fn: (s: Slot) => T): T {
  return fn(slot);
}

/**
 * Apply N independent reserve attempts against a cloned slot under a mutex.
 * Used to prove the algebra never oversells when requests are serialized
 * the way Postgres serializes `UPDATE ... WHERE remaining >= guests`.
 */
export function applyConcurrentReserves(initial: Slot, attempts: number[]): {
  slot: Slot;
  accepted: number;
  rejected: number;
} {
  let slot = { ...initial };
  let accepted = 0;
  let rejected = 0;
  for (const guests of attempts) {
    try {
      slot = reserve(slot, guests);
      accepted += 1;
    } catch {
      rejected += 1;
    }
  }
  if (slot.bookedSeats + slot.reservedSeats > slot.maxCapacity) {
    throw new Error("INVARIANT_BROKEN");
  }
  return { slot, accepted, rejected };
}
