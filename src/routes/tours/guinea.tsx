import { createFileRoute } from "@tanstack/react-router";
import { CountryToursPage } from "@/components/country-tours-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/tours/guinea")({
  head: () =>
    pageHead(
      "Guinea programmes",
      "Quote-only Guinea highland and overland programmes arranged from Tourism Is Life in Freetown.",
      "/tours/guinea",
    ),
  component: () => <CountryToursPage country="guinea" />,
});
