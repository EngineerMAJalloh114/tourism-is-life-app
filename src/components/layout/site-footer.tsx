import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ChevronDown, MessageCircle, MessageSquare, Phone } from "lucide-react";
import { useState } from "react";
import { SocialLinks } from "@/components/layout/social-links";
import { SITE } from "@/lib/site";
import { NewsletterForm } from "@/components/newsletter-form";
import { cn } from "@/lib/utils";

type FooterCategory = {
  key: string;
  label: string;
  links: { label: string; to: string }[];
};

const FOOTER_CATEGORIES: FooterCategory[] = [
  {
    key: "explore",
    label: "Explore",
    links: [
      { label: "Destinations", to: "/destinations" },
      { label: "Tours", to: "/tours" },
      { label: "Cruise Ship Handling", to: "/cruise" },
      { label: "Search", to: "/tours/search" },
    ],
  },
  {
    key: "company",
    label: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Our Team", to: "/about/team" },
      { label: "Sustainability", to: "/about/sustainability" },
      { label: "Journal", to: "/journal" },
      { label: "Image Credits", to: "/about/image-credits" },
      { label: "Coming Soon", to: "/coming-soon" },
    ],
  },
  {
    key: "support",
    label: "Support",
    links: [
      { label: "Contact", to: "/contact" },
      { label: "B2B enquiry", to: "/contact/partner" },
      { label: "Emergency", to: "/contact/emergency" },
      { label: "Services", to: "/services" },
    ],
  },
];

export function SiteFooter() {
  // Single-open accordion, same convention as the mobile nav's category
  // list — collapsed by default below `lg`, where three full link lists
  // plus the brand blurb and emergency block otherwise stack into a very
  // tall footer. At `lg` and up every category's own `lg:block` keeps it
  // permanently open regardless of this state, matching the original
  // always-expanded desktop layout exactly.
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  return (
    <footer className="bg-brand-dark text-ivory">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
        <div>
          <Link to="/" aria-label="Tourism Is Life home" className="inline-block rounded-md bg-page p-1.5">
            <BrandLogo size="footer" />
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ivory/70">
            Destination management for Sierra Leone and West Africa. Local experts, global standards.
          </p>
        </div>
        {FOOTER_CATEGORIES.map((category) => {
          const isOpen = openCategory === category.key;
          return (
            <div key={category.key} className="border-b border-ivory/10 pb-3 sm:border-none sm:pb-0">
              <button
                type="button"
                onClick={() => setOpenCategory((v) => (v === category.key ? null : category.key))}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between py-2 text-left lg:pointer-events-none lg:py-0"
              >
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-gold">
                  {category.label}
                </span>
                <ChevronDown
                  className={cn("size-4 text-ivory/60 transition-transform lg:hidden", isOpen && "rotate-180")}
                  aria-hidden="true"
                />
              </button>
              <ul
                className={cn(
                  "space-y-2 text-sm text-ivory/80 lg:mt-4 lg:block",
                  isOpen ? "mt-3 block" : "hidden",
                )}
              >
                {category.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="hover:text-gold">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              {category.key === "support" ? (
                <p
                  className={cn(
                    "text-sm text-ivory/70 lg:mt-5 lg:block",
                    isOpen ? "mt-3 block" : "hidden",
                  )}
                >
                  24/7 emergency
                  <br />
                  <a href={SITE.phoneHref} className="text-gold inline-flex items-center gap-1">
                    <Phone className="size-3.5" />
                    {SITE.phone}
                  </a>
                  <br />
                  <a
                    href={SITE.whatsappHref}
                    className="text-gold inline-flex items-center gap-1"
                    aria-label="Chat with Tourism Is Life on WhatsApp"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="size-3.5" />
                    WhatsApp
                  </a>
                  <br />
                  <a href={SITE.smsHref} className="text-gold inline-flex items-center gap-1">
                    <MessageSquare className="size-3.5" />
                    SMS
                  </a>
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="border-t border-ivory/10">
        <div className="container-page grid gap-6 py-8 lg:grid-cols-[1fr_20rem]">
          <div className="flex flex-col gap-3 text-xs text-ivory/50">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p>
                © {new Date().getFullYear()} {SITE.legalName}. {SITE.address}.
              </p>
              <p>Member partner of 1 DCM World, as stated by the CEO in Travel And Tour World, 2024.</p>
            </div>
            <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-1">
              <Link to="/privacy" className="hover:text-gold">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-gold">
                Terms
              </Link>
              <Link to="/cookies" className="hover:text-gold">
                Cookies
              </Link>
              <Link to="/team/sign-in" className="hover:text-gold">
                Team access
              </Link>
            </nav>
            <SocialLinks variant="footer" />
          </div>
          <NewsletterForm variant="dark" />
        </div>
      </div>
    </footer>
  );
}
