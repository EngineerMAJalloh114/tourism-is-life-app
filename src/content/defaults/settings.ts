/**
 * The site settings as the code has them today, built from the constants the
 * site renders (`SITE`, `SOCIAL_LINKS`, `ENQUIRY_TEAM_EMAILS`, the SEO and
 * interface defaults, the sustainability policy URL). The seed in
 * `0009_site_settings` is this object, serialised by
 * `scripts/content/generate-seed.mjs`; a test checks the two are identical.
 */
import { INTERFACE_TEXT } from "@/content/defaults/interface";
import { SUSTAINABILITY_POLICY_URL } from "@/data/sustainability";
import { DEFAULT_DESCRIPTION, DEFAULT_SHARE_IMAGE } from "@/lib/seo";
import type { SiteSettings } from "@/lib/settings/schema";
import { ENQUIRY_TEAM_EMAILS, SITE, SOCIAL_LINKS, TIKTOK_URL_PLACEHOLDER } from "@/lib/site";

export const DEFAULT_SETTINGS: SiteSettings = {
  business: {
    name: SITE.name,
    legalName: SITE.legalName,
    tagline: SITE.tagline,
    description: SITE.description,
    website: SITE.website,
  },
  contact: {
    // `SITE.phone` renders first wherever both numbers appear together.
    phones: [
      { label: "Phone", number: SITE.phone, whatsapp: true, sms: true },
      { label: "Mobile", number: SITE.mobile, whatsapp: true, sms: true },
    ],
    email: SITE.email,
    address: SITE.address,
    emergencyNote: SITE.emergencyNote,
  },
  // The TikTok account has no address yet; its placeholder is stored empty.
  social: SOCIAL_LINKS.map((s) => ({
    platform: s.platform,
    label: s.label,
    url: s.url === TIKTOK_URL_PLACEHOLDER ? "" : s.url,
    handle: s.handle,
    enabled: s.enabled,
  })),
  seo: { defaultDescription: DEFAULT_DESCRIPTION, shareImage: DEFAULT_SHARE_IMAGE },
  enquiryRecipients: [...ENQUIRY_TEAM_EMAILS],
  interface: { ...INTERFACE_TEXT },
  documents: { sustainabilityPolicyUrl: SUSTAINABILITY_POLICY_URL },
};
