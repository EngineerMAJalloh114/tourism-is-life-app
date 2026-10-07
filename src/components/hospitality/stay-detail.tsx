import { CalendarDays, MapPin, Users } from "lucide-react";
import { useState } from "react";
import { AmenityIcon, StayTypeIcon } from "@/components/hospitality/icons";
import { DetailBreadcrumb, DetailSection, IconGrid, LocationCard, ReviewsNote } from "@/components/hospitality/detail-parts";
import { PropertyGallery } from "@/components/hospitality/gallery";
import { InquiryDialog } from "@/components/hospitality/inquiry-dialog";
import { FavoriteButton, RatingLine, StayCard } from "@/components/hospitality/listing-card";
import { formatMoney } from "@/lib/hospitality/format";
import { SampleNotice } from "@/components/hospitality/sample-notice";
import { Calendar, Field, Stepper } from "@/components/hospitality/search-bar";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { AMENITY_LABELS, SAMPLE_LISTING_NOTE, STAY_TYPE_LABELS } from "@/data/hospitality";
import { show, toIso } from "@/lib/hospitality/format";
import { useFavoritesHydration } from "@/lib/hospitality/favorites";
import { isValidRange, nightsBetween } from "@/lib/hospitality/search";
import { useHeaderOffset } from "@/lib/hospitality/use-header-offset";
import type { DestinationOption, Stay } from "@/lib/hospitality/types";

function BookingCard({ stay, destinationName }: { stay: Stay; destinationName: string }) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [open, setOpen] = useState<"" | "in" | "out" | "guests">("");
  const nights = nightsBetween(checkIn, checkOut);
  const guests = adults + children;

  const onRange = (r: { from?: Date; to?: Date } | undefined) => {
    const from = r?.from ? toIso(r.from) : "";
    const to = r?.to ? toIso(r.to) : "";
    if (from && to && !isValidRange(from, to)) {
      setCheckIn(from);
      setCheckOut("");
    } else {
      setCheckIn(from);
      setCheckOut(to);
      if (from && to) setOpen("");
    }
  };
  const set = (name: typeof open) => (o: boolean) => setOpen((cur) => (o ? name : cur === name ? "" : cur));

  const summary = [
    checkIn ? (checkOut ? `${show(checkIn)} to ${show(checkOut)}` : `From ${show(checkIn)}`) : "Dates open",
    nights > 0 ? `${nights} ${nights === 1 ? "night" : "nights"}` : "",
    `${adults} ${adults === 1 ? "adult" : "adults"}${children ? `, ${children} ${children === 1 ? "child" : "children"}` : ""}`,
  ].filter(Boolean);

  const fieldClass = "rounded-xl border border-line bg-surface";
  return (
    <div className="rounded-2xl border border-line bg-page p-4 shadow-[var(--shadow-lift)] sm:p-5">
      <p className="font-display text-xl text-heading">
        {stay.price ? (
          <>
            {formatMoney(stay.price)} <span className="text-base font-normal text-muted">/ night</span>
          </>
        ) : (
          "Price on request"
        )}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Field label="Check in" value={show(checkIn)} placeholder="Add date" icon={<CalendarDays className="size-4" />} open={open === "in"} onOpenChange={set("in")} className={fieldClass} contentClassName="w-auto">
          <Calendar mode="range" checkIn={checkIn} checkOut={checkOut} onRange={onRange} />
        </Field>
        <Field label="Check out" value={show(checkOut)} placeholder="Add date" icon={<CalendarDays className="size-4" />} open={open === "out"} onOpenChange={set("out")} className={fieldClass} contentClassName="w-auto">
          <Calendar mode="range" checkIn={checkIn} checkOut={checkOut} onRange={onRange} />
        </Field>
        <Field
          label="Guests"
          value={`${guests} ${guests === 1 ? "guest" : "guests"}`}
          placeholder="Add guests"
          icon={<Users className="size-4" />}
          open={open === "guests"}
          onOpenChange={set("guests")}
          className={`${fieldClass} col-span-2`}
        >
          <div className="w-[min(18rem,calc(100vw-3rem))]">
            <Stepper label="Adults" hint="Age 13 or above" value={adults} min={1} max={12} onChange={setAdults} />
            <Stepper label="Children" hint="Under 13" value={children} min={0} max={8} onChange={setChildren} />
          </div>
        </Field>
      </div>

      <InquiryDialog
        title={`Request availability`}
        summary={[stay.name, ...summary]}
        details={{
          listing: stay.name,
          listingType: STAY_TYPE_LABELS[stay.type],
          destination: [stay.area, destinationName].filter(Boolean).join(", "),
          dates: checkIn ? (checkOut ? `${checkIn} to ${checkOut}` : `From ${checkIn}`) : "Flexible",
          travelers: `${adults} adults${children ? `, ${children} children` : ""}`,
        }}
        context={`Stays enquiry: ${stay.name}${stay.status === "sample" ? " (SAMPLE listing from the preview page, not a confirmed property)" : ""}`}
        messageLabel="Anything we should know?"
        messageHint="Room needs, arrival time, questions for the property"
        cta="Send enquiry"
        trigger={
          <Button type="button" size="lg" className="mt-4 w-full">
            Request availability
          </Button>
        }
      />
      <p className="mt-3 text-center text-xs leading-relaxed text-muted">
        Nothing is booked or charged online. Our team checks availability with the property and replies by email.
      </p>
    </div>
  );
}

export function StayDetail({ stay, related, destinations }: { stay: Stay; related: Stay[]; destinations: DestinationOption[] }) {
  useFavoritesHydration();
  const top = useHeaderOffset(16);
  const destName = (id: string) => destinations.find((d) => d.id === id)?.name ?? id;
  const place = [stay.area, destName(stay.destination)].filter(Boolean).join(", ");

  return (
    <div>
      <SampleNotice />
      <div className="container-page py-5 sm:py-6">
        <DetailBreadcrumb kind="stays" name={stay.name} />

        <div className="mt-5 grid gap-x-10 gap-y-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <PropertyGallery images={stay.images} name={stay.name} overlay={<FavoriteButton id={stay.id} name={stay.name} />} />
          </Reveal>

          <div className="lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
            <div className="lg:sticky" style={{ top }}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-surface px-3 text-xs uppercase tracking-[0.14em] text-muted">
                  <StayTypeIcon id={stay.type} className="size-3.5 text-gold-ink" />
                  {STAY_TYPE_LABELS[stay.type]}
                </span>
                {stay.status === "sample" ? (
                  <span className="inline-flex min-h-8 items-center rounded-full bg-brand-dark px-3 text-xs uppercase tracking-[0.14em] text-ivory">Sample listing</span>
                ) : null}
              </div>
              <h1 className="mt-3 font-display text-2xl leading-tight text-heading sm:text-3xl">{stay.name}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                <MapPin className="size-4 shrink-0 text-gold-ink" aria-hidden />
                {place}
                {stay.rating ? <RatingLine rating={stay.rating} className="ml-3 text-heading" /> : null}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink">{stay.summary}</p>
              <div className="mt-6">
                <BookingCard stay={stay} destinationName={destName(stay.destination)} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            {stay.status === "sample" ? <p className="rounded-2xl bg-surface px-4 py-3 text-sm text-muted">{SAMPLE_LISTING_NOTE}</p> : null}
            {stay.amenities.length > 0 ? (
              <DetailSection id="amenities-title" title="Amenities" className="mt-6">
                <IconGrid items={stay.amenities.map((a) => ({ id: a, label: AMENITY_LABELS[a], icon: <AmenityIcon id={a} className="size-5" /> }))} />
              </DetailSection>
            ) : null}
            <DetailSection id="about-title" title={`About ${stay.name}`}>
              <p className="max-w-prose text-sm leading-relaxed text-ink">{stay.description}</p>
            </DetailSection>
            <DetailSection id="reviews-title" title="Reviews">
              <ReviewsNote published={Boolean(stay.rating)} />
            </DetailSection>
            <DetailSection id="location-title" title="Location">
              <LocationCard place={place} />
            </DetailSection>
          </div>
        </div>

        {related.length > 0 ? (
          <section aria-labelledby="related-title" className="mt-12 border-t border-line pt-10">
            <h2 id="related-title" className="font-display text-xl text-heading sm:text-2xl">
              Similar places to stay
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {related.map((r) => (
                <li key={r.id}>
                  <StayCard stay={r} destinationName={destName(r.destination)} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
