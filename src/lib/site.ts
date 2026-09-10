/** Verified public contact from tourismislife.com/contact. */
export const SITE = {
  name: "Tourism Is Life",
  legalName: "Tourism Is Life Tours",
  tagline: "Discover the Heart of West Africa",
  description:
    "Sierra Leone destination management company for tours, cruise shore excursions, and travel services across Sierra Leone, Guinea, Liberia, and West Africa.",
  phone: "+232 80 343 826",
  phoneHref: "tel:+23280343826",
  smsHref: "sms:+23280343826",
  whatsappHref: "https://wa.me/23280343826",
  mobile: "+232 76 568 335",
  mobileHref: "tel:+23276568335",
  smsMobileHref: "sms:+23276568335",
  whatsappMobileHref: "https://wa.me/23276568335",
  email: "info@tourismislife.com",
  emailHref: "mailto:info@tourismislife.com",
  address: "State Avenue 232, Freetown, Sierra Leone",
  website: "https://tourismislife.com",
  emergencyNote: "24/7 emergency phone services",
} as const;

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
      { label: "Contact", href: "/contact" },
    ],
  },
  journal: { label: "Journal", href: "/journal" },
  partner: { label: "Partner With Us", href: "/partner" },
} as const;
