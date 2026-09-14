import { SITE, SOCIAL_LINKS } from "@/lib/site";

const OG_IMAGE = `${SITE.website}/images/misc/og-image.jpg`;

export function pageHead(title: string, description: string, path = "/", robots = "index,follow") {
  const full = title.includes("Tourism Is Life") ? title : `${title} · ${SITE.name}`;
  const url = `${SITE.website}${path === "/" ? "" : path}`;
  return {
    meta: [
      { title: full },
      { name: "description", content: description },
      { name: "robots", content: robots },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE.name },
      { property: "og:title", content: full },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: full },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["TravelAgency", "Organization"],
    name: SITE.legalName,
    alternateName: SITE.name,
    url: SITE.website,
    logo: `${SITE.website}/icons/icon-512.png`,
    image: `${SITE.website}/icons/icon-512.png`,
    email: SITE.email,
    telephone: SITE.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address,
      addressLocality: "Freetown",
      addressCountry: "SL",
    },
    areaServed: ["Sierra Leone", "Guinea", "Liberia", "West Africa"],
    description: SITE.description,
    sameAs: SOCIAL_LINKS.filter((link) => link.enabled).map((link) => link.url),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.website,
    publisher: { "@type": "Organization", name: SITE.legalName },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE.website}${item.path}`,
    })),
  };
}

export function tourJsonLd(tour: {
  title: string;
  summary: string;
  slug: string;
  duration: string;
  image: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.title,
    description: tour.summary,
    touristType: "Adventure, culture, wildlife",
    image: tour.image,
    url: `${SITE.website}/tours/${tour.slug}`,
    itinerary: {
      "@type": "ItemList",
      name: tour.duration,
    },
    provider: {
      "@type": "TravelAgency",
      name: SITE.legalName,
    },
  };
}

export function articleJsonLd(article: {
  title: string;
  excerpt: string;
  date: string;
  image: string;
  slug: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    image: article.image,
    author: { "@type": "Organization", name: SITE.legalName },
    publisher: { "@type": "Organization", name: SITE.legalName },
    mainEntityOfPage: `${SITE.website}/journal/${article.slug}`,
  };
}
