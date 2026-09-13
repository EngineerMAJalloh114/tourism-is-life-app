import { createFileRoute, Outlet } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/checkout/$ref")({
  validateSearch: (s: Record<string, unknown>) => ({
    t: typeof s.t === "string" ? s.t : undefined,
  }),
  head: () => pageHead("Checkout", "Complete your Tourism Is Life reservation.", "/checkout", "noindex,nofollow"),
  component: () => <Outlet />,
});
