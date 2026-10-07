import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "glass-btn inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-wide transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 min-h-11 px-5 text-sm",
  {
    variants: {
      variant: {
        primary: "bg-gold/92 text-brand-dark hover:bg-gold/80",
        dark: "bg-brand/92 text-ivory hover:bg-brand-dark/92",
        outline:
          "glass-btn-tint border border-line text-ink hover:border-gold hover:text-heading",
        ghost: "bg-ivory/6 text-ivory hover:bg-ivory/16",
        ivory: "bg-page/92 text-heading hover:bg-surface/92",
      },
      size: {
        default: "min-h-11 px-5",
        sm: "min-h-9 px-3 text-xs uppercase tracking-[0.14em]",
        lg: "min-h-12 px-7 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
