import { createFileRoute } from "@tanstack/react-router";
import { CountryToursPage } from "@/components/country-tours-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/tours/sierra-leone")({
  head: () =>
    pageHead(
      "Sierra Leone tours",
      "City, peninsula, island, rainforest and highland tours from Tourism Is Life, a Freetown destination management company.",
      "/tours/sierra-leone",
    ),
  component: () => <CountryToursPage country="sierra-leone" />,
});
