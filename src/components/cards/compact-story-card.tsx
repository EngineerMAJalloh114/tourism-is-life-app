/**
 * Smaller and less prominent than TourCard/EditorialFeatureCard, per the
 * card system's hierarchy: journal entries support the travel content, they
 * don't compete with it for attention.
 */
export function CompactStoryCard({
  image,
  imageAlt,
  eyebrow,
  title,
  excerpt,
}: {
  image: string;
  imageAlt: string;
  /** Category and/or date, already formatted by the caller. */
  eyebrow: string;
  title: string;
  excerpt?: string;
}) {
  return (
    <div className="group block">
      <div className="overflow-hidden rounded-md">
        <img
          src={image}
          alt={imageAlt}
          loading="lazy"
          className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-muted">{eyebrow}</p>
      <h3 className="mt-1 font-display text-2xl text-heading group-hover:text-gold-ink">{title}</h3>
      {excerpt ? <p className="mt-2 line-clamp-2 text-sm text-muted">{excerpt}</p> : null}
    </div>
  );
}
