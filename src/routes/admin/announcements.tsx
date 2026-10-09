import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { requirePageCapability } from "@/lib/admin-access";
import { AdminRouteError } from "@/components/admin/admin-route-error";
import { AnnouncementBar } from "@/components/announcement-bar";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  adminCreateAnnouncement,
  adminListAnnouncements,
  adminSetAnnouncementStatus,
  adminUpdateAnnouncement,
} from "@/lib/server/admin/announcements.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/announcements")({
  beforeLoad: ({ context }) => requirePageCapability(context.access, "announcements.edit"),
  errorComponent: AdminRouteError,
  component: AnnouncementsPage,
});

type Item = Awaited<ReturnType<typeof adminListAnnouncements>>[number];
const MAX = 200;

function messageOf(e: unknown, fallback: string) {
  return e instanceof Error && e.message ? e.message : fallback;
}

/** `datetime-local` works in the viewer's own time; convert both ways. */
const toLocal = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null);

function isLive(a: Item, now: number) {
  return a.status === "published" && Date.parse(a.startsAt) <= now && (!a.endsAt || Date.parse(a.endsAt) > now);
}

function AnnouncementForm({ initial, onSubmit, submitLabel }: { initial?: Item; onSubmit: (d: Record<string, string | null>) => Promise<void>; submitLabel: string }) {
  const [message, setMessage] = useState(initial?.message ?? "");
  const [linkLabel, setLinkLabel] = useState(initial?.linkLabel ?? "");
  const [link, setLink] = useState(initial?.link ?? "");
  const [err, setErr] = useState<string | null>(null);
  const p = initial?.id ?? "new";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Captured before any await: React clears currentTarget afterwards.
    const form = e.currentTarget;
    const data = new FormData(form);
    setErr(null);
    try {
      await onSubmit({
        message,
        linkLabel,
        link,
        startsAt: fromLocal(String(data.get("startsAt") ?? "")) ?? "",
        endsAt: fromLocal(String(data.get("endsAt") ?? "")),
      });
      if (!initial) {
        form.reset();
        setMessage("");
        setLink("");
        setLinkLabel("");
      }
    } catch (e2) {
      setErr(messageOf(e2, "Not saved."));
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor={`${p}-message`}>Message</Label>
        <Textarea id={`${p}-message`} className="min-h-16" value={message} maxLength={MAX} onChange={(e) => setMessage(e.target.value)} required />
        <p className={cn("mt-1 text-xs", message.length > MAX ? "text-danger" : "text-muted")}>
          {message.length} of {MAX} characters. Plain text only.
        </p>
      </div>
      <div>
        <Label htmlFor={`${p}-link`}>Link (optional)</Label>
        <Input id={`${p}-link`} value={link} onChange={(e) => setLink(e.target.value)} placeholder="/tours or https://" />
      </div>
      <div>
        <Label htmlFor={`${p}-label`}>Link text</Label>
        <Input id={`${p}-label`} value={linkLabel} maxLength={40} onChange={(e) => setLinkLabel(e.target.value)} />
      </div>
      <div>
        <Label htmlFor={`${p}-start`}>Starts</Label>
        <Input id={`${p}-start`} name="startsAt" type="datetime-local" required defaultValue={toLocal(initial?.startsAt ?? new Date().toISOString())} />
      </div>
      <div>
        <Label htmlFor={`${p}-end`}>Ends (optional)</Label>
        <Input id={`${p}-end`} name="endsAt" type="datetime-local" defaultValue={toLocal(initial?.endsAt ?? null)} />
      </div>
      <div className="sm:col-span-2">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.14em] text-muted">Preview</p>
        <AnnouncementBar message={message || "Your message"} linkLabel={linkLabel} link={link} />
      </div>
      {err ? (
        <p role="alert" className="text-sm text-danger sm:col-span-2">
          {err}
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <Button type="submit" size="sm">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function AnnouncementsPage() {
  const [rows, setRows] = useState<Item[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const now = Date.now();

  useEffect(() => {
    void adminListAnnouncements().then(setRows).catch((e) => setErr(messageOf(e, "Could not load announcements.")));
  }, [version]);

  const live = (rows ?? []).filter((a) => isLive(a, now)).sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt))[0];

  async function status(id: string, s: "draft" | "published" | "archived", done: string) {
    setErr(null);
    setNotice(null);
    try {
      await adminSetAnnouncementStatus({ data: { id, status: s } });
      setNotice(done);
      setVersion((v) => v + 1);
    } catch (e) {
      setErr(messageOf(e, "Not saved."));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-heading">Announcements</h1>
        <p className="mt-2 text-sm text-muted">
          A short message across the top of the site. One shows at a time: the published one whose window is open, the latest start first.
          The site shows it from a later release.
        </p>
        <p className="mt-2 text-sm [overflow-wrap:anywhere]">{live ? `Showing now: "${live.message}"` : "Nothing would show right now."}</p>
      </div>
      <section className="rounded-lg border border-line bg-surface p-4 sm:p-5">
        <h2 className="font-display text-xl text-heading">New announcement</h2>
        <div className="mt-3">
          <AnnouncementForm
            submitLabel="Save as draft"
            onSubmit={async (d) => {
              await adminCreateAnnouncement({ data: { message: d.message ?? "", linkLabel: d.linkLabel ?? "", link: d.link ?? "", startsAt: d.startsAt ?? "", endsAt: d.endsAt } });
              setNotice("Saved as a draft. Publish it to show it.");
              setVersion((v) => v + 1);
            }}
          />
        </div>
      </section>
      <div aria-live="polite">
        {notice ? <p className="rounded-md border border-ok/40 bg-ok/10 px-3 py-2 text-sm">{notice}</p> : null}
        {err ? (
          <p role="alert" className="text-sm text-danger">
            {err}
          </p>
        ) : null}
      </div>
      <ul className="space-y-2">
        {(rows ?? []).map((a) => (
          <li key={a.id} className="rounded-md border border-line bg-surface px-3 py-2 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-ink [overflow-wrap:anywhere]">{a.message}</p>
                <p className="text-xs text-muted">
                  {new Date(a.startsAt).toLocaleString()} to {a.endsAt ? new Date(a.endsAt).toLocaleString() : "no end"}
                  {a.link ? ` · ${a.linkLabel}: ${a.link}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full border px-2 py-0.5 text-[11px]", isLive(a, now) ? "border-ok/40 text-ok" : "border-line text-muted")}>
                  {isLive(a, now) ? "Showing" : a.status === "published" ? "Published, outside its window" : a.status === "draft" ? "Draft" : "Archived"}
                </span>
                {a.status !== "archived" ? (
                  <>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditing(editing === a.id ? null : a.id)}>
                      Edit
                    </Button>
                    {a.status === "draft" ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => void status(a.id, "published", "Published.")}>
                        Publish
                      </Button>
                    ) : (
                      <Button type="button" size="sm" variant="outline" onClick={() => void status(a.id, "draft", "Taken back to a draft.")}>
                        Unpublish
                      </Button>
                    )}
                    <Button type="button" size="sm" variant="outline" onClick={() => void status(a.id, "archived", "Archived.")}>
                      Archive
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
            {editing === a.id ? (
              <div className="mt-3">
                <AnnouncementForm
                  initial={a}
                  submitLabel="Save"
                  onSubmit={async (d) => {
                    await adminUpdateAnnouncement({ data: { id: a.id, message: d.message ?? "", linkLabel: d.linkLabel ?? "", link: d.link ?? "", startsAt: d.startsAt ?? "", endsAt: d.endsAt } });
                    setEditing(null);
                    setNotice("Saved.");
                    setVersion((v) => v + 1);
                  }}
                />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      {rows && rows.length === 0 ? <p className="text-sm text-muted">No announcements yet.</p> : null}
    </div>
  );
}
