import type { VehicleCategoryInfo } from "@/data/vehicle-rental";

export function VehicleCategoryCard({ category, onClick }: { category: VehicleCategoryInfo; onClick?: (slug: string) => void }) {
  return (
    <button
      onClick={() => onClick?.(category.slug)}
      className="glass-card group relative isolate flex h-full flex-col overflow-hidden rounded-lg text-left shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="relative z-10 aspect-[16/9] overflow-hidden sm:aspect-[3/2]">
        <img src={category.image} alt={category.imageAlt} className="size-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <span className="rounded-sm bg-brand/90 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-ivory">{category.label}</span>
        </div>
      </div>
      <div className="relative z-10 flex flex-1 flex-col p-3.5 sm:p-4">
        <p className="line-clamp-2 text-sm text-muted">{category.description}</p>
        <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs text-muted sm:mt-3">
          <span>Seats: {category.seats}</span>
          <span>Luggage: {category.luggage}</span>
          <span>Trans: {category.transmission}</span>
          <span className="font-medium text-gold-ink">{category.startingPrice}</span>
        </div>
      </div>
    </button>
  );
}
