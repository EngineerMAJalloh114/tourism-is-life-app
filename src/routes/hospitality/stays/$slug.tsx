import { createFileRoute, notFound } from "@tanstack/react-router";
import { StayDetail } from "@/components/hospitality/stay-detail";
import { hospitality } from "@/lib/hospitality/provider";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/hospitality/stays/$slug")({
  loader: async ({ params }) => {
    const [stay, all, destinations] = await Promise.all([hospitality.getStay(params.slug), hospitality.listStays(), hospitality.destinations()]);
    if (!stay) throw notFound();
    const others = all.filter((s) => s.id !== stay.id);
    const related = [...others.filter((s) => s.destination === stay.destination), ...others.filter((s) => s.destination !== stay.destination)].slice(0, 5);
    return { stay, related, destinations };
  },
  head: ({ loaderData }) =>
    pageHead(
      loaderData?.stay.name ?? "Place to stay",
      "Sample listing in a preview of Tourism Is Life's stays page.",
      `/hospitality/stays/${loaderData?.stay.slug ?? ""}`,
      "noindex,nofollow",
    ),
  component: Page,
});

function Page() {
  const { stay, related, destinations } = Route.useLoaderData();
  return <StayDetail stay={stay} related={related} destinations={destinations} />;
}
