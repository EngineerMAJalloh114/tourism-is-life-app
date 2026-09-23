import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NAV } from "@/lib/site";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { ContactBar } from "@/components/layout/contact-bar";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { cn } from "@/lib/utils";

/**
 * The bar is translucent over the hero at the top of the page and solid once
 * scrolled, so the link colour has to follow it. Both states are token-based:
 * at the top the bar is a dark scrim continuing the utility bar above it, so
 * links are ivory; once solid the bar is the page surface, so links are ink.
 * Panels that open below (dropdowns, mobile nav) are always `bg-page`, so their
 * links are always ink regardless of scroll.
 */
function navLinkClass(scrolled: boolean) {
  return scrolled ? "text-ink hover:text-gold-ink" : "text-ivory hover:text-gold";
}

const PANEL_LINK_CLASS = "text-ink hover:bg-brand/10 hover:text-heading";

function Dropdown({
  label,
  href,
  items,
  scrolled,
}: {
  label: string;
  href: string;
  items: { label: string; href: string }[];
  scrolled: boolean;
}) {
  const linkClass = navLinkClass(scrolled);

  return (
    <div className="group relative">
       <Link
         to={href}
         className={cn(
           "inline-flex min-h-11 items-center gap-1 text-[13px] font-medium uppercase tracking-[0.16em]",
           linkClass,
         )}
       >
        {label}
        <ChevronDown className="size-3.5 opacity-70" />
      </Link>
      <div className="invisible absolute left-0 top-full z-40 min-w-56 translate-y-1 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
           <ul className="rounded-md border border-line bg-page py-2 shadow-[var(--shadow-card)]">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn("block px-4 py-2.5 text-sm transition-colors", PANEL_LINK_CLASS)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

   return (
    <header className="sticky top-0 z-50">
      <div className="bg-brand-dark text-ivory">
        <div className="container-page flex min-h-10 flex-wrap items-center justify-between gap-2 py-1.5 text-[11px] uppercase tracking-[0.14em]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <ThemeSwitcher />
          </div>
          <div className="flex items-center gap-4">
            <ContactBar />
          </div>
        </div>
      </div>
<div
          className={cn(
            "border-b transition-all duration-300",
            scrolled
              ? "border-line/40 bg-page/95 backdrop-blur-md"
              // 75% is not arbitrary: the bar floats over hero photography, and
              // the auditor can't see that photo (the header is sticky, so the
              // image is not an ancestor). At 0.75 over the worst case of a pure
              // white sky, ivory text still measures ~5.6:1, so the nav stays
              // legible over any image without relying on the image being dark.
              : "border-transparent bg-brand-dark/75 backdrop-blur-sm",
          )}
        >
         <div className="container-page flex h-[4.25rem] items-center justify-between gap-4 lg:h-[4.75rem]">
           <Link to="/" aria-label="Tourism Is Life home" className="flex shrink-0 items-center">
             {/* The logo is an opaque JPG, so it carries its own light background.
                 The ring stays ivory so it reads as a rim on the dark themes too. */}
             <BrandLogo className="rounded-sm ring-1 ring-ivory/30" />
          </Link>

          <nav className="hidden items-center gap-5 xl:flex" aria-label="Primary">
            <Dropdown label={NAV.destinations.label} href={NAV.destinations.href} items={[...NAV.destinations.items]} scrolled={scrolled} />
            <Dropdown label={NAV.tours.label} href={NAV.tours.href} items={[...NAV.tours.items]} scrolled={scrolled} />
             <Link
               to={NAV.cruise.href}
               className={cn(
                 "text-[13px] font-medium uppercase tracking-[0.16em] transition-colors",
                 navLinkClass(scrolled),
               )}
             >
              Cruise
            </Link>
            <Dropdown label={NAV.services.label} href={NAV.services.href} items={[...NAV.services.items]} scrolled={scrolled} />
            <Dropdown label={NAV.about.label} href={NAV.about.href} items={[...NAV.about.items]} scrolled={scrolled} />
             <Link
               to={NAV.journal.href}
               className={cn(
                 "text-[13px] font-medium uppercase tracking-[0.16em] transition-colors",
                 navLinkClass(scrolled),
               )}
             >
              Journal
            </Link>
          </nav>

           <div className="flex items-center gap-2">
            {/* No text-* override here: the primary variant's own text-brand-dark is
                what keeps the label readable on the accent in every theme. */}
            <Button asChild variant="primary" size="sm" className="hidden sm:inline-flex">
              <Link to="/partner">Partner With Us</Link>
            </Button>
             <button
               type="button"
               className={cn(
                 "grid size-11 place-items-center rounded-md transition-colors xl:hidden",
                 navLinkClass(scrolled),
               )}
               aria-expanded={open}
               aria-label={open ? "Close menu" : "Open menu"}
               onClick={() => setOpen((v) => !v)}
             >
               {open ? <X /> : <Menu />}
             </button>
           </div>
         </div>
{open ? (
            <nav className="border-t border-line bg-page px-5 py-4 xl:hidden" aria-label="Mobile">
              <div className="flex flex-col gap-1">
                {[
                  ...NAV.destinations.items,
                  ...NAV.tours.items.slice(0, 4),
                 { label: "Cruise Ship Handling", href: "/cruise" },
                 ...NAV.services.items,
                 ...NAV.about.items,
                 { label: "Journal", href: "/journal" },
                 { label: "Partner With Us", href: "/partner" },
               ].map((item) => (
          <Link
            key={item.href + item.label}
            to={item.href}
            className={cn(
              "min-h-11 border-b border-line/60 py-3 text-sm transition-colors",
              PANEL_LINK_CLASS,
            )}
          >
                   {item.label}
                 </Link>
               ))}
             </div>
           </nav>
         ) : null}
      </div>
    </header>
  );
}
