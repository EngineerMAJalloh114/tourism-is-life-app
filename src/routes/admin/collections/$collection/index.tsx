import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { hasCapability, requirePageCapability } from "@/lib/admin-access";
import { AdminRouteError } from "@/components/admin/admin-route-error";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { COLLECTIONS, isCollectionId } from "@/lib/collections/registry";
import {
  adminListCollectionItems,
  adminReorderCollection,
  adminRestoreCollectionItem,
} from "@/lib/server/admin/collections.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/collections/$collection/")({
  beforeLoad: ({ context, params }) => {
    requirePageCapability(context.access, "collections.edit");
    if (!isCollectionId(params.collection)) throw notFound();
  },
  errorComponent: AdminRouteError,
  component: CollectionList,
});

type Row = Awaited<ReturnType<typeof adminListCollectionItems>>[number];

const STATUS: Record<Row["status"], string> = { draft: "Draft", published: "Published", hidden: "Hidden" };

function messageOf(e: unknown, fallback: string) {
  return e instanceof Error && e.message ? e.message : fallback;
}

function CollectionList() {
  const { collection } = Route.useParams();
  const { access } = Route.useRouteContext();
  const def = COLLECTIONS[collection as keyof typeof COLLECTIONS];
  const canDelete = hasCapability(access, "collections.delete");
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [trash, setTrash] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    setRows(null);
    void adminListCollectionItems({ data: { collection: def.id, trash } })
      .then(setRows)
      .catch((e) => setErr(messageOf(e, "Could not load the list.")));
  }, [def.id, trash, version]);

  const shown = (rows ?? []).filter((r) => !q.trim() || r.title.toLowerCase().includes(q.trim().toLowerCase()) || r.key.includes(q.trim().toLowerCase()));

  async function move(index: number, by: number) {
    if (!rows) return;
    const ids = rows.map((r) => r.id);
    const j = index + by;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    setBusy(true);
    setErr(null);
    try {
      await adminReorderCollection({ data: { collection: def.id, ids } });
      setVersion((v) => v + 1);
    } catch (e) {
      setErr(messageOf(e, "The order was not saved."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-sm">
        <Link to="/admin/collections" className="text-muted hover:text-heading">
          Collections
        </Link>
      </p>
      <h1 className="mt-1 font-display text-3xl text-heading">{trash ? `${def.label} in the trash` : def.label}</h1>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-64">
          <Label htmlFor="collection-search">Search</Label>
          <Input id="collection-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {def.canCreate && !trash ? (
          <Button type="button" onClick={() => void navigate({ to: "/admin/collections/$collection/$id", params: { collection: def.id, id: "new" } })}>
            New {def.singular}
          </Button>
        ) : null}
        {canDelete ? (
          <Button type="button" variant="outline" onClick={() => setTrash((t) => !t)}>
            {trash ? `Back to ${def.label.toLowerCase()}` : "Show the trash"}
          </Button>
        ) : null}
      </div>
      {trash ? <p className="mt-3 text-sm text-muted">Records stay here for 30 days and can be restored. After that they are deleted for good.</p> : null}
      <div aria-live="polite" className="mt-3">
        {notice ? <p className="rounded-md border border-ok/40 bg-ok/10 px-3 py-2 text-sm">{notice}</p> : null}
        {err ? (
          <p role="alert" className="text-sm text-danger">
            {err}
          </p>
        ) : null}
      </div>
      {!rows ? <p className="mt-4 text-muted">Loading…</p> : null}
      <ul className="mt-4 space-y-2">
        {shown.map((r) => {
          const index = rows!.indexOf(r);
          return (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-surface px-3 py-2">
              <div className="min-w-0">
                {trash ? (
                  <span className="font-medium text-heading">{r.title}</span>
                ) : (
                  <Link to="/admin/collections/$collection/$id" params={{ collection: def.id, id: r.id }} className="font-medium text-heading hover:underline">
                    {r.title}
                  </Link>
                )}
                <p className="break-all text-xs text-muted">
                  {r.key}
                  {r.draftDiffers && r.status !== "draft" ? " · unpublished changes" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px]",
                    r.status === "published" ? "border-ok/40 text-ok" : "border-line text-muted",
                  )}
                >
                  {STATUS[r.status]}
                </span>
                {trash ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void (async () => {
                        setErr(null);
                        try {
                          await adminRestoreCollectionItem({ data: { id: r.id } });
                          setNotice(`${r.title} restored.`);
                          setVersion((v) => v + 1);
                        } catch (e) {
                          setErr(messageOf(e, "Not restored."));
                        }
                      })()
                    }
                  >
                    Restore
                  </Button>
                ) : q.trim() ? null : (
                  <>
                    <button type="button" aria-label={`Move ${r.title} up`} disabled={busy || index === 0} onClick={() => void move(index, -1)} className="grid size-9 place-items-center rounded border border-line disabled:opacity-40">
                      <ArrowUp className="size-4" aria-hidden="true" />
                    </button>
                    <button type="button" aria-label={`Move ${r.title} down`} disabled={busy || index === rows!.length - 1} onClick={() => void move(index, 1)} className="grid size-9 place-items-center rounded border border-line disabled:opacity-40">
                      <ArrowDown className="size-4" aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {rows && shown.length === 0 ? <p className="mt-4 text-sm text-muted">{trash ? "The trash is empty." : "Nothing matches."}</p> : null}
    </div>
  );
}
