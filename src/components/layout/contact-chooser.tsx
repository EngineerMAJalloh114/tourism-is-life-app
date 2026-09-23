"use client";

import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { MessageCircle, MessageSquare, Phone, X } from "lucide-react";
import { useState } from "react";
import { createTelUrl, createSmsUrl, createWhatsAppUrl } from "@/lib/contact";
import { cn } from "@/lib/utils";

type ContactChooserProps = {
  phone: string;
  label?: string;
};

export function ContactChooser({ phone, label }: ContactChooserProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 text-ivory/70 hover:text-gold",
            "min-h-8 transition-colors duration-200",
          )}
          aria-label={`Contact ${phone}`}
          aria-expanded={open}
        >
          <Phone className="size-3 shrink-0" aria-hidden="true" />
          <span className="text-[11px] font-medium uppercase tracking-[0.14em]">
            {label ?? phone}
          </span>
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
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                Contact
              </p>
              <p className="mt-1 font-display text-lg text-heading">{phone}</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <a
                href={createWhatsAppUrl(phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2.5 text-sm font-medium text-heading hover:border-gold hover:text-brand-dark transition-colors"
                onClick={() => setOpen(false)}
              >
                <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
                WhatsApp
              </a>
              <a
                href={createSmsUrl(phone)}
                className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2.5 text-sm font-medium text-heading hover:border-gold hover:text-brand-dark transition-colors"
                onClick={() => setOpen(false)}
              >
                <MessageSquare className="size-4 shrink-0" aria-hidden="true" />
                Send SMS
              </a>
              <a
                href={createTelUrl(phone)}
                className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2.5 text-sm font-medium text-heading hover:border-gold hover:text-brand-dark transition-colors"
                onClick={() => setOpen(false)}
              >
                <Phone className="size-4 shrink-0" aria-hidden="true" />
                Phone Call
              </a>
            </div>
            <PopoverClose asChild>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium uppercase tracking-[0.14em] text-muted hover:text-ink transition-colors"
              >
                <X className="size-3.5" aria-hidden="true" />
                Cancel
              </button>
            </PopoverClose>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  );
}
