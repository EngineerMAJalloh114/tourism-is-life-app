"use client";

import { Mail } from "lucide-react";
import { ContactChooser } from "@/components/layout/contact-chooser";
import { MobileContactMenu } from "@/components/layout/mobile-contact-menu";
import { SITE } from "@/lib/site";

export function ContactBar() {
  return (
    <>
      {/* Two phone numbers plus an email address is too much for the
          utility bar below `sm` — replaced there by a single "Get in
          touch" trigger (`MobileContactMenu`) that opens the same three
          destinations as a menu instead of forcing them to wrap onto
          extra lines. */}
      <div className="hidden flex-wrap items-center gap-x-4 gap-y-1 sm:flex sm:gap-x-6">
        <ContactChooser phone={SITE.phone} label={SITE.phone} />
        <ContactChooser phone={SITE.mobile} label={SITE.mobile} />
        <a
          href={SITE.emailHref}
          className="inline-flex items-center gap-1.5 text-ivory/70 hover:text-gold transition-colors duration-200"
        >
          <Mail className="size-3 shrink-0" aria-hidden="true" />
          <span className="text-[11px] font-medium uppercase tracking-[0.14em]">
            {SITE.email}
          </span>
        </a>
      </div>
      <MobileContactMenu className="sm:hidden" />
    </>
  );
}
