import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NAV } from "@/lib/site";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { ContactBar } from "@/components/layout/contact-bar";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { cn } from "@/lib/utils";

/**
 * The header is one piece of smoked glass in both states: frosted at the top of
 * the page (`.glass-frosted`, heavy blur), then ultra-clear liquid glass once
 * the page has scrolled under it (`.glass-clear`, see styles.css). Both dim what
 * is behind them, so the links are ivory in both states and stay above 4.5:1
 * over any page content. Panels that open below (dropdowns, mobile nav) are
 * solid `bg-page`, so their links are always ink regardless of scroll.
 */
function navLinkClass() {
  return "glass-text text-ivory hover:text-gold";
}

const PANEL_LINK_CLASS = "text-ink hover:bg-brand/10 hover:text-heading";

type MobileNavSection = {
  key: string;
  label: string;
  href: string;
  items: readonly { label: string; href: string }[];
};

/** Mirrors the desktop `Dropdown` groupings exactly, so the mobile menu is an
 * accordion of the same seven categories rather than one flattened link list. */
const MOBILE_SECTIONS: MobileNavSection[] = [
  { key: "destinations", label: NAV.destinations.label, href: NAV.destinations.href, items: NAV.destinations.items },
  { key: "tours", label: NAV.tours.label, href: NAV.tours.href, items: NAV.tours.items },
  { key: "stay-dine", label: NAV.stayDine.label, href: NAV.stayDine.href, items: [] },
  { key: "cruise", label: NAV.cruise.label, href: NAV.cruise.href, items: [] },
  { key: "services", label: NAV.services.label, href: NAV.services.href, items: NAV.services.items },
  { key: "about", label: NAV.about.label, href: NAV.about.href, items: NAV.about.items },
  { key: "journal", label: NAV.journal.label, href: NAV.journal.href, items: [] },
];

function Dropdown({
  label,
  href,
  items,
}: {
  label: string;
  href: string;
  items: { label: string; href: string }[];
}) {
  const linkClass = navLinkClass();

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
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [chromeHeight, setChromeHeight] = useState(0);
  const chromeRef = useRef<HTMLDivElement>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
    setOpenSection(null);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Tracks the live height of the utility bar + nav row (it changes with
  // `scrolled` and with contact-bar wrapping at narrow widths) so the mobile
  // panel below can be pinned to sit exactly under it instead of guessing a
  // fixed offset.
  useEffect(() => {
    const el = chromeRef.current;
    if (!el) return;
    const update = () => setChromeHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  // Locks the page in place while the mobile panel is open — plain
  // `overflow: hidden` on the body still lets iOS Safari rubber-band/shake
  // the page behind a fixed panel, so the body is pinned with `position:
  // fixed` instead and its scroll position is restored on close.
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const { style } = document.body;
    const prev = { position: style.position, top: style.top, left: style.left, right: style.right };
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.left = "0";
    style.right = "0";
    return () => {
      style.position = prev.position;
      style.top = prev.top;
      style.left = prev.left;
      style.right = prev.right;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

   return (
    <header className="sticky top-0 z-50">
      <div ref={chromeRef} className="relative">
        {/* Two glass layers that crossfade with scroll. Separate elements rather than
            one element with switching classes, because a `background-image` gradient
            cannot be interpolated and the change would snap instead of easing. */}
        <span
          aria-hidden
          className={cn(
            "glass-frosted pointer-events-none absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none",
            scrolled ? "opacity-0" : "opacity-100",
          )}
        />
        <span
          aria-hidden
          className={cn(
            "glass-clear pointer-events-none absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none",
            scrolled ? "opacity-100" : "opacity-0",
          )}
        />
      <div className="relative border-b border-ivory/10 text-ivory">
        <div className="container-page flex min-h-10 flex-wrap items-center justify-between gap-2 py-1.5 text-[11px] uppercase tracking-[0.14em]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <ThemeSwitcher />
          </div>
          <div className="flex items-center gap-4">
            <ContactBar />
          </div>
        </div>
      </div>
<div className="relative">
         <div className="container-page flex h-[4.25rem] items-center justify-between gap-4 lg:h-[4.75rem]">
           <Link to="/" aria-label="Tourism Is Life home" className="flex shrink-0 items-center">
             {/* The logo is an opaque JPG, so it carries its own light background.
                 The ring stays ivory so it reads as a rim on the dark themes too. */}
             <BrandLogo className="rounded-sm ring-1 ring-ivory/30" />
          </Link>

          <nav className="hidden items-center gap-5 xl:flex" aria-label="Primary">
            <Dropdown label={NAV.destinations.label} href={NAV.destinations.href} items={[...NAV.destinations.items]} />
            <Dropdown label={NAV.tours.label} href={NAV.tours.href} items={[...NAV.tours.items]} />
             <Link
               to={NAV.stayDine.href}
               className={cn(
                 "text-[13px] font-medium uppercase tracking-[0.16em] transition-colors",
                 navLinkClass(),
               )}
             >
              Stay &amp; Dine
            </Link>
             <Link
               to={NAV.cruise.href}
               className={cn(
                 "text-[13px] font-medium uppercase tracking-[0.16em] transition-colors",
                 navLinkClass(),
               )}
             >
              Cruise
            </Link>
            <Dropdown label={NAV.services.label} href={NAV.services.href} items={[...NAV.services.items]} />
            <Dropdown label={NAV.about.label} href={NAV.about.href} items={[...NAV.about.items]} />
             <Link
               to={NAV.journal.href}
               className={cn(
                 "text-[13px] font-medium uppercase tracking-[0.16em] transition-colors",
                 navLinkClass(),
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
                 navLinkClass(),
               )}
               aria-expanded={open}
               aria-label={open ? "Close menu" : "Open menu"}
               onClick={() => setOpen((v) => !v)}
             >
               {open ? <X /> : <Menu />}
             </button>
           </div>
         </div>
      </div>
      </div>
      {open ? (
            <nav
              className="fixed inset-x-0 bottom-0 z-40 overflow-y-auto overscroll-contain border-t border-line bg-page px-5 py-4 shadow-[var(--shadow-card)] xl:hidden"
              style={{ top: chromeHeight }}
              aria-label="Mobile"
            >
              <div className="flex flex-col">
                {MOBILE_SECTIONS.map((section) => {
                  const hasChildren = section.items.length > 0;
                  const isOpen = openSection === section.key;
                  return (
                    <div key={section.key} className="border-b border-line/60">
                      <div className="flex items-center">
                        <Link
                          to={section.href}
                          className={cn(
                            "min-h-11 flex-1 py-3 text-sm font-semibold uppercase tracking-[0.12em] transition-colors",
                            PANEL_LINK_CLASS,
                          )}
                        >
                          {section.label}
                        </Link>
                        {hasChildren ? (
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            aria-label={`${isOpen ? "Collapse" : "Expand"} ${section.label} submenu`}
                            className="grid size-11 shrink-0 place-items-center text-ink/70 transition-colors hover:text-heading"
                            onClick={() => setOpenSection((v) => (v === section.key ? null : section.key))}
                          >
                            <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
                          </button>
                        ) : null}
                      </div>
                      {hasChildren && isOpen ? (
                        <ul className="flex flex-col gap-0.5 pb-2 pl-3">
                          {section.items.map((item) => (
                            <li key={item.href}>
                              <Link
                                to={item.href}
                                className={cn(
                                  "block min-h-10 rounded-md px-3 py-2 text-sm transition-colors",
                                  PANEL_LINK_CLASS,
                                )}
                              >
                                {item.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  );
                })}
                <Link
                  to="/partner"
                  className={cn(
                    "min-h-11 py-3 text-sm font-semibold uppercase tracking-[0.12em] transition-colors",
                    PANEL_LINK_CLASS,
                  )}
                >
                  Partner With Us
                </Link>
              </div>
            </nav>
          ) : null}
    </header>
  );
}
