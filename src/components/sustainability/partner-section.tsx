import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { IconFor } from "@/components/sustainability/icon-for";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { PARTNER_CARDS } from "@/data/sustainability";
import { cn } from "@/lib/utils";

/** For international tour operators: what a Freetown DMC can do for a responsible programme. */
export function PartnerSection() {
  return (
    <section id="partners" aria-labelledby="partners-title" className="container-page scroll-mt-48 py-14 lg:py-20">
      <div className="overflow-hidden rounded-3xl bg-brand-dark p-6 text-ivory sm:p-10 lg:p-14">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <Reveal className="lg:col-span-4">
            <p className="text-xs uppercase tracking-[0.22em] text-gold">For tour operators</p>
            <h2 id="partners-title" className="mt-3 font-display text-3xl sm:text-4xl">
              Responsible tourism for our partners
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ivory/80">
              Tourism Is Life is a destination management company. Here is how we can support a
              programme that takes responsible tourism seriously.
            </p>
            <Button asChild size="lg" className="group mt-7">
              <Link to="/contact/partner">
                Work With Tourism Is Life
                <ArrowRight
                  className="ml-2 size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
                  aria-hidden
                />
              </Link>
            </Button>
          </Reveal>

          <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
            {PARTNER_CARDS.map((c, i) => (
              <li key={c.title} className={cn(i === 0 && "sm:col-span-2")}>
                <Reveal delay={i * 80} className="h-full">
                  <div className="h-full rounded-2xl border border-ivory/15 bg-ivory/5 p-5 transition-[transform,background-color,border-color] duration-300 hover:-translate-y-0.5 hover:border-gold/60 hover:bg-ivory/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                    <IconFor name={c.icon} className="size-6 text-gold" />
                    <h3 className="mt-3 font-display text-xl">{c.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ivory/75">{c.body}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
