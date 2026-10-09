import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { hasCapability, requirePageCapability } from "@/lib/admin-access";
import { AdminRouteError } from "@/components/admin/admin-route-error";
import { RecordForm, type Previews, type RefOptions } from "@/components/admin/record-form";
import { Button } from "@/components/ui/button";
import { BLANK_RECORDS } from "@/lib/collections/blanks";
import { COLLECTIONS, isCollectionId, referencesOf, type CollectionDef, type CollectionId } from "@/lib/collections/registry";
import {
  adminCreateCollectionItem,
  adminGetCollectionItem,
  adminListCollectionItems,
  adminPublishCollectionItem,
  adminSaveCollectionItem,
  adminSetCollectionItemHidden,
  adminTrashCollectionItem,
} from "@/lib/server/admin/collections.functions";
import { adminMediaPreviews } from "@/lib/server/admin/media.functions";

export const Route = createFileRoute("/admin/collections/$collection/$id")({
  beforeLoad: ({ context, params }) => {
    requirePageCapability(context.access, "collections.edit");
    if (!isCollectionId(params.collection)) throw notFound();
  },
  errorComponent: AdminRouteError,
  component: EditorPage,
});

type Item = Awaited<ReturnType<typeof adminGetCollectionItem>>;
type Data = Record<string, unknown>;

function messageOf(e: unknown, fallback: string) {
  return e instanceof Error && e.message ? e.message : fallback;
}

/** Choices for the "points at" fields: destinations for a tour, FAQ groups. */
function useRefOptions(def: CollectionDef): RefOptions {
  const [options, setOptions] = useState<RefOptions>({});
  useEffect(() => {
    const wanted = [...new Set(def.fields.flatMap((f) => (f.kind === "ref" ? [f.collection] : [])))];
    void Promise.all(wanted.map((c) => adminListCollectionItems({ data: { collection: c } }).then((rows) => [c, rows] as const))).then((pairs) =>
      setOptions(Object.fromEntries(pairs.map(([c, rows]) => [c, rows.map((r) => ({ key: r.key, title: r.title }))]))),
    );
  }, [def]);
  return options;
}

function usePreviews(collection: CollectionId, data: Data | null) {
  const [previews, setPreviews] = useState<Previews>({});
  const ids = data ? referencesOf(collection, data).media.map((m) => m.id).filter((id) => id && !previews[id]) : [];
  const wanted = ids.join(",");
  useEffect(() => {
    if (!wanted) return;
    void adminMediaPreviews({ data: { ids: wanted.split(",") } }).then((p) => setPreviews((prev) => ({ ...prev, ...p })));
  }, [wanted]);
  return { previews, addPreview: (id: string, p: Previews[string]) => setPreviews((prev) => ({ ...prev, [id]: p })) };
}

function EditorPage() {
  const { collection, id } = Route.useParams();
  const { access } = Route.useRouteContext();
  const def = COLLECTIONS[collection as CollectionId];
  const creating = id === "new";
  const navigate = useNavigate();
  const canDelete = hasCapability(access, "collections.delete");
  const canSourceClaims = hasCapability(access, "claims.source");
  const [item, setItem] = useState<Item | null>(null);
  const [data, setData] = useState<Data | null>(creating ? structuredClone(BLANK_RECORDS[def.id]) : null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmTrash, setConfirmTrash] = useState(false);
  const refOptions = useRefOptions(def);
  const { previews, addPreview } = usePreviews(def.id, data);

  function load() {
    if (creating) return;
    void adminGetCollectionItem({ data: { id } })
      .then((it) => {
        setItem(it);
        setData(it.draft as Data);
        setDirty(false);
      })
      .catch((e) => setErr(messageOf(e, "Could not load this record.")));
  }
  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(action: () => Promise<string | null>) {
    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      const message = await action();
      if (message) setNotice(message);
    } catch (e) {
      setErr(messageOf(e, "That change was not saved."));
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <p className="text-muted">{err ?? "Loading…"}</p>;
  const title = String(data[def.titleField] || (creating ? `New ${def.singular}` : item?.key));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm">
          <Link to="/admin/collections/$collection" params={{ collection: def.id }} className="text-muted hover:text-heading">
            {def.label}
          </Link>
        </p>
        <h1 className="mt-1 font-display text-3xl text-heading">{title}</h1>
        {item ? (
          <p className="mt-2 text-sm text-muted">
            {item.status === "draft" ? "Not published yet." : item.status === "hidden" ? "Hidden from the site." : "Published."}
            {item.draftDiffers && item.status !== "draft" ? " The draft has changes that are not live." : ""}
            {item.livePath ? ` Address: ${item.livePath}` : ""}
            {item.livePath && item.draftPath && item.draftPath !== item.livePath ? `, becoming ${item.draftPath} when published (a redirect is added).` : ""}
          </p>
        ) : null}
      </div>

      <RecordForm
        fields={def.fields}
        value={data}
        onChange={(v) => {
          setData(v);
          setDirty(true);
          setNotice(null);
        }}
        refOptions={refOptions}
        previews={previews}
        addPreview={addPreview}
        canSourceClaims={canSourceClaims}
      />

      <div aria-live="polite" className="space-y-2">
        {notice ? <p className="rounded-md border border-ok/40 bg-ok/10 px-3 py-2 text-sm">{notice}</p> : null}
        {err ? (
          <p role="alert" className="text-sm text-danger">
            {err}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {creating ? (
          <Button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const created = await adminCreateCollectionItem({ data: { collection: def.id, data } });
                await navigate({ to: "/admin/collections/$collection/$id", params: { collection: def.id, id: created.id } });
                return null;
              })
            }
          >
            Create draft
          </Button>
        ) : item ? (
          <>
            <Button
              type="button"
              disabled={busy || !dirty}
              onClick={() =>
                void run(async () => {
                  await adminSaveCollectionItem({ data: { id: item.id, rev: item.rev, data } });
                  load();
                  return "Draft saved. Publish to put it live.";
                })
              }
            >
              Save draft
            </Button>
            <Button
              type="button"
              variant="dark"
              disabled={busy || dirty}
              title={dirty ? "Save the draft first" : undefined}
              onClick={() =>
                void run(async () => {
                  const r = await adminPublishCollectionItem({ data: { id: item.id, rev: item.rev } });
                  load();
                  return r.redirect ? `Published. ${r.redirect.from} now redirects to ${r.redirect.to}.` : `Published as version ${r.version}.`;
                })
              }
            >
              Publish
            </Button>
            {item.status !== "draft" ? (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const hidden = item.status !== "hidden";
                    await adminSetCollectionItemHidden({ data: { id: item.id, hidden } });
                    load();
                    return hidden ? "Hidden from the site." : "Shown on the site again.";
                  })
                }
              >
                {item.status === "hidden" ? "Show on the site" : "Hide from the site"}
              </Button>
            ) : null}
            {canDelete ? (
              <Button type="button" variant="outline" disabled={busy} onClick={() => setConfirmTrash(true)}>
                Move to the trash
              </Button>
            ) : null}
          </>
        ) : null}
      </div>

      {confirmTrash && item ? (
        <div role="alertdialog" aria-label="Confirm" className="rounded-md border border-danger/40 bg-page p-3 text-sm">
          <p>Move this {def.singular} to the trash? It leaves the site and can be restored for 30 days.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="dark"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  setConfirmTrash(false);
                  await adminTrashCollectionItem({ data: { id: item.id } });
                  await navigate({ to: "/admin/collections/$collection", params: { collection: def.id } });
                  return null;
                })
              }
            >
              Move to the trash
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setConfirmTrash(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {item ? (
        <section className="grid gap-4 rounded-lg border border-line bg-surface p-4 text-sm sm:grid-cols-3">
          <div>
            <h2 className="text-xs uppercase tracking-[0.14em] text-muted">Used by</h2>
            {item.usedBy.length ? (
              <ul className="mt-1 space-y-0.5">
                {[...new Map(item.usedBy.map((u) => [`${u.collection}:${u.key}`, u])).values()].map((u) => (
                  <li key={u.id}>
                    <Link to="/admin/collections/$collection/$id" params={{ collection: u.collection, id: u.id }} className="hover:underline">
                      {u.collection} {u.key}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-muted">Nothing points at this record.</p>
            )}
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-[0.14em] text-muted">Redirects</h2>
            {item.redirects.length ? (
              <ul className="mt-1 space-y-0.5 break-all">
                {item.redirects.map((r) => (
                  <li key={r.from}>
                    {r.from} → {r.to}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-muted">None.</p>
            )}
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-[0.14em] text-muted">Published versions</h2>
            <ul className="mt-1 space-y-0.5">
              {item.versions.slice(0, 8).map((v) => (
                <li key={v.id}>
                  Version {v.version} · {new Date(v.publishedAt).toLocaleDateString()}
                  {v.current ? " · live" : ""}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
