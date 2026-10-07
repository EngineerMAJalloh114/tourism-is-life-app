"use client";

import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { ArrowLeft, Mail, MessageSquareText, Phone, X } from "lucide-react";
import { useState } from "react";
import { ContactMethodList } from "@/components/layout/contact-chooser";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

const ROW_CLASS =
  "flex w-full items-center gap-2 rounded-md border border-line bg-surface px-3 py-2.5 text-sm font-medium text-heading transition-colors hover:border-gold hover:text-brand-dark";

/**
 * The phone-width replacement for `ContactBar`'s two raw phone numbers plus
 * email address — three items is a lot of horizontal text to force onto a
 * narrow header, so below `sm` they collapse into one "Get in touch"
 * trigger. Opening it shows the same three destinations as a menu; picking
 * either phone number drills into the identical WhatsApp/SMS/Call chooser
 * `ContactChooser` already shows on desktop (`ContactMethodList`, shared
 * rather than reimplemented) — picking the email address just opens the
 * mailto link directly, since email has no such method choice to offer.
 */
export function MobileContactMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"menu" | "phone" | "mobile">("menu");

  function close() {
    setOpen(false);
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setStep("menu");
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex min-h-8 items-center gap-1.5 text-ivory/70 transition-colors duration-200 hover:text-gold",
            className,
          )}
          aria-expanded={open}
        >
          <MessageSquareText className="size-3 shrink-0" aria-hidden="true" />
          <span className="text-[11px] font-medium uppercase tracking-[0.14em]">Get in touch</span>
        </button>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          side="bottom"
          align="start"
          collisionPadding={8}
          className={cn(
            "z-50 w-72 rounded-md border border-line bg-page p-4 shadow-[var(--shadow-card)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          )}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {step === "menu" ? (
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Get in touch</p>
              <div className="grid grid-cols-1 gap-2">
                <button type="button" className={ROW_CLASS} onClick={() => setStep("phone")}>
                  <Phone className="size-4 shrink-0" aria-hidden="true" />
                  {SITE.phone}
                </button>
                <button type="button" className={ROW_CLASS} onClick={() => setStep("mobile")}>
                  <Phone className="size-4 shrink-0" aria-hidden="true" />
                  {SITE.mobile}
                </button>
                <a href={SITE.emailHref} className={ROW_CLASS} onClick={close}>
                  <Mail className="size-4 shrink-0" aria-hidden="true" />
                  {SITE.email}
                </a>
              </div>
              <PopoverClose asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
                >
                  <X className="size-3.5" aria-hidden="true" />
                  Cancel
                </button>
              </PopoverClose>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setStep("menu")}
                className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
              >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                Back
              </button>
              <ContactMethodList phone={step === "phone" ? SITE.phone : SITE.mobile} onSelect={close} />
            </div>
          )}
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  );
}
