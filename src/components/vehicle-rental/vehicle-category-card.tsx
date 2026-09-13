import type { VehicleCategoryInfo } from "@/data/vehicle-rental";

export function VehicleCategoryCard({ category, onClick }: { category: VehicleCategoryInfo; onClick?: (slug: string) => void }) {
  return (
    <button
      onClick={() => onClick?.(category.slug)}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface text-left shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={category.image} alt={category.imageAlt} className="size-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <span className="rounded-sm bg-brand/90 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-ivory">{category.label}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm text-muted">{category.description}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted">
          <span>Seats: {category.seats}</span>
          <span>Luggage: {category.luggage}</span>
          <span>Trans: {category.transmission}</span>
          <span className="font-medium text-gold">{category.startingPrice}</span>
        </div>
      </div>
    </button>
  );
}
