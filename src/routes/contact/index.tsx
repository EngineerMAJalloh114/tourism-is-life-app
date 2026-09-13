import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, MessageSquare, Phone } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { EnquiryForm } from "@/components/enquiry-form";
import { IMG_HERO } from "@/data/catalog";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/contact/")({ component: Contact });

function Contact() {
  return (
    <>
      <PageHero
        kicker="Contact"
        title="Talk to the Freetown desk"
        lede={`${SITE.address}. Email replies are described as within 24 hours.`}
        image={IMG_HERO}
        imageAlt="Coast"
      />
      <div className="container-page grid gap-10 py-16 lg:grid-cols-2">
        <div className="space-y-3 text-sm">
          <p>
            Phone: <a className="text-brand inline-flex items-center gap-1.5" href={SITE.phoneHref}><Phone className="size-3.5" />{SITE.phone}</a>
          </p>
          <p>
            <a className="text-brand inline-flex items-center gap-1.5" href={SITE.whatsappHref} aria-label={`WhatsApp ${SITE.phone}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-3.5" />WhatsApp</a>
            <span className="mx-2 text-muted">|</span>
            <a className="text-brand inline-flex items-center gap-1.5" href={SITE.smsHref}><MessageSquare className="size-3.5" />SMS</a>
          </p>
          <p>
            Mobile: <a className="text-brand inline-flex items-center gap-1.5" href={SITE.mobileHref}><Phone className="size-3.5" />{SITE.mobile}</a>
          </p>
          <p>
            <a className="text-brand inline-flex items-center gap-1.5" href={SITE.whatsappMobileHref} aria-label={`WhatsApp ${SITE.mobile}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-3.5" />WhatsApp</a>
            <span className="mx-2 text-muted">|</span>
            <a className="text-brand inline-flex items-center gap-1.5" href={SITE.smsMobileHref}><MessageSquare className="size-3.5" />SMS</a>
          </p>
          <p>
            Email: <a className="text-brand" href={SITE.emailHref}>{SITE.email}</a>
          </p>
          <p>{SITE.address}</p>
          <p className="text-muted">
            Template addresses from the old website (California / Melbourne) are not used.
          </p>
        </div>
        <EnquiryForm type="B2C" />
      </div>
    </>
  );
}
