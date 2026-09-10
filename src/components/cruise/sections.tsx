import { CatalogImage } from "@/components/cruise/catalog-image";
import { cruiseOverview, cruiseDestinations } from "@/data/cruise";
import { cn } from "@/lib/utils";

export function SectionHeader({
  kicker,
  title,
  lede,
  className,
}: {
  kicker?: string;
  title: string;
  lede?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {kicker ? (
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold">{kicker}</p>
      ) : null}
      <h2 className="mt-3 font-display text-3xl text-brand sm:text-4xl">{title}</h2>
      {lede ? <p className="mt-3 text-base text-muted sm:text-lg">{lede}</p> : null}
    </div>
  );
}

export function OverviewGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cruiseOverview.map((item) => (
        <article key={item.id} className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-[var(--shadow-card)]">
          <div className="relative aspect-[16/9] overflow-hidden">
            <CatalogImage src={item.image} alt={item.imageAlt} className="size-full" />
          </div>
          <div className="flex flex-1 flex-col p-5">
            <h3 className="font-display text-xl text-brand">{item.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/80">{item.body}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function WhyTourismIsLife() {
  const items = [
    { title: "Established in 2013", body: "Tourism Is Life Tours is a destination management company established in 2013." },
    { title: "100% locally owned and managed", body: "The company is 100% locally owned and managed." },
    { title: "Experienced travel/tourism staff", body: "Qualified travel and tourism staff and guides with extensive travel and tourism experience." },
    { title: "Cruise ship handling", body: "Dedicated cruise ship handling as part of the company’s DMC services." },
    { title: "Full-service DMC", body: "Transportation, tours, excursions, hotels, and related destination services." },
    { title: "International customer base", body: "Serves an international customer base." },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.title} className="rounded-lg border border-line bg-surface p-5">
          <h3 className="font-display text-xl text-brand">{item.title}</h3>
          <p className="mt-2 text-sm text-muted">{item.body}</p>
        </div>
      ))}
    </div>
  );
}

export function DestinationGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cruiseDestinations.map((item) => (
        <article key={item.id} className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-[var(--shadow-card)]">
          <div className="relative aspect-[16/9] overflow-hidden">
            <CatalogImage src={item.image} alt={item.imageAlt} className="size-full" />
          </div>
          <div className="flex flex-1 flex-col p-5">
            <h3 className="font-display text-xl text-brand">{item.name}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/80">{item.summary}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function InfoList({ items }: { items: readonly string[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-ink/80">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ServiceGrid() {
  const services = [
    { title: "Fresh water", body: "Fresh water availability is listed in the proposal." },
    { title: "Bunkering", body: "Bunkering by truck is listed in the proposal." },
    { title: "Ship chandler", body: "Ship chandler / store provisions are listed." },
    { title: "Garbage collection", body: "Garbage collection is listed among port services." },
    { title: "Medical emergency", body: "Hospital, doctor, and dentist emergency availability is listed." },
    { title: "Telephone / mobile", body: "Telephone and mobile services are listed as available with notice." },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((item) => (
        <div key={item.title} className="rounded-lg border border-line bg-surface p-5">
          <h3 className="font-display text-xl text-brand">{item.title}</h3>
          <p className="mt-2 text-sm text-muted">{item.body}</p>
        </div>
      ))}
    </div>
  );
}

export function PersonnelSection() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-lg border border-line bg-surface p-6">
        <h3 className="font-display text-2xl text-brand">Drivers</h3>
        <ul className="mt-4 space-y-2 text-sm text-ink/80">
          <li>English-speaking</li>
          <li>Mobile-equipped</li>
          <li>5+ years driving experience</li>
          <li>Familiar with road conditions</li>
        </ul>
      </div>
      <div className="rounded-lg border border-line bg-surface p-6">
        <h3 className="font-display text-2xl text-brand">Tour guides</h3>
        <ul className="mt-4 space-y-2 text-sm text-ink/80">
          <li>Accompany excursions</li>
          <li>Provide historical and cultural information</li>
          <li>Monitor groups</li>
          <li>Coordinate pickup and drop-off</li>
          <li>Coordinate lunch and sightseeing</li>
          <li>Connect facilities and tour operations</li>
          <li>Provide guest briefings</li>
          <li>Provide first aid when needed</li>
        </ul>
      </div>
    </div>
  );
}

export function CapabilitiesList() {
  const items = [
    "English-speaking guides",
    "Lunch when stated on the excursion",
    "Bottled water",
    "Experienced drivers",
    "24-hour support desk once a request is confirmed",
    "Comprehensive bus insurance",
    "Fully air-conditioned buses",
  ];
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-ink/80">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ok" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function TermsAccordion() {
  const items = [
    { title: "Per-person costing", body: "Costs are charged per person." },
    { title: "Minimum numbers", body: "Minimum group numbers apply. Special arrangements may be possible when minimum numbers are not met." },
    { title: "Changes and cancellation", body: "Changes and cancellation fees apply." },
    { title: "Visa and shore pass", body: "Visa / shore-pass facilitation is available upon receiving the passenger manifest." },
    { title: "Gratuities", body: "Tips and gratuities are applicable." },
    { title: "Shipping agency", body: "Shipping agency cost is the cruise liner’s liability. The inbound operator can recommend an operator." },
  ];
  return (
    <div className="rounded-lg border border-line bg-surface divide-y divide-line">
      {items.map((item) => (
        <details key={item.title} className="group">
          <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-brand">
            {item.title}
            <span className="ml-4 text-muted transition group-open:rotate-180" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 6l4 4 4-4" />
              </svg>
            </span>
          </summary>
          <div className="px-5 pb-4 text-sm text-muted">{item.body}</div>
        </details>
      ))}
    </div>
  );
}
