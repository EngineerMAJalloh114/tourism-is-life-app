import { CalendarDays, Clock, ExternalLink, MapPin, Users } from "lucide-react";
import { useState } from "react";
import { DetailBreadcrumb, DetailSection, IconGrid, LocationCard, ReviewsNote } from "@/components/hospitality/detail-parts";
import { PropertyGallery } from "@/components/hospitality/gallery";
import { DiningStyleIcon, FeatureIcon } from "@/components/hospitality/icons";
import { InquiryDialog } from "@/components/hospitality/inquiry-dialog";
import { DiningCard, FavoriteButton, RatingLine } from "@/components/hospitality/listing-card";
import { SampleNotice } from "@/components/hospitality/sample-notice";
import { Calendar, Field, Stepper } from "@/components/hospitality/search-bar";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { DINING_STYLE_LABELS, FEATURE_LABELS, SAMPLE_LISTING_NOTE } from "@/data/hospitality";
import { show, toIso } from "@/lib/hospitality/format";
import { useFavoritesHydration } from "@/lib/hospitality/favorites";
import { useHeaderOffset } from "@/lib/hospitality/use-header-offset";
import type { DestinationOption, Restaurant } from "@/lib/hospitality/types";

const TIMES = Array.from({ length: 23 }, (_, i) => {
  const mins = 11 * 60 + i * 30;
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
});

/** A table request, not a live reservation: nothing here checks or holds a table. */
function ReservationCard({ place, destinationName }: { place: Restaurant; destinationName: string }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [party, setParty] = useState(2);
  const [open, setOpen] = useState<"" | "date" | "party">("");
  const set = (name: typeof open) => (o: boolean) => setOpen((cur) => (o ? name : cur === name ? "" : cur));
  const fieldClass = "rounded-xl border border-line bg-surface";

  return (
    <div className="rounded-2xl border border-line bg-page p-4 shadow-[var(--shadow-lift)] sm:p-5">
      <p className="font-display text-xl text-heading">Request a table</p>
      <p className="mt-1 text-sm text-muted">{place.priceRange ? `Price range ${place.priceRange}` : "Prices are confirmed on enquiry"}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Field label="Date" value={show(date)} placeholder="Add date" icon={<CalendarDays className="size-4" />} open={open === "date"} onOpenChange={set("date")} className={fieldClass} contentClassName="w-auto">
          <Calendar
            mode="single"
            date={date}
            onDate={(d) => {
              setDate(d ? toIso(d) : "");
              if (d) setOpen("");
            }}
          />
        </Field>
        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2 focus-within:outline-2 focus-within:outline-gold">
          <Clock className="size-5 shrink-0 text-gold-ink" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Time</span>
            <select value={time} onChange={(e) => setTime(e.target.value)} className="block w-full cursor-pointer appearance-none bg-transparent text-sm font-medium text-heading focus:outline-none">
              <option value="">Any time</option>
              {TIMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </span>
        </label>
        <Field
          label="Party size"
          value={`${party} ${party === 1 ? "guest" : "guests"}`}
          placeholder="Add guests"
          icon={<Users className="size-4" />}
          open={open === "party"}
          onOpenChange={set("party")}
          className={`${fieldClass} col-span-2`}
        >
          <div className="w-[min(18rem,calc(100vw-3rem))]">
            <Stepper label="Guests" value={party} min={1} max={20} onChange={setParty} />
          </div>
        </Field>
      </div>

      <InquiryDialog
        title="Request a table"
        summary={[place.name, date ? show(date) : "Date open", time || "Any time", `${party} ${party === 1 ? "guest" : "guests"}`]}
        details={{
          listing: place.name,
          listingType: "Restaurant",
          destination: [place.area, destinationName].filter(Boolean).join(", "),
          dates: date ? `${date}${time ? ` at ${time}` : ""}` : "Flexible",
          travelers: `${party} guests`,
        }}
        context={`Dining enquiry: ${place.name}${place.status === "sample" ? " (SAMPLE listing from the preview page, not a confirmed restaurant)" : ""}`}
        messageLabel="Special requests"
        messageHint="Dietary needs, occasion, seating preference"
        cta="Send enquiry"
        trigger={
          <Button type="button" size="lg" className="mt-4 w-full">
            Request a table
          </Button>
        }
      />
      <p className="mt-3 text-center text-xs leading-relaxed text-muted">
        Tables are not booked online. Our team checks with the restaurant and replies by email.
      </p>
    </div>
  );
}

export function DiningDetail({ place, related, destinations }: { place: Restaurant; related: Restaurant[]; destinations: DestinationOption[] }) {
  useFavoritesHydration();
  const top = useHeaderOffset(16);
  const destName = (id: string) => destinations.find((d) => d.id === id)?.name ?? id;
  const where = [place.area, destName(place.destination)].filter(Boolean).join(", ");

  return (
    <div>
      <SampleNotice />
      <div className="container-page py-5 sm:py-6">
        <DetailBreadcrumb kind="dining" name={place.name} />

        <div className="mt-5 grid gap-x-10 gap-y-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <PropertyGallery images={place.images} name={place.name} overlay={<FavoriteButton id={place.id} name={place.name} />} />
          </Reveal>

          <div className="lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
            <div className="lg:sticky" style={{ top }}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-surface px-3 text-xs uppercase tracking-[0.14em] text-muted">
                  <DiningStyleIcon id={place.style} className="size-3.5 text-gold-ink" />
                  {DINING_STYLE_LABELS[place.style]}
                </span>
                {place.status === "sample" ? (
                  <span className="inline-flex min-h-8 items-center rounded-full bg-brand-dark px-3 text-xs uppercase tracking-[0.14em] text-ivory">Sample listing</span>
                ) : null}
              </div>
              <h1 className="mt-3 font-display text-2xl leading-tight text-heading sm:text-3xl">{place.name}</h1>
              <p className="mt-2 text-sm text-muted">{place.cuisines.join(" · ")}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                <MapPin className="size-4 shrink-0 text-gold-ink" aria-hidden />
                {where}
                {place.rating ? <RatingLine rating={place.rating} className="ml-3 text-heading" /> : null}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink">{place.summary}</p>
              <div className="mt-6">
                <ReservationCard place={place} destinationName={destName(place.destination)} />
              </div>
              {place.menuUrl ? (
                <Button asChild variant="outline" size="lg" className="mt-3 w-full">
                  <a href={place.menuUrl} target="_blank" rel="noopener noreferrer">
                    View menu <ExternalLink className="size-4" aria-hidden />
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-6">
            {place.status === "sample" ? <p className="rounded-2xl bg-surface px-4 py-3 text-sm text-muted">{SAMPLE_LISTING_NOTE}</p> : null}
            <DetailSection id="about-title" title={`About ${place.name}`} className="mt-6">
              <p className="max-w-prose text-sm leading-relaxed text-ink">{place.description}</p>
            </DetailSection>
            {place.features.length > 0 ? (
              <DetailSection id="features-title" title="Features">
                <IconGrid items={place.features.map((f) => ({ id: f, label: FEATURE_LABELS[f], icon: <FeatureIcon id={f} className="size-5" /> }))} />
              </DetailSection>
            ) : null}
            <DetailSection id="hours-title" title="Opening hours">
              {place.hours ? (
                <dl className="grid max-w-sm grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                  {place.hours.map((h) => (
                    <div key={h.days} className="contents">
                      <dt className="text-muted">{h.days}</dt>
                      <dd className="text-ink">{h.hours}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-muted">Opening hours are confirmed with the restaurant when you enquire.</p>
              )}
            </DetailSection>
            <DetailSection id="reviews-title" title="Reviews">
              <ReviewsNote published={Boolean(place.rating)} />
            </DetailSection>
            <DetailSection id="location-title" title="Location">
              <LocationCard place={where} />
            </DetailSection>
          </div>
        </div>

        {related.length > 0 ? (
          <section aria-labelledby="related-title" className="mt-12 border-t border-line pt-10">
            <h2 id="related-title" className="font-display text-xl text-heading sm:text-2xl">
              Similar places to dine
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {related.map((r) => (
                <li key={r.id}>
                  <DiningCard place={r} destinationName={destName(r.destination)} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
