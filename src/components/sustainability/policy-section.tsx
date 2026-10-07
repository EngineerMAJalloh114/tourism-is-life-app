import { Link } from "@tanstack/react-router";
import { ArrowRight, FileText } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { SUSTAINABILITY_POLICY_URL } from "@/data/sustainability";

/**
 * Document access. When `SUSTAINABILITY_POLICY_URL` is set the button opens
 * the real document; while it is null no link is shown and the section says
 * plainly that nothing is published, so no placeholder can pass as a policy.
 */
export function PolicySection() {
  const published = Boolean(SUSTAINABILITY_POLICY_URL);
  return (
    <section aria-labelledby="policy-title" className="container-page py-6 lg:py-10">
      <Reveal>
        <div className="grid items-center gap-6 rounded-3xl border border-line bg-surface p-6 sm:p-8 md:grid-cols-[auto_1fr_auto] md:gap-8">
          <span className="grid size-14 place-items-center rounded-2xl bg-page text-gold-ink shadow-[var(--shadow-card)]">
            <FileText className="size-7" strokeWidth={1.5} aria-hidden />
          </span>
          <div>
            <h2 id="policy-title" className="font-display text-2xl text-heading sm:text-3xl">
              Our sustainability policy
            </h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
              {published
                ? "Read the written policy that sets out how we approach responsible tourism."
                : "A written policy has not been published yet. Until it is, this page describes our approach. If you need more detail for a programme, ask us."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {published ? (
              <Button asChild size="lg" variant="dark">
                <a href={SUSTAINABILITY_POLICY_URL as string} target="_blank" rel="noopener noreferrer">
                  View Sustainability Policy
                  <ArrowRight className="ml-2 size-4" aria-hidden />
                </a>
              </Button>
            ) : (
              <>
                <Button size="lg" variant="dark" disabled className="disabled:opacity-55">
                  View Sustainability Policy
                </Button>
                <Link
                  to="/contact"
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-gold-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-gold"
                >
                  Ask us a question <ArrowRight className="size-4" aria-hidden />
                </Link>
              </>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
