import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, MessageSquare } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { IMG_HERO } from "@/data/catalog";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/contact/emergency")({ component: Page });

function Page() {
  return (
    <>
      <PageHero
        kicker="24/7"
        title="Emergency phone"
        lede="Published on the public website as a round-the-clock line."
        image={IMG_HERO}
        imageAlt="Coast"
      />
      <div className="container-page py-16">
        <a href={SITE.phoneHref} className="font-display text-4xl text-brand">
          {SITE.phone}
        </a>
        <p className="mt-4 text-muted">
          WhatsApp: <a href={SITE.whatsappHref} className="text-brand inline-flex items-center gap-1" aria-label="Chat with Tourism Is Life on WhatsApp" target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" />WhatsApp</a>
          <br />
          SMS: <a href={SITE.smsHref} className="text-brand inline-flex items-center gap-1"><MessageSquare className="size-4" />Message</a>
          <br />
          Email: <a href={SITE.emailHref} className="text-brand">{SITE.email}</a>
        </p>
      </div>
    </>
  );
}
