import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { hasCapability, requirePageCapability } from "@/lib/admin-access";
import { AdminRouteError } from "@/components/admin/admin-route-error";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  adminAddEnquiryNote,
  adminAssignEnquiry,
  adminExportEnquiries,
  adminGetEnquiry,
  adminListAssignees,
  adminListEnquiries,
  adminSetEnquiryStatus,
} from "@/lib/server/admin/enquiries.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/enquiries")({
  beforeLoad: ({ context }) => requirePageCapability(context.access, "enquiries.read"),
  errorComponent: AdminRouteError,
  component: Page,
});

type List = Awaited<ReturnType<typeof adminListEnquiries>>;
type Row = List["rows"][number];
type Detail = Awaited<ReturnType<typeof adminGetEnquiry>>;
type Status = Row["status"];
type Filters = { q: string; status: "" | Status; type: string; assignee: string };

const STATUSES: { value: Status; label: string }[] = [
  { value: "open", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "quoted", label: "Quoted" },
  { value: "closed", label: "Closed" },
];
const LABEL = Object.fromEntries(STATUSES.map((s) => [s.value, s.label])) as Record<Status, string>;
const TYPES = ["B2C", "B2B", "CRUISE", "MICE"];
const select = "min-h-11 w-full rounded-md border border-line bg-page px-3 text-sm text-ink";

function messageOf(e: unknown, fallback: string) {
  return e instanceof Error && e.message ? e.message : fallback;
}

const toFilters = (f: Filters) => ({
  q: f.q.trim() || undefined,
  status: f.status || undefined,
  type: f.type || undefined,
  assignee: f.assignee || undefined,
});

function DetailPanel({ id, canManage, onChanged }: { id: string; canManage: boolean; onChanged: () => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [assignees, setAssignees] = useState<{ id: string; email: string | null; name: string | null }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const ref = useRef<HTMLElement>(null);

  function load() {
    void adminGetEnquiry({ data: { id } })
      .then(setD)
      .catch((e) => setErr(messageOf(e, "Could not load this enquiry.")));
  }
  useEffect(() => {
    setD(null);
    setNotice(null);
    setErr(null);
    load();
    ref.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useEffect(() => {
    if (canManage) void adminListAssignees().then(setAssignees);
  }, [canManage]);

  async function run(action: () => Promise<unknown>, done: string) {
    setErr(null);
    setNotice(null);
    try {
      await action();
      setNotice(done);
      load();
      onChanged();
    } catch (e) {
      setErr(messageOf(e, "Not saved."));
    }
  }

  async function addNote(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Captured before any await: React clears currentTarget afterwards.
    const form = e.currentTarget;
    const body = String(new FormData(form).get("body") ?? "");
    await run(async () => {
      await adminAddEnquiryNote({ data: { id, body } });
      form.reset();
    }, "Note added.");
  }

  return (
    <section ref={ref} aria-label="Enquiry" className="scroll-mt-48 rounded-lg border border-line bg-surface p-4 sm:p-5">
      {!d ? (
        <p className="text-sm text-muted">{err ?? "Loading…"}</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-display text-xl text-heading">{d.id}</h2>
              <p className="text-xs text-muted">
                {d.type} · received {new Date(d.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {d.reply.email ? (
                <Button asChild size="sm" variant="outline">
                  <a href={d.reply.email}>Reply by email</a>
                </Button>
              ) : null}
              {d.reply.whatsapp ? (
                <Button asChild size="sm" variant="outline">
                  <a href={d.reply.whatsapp} target="_blank" rel="noopener noreferrer">
                    Reply on WhatsApp
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {d.fields.map((f) => (
              <div key={f.key} className={cn("min-w-0", f.key === "message" && "sm:col-span-2")}>
                <dt className="text-xs uppercase tracking-[0.14em] text-muted">{f.label}</dt>
                <dd className="whitespace-pre-wrap [overflow-wrap:anywhere]">{f.value}</dd>
              </div>
            ))}
          </dl>
          {canManage ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="enquiry-status">Status</Label>
                <select
                  id="enquiry-status"
                  className={select}
                  value={d.status}
                  onChange={(e) => void run(() => adminSetEnquiryStatus({ data: { id, status: e.target.value as Status } }), "Status changed.")}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="enquiry-assignee">Assigned to</Label>
                <select
                  id="enquiry-assignee"
                  className={select}
                  value={d.assigneeId ?? ""}
                  onChange={(e) => void run(() => adminAssignEnquiry({ data: { id, assigneeId: e.target.value || null } }), "Assignment changed.")}
                >
                  <option value="">Nobody</option>
                  {assignees.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name || a.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">
              {LABEL[d.status]} · {d.assigneeEmail ? `assigned to ${d.assigneeEmail}` : "not assigned"}
            </p>
          )}
          <div aria-live="polite">
            {notice ? <p className="rounded-md border border-ok/40 bg-ok/10 px-3 py-2 text-sm">{notice}</p> : null}
            {err ? (
              <p role="alert" className="text-sm text-danger">
                {err}
              </p>
            ) : null}
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-[0.14em] text-muted">Notes</h3>
            {d.notes.length ? (
              <ul className="mt-2 space-y-2">
                {d.notes.map((n) => (
                  <li key={n.id} className="rounded-md border border-line bg-page px-3 py-2 text-sm">
                    <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{n.body}</p>
                    <p className="mt-1 text-xs text-muted">
                      {n.author ?? "Unknown"} · {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-muted">No notes yet.</p>
            )}
            {canManage ? (
              <form onSubmit={addNote} className="mt-3">
                <Label htmlFor="enquiry-note">Add a note (only the team sees notes)</Label>
                <Textarea id="enquiry-note" name="body" required maxLength={4000} className="min-h-20" />
                <Button type="submit" size="sm" className="mt-2">
                  Add note
                </Button>
              </form>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

function Page() {
  const { access } = Route.useRouteContext();
  const canManage = hasCapability(access, "enquiries.manage");
  const canExport = hasCapability(access, "enquiries.export");
  const [filters, setFilters] = useState<Filters>({ q: "", status: "", type: "", assignee: "" });
  const [rows, setRows] = useState<Row[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handle = setTimeout(() => {
      void adminListEnquiries({ data: toFilters(filters) })
        .then((r) => {
          setRows(r.rows);
          setCursor(r.nextCursor);
        })
        .catch((e) => setErr(messageOf(e, "Could not load enquiries.")));
    }, 250);
    return () => clearTimeout(handle);
  }, [filters, version]);

  async function exportCsv() {
    setErr(null);
    setNotice(null);
    try {
      const r = await adminExportEnquiries({ data: toFilters(filters) });
      const url = URL.createObjectURL(new Blob([r.csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = r.filename;
      a.click();
      URL.revokeObjectURL(url);
      setNotice(`Exported ${r.count} enquir${r.count === 1 ? "y" : "ies"}${r.capped ? " (the most at once; narrow the filters for the rest)" : ""}.`);
    } catch (e) {
      setErr(messageOf(e, "The export did not run."));
    }
  }

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-heading">Enquiries</h1>
        <p className="mt-2 text-sm text-muted">Newest first. Reply by email or WhatsApp; the team's notes stay inside the desk.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="enq-q">Search</Label>
          <Input id="enq-q" type="search" value={filters.q} onChange={(e) => set({ q: e.target.value })} placeholder="Reference, name, email or text" />
        </div>
        <div>
          <Label htmlFor="enq-status">Status</Label>
          <select id="enq-status" className={select} value={filters.status} onChange={(e) => set({ status: e.target.value as Filters["status"] })}>
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="enq-type">Type</Label>
          <select id="enq-type" className={select} value={filters.type} onChange={(e) => set({ type: e.target.value })}>
            <option value="">All</option>
            {TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="enq-assignee">Assigned</Label>
          <select id="enq-assignee" className={select} value={filters.assignee} onChange={(e) => set({ assignee: e.target.value })}>
            <option value="">Anyone</option>
            <option value="me">Me</option>
            <option value="none">Nobody</option>
          </select>
        </div>
      </div>
      {canExport ? (
        <Button type="button" variant="outline" size="sm" onClick={() => void exportCsv()}>
          Export these as CSV
        </Button>
      ) : null}
      <div aria-live="polite">
        {notice ? <p className="rounded-md border border-ok/40 bg-ok/10 px-3 py-2 text-sm">{notice}</p> : null}
        {err ? (
          <p role="alert" className="text-sm text-danger">
            {err}
          </p>
        ) : null}
      </div>
      {selected ? <DetailPanel id={selected} canManage={canManage} onChanged={() => setVersion((v) => v + 1)} /> : null}
      {!rows ? <p className="text-muted">Loading…</p> : null}
      <ul className="space-y-2">
        {(rows ?? []).map((e) => (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => setSelected(e.id)}
              aria-pressed={selected === e.id}
              className={cn(
                "block w-full rounded-md border bg-surface px-3 py-2 text-left text-sm",
                selected === e.id ? "border-brand ring-2 ring-brand" : "border-line hover:border-gold",
              )}
            >
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-heading">
                  {e.id} · {e.type}
                </span>
                <span className={cn("rounded-full border px-2 py-0.5 text-[11px]", e.status === "open" ? "border-gold-ink/40 text-gold-ink" : "border-line text-muted")}>
                  {LABEL[e.status] ?? e.status}
                </span>
              </span>
              <span className="mt-1 block break-all text-xs text-muted">
                {new Date(e.createdAt).toLocaleString()} · {e.name ?? "Guest"} · {e.email ?? "no email"}
                {e.assigneeEmail ? ` · ${e.assigneeEmail}` : ""}
              </span>
              {e.preview ? <span className="mt-1 line-clamp-2 block text-xs text-ink [overflow-wrap:anywhere]">{e.preview}</span> : null}
            </button>
          </li>
        ))}
      </ul>
      {rows && rows.length === 0 ? <p className="text-sm text-muted">No enquiries match.</p> : null}
      {cursor ? (
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            void adminListEnquiries({ data: { ...toFilters(filters), cursor } })
              .then((r) => {
                setRows((prev) => [...(prev ?? []), ...r.rows]);
                setCursor(r.nextCursor);
              })
              .catch((e) => setErr(messageOf(e, "Could not load more.")))
          }
        >
          Show older enquiries
        </Button>
      ) : null}
    </div>
  );
}
