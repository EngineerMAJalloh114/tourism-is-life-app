/** Verified public contact from tourismislife.com/contact. */
export const SITE = {
  name: "Tourism Is Life",
  legalName: "Tourism Is Life Tours",
  tagline: "Discover the Heart of West Africa",
  description:
    "Sierra Leone destination management company for tours, cruise shore excursions, and travel services across Sierra Leone, Guinea, Liberia, and West Africa.",
  // `phone` renders first everywhere both numbers appear together (header
  // contact bar, footer's emergency block, /contact, the brochure) — this
  // is the primary/first-in-queue number, not necessarily the office line.
  phone: "+232 76 568 335",
  phoneHref: "tel:+23276568335",
  smsHref: "sms:+23276568335",
  whatsappHref: "https://wa.me/23276568335",
  mobile: "+232 79 616 668",
  mobileHref: "tel:+23279616668",
  smsMobileHref: "sms:+23279616668",
  whatsappMobileHref: "https://wa.me/23279616668",
  email: "info@tourismislife.com",
  emailHref: "mailto:info@tourismislife.com",
  address: "State Avenue 232, Freetown, Sierra Leone",
  website: "https://tourismislife.com",
  emergencyNote: "24/7 emergency phone services",
} as const;

/** Every enquiry notification (a visitor sending a form) goes to both — the
 * desk inbox and a partner CC — by explicit instruction, not the single
 * recipient every other outbound email (booking confirmations, enquiry
 * receipts to the visitor themselves) still uses. */
export const ENQUIRY_TEAM_EMAILS = [SITE.email, "george@baobabadventure.co.uk"] as const;

export const TIKTOK_URL_PLACEHOLDER = "TIKTOK_URL_PLACEHOLDER";

export const SOCIAL_LINKS = [
  {
    platform: "youtube",
    label: "YouTube",
    url: "https://youtube.com/@tourismislifetours7260?si=n9DPO2r-pFJwWtjn",
    handle: "@tourismislifetours7260",
    enabled: true,
  },
  {
    platform: "facebook",
    label: "Facebook",
    url: "https://www.facebook.com/share/1EUPY5JvRi/",
    handle: "",
    enabled: true,
  },
  {
    platform: "x",
    label: "X",
    url: "https://x.com/tourismislife",
    handle: "@tourismislife",
    enabled: true,
  },
  {
    platform: "instagram",
    label: "Instagram",
    url: "https://www.instagram.com/tourismislifetours",
    handle: "@tourismislifetours",
    enabled: true,
  },
  {
    platform: "tiktok",
    label: "TikTok",
    url: TIKTOK_URL_PLACEHOLDER,
    handle: "",
    enabled: false,
  },
] as const;

export type SocialLink = (typeof SOCIAL_LINKS)[number];

export const NAV = {
  destinations: {
    label: "Destinations",
    href: "/destinations",
    items: [
      { label: "Eastern Circuit", href: "/destinations/eastern-circuit" },
      { label: "Northern Circuit", href: "/destinations/northern-circuit" },
      { label: "Southern Circuit", href: "/destinations/southern-circuit" },
      { label: "Western Circuit", href: "/destinations/western-circuit" },
      { label: "All Destinations", href: "/destinations" },
    ],
  },
  tours: {
    label: "Tours",
    href: "/tours",
    items: [
      { label: "Sierra Leone", href: "/tours/sierra-leone" },
      { label: "Guinea", href: "/tours/guinea" },
      { label: "Liberia", href: "/tours/liberia" },
      { label: "West Africa", href: "/tours/west-africa" },
      { label: "Search tours", href: "/tours/search" },
    ],
  },
  stayDine: { label: "Stay & Dine", href: "/hospitality" },
  cruise: { label: "Cruise Ship Handling", href: "/cruise" },
  services: {
    label: "Services",
    href: "/services",
    items: [
      { label: "MICE", href: "/services/mice" },
      { label: "Tours & Excursions", href: "/services/tours-excursions" },
      { label: "Visa Facilitation", href: "/services/visa-facilitation" },
      { label: "Travel Insurance", href: "/services/travel-insurance" },
      { label: "Vehicle Rental", href: "/services/vehicle-rental" },
      { label: "Hotel Reservations", href: "/services/hotel-reservations" },
      { label: "Ticketing", href: "/services/ticketing" },
    ],
  },
  about: {
    label: "About",
    href: "/about",
    items: [
      { label: "What We Offer", href: "/about/what-we-offer" },
      { label: "Our Team", href: "/about/team" },
      { label: "Why Us", href: "/about/why-us" },
      { label: "Sustainability", href: "/about/sustainability" },
      { label: "DMC Brochure", href: "/brochure" },
      { label: "Contact", href: "/contact" },
    ],
  },
  journal: { label: "Journal", href: "/journal" },
  partner: { label: "Partner With Us", href: "/partner" },
} as const;
