import type { ReactNode } from "react";
import { PageHero } from "@/components/page-hero";

export const LEGAL_UPDATED = "25 September 2026";

/** Shared shell for the privacy, terms and cookies pages. */
export function LegalPage({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHero
        kicker="Legal"
        title={title}
        lede={lede}
        image="/images/cities/freetown-street.jpg"
        imageAlt="A busy street in central Freetown, Sierra Leone"
      />
      <div className="container-page max-w-3xl py-10">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Last updated {LEGAL_UPDATED}</p>
        <div className="mt-6 space-y-8 text-sm leading-relaxed text-muted">{children}</div>
      </div>
    </>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl text-heading">{heading}</h2>
      {children}
    </section>
  );
}
