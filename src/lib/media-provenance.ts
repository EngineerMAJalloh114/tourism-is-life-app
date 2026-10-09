/**
 * Provenance for a photo: where it came from, who made it, the licence, and
 * the place it shows. The field names match `public/images/image-sources.json`
 * so the seeded records and new uploads read the same way.
 *
 * A photo is "complete" when it has alt text, a licence that has been
 * verified, a source, and a confirmed location. Only a complete photo can be
 * published, and only a published photo can be newly placed on a page
 * (docs/CUSTOMIZATION_PLAN.md section 7.3). No server imports: the admin page
 * shows the same missing-field list the server enforces.
 *
 * `scripts/content/generate-media-seed.mjs` repeats this rule for the seed;
 * `media-seed.test.ts` checks the two agree on every seeded photo.
 */
export type Provenance = {
  /** Who or where it came from, as a name (for example "Wikimedia Commons" or "Supplied by the owner"). */
  source?: string;
  /** The original file or listing. */
  sourceUrl?: string;
  /** The page describing the photo (image-sources.json keeps both). */
  page?: string;
  license?: string;
  author?: string;
  /** The place the photo shows. */
  location?: string;
  subject?: string;
  note?: string;
  notes?: string;
  /** Other recorded fields (a repository record keeps filename, section, purpose). Always text. */
  [key: string]: string | undefined;
};

export const UNVERIFIED_LICENSE = "license_verification_required";

const filled = (v: unknown) => typeof v === "string" && v.trim().length > 0;

/** The labels of what is still missing, in form order; empty when complete. */
export function missingProvenance(p: Provenance | null | undefined, alt: string | null | undefined): string[] {
  const missing: string[] = [];
  if (!filled(alt)) missing.push("Alt text");
  if (!p || !(filled(p.source) || filled(p.sourceUrl) || filled(p.page))) missing.push("Source");
  if (!p || !filled(p.license) || p.license === UNVERIFIED_LICENSE) missing.push("Verified licence");
  if (!p || !filled(p.location) || /^unconfirmed/i.test(String(p.location).trim())) missing.push("Confirmed location");
  return missing;
}

export function provenanceStatus(p: Provenance | null | undefined, alt: string | null | undefined): "complete" | "incomplete" {
  return missingProvenance(p, alt).length === 0 ? "complete" : "incomplete";
}
