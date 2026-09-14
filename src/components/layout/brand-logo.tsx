import { cn } from "@/lib/utils";

export const BRAND_LOGO_JPG = "/images/misc/tourism-is-life-web-logo.jpg";
export const BRAND_LOGO_WEBP = "/images/misc/tourism-is-life-web-logo.webp";

type BrandLogoProps = {
  className?: string;
  /** Larger lockup for the footer and similar dark surfaces. */
  size?: "header" | "footer";
};

export function BrandLogo({ className, size = "header" }: BrandLogoProps) {
  return (
    <picture>
      <source srcSet={BRAND_LOGO_WEBP} type="image/webp" />
      <img
        src={BRAND_LOGO_JPG}
        alt="Tourism Is Life Tours logo"
        width={1024}
        height={512}
        decoding="async"
        className={cn(
          "w-auto object-contain",
          size === "header" ? "h-12 sm:h-14 lg:h-[3.75rem]" : "h-[4.5rem] sm:h-20",
          className,
        )}
      />
    </picture>
  );
}
