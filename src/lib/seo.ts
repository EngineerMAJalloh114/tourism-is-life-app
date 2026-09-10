import { SITE } from "@/lib/site";

export function pageHead(title: string, description: string, path = "/") {
  const full = title.includes("Tourism Is Life") ? title : `${title} · ${SITE.name}`;
  return {
    meta: [
      { title: full },
      { name: "description", content: description },
      { name: "robots", content: "index,follow" },
    ],
    links: [{ rel: "canonical", href: path }],
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["TravelAgency", "Organization"],
    name: SITE.legalName,
    alternateName: SITE.name,
    url: SITE.website,
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
