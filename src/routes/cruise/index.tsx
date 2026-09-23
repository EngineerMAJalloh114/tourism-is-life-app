import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { IMG_CRUISE } from "@/data/catalog";
import { CRUISE_HERO } from "@/data/cruise";
import { Button } from "@/components/ui/button";
import { StickySectionNav } from "@/components/cruise/sticky-section-nav";
import { ExcursionExplorer } from "@/components/cruise/excursion-explorer";
import { CruiseInquiryForm } from "@/components/cruise/cruise-inquiry-form";
import {
  SectionHeader,
  OverviewGrid,
  WhyTourismIsLife,
  DestinationGrid,
  InfoList,
  ServiceGrid,
  PersonnelSection,
  CapabilitiesList,
  TermsAccordion,
} from "@/components/cruise/sections";
import {
  portFacts,
  vesselInfoRequired,
  documentationChecklist,
  paymentNotes,
  cruiseContacts,
  pilotage,
  anchorageNotes,
  berthingNote,
} from "@/data/cruise";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/cruise/")({
  head: () =>
    pageHead(
      "Cruise Ship Handling",
      "Cruise ship handling, shore excursions, destination services, and turnaround support in Freetown, Sierra Leone.",
      "/cruise",
    ),
  component: Cruise,
});

function Cruise() {
  return (
    <>
      <PageHero
        kicker="Cruise handling"
        title="Cruise Ship Handling"
        lede="Call Freetown with confidence. Tourism Is Life is your Sierra Leone cruise desk for shore excursions, turnaround services, destination services, and 24-hour support."
        image={CRUISE_HERO.image}
        imageAlt={CRUISE_HERO.imageAlt}
      />

      <div className="bg-surface">
        <div className="container-page py-16">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="text-lg leading-relaxed text-ink/80">
                Tourism Is Life assists cruise lines and operators with shore programmes,
                ground transport, and destination services in Sierra Leone. Every programme
                is timed to ship schedules and confirmed per call.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/cruise/quote">Request a cruise plan</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/cruise/shore-excursions">Explore shore excursions</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-lg border border-line bg-page p-6 text-sm text-muted">
              <p className="font-medium text-heading">Emergency / operations</p>
              <p className="mt-2">
                A 24-hour contact is provided once a request is confirmed. For urgent
                port matters, contact the operations officer: {cruiseContacts.operationsOfficer}.
                Travel director: {cruiseContacts.travelDirector}.
              </p>
            </div>
          </div>
        </div>
      </div>

      <StickySectionNav />

      <div className="container-page py-16 space-y-24">
        <section id="overview" className="scroll-mt-32">
          <SectionHeader
            kicker="Overview"
            title="Cruise services in Sierra Leone"
            lede="A full-service DMC for cruise calls at Freetown, covering arrival coordination, shore programmes, and turnaround support."
          />
          <div className="mt-8">
            <OverviewGrid />
          </div>
        </section>

        <section id="why" className="scroll-mt-32">
          <SectionHeader
            kicker="Why Tourism Is Life"
            title="Local expertise, international standards"
            lede="A locally owned and managed destination management company with the experience to handle cruise calls safely and professionally."
          />
          <div className="mt-8">
            <WhyTourismIsLife />
          </div>
        </section>

        <section id="excursions" className="scroll-mt-32">
          <SectionHeader
            kicker="Shore excursions"
            title="Explore shore excursions"
            lede="Six primary shore programmes covering Freetown, heritage islands, rainforest, wildlife, and peninsula beaches, timed to ship schedules."
          />
          <div className="mt-8">
            <ExcursionExplorer onSelect={() => {}} />
          </div>
        </section>

        <section id="destinations" className="scroll-mt-32">
          <SectionHeader
            kicker="Destination discovery"
            title="Where cruise guests go"
            lede="Freetown, Bunce Island, Tacugama, Banana Island, River No. 2, and the peninsula beaches, all within reach of Queen Elizabeth II Quay."
          />
          <div className="mt-8">
            <DestinationGrid />
          </div>
        </section>

        <section id="port" className="scroll-mt-32">
          <SectionHeader
            kicker="Port of Freetown"
            title="Queen Elizabeth II Quay"
            lede="Africa’s largest natural harbour, with a minimum entrance depth of 11.6m and quay facilities for cruise calls."
          />
          <div className="mt-8 rounded-lg border border-line bg-surface p-6 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="font-display text-2xl text-heading">Port facts</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-3 border-b border-line pb-3">
                    <dt className="text-muted">Name</dt>
                    <dd className="text-ink/80">{portFacts.name}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-line pb-3">
                    <dt className="text-muted">Location</dt>
                    <dd className="text-ink/80">{portFacts.location}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-line pb-3">
                    <dt className="text-muted">Minimum entrance depth</dt>
                    <dd className="text-ink/80">11.6m</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-line pb-3">
                    <dt className="text-muted">Original quay length</dt>
                    <dd className="text-ink/80">365m</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-line pb-3">
                    <dt className="text-muted">Quay extension</dt>
                    <dd className="text-ink/80">702m</dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs text-muted">{portFacts.attribution}</p>
              </div>
              <div className="flex items-center justify-center">
                <img
                  src={IMG_CRUISE}
                  alt="Freetown harbour, Sierra Leone"
                  className="size-full max-h-80 rounded-lg object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="arrival" className="scroll-mt-32">
          <SectionHeader
            kicker="Arrival information"
            title="48-hour vessel information"
            lede="The following vessel information is required for cruise calls at Freetown."
          />
          <div className="mt-8">
            <InfoList items={vesselInfoRequired} />
          </div>
        </section>

        <section id="documentation" className="scroll-mt-32">
          <SectionHeader
            kicker="Documentation"
            title="Documentation checklist"
            lede="Required documentation for port clearance and customs facilitation."
          />
          <div className="mt-8">
            <InfoList items={documentationChecklist} />
          </div>
        </section>

        <section id="services" className="scroll-mt-32">
          <SectionHeader
            kicker="Port services"
            title="Services at the quay"
            lede="Essential port services available for cruise calls at Freetown."
          />
          <div className="mt-8">
            <ServiceGrid />
          </div>
        </section>

        <section id="berthing" className="scroll-mt-32">
          <SectionHeader
            kicker="Berthing & maritime"
            title="Pilotage, anchorage, and berthing"
            lede="Maritime information for smooth arrival and departure at Freetown."
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface p-6">
              <h3 className="font-display text-2xl text-heading">Pilotage</h3>
              <ul className="mt-4 space-y-2 text-sm text-ink/80">
                {pilotage.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-line bg-surface p-6">
              <h3 className="font-display text-2xl text-heading">Anchorage & tugs</h3>
              <ul className="mt-4 space-y-2 text-sm text-ink/80">
                {anchorageNotes.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted">{berthingNote}</p>
            </div>
          </div>
        </section>

        <section id="personnel" className="scroll-mt-32">
          <SectionHeader
            kicker="Personnel"
            title="Guides and drivers"
            lede="Experienced English-speaking staff who accompany every cruise programme."
          />
          <div className="mt-8">
            <PersonnelSection />
          </div>
        </section>

        <section id="capabilities" className="scroll-mt-32">
          <SectionHeader
            kicker="Capabilities"
            title="What we provide"
            lede="Standard inclusions and capabilities across cruise programmes."
          />
          <div className="mt-8">
            <CapabilitiesList />
          </div>
        </section>

        <section id="terms" className="scroll-mt-32">
          <SectionHeader
            kicker="Terms"
            title="Booking terms"
            lede="Key terms for cruise excursion bookings and services."
          />
          <div className="mt-8">
            <TermsAccordion />
          </div>
        </section>

        <section id="payment" className="scroll-mt-32">
          <SectionHeader
            kicker="Payment"
            title="Payment terms"
            lede="Payment arrangements for confirmed cruise programmes."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-surface p-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Deposit</p>
              <p className="mt-2 text-sm text-ink/80">{paymentNotes.deposit}</p>
            </div>
            <div className="rounded-lg border border-line bg-surface p-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Balance</p>
              <p className="mt-2 text-sm text-ink/80">{paymentNotes.balance}</p>
            </div>
            <div className="rounded-lg border border-line bg-surface p-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Banking</p>
              <p className="mt-2 text-sm text-ink/80">{paymentNotes.banking}</p>
            </div>
          </div>
        </section>

        <section id="inquiry" className="scroll-mt-32">
          <SectionHeader
            kicker="Cruise inquiry"
            title="Request a cruise plan"
            lede="Submit your vessel and programme requirements. The cruise desk confirms every itinerary in writing."
          />
          <div className="mt-8">
            <CruiseInquiryForm />
          </div>
        </section>
      </div>
    </>
  );
}
