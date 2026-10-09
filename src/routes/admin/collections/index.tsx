import { createFileRoute, Link } from "@tanstack/react-router";
import { hasCapability, requirePageCapability } from "@/lib/admin-access";
import { AdminRouteError } from "@/components/admin/admin-route-error";
import { COLLECTIONS, COLLECTION_IDS } from "@/lib/collections/registry";

export const Route = createFileRoute("/admin/collections/")({
  beforeLoad: ({ context }) => requirePageCapability(context.access, "collections.edit"),
  errorComponent: AdminRouteError,
  component: CollectionsIndex,
});

const HELP: Record<string, string> = {
  circuits: "The four regions. Their ids are fixed because the site's layout uses them.",
  destinations: "Places within each circuit.",
  tours: "Tours with itinerary, inclusions, gallery and questions.",
  "faq-groups": "Question sets that several tours share.",
  services: "The seven DMC services.",
  "journal-posts": "Journal articles.",
  "journal-categories": "The journal sections.",
  "cruise-overview": "The cruise services shown on the cruise page.",
  "cruise-excursions": "Shore programmes for cruise calls. Prices are rates, kept separately.",
  "cruise-destinations": "Places cruise guests visit.",
  vehicles: "Rental vehicles. Rates are kept separately; availability is never shown.",
  "vehicle-categories": "The eight vehicle types. Their keys are fixed.",
  testimonials: "Quotes from travellers, shown only with a source link and date.",
  "team-profiles": "Public profiles. A photo shows only with recorded consent.",
  stays: "Sample stays for the Stay & Dine preview. They stay samples while the preview is on.",
  dining: "Sample dining places for the Stay & Dine preview.",
};

function CollectionsIndex() {
  const { access } = Route.useRouteContext();
  const shown = COLLECTION_IDS.filter((id) => !COLLECTIONS[id].editCapability || hasCapability(access, COLLECTIONS[id].editCapability));
  return (
    <div>
      <h1 className="font-display text-3xl text-heading">Collections</h1>
      <p className="mt-2 text-sm text-muted">
        The records the site lists. Edits stay in a draft until published. The public pages read these from a later release; until then
        they show what is in the code.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {shown.map((id) => (
          <li key={id}>
            <Link
              to="/admin/collections/$collection"
              params={{ collection: id }}
              className="block rounded-lg border border-line bg-surface p-4 hover:border-gold"
            >
              <p className="font-display text-xl text-heading">{COLLECTIONS[id].label}</p>
              <p className="mt-1 text-sm text-muted">{HELP[id]}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
