import { createFileRoute } from "@tanstack/react-router";
import { HospitalityDiscover } from "@/components/hospitality/hospitality-discover";
import { hospitality } from "@/lib/hospitality/provider";
import { parseSearch, toUrlSearch, type UrlSearch } from "@/lib/hospitality/search";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/hospitality/")({
  // Normalised in one place: junk or hand-edited params fall back to defaults,
  // and a check-out that is not after check-in is dropped.
  validateSearch: (raw: Record<string, unknown>): UrlSearch => toUrlSearch(parseSearch(raw)),
  loader: async () => {
    const [stays, dining, destinations, slides] = await Promise.all([
      hospitality.listStays(),
      hospitality.listDining(),
      hospitality.destinations(),
      Promise.all([hospitality.heroSlides("stays"), hospitality.heroSlides("dining")]).then(([a, b]) => [...a, ...b]),
    ]);
    return { stays, dining, destinations, slides };
  },
  // Preview content: kept out of search engines until real listings replace the samples.
  head: () =>
    pageHead(
      "Places to stay and dine",
      "Preview of a hotel and restaurant discovery page for Sierra Leone, using sample listings.",
      "/hospitality",
      "noindex,nofollow",
    ),
  component: Page,
});

function Page() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <HospitalityDiscover
      {...data}
      search={search}
      // Replace, not push: typing in a filter should not fill the history with entries.
      onNavigate={(next) => void navigate({ search: next, replace: true, resetScroll: false })}
    />
  );
}
