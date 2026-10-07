import { createFileRoute, notFound } from "@tanstack/react-router";
import { DiningDetail } from "@/components/hospitality/dining-detail";
import { hospitality } from "@/lib/hospitality/provider";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/hospitality/dining/$slug")({
  loader: async ({ params }) => {
    const [place, all, destinations] = await Promise.all([hospitality.getRestaurant(params.slug), hospitality.listDining(), hospitality.destinations()]);
    if (!place) throw notFound();
    const others = all.filter((r) => r.id !== place.id);
    const related = [...others.filter((r) => r.destination === place.destination), ...others.filter((r) => r.destination !== place.destination)].slice(0, 5);
    return { place, related, destinations };
  },
  head: ({ loaderData }) =>
    pageHead(
      loaderData?.place.name ?? "Place to dine",
      "Sample listing in a preview of Tourism Is Life's dining page.",
      `/hospitality/dining/${loaderData?.place.slug ?? ""}`,
      "noindex,nofollow",
    ),
  component: Page,
});

function Page() {
  const { place, related, destinations } = Route.useLoaderData();
  return <DiningDetail place={place} related={related} destinations={destinations} />;
}
