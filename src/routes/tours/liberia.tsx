import { createFileRoute } from "@tanstack/react-router";
import { CountryToursPage } from "@/components/country-tours-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/tours/liberia")({
  head: () =>
    pageHead(
      "Liberia programmes",
      "Custom Liberia ground handling including Sapo National Park — quote-only from Tourism Is Life.",
      "/tours/liberia",
    ),
  component: () => <CountryToursPage country="liberia" />,
});
