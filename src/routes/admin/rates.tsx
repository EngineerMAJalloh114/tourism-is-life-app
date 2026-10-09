import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { requirePageCapability } from "@/lib/admin-access";
import { AdminRouteError } from "@/components/admin/admin-route-error";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { CURRENCIES, parseMajor, parseRating } from "@/lib/money";
import { adminListCollectionItems } from "@/lib/server/admin/collections.functions";
import {
  adminArchiveRate,
  adminArchiveRating,
  adminCreateRate,
  adminCreateRating,
  adminListRates,
  adminListRatings,
  adminPublishRate,
  adminPublishRating,
  adminUpdateRate,
  adminUpdateRating,
} from "@/lib/server/admin/rates.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/rates")({
  beforeLoad: ({ context }) => requirePageCapability(context.access, "rates.manage"),
  errorComponent: AdminRouteError,
  component: RatesPage,
});

type Rate = Awaited<ReturnType<typeof adminListRates>>[number];
type Rating = Awaited<ReturnType<typeof adminListRatings>>[number];

const SUBJECTS = [
  { id: "cruise-excursions", label: "Shore excursions" },
  { id: "vehicles", label: "Vehicles" },
  { id: "tours", label: "Tours" },
  { id: "vehicle-categories", label: "Vehicle categories" },
  { id: "services", label: "Services" },
] as const;
const UNITS = ["per-person", "per-day", "per-group", "per-transfer", "per-night"] as const;
const STATUS = { draft: "Draft", published: "Published", archived: "Archived" } as const;
const select = "min-h-11 w-full rounded-md border border-line bg-page px-3 text-sm text-ink";

function messageOf(e: unknown, fallback: string) {
  return e instanceof Error && e.message ? e.message : fallback;
}

function StatusBadge({ status }: { status: keyof typeof STATUS }) {
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[11px]", status === "published" ? "border-ok/40 text-ok" : "border-line text-muted")}>
      {STATUS[status]}
    </span>
  );
}

function RateForm({ initial, subjects, onSubmit, submitLabel }: {
  initial?: Rate;
  subjects?: { collection: string; options: { id: string; title: string }[]; onCollection: (c: string) => void };
  onSubmit: (data: Record<string, string>) => Promise<void>;
  submitLabel: string;
}) {
  const [amount, setAmount] = useState(initial ? initial.amount.split(" ")[1] : "");
  const [err, setErr] = useState<string | null>(null);
  const parsed = amount ? parseMajor(amount) : null;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Captured before any await: React clears currentTarget afterwards.
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    setErr(null);
    try {
      await onSubmit(data);
      if (!initial) {
        form.reset();
        setAmount("");
      }
    } catch (e2) {
      setErr(messageOf(e2, "Not saved."));
    }
  }

  const p = initial?.id ?? "new";
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
      {subjects ? (
        <>
          <div>
            <Label htmlFor={`${p}-collection`}>For</Label>
            <select id={`${p}-collection`} className={select} value={subjects.collection} onChange={(e) => subjects.onCollection(e.target.value)} name="subjectCollection">
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor={`${p}-subject`}>Record</Label>
            <select id={`${p}-subject`} className={select} name="subjectId" required>
              {subjects.options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </select>
          </div>
        </>
      ) : null}
      <div>
        <Label htmlFor={`${p}-label`}>Label</Label>
        <Input id={`${p}-label`} name="label" required maxLength={80} defaultValue={initial?.label ?? "Per person"} />
      </div>
      <div>
        <Label htmlFor={`${p}-currency`}>Currency</Label>
        <select id={`${p}-currency`} name="currency" className={select} defaultValue={initial?.currency ?? "USD"}>
          {CURRENCIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor={`${p}-amount`}>Amount</Label>
        <Input id={`${p}-amount`} name="amount" required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="12.50" />
        {parsed && !parsed.ok ? <p className="mt-1 text-xs text-danger">{parsed.error}</p> : null}
      </div>
      <div>
        <Label htmlFor={`${p}-unit`}>Per</Label>
        <select id={`${p}-unit`} name="unit" className={select} defaultValue={initial?.unit ?? "per-person"}>
          {UNITS.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor={`${p}-note`}>Source</Label>
        <Input id={`${p}-note`} name="sourceNote" maxLength={300} defaultValue={initial?.sourceNote ?? ""} placeholder="Where the price comes from" />
      </div>
      <div>
        <Label htmlFor={`${p}-date`}>Source date</Label>
        <Input id={`${p}-date`} name="sourceDate" type="date" defaultValue={initial?.sourceDate ?? ""} />
      </div>
      {err ? (
        <p role="alert" className="text-sm text-danger sm:col-span-3">
          {err}
        </p>
      ) : null}
      <div className="sm:col-span-3">
        <Button type="submit" size="sm" disabled={Boolean(parsed && !parsed.ok)}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function RatesSection() {
  const [rows, setRows] = useState<Rate[] | null>(null);
  const [collection, setCollection] = useState<string>("cruise-excursions");
  const [options, setOptions] = useState<{ id: string; title: string }[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    void adminListRates().then(setRows).catch((e) => setErr(messageOf(e, "Could not load rates.")));
  }, [version]);
  useEffect(() => {
    void adminListCollectionItems({ data: { collection: collection as "tours" } }).then((r) => setOptions(r.map((x) => ({ id: x.id, title: x.title }))));
  }, [collection]);

  async function act(action: () => Promise<unknown>, done: string) {
    setErr(null);
    setNotice(null);
    try {
      await action();
      setNotice(done);
      setVersion((v) => v + 1);
    } catch (e) {
      setErr(messageOf(e, "Not saved."));
    }
  }
  const toData = (d: Record<string, string>) => ({
    label: d.label,
    currency: d.currency,
    amount: d.amount,
    unit: d.unit,
    sourceNote: d.sourceNote,
    sourceDate: d.sourceDate || null,
  });

  return (
    <section className="rounded-lg border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl text-heading">Rates</h2>
        <Button type="button" size="sm" variant="outline" onClick={() => setAdding((a) => !a)}>
          {adding ? "Close" : "Add a rate"}
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted">A rate shows on the site only once it is published, and it can be published only with its source and date.</p>
      {adding ? (
        <div className="mt-4 rounded-md border border-line bg-page p-3">
          <RateForm
            subjects={{ collection, options, onCollection: setCollection }}
            submitLabel="Add as draft"
            onSubmit={async (d) => {
              await adminCreateRate({ data: { subjectCollection: collection, subjectId: d.subjectId, ...toData(d) } });
              setNotice("Rate added as a draft.");
              setVersion((v) => v + 1);
            }}
          />
        </div>
      ) : null}
      <div aria-live="polite" className="mt-3">
        {notice ? <p className="rounded-md border border-ok/40 bg-ok/10 px-3 py-2 text-sm">{notice}</p> : null}
        {err ? (
          <p role="alert" className="text-sm text-danger">
            {err}
          </p>
        ) : null}
      </div>
      <ul className="mt-3 space-y-2">
        {(rows ?? []).map((r) => (
          <li key={r.id} className="rounded-md border border-line bg-page px-3 py-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-heading">
                  {r.subjectTitle ?? r.subjectKey} · {r.label}
                </p>
                <p className="text-xs text-muted">
                  {r.amount} {r.unit} · {r.sourceNote || "no source"}
                  {r.sourceDate ? `, ${r.sourceDate}` : ", no date"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={r.status} />
                {r.status === "draft" ? (
                  <>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditing(editing === r.id ? null : r.id)}>
                      Edit
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void act(() => adminPublishRate({ data: { id: r.id } }), "Rate published.")}>
                      Publish
                    </Button>
                  </>
                ) : null}
                {r.status !== "archived" ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => void act(() => adminArchiveRate({ data: { id: r.id } }), "Rate archived.")}>
                    Archive
                  </Button>
                ) : null}
              </div>
            </div>
            {editing === r.id ? (
              <div className="mt-3">
                <RateForm
                  initial={r}
                  submitLabel="Save draft"
                  onSubmit={async (d) => {
                    await adminUpdateRate({ data: { id: r.id, ...toData(d) } });
                    setEditing(null);
                    setNotice("Draft saved.");
                    setVersion((v) => v + 1);
                  }}
                />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function RatingForm({ initial, tours, onSubmit, submitLabel }: {
  initial?: Rating;
  tours?: { id: string; title: string }[];
  onSubmit: (data: Record<string, string>) => Promise<void>;
  submitLabel: string;
}) {
  const [value, setValue] = useState(initial?.value ?? "");
  const [err, setErr] = useState<string | null>(null);
  const parsed = value ? parseRating(value) : null;
  const p = initial?.id ?? "new-rating";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    setErr(null);
    try {
      await onSubmit(data);
    } catch (e2) {
      setErr(messageOf(e2, "Not saved."));
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-4">
      {tours ? (
        <div className="sm:col-span-4">
          <Label htmlFor={`${p}-tour`}>Tour</Label>
          <select id={`${p}-tour`} name="tourId" className={select}>
            {tours.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div>
        <Label htmlFor={`${p}-value`}>Rating (0 to 5)</Label>
        <Input id={`${p}-value`} name="value" required value={value} onChange={(e) => setValue(e.target.value)} placeholder="4.1" />
        {parsed && !parsed.ok ? <p className="mt-1 text-xs text-danger">{parsed.error}</p> : null}
      </div>
      <div>
        <Label htmlFor={`${p}-count`}>Reviews</Label>
        <Input id={`${p}-count`} name="reviewCount" type="number" min={0} required defaultValue={initial?.reviewCount ?? 0} />
      </div>
      <div>
        <Label htmlFor={`${p}-url`}>Source link</Label>
        <Input id={`${p}-url`} name="sourceUrl" defaultValue={initial?.sourceUrl ?? ""} placeholder="https://" />
      </div>
      <div>
        <Label htmlFor={`${p}-date`}>Source date</Label>
        <Input id={`${p}-date`} name="sourceDate" type="date" defaultValue={initial?.sourceDate ?? ""} />
      </div>
      {err ? (
        <p role="alert" className="text-sm text-danger sm:col-span-4">
          {err}
        </p>
      ) : null}
      <div className="sm:col-span-4">
        <Button type="submit" size="sm" disabled={Boolean(parsed && !parsed.ok)}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function RatingsSection() {
  const [rows, setRows] = useState<Rating[] | null>(null);
  const [tours, setTours] = useState<{ id: string; title: string }[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    void adminListRatings().then(setRows).catch((e) => setErr(messageOf(e, "Could not load ratings.")));
  }, [version]);
  useEffect(() => {
    void adminListCollectionItems({ data: { collection: "tours" } }).then((r) => setTours(r.map((x) => ({ id: x.id, title: x.title }))));
  }, []);

  async function act(action: () => Promise<unknown>, done: string) {
    setErr(null);
    setNotice(null);
    try {
      await action();
      setNotice(done);
      setVersion((v) => v + 1);
    } catch (e) {
      setErr(messageOf(e, "Not saved."));
    }
  }
  const toData = (d: Record<string, string>) => ({ value: d.value, reviewCount: Number(d.reviewCount), sourceUrl: d.sourceUrl, sourceDate: d.sourceDate || null });

  return (
    <section className="rounded-lg border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl text-heading">Tour ratings</h2>
        <Button type="button" size="sm" variant="outline" onClick={() => setAdding((a) => !a)}>
          {adding ? "Close" : "Add a rating"}
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted">A rating shows only once published, which needs the page it comes from (https) and the date it was read.</p>
      {adding ? (
        <div className="mt-4 rounded-md border border-line bg-page p-3">
          <RatingForm
            tours={tours}
            submitLabel="Add as draft"
            onSubmit={async (d) => {
              await adminCreateRating({ data: { tourId: d.tourId, ...toData(d) } });
              setNotice("Rating added as a draft.");
              setVersion((v) => v + 1);
            }}
          />
        </div>
      ) : null}
      <div aria-live="polite" className="mt-3">
        {notice ? <p className="rounded-md border border-ok/40 bg-ok/10 px-3 py-2 text-sm">{notice}</p> : null}
        {err ? (
          <p role="alert" className="text-sm text-danger">
            {err}
          </p>
        ) : null}
      </div>
      <ul className="mt-3 space-y-2">
        {(rows ?? []).map((r) => (
          <li key={r.id} className="rounded-md border border-line bg-page px-3 py-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-heading">{r.tourTitle ?? r.tourKey}</p>
                <p className="text-xs text-muted">
                  {r.value} / 5 from {r.reviewCount} reviews · {r.sourceUrl || "no source"}
                  {r.sourceDate ? `, ${r.sourceDate}` : ", no date"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={r.status} />
                {r.status === "draft" ? (
                  <>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditing(editing === r.id ? null : r.id)}>
                      Edit
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void act(() => adminPublishRating({ data: { id: r.id } }), "Rating published.")}>
                      Publish
                    </Button>
                  </>
                ) : null}
                {r.status !== "archived" ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => void act(() => adminArchiveRating({ data: { id: r.id } }), "Rating archived.")}>
                    Archive
                  </Button>
                ) : null}
              </div>
            </div>
            {editing === r.id ? (
              <div className="mt-3">
                <RatingForm
                  initial={r}
                  submitLabel="Save draft"
                  onSubmit={async (d) => {
                    await adminUpdateRating({ data: { id: r.id, ...toData(d) } });
                    setEditing(null);
                    setNotice("Draft saved.");
                    setVersion((v) => v + 1);
                  }}
                />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function RatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-heading">Rates and ratings</h1>
        <p className="mt-2 text-sm text-muted">
          Prices and ratings shown with their source. Amounts are entered as you would write them (12.50 or 1,000) and stored exactly. Rates
          never change what the site charges: it takes enquiries only.
        </p>
      </div>
      <RatesSection />
      <RatingsSection />
    </div>
  );
}
