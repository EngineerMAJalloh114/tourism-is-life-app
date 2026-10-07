import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Heart, MapPin, Star } from "lucide-react";
import type { ReactNode } from "react";
import { DINING_STYLE_LABELS, STAY_TYPE_LABELS } from "@/data/hospitality";
import { useFavorites } from "@/lib/hospitality/favorites";
import { formatMoney } from "@/lib/hospitality/format";
import type { Photo, Rating, Restaurant, Stay } from "@/lib/hospitality/types";
import { cn } from "@/lib/utils";

export function RatingLine({ rating, className }: { rating: Rating | null; className?: string }) {
  if (!rating) return null;
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Star className="size-3.5 fill-gold text-gold" aria-hidden />
      <span>{rating.value.toFixed(1)}</span>
      <span className="opacity-75">({rating.count})</span>
    </span>
  );
}

/** Saved on this device only. Local UI state, not an account feature. */
export function FavoriteButton({ id, name, className }: { id: string; name: string; className?: string }) {
  const saved = useFavorites((s) => s.ids.includes(id));
  const toggle = useFavorites((s) => s.toggle);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from places saved on this device` : `Save ${name} on this device`}
      title={saved ? "Saved on this device" : "Save on this device"}
      onClick={() => toggle(id)}
      className={cn(
        "grid size-8 place-items-center rounded-full bg-page/92 text-heading shadow-sm backdrop-blur transition-[transform,background-color] duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-gold motion-reduce:transition-none",
        className,
      )}
    >
      <Heart className={cn("size-4 transition-colors duration-200", saved ? "fill-danger text-danger" : "text-heading")} aria-hidden />
    </button>
  );
}

/**
 * Shared card shell: photo, top badges, save button, bottom text on a dark
 * gradient. The link is passed in as a render prop because TanStack's typed
 * `Link` infers `params` from a literal `to` at the call site, and that
 * inference breaks when `to`/`params` travel through a generic prop object.
 * The save button sits beside the link, never inside it, so no interactive
 * element is nested in another.
 */
function CardFrame({
  photo,
  badge,
  favorite,
  renderLink,
  children,
  eager,
}: {
  photo: Photo;
  badge: ReactNode;
  favorite: ReactNode;
  renderLink: (content: ReactNode, className: string) => ReactNode;
  children: ReactNode;
  eager?: boolean;
}) {
  return (
    <article className="group relative isolate overflow-hidden rounded-xl bg-brand-dark shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-[400ms] ease-out hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      {renderLink(
        <>
          <img
            src={photo.src}
            alt={photo.alt}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            draggable={false}
            className="absolute inset-0 size-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            style={{ objectPosition: photo.position ?? "center" }}
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-brand-dark from-0% via-brand-dark/88 via-46% to-brand-dark/0 to-82% transition-opacity duration-[400ms] group-hover:opacity-95"
          />
          <span className="absolute inset-x-0 bottom-0 z-10 block p-3 text-ivory">{children}</span>
        </>,
        "relative block aspect-[7/8] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-gold",
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-2.5">
        <div className="pointer-events-auto">{badge}</div>
        <div className="pointer-events-auto">{favorite}</div>
      </div>
    </article>
  );
}

function Badge({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "sample" }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full px-2 text-[10px] font-medium tracking-wide shadow-sm backdrop-blur",
        tone === "sample" ? "bg-brand-dark/92 text-ivory ring-1 ring-ivory/30" : "bg-page/92 text-heading",
      )}
    >
      {children}
    </span>
  );
}

function CardText({ name, place, meta, rating }: { name: string; place: string; meta: string; rating: Rating | null }) {
  return (
    <>
      <span className="block font-display text-base leading-tight sm:text-[1.05rem]">{name}</span>
      <span className="mt-0.5 flex items-center gap-1 text-xs text-ivory/90">
        <MapPin className="size-3 shrink-0" aria-hidden />
        <span className="truncate">{place}</span>
      </span>
      <span className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-ivory/90">
        <span className="truncate">{meta}</span>
        {rating ? <RatingLine rating={rating} /> : (
          <ArrowUpRight
            className="size-4 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
            aria-hidden
          />
        )}
      </span>
    </>
  );
}

export function StayCard({ stay, destinationName, eager }: { stay: Stay; destinationName: string; eager?: boolean }) {
  const place = [stay.area, destinationName].filter(Boolean).join(", ");
  return (
    <CardFrame
      photo={stay.images[0]}
      eager={eager}
      badge={
        stay.price ? (
          <Badge>
            {formatMoney(stay.price)} <span className="ml-1 font-normal opacity-70">/ night</span>
          </Badge>
        ) : stay.status === "sample" ? (
          <Badge tone="sample">Sample</Badge>
        ) : (
          <Badge>Price on request</Badge>
        )
      }
      favorite={<FavoriteButton id={stay.id} name={stay.name} />}
      renderLink={(content, className) => (
        <Link to="/hospitality/stays/$slug" params={{ slug: stay.slug }} className={className}>
          {content}
        </Link>
      )}
    >
      <CardText name={stay.name} place={place} meta={STAY_TYPE_LABELS[stay.type]} rating={stay.rating} />
    </CardFrame>
  );
}

export function DiningCard({ place: r, destinationName, eager }: { place: Restaurant; destinationName: string; eager?: boolean }) {
  const place = [r.area, destinationName].filter(Boolean).join(", ");
  const meta = [r.cuisines.slice(0, 2).join(" · "), DINING_STYLE_LABELS[r.style]].filter(Boolean).join(" · ");
  return (
    <CardFrame
      photo={r.images[0]}
      eager={eager}
      badge={
        r.priceRange ? <Badge>{r.priceRange}</Badge> : r.status === "sample" ? <Badge tone="sample">Sample</Badge> : <Badge>Price on request</Badge>
      }
      favorite={<FavoriteButton id={r.id} name={r.name} />}
      renderLink={(content, className) => (
        <Link to="/hospitality/dining/$slug" params={{ slug: r.slug }} className={className}>
          {content}
        </Link>
      )}
    >
      <CardText name={r.name} place={place} meta={meta} rating={r.rating} />
    </CardFrame>
  );
}
