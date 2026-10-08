/**
 * Two-factor recovery codes, stored hashed (docs/CUSTOMIZATION_PLAN.md 9.3).
 *
 * Better Auth 1.6.30 keeps recovery codes as a JSON list, plain or reversibly
 * encrypted, and checks a code with `codes.includes(code)`. We plug in our own
 * `storeBackupCodes` pair: `encrypt` replaces each plain code with an HMAC of
 * it (keyed with the auth secret) and leaves already-hashed ones alone;
 * `decrypt` returns the stored list unchanged. A `before` hook hashes the code
 * a visitor submits the same way, so the plugin's own check and its removal of
 * the used code both work on hashes and the plain codes are never stored.
 * Codes are 10 random characters (about 59 bits), so a keyed fast hash is
 * enough; the plugin's attempt lock still applies.
 */
import { createHmac } from "node:crypto";

export const RECOVERY_HASH_PREFIX = "h1:";

/** Codes are shown as `ABCDE-12345`; accept them typed with or without the dash, any case. */
export function normaliseRecoveryCode(code: string): string {
  const raw = code.trim().replace(/[\s-]/g, "");
  return raw.length === 10 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : code.trim();
}

export function hashRecoveryCode(secret: string, code: string): string {
  if (code.startsWith(RECOVERY_HASH_PREFIX)) return code;
  return RECOVERY_HASH_PREFIX + createHmac("sha256", secret).update(code).digest("base64url");
}

export function recoveryCodeStorage(secret: string) {
  return {
    encrypt: async (json: string): Promise<string> => {
      const codes = JSON.parse(json) as unknown;
      if (!Array.isArray(codes)) throw new Error("recovery codes must be a list");
      return JSON.stringify(codes.map((c) => hashRecoveryCode(secret, String(c))));
    },
    decrypt: async (stored: string): Promise<string> => stored,
  };
}
