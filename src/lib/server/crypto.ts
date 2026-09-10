import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function randomToken(bytes = 24): string {
  return randomBytes(bytes).toString("hex");
}

/** Length-independent comparison of two hex/utf8 strings. */
export function safeEqual(a: string, b: string): boolean {
  const left = sha256Hex(a);
  const right = sha256Hex(b);
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

export function accessTokenMatches(storedHash: string | null | undefined, provided: string): boolean {
  if (!storedHash || !provided) return false;
  return safeEqual(storedHash, sha256Hex(provided));
}

export function publicId(bytes = 12): string {
  return randomBytes(bytes).toString("hex");
}

export function bookingRef(): string {
  const n = randomBytes(4).toString("hex").toUpperCase();
  return `TIL-${Date.now().toString(36).toUpperCase()}-${n}`;
}
