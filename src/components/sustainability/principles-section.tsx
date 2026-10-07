import * as Accordion from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { PRINCIPLES } from "@/data/sustainability";

export function PrinciplesSection() {
  return (
    <section id="principles" aria-labelledby="principles-title" className="container-page scroll-mt-48 py-14 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        <Reveal className="lg:col-span-4">
          <p className="text-xs uppercase tracking-[0.22em] text-gold-ink">What guides us</p>
          <h2 id="principles-title" className="mt-3 font-display text-3xl text-heading sm:text-4xl lg:text-5xl">
            Our principles
          </h2>
        </Reveal>
        <Reveal delay={100} className="lg:col-span-8">
          <Accordion.Root type="single" collapsible className="divide-y divide-line border-y border-line">
            {PRINCIPLES.map((p) => (
              <Accordion.Item key={p.word} value={p.word}>
                <Accordion.Header>
                  <Accordion.Trigger className="group grid min-h-20 w-full grid-cols-[1fr_auto] items-center gap-4 py-4 text-left focus-visible:outline-2 focus-visible:outline-gold sm:grid-cols-[13rem_1fr_auto]">
                    <span className="font-display text-xl uppercase tracking-[0.05em] text-heading sm:text-2xl">
                      {p.word}
                    </span>
                    <span className="order-3 col-span-2 text-sm leading-relaxed text-muted sm:order-none sm:col-span-1">
                      {p.line}
                    </span>
                    <Plus
                      className="size-5 text-gold-ink transition-transform duration-300 group-data-[state=open]:rotate-45 motion-reduce:transition-none"
                      aria-hidden
                    />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="acc-content">
                  <p className="max-w-xl pb-5 text-sm leading-relaxed text-ink sm:pl-[13.5rem]">{p.more}</p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </Reveal>
      </div>
    </section>
  );
}
