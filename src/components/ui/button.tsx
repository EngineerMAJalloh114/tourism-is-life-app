import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-wide transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 min-h-11 px-5 text-sm",
  {
    variants: {
      variant: {
        primary: "bg-gold text-brand-dark hover:bg-gold/90",
        dark: "bg-brand text-ivory hover:bg-brand-dark",
        outline:
          "border border-line bg-transparent text-ink hover:border-gold hover:text-brand",
        ghost: "text-ivory hover:bg-ivory/10",
        ivory: "bg-ivory text-brand hover:bg-surface",
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
