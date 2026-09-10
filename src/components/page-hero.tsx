export function PageHero({
  kicker,
  title,
  lede,
  image,
  imageAlt,
}: {
  kicker?: string;
  title: string;
  lede?: string;
  image: string;
  imageAlt: string;
}) {
  return (
    <section className="relative isolate min-h-[42vh] overflow-hidden bg-brand-dark text-ivory">
      <img
        src={image}
        alt={imageAlt}
        className="absolute inset-0 size-full object-cover opacity-50"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/55 to-brand/20" />
      <div className="container-page relative flex min-h-[42vh] flex-col justify-end pb-12 pt-24">
        {kicker ? (
          <p className="text-xs uppercase tracking-[0.22em] text-gold">{kicker}</p>
        ) : null}
        <h1 className="mt-3 max-w-3xl font-display text-4xl sm:text-5xl lg:text-6xl">{title}</h1>
        {lede ? <p className="mt-4 max-w-2xl text-base text-ivory/80 sm:text-lg">{lede}</p> : null}
      </div>
    </section>
  );
}
