/**
 * Site settings (task A7): business details, contact, social links, default
 * SEO, enquiry recipients, interface text and documents. One Zod schema used
 * by the admin form, the save and publish operations, and the seed test. No
 * server imports.
 *
 * Phone numbers keep the house format ("+232 79 616 668"); links must be
 * https; the retired number +232 80 343 826 is refused anywhere in the
 * settings, in any spacing (CLAUDE.md, approved contact details).
 */
import { z } from "zod";

const text = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, min > 0 ? `${label} is required.` : undefined)
    .max(max, `${label} can be up to ${max} characters.`);

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+\d{1,3}(?: \d{2,4}){2,5}$/, "Write the number with its country code and spaces, for example +232 79 616 668.");

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);

export const httpsUrlSchema = z
  .string()
  .trim()
  .max(500)
  .url("Enter a full link.")
  .refine((u) => u.startsWith("https://"), "Links must start with https://");

export const SOCIAL_PLATFORMS = ["youtube", "facebook", "x", "instagram", "tiktok"] as const;

const socialSchema = z
  .object({
    platform: z.enum(SOCIAL_PLATFORMS),
    label: text(1, 40, "Label"),
    url: z.union([httpsUrlSchema, z.literal("")]),
    handle: text(0, 80, "Handle"),
    enabled: z.boolean(),
  })
  .strict()
  .refine((s) => !s.enabled || s.url !== "", { message: "A link is needed before this account can be shown.", path: ["url"] });

export const siteSettingsSchema = z
  .object({
    business: z
      .object({
        name: text(1, 80, "Name"),
        legalName: text(1, 120, "Legal name"),
        tagline: text(0, 160, "Tagline"),
        description: text(1, 400, "Description"),
        website: httpsUrlSchema,
      })
      .strict(),
    contact: z
      .object({
        phones: z
          .array(
            z
              .object({
                label: text(1, 40, "Label"),
                number: phoneSchema,
                whatsapp: z.boolean(),
                sms: z.boolean(),
              })
              .strict(),
          )
          .min(1, "Keep at least one phone number.")
          .max(4),
        email: emailSchema,
        address: text(1, 200, "Address"),
        emergencyNote: text(0, 160, "Emergency note"),
      })
      .strict(),
    social: z.array(socialSchema).max(10),
    seo: z
      .object({
        defaultDescription: text(1, 300, "Default description"),
        shareImage: z.string().trim().regex(/^\/images\/[a-z0-9/_.-]+\.(?:jpe?g|png|webp)$/i, "Use a photo path under /images/."),
      })
      .strict(),
    enquiryRecipients: z.array(emailSchema).min(1, "Keep at least one address that receives enquiries.").max(10),
    interface: z
      .object({
        skipLink: text(1, 60, "Skip link"),
        notFoundKicker: text(0, 20, "404 label"),
        notFoundTitle: text(1, 120, "404 heading"),
        notFoundBody: text(0, 300, "404 text"),
        errorTitle: text(1, 120, "Error heading"),
        errorFallback: text(1, 300, "Error text"),
      })
      .strict(),
    documents: z.object({ sustainabilityPolicyUrl: httpsUrlSchema.nullable() }).strict(),
  })
  .strict();

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

/**
 * Digit sequences that must never appear in the settings: the retired desk
 * number as its national digits, so "+232 80 343 826", "080 343 826" and
 * "23280343826" are all caught.
 */
export const RETIRED_NUMBERS = ["80343826"];

function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => strings(v, out));
  return out;
}

/** Problems the schema cannot express: the retired number, duplicate recipients. */
export function settingsProblems(data: SiteSettings): string[] {
  const problems: string[] = [];
  if (strings(data).some((s) => RETIRED_NUMBERS.some((n) => s.replace(/\D/g, "").includes(n)))) {
    problems.push("The number +232 80 343 826 is retired and cannot be used.");
  }
  const recipients = data.enquiryRecipients.map((e) => e.toLowerCase());
  if (new Set(recipients).size !== recipients.length) problems.push("An enquiry recipient is listed twice.");
  const numbers = data.contact.phones.map((p) => p.number.replace(/\D/g, ""));
  if (new Set(numbers).size !== numbers.length) problems.push("A phone number is listed twice.");
  return problems;
}

/** Parse and check; throws a message the desk can show. */
export function parseSettings(input: unknown): SiteSettings {
  const parsed = siteSettingsSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new SettingsInvalid(`${first.path.join(" › ") || "Settings"}: ${first.message}`);
  }
  const problems = settingsProblems(parsed.data);
  if (problems.length) throw new SettingsInvalid(problems[0]);
  return parsed.data;
}

export class SettingsInvalid extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SettingsInvalid";
  }
}
