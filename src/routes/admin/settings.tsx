import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { requirePageCapability } from "@/lib/admin-access";
import { AdminRouteError } from "@/components/admin/admin-route-error";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { settingsProblems, siteSettingsSchema, type SiteSettings } from "@/lib/settings/schema";
import {
  adminGetSiteSettings,
  adminPublishSiteSettings,
  adminRestoreSiteSettings,
  adminSaveSiteSettings,
} from "@/lib/server/admin/settings.functions";

export const Route = createFileRoute("/admin/settings")({
  beforeLoad: ({ context }) => requirePageCapability(context.access, "settings.edit"),
  errorComponent: AdminRouteError,
  component: SettingsPage,
});

type View = Awaited<ReturnType<typeof adminGetSiteSettings>>;

function messageOf(e: unknown, fallback: string) {
  return e instanceof Error && e.message ? e.message : fallback;
}

/** The first problem the server would report, so the form says it before saving. */
function problemOf(data: SiteSettings): string | null {
  const parsed = siteSettingsSchema.safeParse(data);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return `${first.path.join(" › ")}: ${first.message}`;
  }
  return settingsProblems(parsed.data)[0] ?? null;
}

function Group({ title, help, children }: { title: string; help?: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-lg border border-line bg-surface p-4 sm:p-5">
      <legend className="px-1 font-display text-xl text-heading">{title}</legend>
      {help ? <p className="mb-3 text-sm text-muted">{help}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  wide,
  multiline,
  type,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  wide?: boolean;
  multiline?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea id={id} className="min-h-20" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input id={id} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function Check({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="inline-flex min-h-9 items-center gap-2 text-sm">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4" />
      {label}
    </label>
  );
}

function SettingsForm({ view, notice, onDone }: { view: View; notice: string | null; onDone: (message: string) => void }) {
  const [data, setData] = useState<SiteSettings>(view.draft);
  const [rev, setRev] = useState(view.rev);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  function change(next: SiteSettings) {
    setData(next);
    setDirty(true);
  }
  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => change({ ...data, [key]: value });
  const problem = problemOf(data);

  async function run(action: () => Promise<string>) {
    setBusy(true);
    setErr(null);
    try {
      onDone(await action());
    } catch (e) {
      setErr(messageOf(e, "That change was not saved."));
    } finally {
      setBusy(false);
    }
  }

  const b = data.business;
  const c = data.contact;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        {view.publishedVersion ? `Published version ${view.publishedVersion}. ` : "Not published yet. "}
        {dirty ? "You have unsaved changes." : view.draftDiffers ? "The saved draft differs from the published settings." : "The draft matches what is published."}
      </p>

      <Group title="Business">
        <Field id="b-name" label="Name" value={b.name} onChange={(v) => set("business", { ...b, name: v })} />
        <Field id="b-legal" label="Legal name" value={b.legalName} onChange={(v) => set("business", { ...b, legalName: v })} />
        <Field id="b-tagline" label="Tagline" value={b.tagline} onChange={(v) => set("business", { ...b, tagline: v })} />
        <Field id="b-website" label="Website" value={b.website} onChange={(v) => set("business", { ...b, website: v })} />
        <Field id="b-description" label="Description" wide multiline value={b.description} onChange={(v) => set("business", { ...b, description: v })} />
      </Group>

      <Group title="Contact" help="The first number is shown first wherever both appear. Numbers keep the country code and spaces.">
        {c.phones.map((p, i) => (
          <div key={i} className="rounded-md border border-line bg-page p-3 sm:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id={`p-label-${i}`} label="Label" value={p.label} onChange={(v) => set("contact", { ...c, phones: c.phones.map((x, j) => (j === i ? { ...x, label: v } : x)) })} />
              <Field id={`p-number-${i}`} label="Number" value={p.number} placeholder="+232 79 616 668" onChange={(v) => set("contact", { ...c, phones: c.phones.map((x, j) => (j === i ? { ...x, number: v } : x)) })} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <Check id={`p-wa-${i}`} label="WhatsApp" checked={p.whatsapp} onChange={(v) => set("contact", { ...c, phones: c.phones.map((x, j) => (j === i ? { ...x, whatsapp: v } : x)) })} />
              <Check id={`p-sms-${i}`} label="SMS" checked={p.sms} onChange={(v) => set("contact", { ...c, phones: c.phones.map((x, j) => (j === i ? { ...x, sms: v } : x)) })} />
              {c.phones.length > 1 ? (
                <Button type="button" size="sm" variant="outline" onClick={() => set("contact", { ...c, phones: c.phones.filter((_, j) => j !== i) })}>
                  Remove number
                </Button>
              ) : null}
            </div>
          </div>
        ))}
        {c.phones.length < 4 ? (
          <div className="sm:col-span-2">
            <Button type="button" size="sm" variant="outline" onClick={() => set("contact", { ...c, phones: [...c.phones, { label: "", number: "", whatsapp: false, sms: false }] })}>
              Add a number
            </Button>
          </div>
        ) : null}
        <Field id="c-email" label="Email" type="email" value={c.email} onChange={(v) => set("contact", { ...c, email: v })} />
        <Field id="c-emergency" label="Emergency note" value={c.emergencyNote} onChange={(v) => set("contact", { ...c, emergencyNote: v })} />
        <Field id="c-address" label="Address" wide value={c.address} onChange={(v) => set("contact", { ...c, address: v })} />
      </Group>

      <Group title="Social links" help="An account is shown only when it has a link and Show is ticked.">
        {data.social.map((s, i) => (
          <div key={s.platform} className="rounded-md border border-line bg-page p-3 sm:col-span-2">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field id={`s-url-${i}`} label={`${s.label} link`} value={s.url} placeholder="https://" onChange={(v) => set("social", data.social.map((x, j) => (j === i ? { ...x, url: v } : x)))} />
              <Field id={`s-handle-${i}`} label="Handle" value={s.handle} onChange={(v) => set("social", data.social.map((x, j) => (j === i ? { ...x, handle: v } : x)))} />
              <div className="flex items-end">
                <Check id={`s-on-${i}`} label="Show" checked={s.enabled} onChange={(v) => set("social", data.social.map((x, j) => (j === i ? { ...x, enabled: v } : x)))} />
              </div>
            </div>
          </div>
        ))}
      </Group>

      <Group title="Search and sharing">
        <Field id="seo-desc" label="Default description" wide multiline value={data.seo.defaultDescription} onChange={(v) => set("seo", { ...data.seo, defaultDescription: v })} />
        <Field id="seo-image" label="Share image" value={data.seo.shareImage} placeholder="/images/misc/og-image.jpg" onChange={(v) => set("seo", { ...data.seo, shareImage: v })} />
      </Group>

      <Group title="Enquiry recipients" help="Every enquiry sent from the site is emailed to these addresses as soon as the settings are published.">
        {data.enquiryRecipients.map((r, i) => (
          <div key={i} className="flex items-end gap-2 sm:col-span-2">
            <div className="flex-1">
              <Field id={`r-${i}`} label={`Recipient ${i + 1}`} type="email" value={r} onChange={(v) => set("enquiryRecipients", data.enquiryRecipients.map((x, j) => (j === i ? v : x)))} />
            </div>
            {data.enquiryRecipients.length > 1 ? (
              <Button type="button" size="sm" variant="outline" onClick={() => set("enquiryRecipients", data.enquiryRecipients.filter((_, j) => j !== i))}>
                Remove
              </Button>
            ) : null}
          </div>
        ))}
        {data.enquiryRecipients.length < 10 ? (
          <div className="sm:col-span-2">
            <Button type="button" size="sm" variant="outline" onClick={() => set("enquiryRecipients", [...data.enquiryRecipients, ""])}>
              Add a recipient
            </Button>
          </div>
        ) : null}
      </Group>

      <Group title="Interface text">
        <Field id="i-skip" label="Skip link" value={data.interface.skipLink} onChange={(v) => set("interface", { ...data.interface, skipLink: v })} />
        <Field id="i-404k" label="404 label" value={data.interface.notFoundKicker} onChange={(v) => set("interface", { ...data.interface, notFoundKicker: v })} />
        <Field id="i-404t" label="404 heading" value={data.interface.notFoundTitle} onChange={(v) => set("interface", { ...data.interface, notFoundTitle: v })} />
        <Field id="i-404b" label="404 text" value={data.interface.notFoundBody} onChange={(v) => set("interface", { ...data.interface, notFoundBody: v })} />
        <Field id="i-errt" label="Error heading" value={data.interface.errorTitle} onChange={(v) => set("interface", { ...data.interface, errorTitle: v })} />
        <Field id="i-errb" label="Error text" value={data.interface.errorFallback} onChange={(v) => set("interface", { ...data.interface, errorFallback: v })} />
      </Group>

      <Group title="Documents" help="Leave empty until the document is published. An empty link shows the button as not available yet.">
        <Field
          id="d-policy"
          label="Sustainability policy link"
          wide
          value={data.documents.sustainabilityPolicyUrl ?? ""}
          placeholder="https://"
          onChange={(v) => set("documents", { sustainabilityPolicyUrl: v.trim() ? v : null })}
        />
      </Group>

      <div aria-live="polite" className="space-y-2">
        {problem ? <p className="text-sm text-danger">{problem}</p> : null}
        {notice && !dirty ? <p className="rounded-md border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ink">{notice}</p> : null}
        {err ? (
          <p role="alert" className="text-sm text-danger">
            {err}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={busy || !dirty || Boolean(problem)}
          onClick={() =>
            void run(async () => {
              const r = await adminSaveSiteSettings({ data: { rev, data } });
              setRev(r.rev);
              setDirty(false);
              return "Draft saved. Publish to put it live.";
            })
          }
        >
          Save draft
        </Button>
        <Button
          type="button"
          variant="dark"
          disabled={busy || dirty || Boolean(problem)}
          title={dirty ? "Save the draft first" : undefined}
          onClick={() =>
            void run(async () => {
              const r = await adminPublishSiteSettings({ data: { rev } });
              setRev(r.rev);
              return `Published as version ${r.version}.`;
            })
          }
        >
          Publish
        </Button>
      </div>

      <section className="rounded-lg border border-line bg-surface p-4 sm:p-5">
        <h2 className="font-display text-xl text-heading">Published versions</h2>
        <p className="mt-1 text-sm text-muted">The last 30 are kept. Restoring publishes that version again as a new one.</p>
        <ul className="mt-3 space-y-2 text-sm">
          {view.versions.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-page px-3 py-2">
              <span>
                Version {v.version} · {new Date(v.publishedAt).toLocaleString()}
                {v.publishedBy ? "" : " · from the code"}
                {v.restoredFrom ? " · restored" : ""}
                {v.current ? " · live" : ""}
              </span>
              {v.current ? null : confirmRestore === v.id ? (
                <span className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="dark"
                    disabled={busy || dirty}
                    onClick={() =>
                      void run(async () => {
                        const r = await adminRestoreSiteSettings({ data: { rev, versionId: v.id } });
                        setRev(r.rev);
                        setConfirmRestore(null);
                        return `Version ${v.version} is live again as version ${r.version}.`;
                      })
                    }
                  >
                    Restore and publish
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setConfirmRestore(null)}>
                    Cancel
                  </Button>
                </span>
              ) : (
                <Button type="button" size="sm" variant="outline" disabled={dirty} onClick={() => setConfirmRestore(v.id)}>
                  Restore
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SettingsPage() {
  const [view, setView] = useState<View | null>(null);
  const [version, setVersion] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void adminGetSiteSettings()
      .then(setView)
      .catch((e) => setErr(messageOf(e, "Could not load the settings.")));
  }, [version]);

  return (
    <div>
      <h1 className="font-display text-3xl text-heading">Site settings</h1>
      <p className="mt-2 text-sm text-muted">
        Business details, contact, social links, sharing, enquiry recipients and interface text. Changes go live when published.
      </p>
      <div className="mt-6">
        {err ? (
          <p role="alert" className="text-sm text-danger">
            {err}
          </p>
        ) : view ? (
          <SettingsForm
            key={view.rev}
            view={view}
            notice={notice}
            onDone={(message) => {
              setNotice(message);
              setVersion((v) => v + 1);
            }}
          />
        ) : (
          <p className="text-muted">Loading…</p>
        )}
      </div>
    </div>
  );
}
