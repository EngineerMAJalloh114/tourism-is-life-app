/**
 * How records are shown, applying rule 2 (nothing invented) when rendering,
 * never by rewriting data (docs/CUSTOMIZATION_PLAN.md section 11). The public
 * pages use these from task B5; the code fallback uses the same rules (B1).
 */
import { claimSourced, isClaim, type Claim, type ImageRef } from "@/lib/collections/registry";

/** A claim's text when sourced, otherwise its fallback, or null to leave it out. */
export function claimText(c: Claim): string | null {
  if (claimSourced(c)) return c.claim;
  return c.fallback.trim() ? c.fallback : null;
}

/** A list where some lines may be claims: unsourced claims show their fallback or are left out. */
export function visibleLines(lines: readonly (string | Claim)[]): string[] {
  return lines.flatMap((line) => {
    if (!isClaim(line)) return [line];
    const text = claimText(line);
    return text === null ? [] : [text];
  });
}

type TeamPhotoFields = {
  photo: ImageRef | null;
  photoConsent: { recordedBy: string; recordedAt: string; note?: string };
};

/** A team member's photo, only once who recorded consent and when are both filled in. Otherwise null (the site shows initials). */
export function teamPhoto(profile: TeamPhotoFields): ImageRef | null {
  const consent = profile.photoConsent;
  if (!profile.photo || !consent?.recordedBy?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(consent.recordedAt ?? "")) return null;
  return profile.photo;
}

/** A testimonial is shown only with a source link and date. */
export function testimonialShown(t: { sourceUrl: string; sourceDate: string }): boolean {
  return t.sourceUrl.startsWith("https://") && /^\d{4}-\d{2}-\d{2}$/.test(t.sourceDate);
}
