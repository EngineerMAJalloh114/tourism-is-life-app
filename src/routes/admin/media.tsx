import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { hasCapability, requirePageCapability } from "@/lib/admin-access";
import { AdminRouteError } from "@/components/admin/admin-route-error";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { missingProvenance } from "@/lib/media-provenance";
import {
  adminCreateUploadTicket,
  adminDeleteMedia,
  adminFinishUpload,
  adminGetMedia,
  adminListMedia,
  adminReplaceMediaFile,
  adminSetMediaPublished,
  adminUpdateMedia,
} from "@/lib/server/admin/media.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/media")({
  beforeLoad: ({ context }) => requirePageCapability(context.access, "media.upload"),
  errorComponent: AdminRouteError,
  component: MediaPage,
});

type List = Awaited<ReturnType<typeof adminListMedia>>;
type Item = List["items"][number];
type Detail = Awaited<ReturnType<typeof adminGetMedia>>;
type Filter = "all" | "uploads" | "repository" | "incomplete";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "uploads", label: "Uploads" },
  { value: "repository", label: "Ships with the site" },
  { value: "incomplete", label: "Provenance incomplete" },
];

/** The provenance fields the form edits, with the labels the missing list uses. */
const FIELDS = [
  { name: "source", label: "Source", hint: "Who or where it came from" },
  { name: "sourceUrl", label: "Source link", hint: "https:// link to the original, if there is one" },
  { name: "license", label: "Licence", hint: "For example CC BY-SA 4.0, or the owner's own photo" },
  { name: "author", label: "Photographer or credit" },
  { name: "location", label: "Place shown", hint: "Where in Sierra Leone the photo was taken" },
  { name: "subject", label: "Subject" },
] as const;

const MAX_BYTES = 15 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

function messageOf(e: unknown, fallback: string) {
  return e instanceof Error && e.message ? e.message : fallback;
}

/** Ask for a slot, send the file straight to storage, and return the signed ticket. */
async function sendFile(file: File, replaceId?: string): Promise<string> {
  if (!TYPES.includes(file.type)) throw new Error("Upload a JPEG, PNG or WebP photo.");
  if (file.size > MAX_BYTES) throw new Error("The photo is larger than 15 MB.");
  const ticket = await adminCreateUploadTicket({ data: { filename: file.name, contentType: file.type, bytes: file.size, replaceId } });
  const res = await fetch(ticket.upload.url, {
    method: ticket.upload.method,
    headers: { "Content-Type": file.type, ...ticket.upload.headers },
    body: file,
  });
  if (!res.ok) throw new Error(`The file did not reach storage (HTTP ${res.status}). Try again.`);
  return ticket.token;
}

function readProvenance(data: FormData) {
  const out: Record<string, string> = {};
  for (const f of FIELDS) out[f.name] = String(data.get(f.name) ?? "");
  out.notes = String(data.get("notes") ?? "");
  return out;
}

function ProvenanceFields({ prefix, values, onChange }: { prefix: string; values: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor={`${prefix}-alt`}>Alt text</Label>
        <Input
          id={`${prefix}-alt`}
          name="alt"
          maxLength={300}
          value={values.alt ?? ""}
          onChange={(e) => onChange({ ...values, alt: e.target.value })}
          placeholder="What the photo shows, for people who cannot see it"
        />
      </div>
      {FIELDS.map((f) => (
        <div key={f.name}>
          <Label htmlFor={`${prefix}-${f.name}`}>{f.label}</Label>
          <Input
            id={`${prefix}-${f.name}`}
            name={f.name}
            maxLength={500}
            value={values[f.name] ?? ""}
            onChange={(e) => onChange({ ...values, [f.name]: e.target.value })}
            placeholder={"hint" in f ? f.hint : undefined}
          />
        </div>
      ))}
      <div className="sm:col-span-2">
        <Label htmlFor={`${prefix}-notes`}>Notes</Label>
        <Textarea
          id={`${prefix}-notes`}
          name="notes"
          maxLength={500}
          className="min-h-16"
          value={values.notes ?? ""}
          onChange={(e) => onChange({ ...values, notes: e.target.value })}
        />
      </div>
    </div>
  );
}

function Missing({ values }: { values: Record<string, string> }) {
  const missing = missingProvenance(values, values.alt);
  return missing.length ? (
    <p className="text-xs text-muted">Still needed before it can be published: {missing.join(", ")}.</p>
  ) : (
    <p className="text-xs text-ok">Provenance complete.</p>
  );
}

function UploadForm({ onDone }: { onDone: (id: string) => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Captured before any await: React clears currentTarget afterwards.
    const form = e.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setErr("Choose a photo first.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const token = await sendFile(file);
      const result = await adminFinishUpload({
        data: { token, filename: file.name, alt: String(data.get("alt") ?? ""), provenance: readProvenance(data) },
      });
      form.reset();
      setValues({});
      onDone(result.id);
    } catch (e2) {
      setErr(messageOf(e2, "The photo was not uploaded."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-line bg-surface p-4 sm:p-5">
      <h2 className="font-display text-xl text-heading">Upload a photo</h2>
      <p className="mt-1 text-sm text-muted">
        JPEG, PNG or WebP, up to 15 MB. Location data and other metadata are removed, and smaller copies are made for the site.
      </p>
      <div className="mt-4">
        <Label htmlFor="upload-file">Photo</Label>
        <input id="upload-file" name="file" type="file" accept={TYPES.join(",")} className="block w-full text-sm" required />
      </div>
      <div className="mt-4">
        <ProvenanceFields prefix="upload" values={values} onChange={setValues} />
      </div>
      <div className="mt-3">
        <Missing values={values} />
      </div>
      {err ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {err}
        </p>
      ) : null}
      <Button type="submit" className="mt-4" disabled={busy}>
        {busy ? "Uploading…" : "Upload"}
      </Button>
    </form>
  );
}

function Badge({ tone, children }: { tone: "ok" | "muted" | "warn"; children: string }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px]",
        tone === "ok" && "border-ok/40 text-ok",
        tone === "muted" && "border-line text-muted",
        tone === "warn" && "border-gold-ink/40 text-gold-ink",
      )}
    >
      {children}
    </span>
  );
}

function DetailPanel({
  id,
  canPublish,
  uploadsOn,
  onChanged,
  onClose,
}: {
  id: string;
  canPublish: boolean;
  uploadsOn: boolean;
  onChanged: () => void;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef<HTMLElement>(null);

  function load() {
    void adminGetMedia({ data: { mediaId: id } })
      .then((d) => {
        setDetail(d);
        const v: Record<string, string> = { alt: d.alt };
        for (const f of [...FIELDS.map((x) => x.name), "notes"]) v[f] = String(d.provenance[f] ?? "");
        setValues(v);
      })
      .catch((e) => setErr(messageOf(e, "Could not load this photo.")));
  }

  useEffect(() => {
    setDetail(null);
    setErr(null);
    setNotice(null);
    setConfirmDelete(false);
    load();
    ref.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function run(action: () => Promise<string>) {
    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      setNotice(await action());
      load();
      onChanged();
    } catch (e) {
      setErr(messageOf(e, "That change was not saved."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section ref={ref} aria-label="Photo details" className="scroll-mt-48 rounded-lg border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-xl text-heading">Photo details</h2>
        <Button type="button" size="sm" variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
      {!detail ? (
        <p className="mt-3 text-sm text-muted">{err ?? "Loading…"}</p>
      ) : (
        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="min-w-0">
            {detail.previewUrl ? (
              <img src={detail.previewUrl} alt={detail.alt} className="w-full rounded-md border border-line object-contain" />
            ) : (
              <p className="text-sm text-muted">No preview while uploads are switched off.</p>
            )}
            <p className="mt-2 break-all text-xs text-muted">
              {detail.origin === "repository" ? `Ships with the site: ${detail.repoPath}` : "Uploaded"}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone={detail.provenanceStatus === "complete" ? "ok" : "warn"}>
                {detail.provenanceStatus === "complete" ? "Provenance complete" : "Provenance incomplete"}
              </Badge>
              <Badge tone={detail.published ? "ok" : "muted"}>{detail.published ? "Published" : "Not published"}</Badge>
            </div>
            <h3 className="mt-4 text-xs uppercase tracking-[0.14em] text-muted">Where it is used</h3>
            {detail.usage.length ? (
              <ul className="mt-1 space-y-1 text-sm">
                {detail.usage.map((u) => (
                  <li key={`${u.kind}:${u.id}:${u.field ?? ""}`}>
                    {u.kind} {u.id}
                    {u.field ? ` (${u.field})` : ""} · {u.state}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-muted">
                {detail.origin === "repository" ? "Placed by the site code. Pages edited in the admin will be listed here." : "Not used anywhere yet."}
              </p>
            )}
            {detail.variants.length ? (
              <>
                <h3 className="mt-4 text-xs uppercase tracking-[0.14em] text-muted">Copies made for the site</h3>
                <ul className="mt-1 space-y-0.5 text-xs text-muted">
                  {detail.variants.map((v) => (
                    <li key={v.key}>
                      {v.format.toUpperCase()} {v.width} × {v.height} · {Math.round(v.bytes / 1024)} KB
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
          <form
            className="min-w-0"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              void run(async () => {
                const r = await adminUpdateMedia({ data: { mediaId: id, alt: String(data.get("alt") ?? ""), provenance: readProvenance(data) } });
                return r.missing.length ? "Saved. Provenance is still incomplete." : "Saved.";
              });
            }}
          >
            <ProvenanceFields prefix="detail" values={values} onChange={setValues} />
            <div className="mt-3">
              <Missing values={values} />
            </div>
            <div aria-live="polite" className="mt-3 space-y-2">
              {notice ? <p className="rounded-md border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ink">{notice}</p> : null}
              {err ? (
                <p role="alert" className="text-sm text-danger">
                  {err}
                </p>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="submit" size="sm" disabled={busy}>
                Save details
              </Button>
              {canPublish ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await adminSetMediaPublished({ data: { mediaId: id, published: !detail.published } });
                      return detail.published ? "Unpublished." : "Published. It can now be placed on pages.";
                    })
                  }
                >
                  {detail.published ? "Unpublish" : "Publish"}
                </Button>
              ) : null}
              {canPublish && uploadsOn && detail.origin === "upload" ? (
                <label className="glass-btn glass-btn-tint inline-flex min-h-9 cursor-pointer items-center rounded-md border border-line px-3 text-xs uppercase tracking-[0.14em] text-ink hover:border-gold">
                  Replace file
                  <input
                    type="file"
                    accept={TYPES.join(",")}
                    className="sr-only"
                    disabled={busy}
                    onChange={(e) => {
                      const input = e.currentTarget;
                      const file = input.files?.[0];
                      if (!file) return;
                      void run(async () => {
                        const token = await sendFile(file, id);
                        await adminReplaceMediaFile({ data: { mediaId: id, token, filename: file.name } });
                        input.value = "";
                        return "File replaced. The old file is removed unless a kept version still uses it.";
                      });
                    }}
                  />
                </label>
              ) : null}
              {canPublish && detail.origin === "upload" ? (
                <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
              ) : null}
            </div>
            {confirmDelete ? (
              <div role="alertdialog" aria-label="Confirm delete" className="mt-3 rounded-md border border-danger/40 bg-page p-3 text-sm">
                <p>Delete this photo and its files? This cannot be undone.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="dark"
                    disabled={busy}
                    onClick={() =>
                      void (async () => {
                        setBusy(true);
                        setErr(null);
                        try {
                          await adminDeleteMedia({ data: { mediaId: id } });
                          onChanged();
                          onClose();
                        } catch (e) {
                          setErr(messageOf(e, "The photo was not deleted."));
                          setConfirmDelete(false);
                        } finally {
                          setBusy(false);
                        }
                      })()
                    }
                  >
                    Delete photo
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}
          </form>
        </div>
      )}
    </section>
  );
}

function MediaPage() {
  const { access } = Route.useRouteContext();
  const canPublish = hasCapability(access, "media.publish");
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [list, setList] = useState<List | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handle = setTimeout(() => {
      void adminListMedia({ data: { filter, q: q.trim() || undefined, limit: 48 } })
        .then((r) => {
          setList(r);
          setItems(r.items);
          setNextOffset(r.nextOffset);
        })
        .catch((e) => setErr(messageOf(e, "Could not load the library.")));
    }, 200);
    return () => clearTimeout(handle);
  }, [filter, q, version]);


  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-heading">Media library</h1>
        <p className="mt-2 text-sm text-muted">
          Photos for the site. A photo can be placed on a page once its provenance is complete and it is published.
        </p>
      </div>

      {list && !list.uploads.enabled ? (
        <p className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink">{list.uploads.reason}</p>
      ) : null}

      {list?.uploads.enabled ? (
        showUpload ? (
          <UploadForm
            onDone={(id) => {
              setShowUpload(false);
              setFilter("uploads");
              setVersion((v) => v + 1);
              setSelected(id);
            }}
          />
        ) : (
          <Button type="button" onClick={() => setShowUpload(true)}>
            Upload a photo
          </Button>
        )
      ) : null}

      {selected ? (
        <DetailPanel
          id={selected}
          canPublish={canPublish}
          uploadsOn={Boolean(list?.uploads.enabled)}
          onChanged={() => setVersion((v) => v + 1)}
          onClose={() => setSelected(null)}
        />
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "min-h-9 rounded-full border px-3 text-xs",
                filter === f.value ? "border-brand bg-brand text-ivory" : "border-line text-ink hover:border-gold",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="w-full sm:w-64">
          <Label htmlFor="media-search">Search</Label>
          <Input id="media-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Alt text or file name" />
        </div>
      </div>

      {err ? (
        <p role="alert" className="text-sm text-danger">
          {err}
        </p>
      ) : null}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setSelected(item.id)}
              aria-pressed={selected === item.id}
              className={cn(
                "block w-full overflow-hidden rounded-md border bg-surface text-left",
                selected === item.id ? "border-brand ring-2 ring-brand" : "border-line hover:border-gold",
              )}
            >
              <div className="aspect-[4/3] bg-page">
                {item.previewUrl ? (
                  <img src={item.previewUrl} alt={item.alt} loading="lazy" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="space-y-1.5 p-2">
                <p className="line-clamp-2 text-xs text-ink">{item.alt || item.filename || item.repoPath || "No alt text"}</p>
                <div className="flex flex-wrap gap-1">
                  {item.provenanceStatus === "complete" ? null : <Badge tone="warn">Incomplete</Badge>}
                  <Badge tone={item.published ? "ok" : "muted"}>{item.published ? "Published" : "Draft"}</Badge>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
      {list && items.length === 0 ? <p className="text-sm text-muted">No photos match.</p> : null}
      {nextOffset ? (
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            void adminListMedia({ data: { filter, q: q.trim() || undefined, limit: 48, offset: nextOffset } })
              .then((r) => {
                setItems((prev) => [...prev, ...r.items]);
                setNextOffset(r.nextOffset);
              })
              .catch((e) => setErr(messageOf(e, "Could not load more.")))
          }
        >
          Show more
        </Button>
      ) : null}
    </div>
  );
}
