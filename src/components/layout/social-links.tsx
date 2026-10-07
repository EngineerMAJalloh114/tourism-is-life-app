import { Facebook, Instagram, X, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";
import { SOCIAL_LINKS, type SocialLink } from "@/lib/site";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M19.59 6.03a5.5 5.5 0 0 1-1.55.42 2.75 2.75 0 0 0 1.19-1.52 5.46 5.46 0 0 1-1.75.67 2.71 2.71 0 0 0-4.66 2.47v.9A7.06 7.06 0 0 1 4.15 4.79a2.71 2.71 0 0 0 .85 3.61 2.64 2.64 0 0 1-2.45-.67v.07a2.71 2.71 0 0 0 2.18 2.66 2.75 2.75 0 0 1-.85.17v.07a2.71 2.71 0 0 0 2.34 2.65 5.45 5.45 0 0 1-1.83.3c-.12 0-.24-.01-.35-.02a7.14 7.14 0 0 0 6.33 4.62c-2 .3.8-4.6 5.37-8.47-2.23.48-3.83 1.62-4.65" />
    </svg>
  );
}

const ICON_MAP: Record<SocialLink["platform"], React.ComponentType<{ className?: string }>> = {
  youtube: Youtube,
  facebook: Facebook,
  x: X,
  instagram: Instagram,
  tiktok: TikTokIcon,
};

type SocialLinksProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "footer" | "header" | "mobile";
  showLabels?: boolean;
  filter?: (link: SocialLink) => boolean;
};

const SIZE_CLASSES = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
};

const CONTAINER_CLASSES = {
  default: "flex items-center gap-3",
  footer: "flex items-center gap-4",
  header: "flex items-center gap-2",
  mobile: "flex items-center gap-3",
};

export function SocialLinks({
  className,
  size = "md",
  variant = "default",
  showLabels = false,
  filter,
}: SocialLinksProps) {
  const links = SOCIAL_LINKS.filter((link) => link.enabled && (!filter || filter(link)));

  return (
    <div className={cn(CONTAINER_CLASSES[variant], className)} aria-label="Social media links">
      {links.map((link) => {
        const Icon = ICON_MAP[link.platform];
        const isPlaceholder = link.url === "TIKTOK_URL_PLACEHOLDER";

        return (
          <a
            key={link.platform}
            href={isPlaceholder ? undefined : link.url}
            target={isPlaceholder ? undefined : "_blank"}
            rel={isPlaceholder ? undefined : "noopener noreferrer"}
            aria-label={isPlaceholder ? `${link.label} coming soon` : `Visit Tourism Is Life on ${link.label}`}
            className={cn(
              "inline-flex items-center justify-center transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark",
              "rounded-md",
              isPlaceholder
                ? "text-ivory/40 cursor-not-allowed"
                : variant === "footer"
                ? "text-ivory/70 hover:text-gold bg-transparent"
                : variant === "header"
                ? "text-ivory/70 hover:text-gold bg-transparent"
                : variant === "mobile"
                ? "text-ivory/70 hover:text-gold bg-brand/50 p-2"
                : "text-muted hover:text-heading bg-surface p-2",
              SIZE_CLASSES[size],
            )}
            aria-disabled={isPlaceholder}
            tabIndex={isPlaceholder ? -1 : undefined}
          >
            <Icon className={cn(SIZE_CLASSES[size], "aria-hidden")} />
            {showLabels && <span className="sr-only">{link.label}</span>}
          </a>
        );
      })}
    </div>
  );
}