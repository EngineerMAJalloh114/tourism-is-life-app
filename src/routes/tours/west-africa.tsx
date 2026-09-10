import { createFileRoute } from "@tanstack/react-router";
import { CountryToursPage } from "@/components/country-tours-page";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/tours/west-africa")({
  head: () =>
    pageHead(
      "West Africa circuits",
      "Multi-country Mano River circuits across Sierra Leone, Guinea and Liberia — operator and private-group quotes.",
      "/tours/west-africa",
    ),
  component: () => <CountryToursPage country="west-africa" />,
});
