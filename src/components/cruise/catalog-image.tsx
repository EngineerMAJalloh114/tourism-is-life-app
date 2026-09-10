import { useState } from "react";
import { cn } from "@/lib/utils";

const FALLBACK = "/images/cruise/freetown-port.jpg";

export function CatalogImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed ? FALLBACK : src}
      alt={failed ? "Freetown port, Sierra Leone" : alt}
      className={cn("object-cover", className)}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "low"}
      onError={() => setFailed(true)}
    />
  );
}
