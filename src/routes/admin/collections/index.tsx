import { createFileRoute, Link } from "@tanstack/react-router";
import { requirePageCapability } from "@/lib/admin-access";
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
};

function CollectionsIndex() {
  return (
    <div>
      <h1 className="font-display text-3xl text-heading">Collections</h1>
      <p className="mt-2 text-sm text-muted">
        The records the site lists. Edits stay in a draft until published. The public pages read these from a later release; until then
        they show what is in the code.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {COLLECTION_IDS.map((id) => (
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
