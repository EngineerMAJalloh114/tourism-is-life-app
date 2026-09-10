"use client";

import { Mail } from "lucide-react";
import { ContactChooser } from "@/components/layout/contact-chooser";
import { SITE } from "@/lib/site";

export function ContactBar() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:gap-x-6">
      <ContactChooser phone={SITE.phone} label={SITE.phone} />
      <ContactChooser phone={SITE.mobile} label={SITE.mobile} />
      <a
        href={SITE.emailHref}
        className="inline-flex items-center gap-1.5 text-ivory/70 hover:text-gold transition-colors duration-200"
        aria-label="Email Tourism Is Life"
      >
        <Mail className="size-3 shrink-0" aria-hidden="true" />
        <span className="text-[11px] font-medium uppercase tracking-[0.14em]">
          {SITE.email}
        </span>
      </a>
    </div>
  );
}
