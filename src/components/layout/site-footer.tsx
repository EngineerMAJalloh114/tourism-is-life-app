import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/layout/brand-logo";
import { MessageCircle, MessageSquare, Phone } from "lucide-react";
import { SocialLinks } from "@/components/layout/social-links";
import { SITE } from "@/lib/site";
import { NewsletterForm } from "@/components/newsletter-form";

export function SiteFooter() {
  return (
    <footer className="bg-brand-dark text-ivory">
      <div className="container-page grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" aria-label="Tourism Is Life home" className="inline-block rounded-md bg-ivory p-1.5">
            <BrandLogo size="footer" />
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ivory/70">
            Destination management for Sierra Leone and West Africa. Local experts, global standards.
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">Explore</p>
          <ul className="mt-4 space-y-2 text-sm text-ivory/80">
            <li>
              <Link to="/destinations" className="hover:text-gold">
                Destinations
              </Link>
            </li>
            <li>
              <Link to="/tours" className="hover:text-gold">
                Tours
              </Link>
            </li>
            <li>
              <Link to="/cruise" className="hover:text-gold">
                Cruise Ship Handling
              </Link>
            </li>
            <li>
              <Link to="/tours/search" className="hover:text-gold">
                Search
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">Company</p>
          <ul className="mt-4 space-y-2 text-sm text-ivory/80">
            <li>
              <Link to="/about" className="hover:text-gold">
                About
              </Link>
            </li>
            <li>
              <Link to="/about/team" className="hover:text-gold">
                Our Team
              </Link>
            </li>
            <li>
              <Link to="/about/sustainability" className="hover:text-gold">
                Sustainability
              </Link>
            </li>
            <li>
              <Link to="/journal" className="hover:text-gold">
                Journal
              </Link>
            </li>
            <li>
              <Link to="/coming-soon" className="hover:text-gold">
                Coming Soon
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">Support</p>
          <ul className="mt-4 space-y-2 text-sm text-ivory/80">
            <li>
              <Link to="/contact" className="hover:text-gold">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/contact/partner" className="hover:text-gold">
                B2B enquiry
              </Link>
            </li>
            <li>
              <Link to="/contact/emergency" className="hover:text-gold">
                Emergency
              </Link>
            </li>
            <li>
              <Link to="/services" className="hover:text-gold">
                Services
              </Link>
            </li>
          </ul>
          <p className="mt-5 text-sm text-ivory/70">
            24/7 emergency
            <br />
            <a href={SITE.phoneHref} className="text-gold inline-flex items-center gap-1">
              <Phone className="size-3.5" />
              {SITE.phone}
            </a>
            <br />
            <a href={SITE.whatsappHref} className="text-gold inline-flex items-center gap-1" aria-label="Chat with Tourism Is Life on WhatsApp" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-3.5" />
              WhatsApp
            </a>
            <br />
            <a href={SITE.smsHref} className="text-gold inline-flex items-center gap-1">
              <MessageSquare className="size-3.5" />
              SMS
            </a>
          </p>
        </div>
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
            <SocialLinks variant="footer" />
          </div>
          <NewsletterForm variant="dark" />
        </div>
      </div>
    </footer>
  );
}
