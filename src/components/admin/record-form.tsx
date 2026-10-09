/**
 * The collection record form, built from a collection's field list
 * (`src/lib/collections/registry.ts`). It edits a plain object; the server
 * checks it against the collection's schema on save.
 */
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useState } from "react";
import { MediaPicker } from "@/components/admin/media-picker";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { isClaim, type Claim, type FieldDef } from "@/lib/collections/registry";

type Data = Record<string, unknown>;
export type Previews = Record<string, { url: string | null; alt: string; published: boolean }>;
export type RefOptions = Record<string, { key: string; title: string }[]>;

type Ctx = { refOptions: RefOptions; previews: Previews; addPreview: (id: string, p: Previews[string]) => void; canSourceClaims: boolean };

function move<T>(list: T[], i: number, by: number): T[] {
  const j = i + by;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function RowTools({ i, count, onMove, onRemove, label }: { i: number; count: number; onMove: (by: number) => void; onRemove: () => void; label: string }) {
  return (
    <span className="flex shrink-0 gap-1">
      <button type="button" aria-label={`Move ${label} ${i + 1} up`} disabled={i === 0} onClick={() => onMove(-1)} className="grid size-9 place-items-center rounded border border-line disabled:opacity-40">
        <ArrowUp className="size-4" aria-hidden="true" />
      </button>
      <button type="button" aria-label={`Move ${label} ${i + 1} down`} disabled={i === count - 1} onClick={() => onMove(1)} className="grid size-9 place-items-center rounded border border-line disabled:opacity-40">
        <ArrowDown className="size-4" aria-hidden="true" />
      </button>
      <button type="button" aria-label={`Remove ${label} ${i + 1}`} onClick={onRemove} className="grid size-9 place-items-center rounded border border-line">
        <X className="size-4" aria-hidden="true" />
      </button>
    </span>
  );
}

function ClaimEditor({ id, value, onChange, canSource }: { id: string; value: Claim; onChange: (c: Claim) => void; canSource: boolean }) {
  const sourced = value.sourceUrl !== "" && value.sourceDate !== "";
  return (
    <div className="flex-1 rounded border border-gold-ink/40 bg-surface p-2">
      <p className="text-[11px] uppercase tracking-[0.14em] text-gold-ink">{sourced ? "Claim, sourced" : "Claim, not shown until sourced"}</p>
      <div className="mt-1 grid gap-2 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${id}-claim`}>Claim</Label>
          <Input id={`${id}-claim`} value={value.claim} onChange={(e) => onChange({ ...value, claim: e.target.value })} />
        </div>
        <div>
          <Label htmlFor={`${id}-fallback`}>Shown without a source</Label>
          <Input id={`${id}-fallback`} value={value.fallback} placeholder="Leave empty to leave it out" onChange={(e) => onChange({ ...value, fallback: e.target.value })} />
        </div>
        <div>
          <Label htmlFor={`${id}-url`}>Source link</Label>
          <Input id={`${id}-url`} value={value.sourceUrl} disabled={!canSource} placeholder="https://" onChange={(e) => onChange({ ...value, sourceUrl: e.target.value })} />
        </div>
        <div>
          <Label htmlFor={`${id}-date`}>Source date</Label>
          <Input id={`${id}-date`} type="date" value={value.sourceDate} disabled={!canSource} onChange={(e) => onChange({ ...value, sourceDate: e.target.value })} />
        </div>
      </div>
      {!canSource ? <p className="mt-1 text-xs text-muted">An ADMIN or SUPER_ADMIN records the source.</p> : null}
    </div>
  );
}

function ImageEditor({ id, value, onChange, ctx }: { id: string; value: { media: string; alt: string }; onChange: (v: { media: string; alt: string }) => void; ctx: Ctx }) {
  const [picking, setPicking] = useState(false);
  const preview = value.media ? ctx.previews[value.media] : undefined;
  return (
    <div className="rounded border border-line bg-page p-2">
      <div className="flex flex-wrap items-start gap-3">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded bg-surface">
          {preview?.url ? <img src={preview.url} alt="" className="h-full w-full object-cover" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <Label htmlFor={`${id}-alt`}>Alt text</Label>
          <Input id={`${id}-alt`} value={value.alt} onChange={(e) => onChange({ ...value, alt: e.target.value })} />
          {preview && !preview.published ? (
            <p className="mt-1 text-xs text-gold-ink">This photo's provenance is incomplete. It stays here, but cannot be placed anywhere new.</p>
          ) : null}
          <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => setPicking((v) => !v)}>
            {value.media ? "Change photo" : "Choose photo"}
          </Button>
        </div>
      </div>
      {picking ? (
        <MediaPicker
          onClose={() => setPicking(false)}
          onPick={(item) => {
            ctx.addPreview(item.id, { url: item.previewUrl, alt: item.alt, published: item.published });
            onChange({ media: item.id, alt: value.alt || item.alt });
            setPicking(false);
          }}
        />
      ) : null}
    </div>
  );
}

function FieldInput({ field, value, onChange, ctx, prefix }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void; ctx: Ctx; prefix: string }) {
  const id = `${prefix}-${field.name}`;
  switch (field.kind) {
    case "text":
      return (
        <div className={field.multiline ? "sm:col-span-2" : undefined}>
          <Label htmlFor={id}>{field.label}</Label>
          {field.multiline ? (
            <Textarea id={id} className="min-h-24" maxLength={field.max} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
          ) : (
            <Input id={id} maxLength={field.max} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
          )}
          {field.help ? <p className="mt-1 text-xs text-muted">{field.help}</p> : null}
        </div>
      );
    case "number":
      return (
        <div>
          <Label htmlFor={id}>{field.label}</Label>
          <Input id={id} type="number" min={field.min} max={field.max} value={String(value ?? "")} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />
          {field.help ? <p className="mt-1 text-xs text-muted">{field.help}</p> : null}
        </div>
      );
    case "select":
    case "ref": {
      const options =
        field.kind === "select"
          ? field.options.map((o) => ({ value: o, label: o }))
          : (ctx.refOptions[field.collection] ?? []).map((o) => ({ value: o.key, label: `${o.title} (${o.key})` }));
      return (
        <div>
          <Label htmlFor={id}>{field.label}</Label>
          <select id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className="min-h-11 w-full rounded-md border border-line bg-page px-3 text-sm text-ink">
            {field.kind === "ref" && field.allowEmpty ? <option value="">None</option> : null}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      );
    }
    case "image":
      return (
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.14em] text-muted">{field.label}</p>
          {field.optional && value === null ? (
            <Button type="button" size="sm" variant="outline" onClick={() => onChange({ media: "", alt: "" })}>
              Add a photo
            </Button>
          ) : (
            <>
              <ImageEditor id={id} value={(value as { media: string; alt: string }) ?? { media: "", alt: "" }} onChange={onChange} ctx={ctx} />
              {field.optional ? (
                <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => onChange(null)}>
                  Remove the photo
                </Button>
              ) : null}
            </>
          )}
        </div>
      );
    case "boolean":
      return (
        <label htmlFor={id} className="inline-flex min-h-11 items-center gap-2 text-sm">
          <input id={id} type="checkbox" className="size-4" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
          {field.label}
        </label>
      );
    case "checkboxes": {
      const chosen = (value as string[]) ?? [];
      return (
        <fieldset className="sm:col-span-2">
          <legend className="mb-1.5 text-xs font-medium uppercase tracking-[0.14em] text-muted">{field.label}</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {field.options.map((o) => (
              <label key={o} className="inline-flex min-h-9 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={chosen.includes(o)}
                  onChange={(e) => onChange(e.target.checked ? field.options.filter((x) => x === o || chosen.includes(x)) : chosen.filter((x) => x !== o))}
                />
                {o}
              </label>
            ))}
          </div>
        </fieldset>
      );
    }
    case "claim":
      return (
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.14em] text-muted">{field.label}</p>
          {field.help ? <p className="mb-2 text-xs text-muted">{field.help}</p> : null}
          <ClaimEditor id={id} value={value as Claim} canSource={ctx.canSourceClaims} onChange={onChange} />
        </div>
      );
    case "group": {
      const obj = (value as Data) ?? {};
      return (
        <fieldset className="rounded border border-line bg-page p-3 sm:col-span-2">
          <legend className="px-1 text-xs font-medium uppercase tracking-[0.14em] text-muted">{field.label}</legend>
          {field.help ? <p className="mb-2 text-xs text-muted">{field.help}</p> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {field.fields.map((sub) => (
              <FieldInput key={sub.name} field={sub} prefix={id} value={obj[sub.name]} ctx={ctx} onChange={(v) => onChange({ ...obj, [sub.name]: v })} />
            ))}
          </div>
        </fieldset>
      );
    }
    case "readonly":
      return (
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.14em] text-muted">{field.label}</p>
          <p className="text-sm text-ink">{String(value ?? "")}</p>
          {field.help ? <p className="mt-1 text-xs text-muted">{field.help}</p> : null}
        </div>
      );
    case "gallery": {
      const list = (value as { media: string; alt: string }[]) ?? [];
      return (
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.14em] text-muted">{field.label}</p>
          <ul className="space-y-2">
            {list.map((img, i) => (
              <li key={i} className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <ImageEditor id={`${id}-${i}`} value={img} onChange={(v) => onChange(list.map((x, j) => (j === i ? v : x)))} ctx={ctx} />
                </div>
                <RowTools i={i} count={list.length} label="photo" onMove={(by) => onChange(move(list, i, by))} onRemove={() => onChange(list.filter((_, j) => j !== i))} />
              </li>
            ))}
          </ul>
          <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => onChange([...list, { media: "", alt: "" }])}>
            Add a photo
          </Button>
        </div>
      );
    }
    case "textList": {
      const list = (value as (string | Claim)[]) ?? [];
      return (
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.14em] text-muted">{field.label}</p>
          {field.help ? <p className="mb-2 text-xs text-muted">{field.help}</p> : null}
          <ul className="space-y-2">
            {list.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                {isClaim(item) ? (
                  <ClaimEditor id={`${id}-${i}`} value={item} canSource={ctx.canSourceClaims} onChange={(c) => onChange(list.map((x, j) => (j === i ? c : x)))} />
                ) : (
                  <Input aria-label={`${field.label} ${i + 1}`} value={item} onChange={(e) => onChange(list.map((x, j) => (j === i ? e.target.value : x)))} />
                )}
                <RowTools i={i} count={list.length} label="line" onMove={(by) => onChange(move(list, i, by))} onRemove={() => onChange(list.filter((_, j) => j !== i))} />
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => onChange([...list, ""])}>
              Add a line
            </Button>
            {field.claims ? (
              <Button type="button" size="sm" variant="outline" onClick={() => onChange([...list, { claim: "", sourceUrl: "", sourceDate: "", fallback: "" }])}>
                Add a claim
              </Button>
            ) : null}
          </div>
        </div>
      );
    }
    case "objectList": {
      const list = (value as Data[]) ?? [];
      const blank = Object.fromEntries(field.fields.map((f) => [f.name, f.kind === "number" ? list.length + 1 : ""]));
      return (
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.14em] text-muted">{field.label}</p>
          <ul className="space-y-2">
            {list.map((item, i) => (
              <li key={i} className="flex items-start gap-2 rounded border border-line bg-page p-2">
                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                  {field.fields.map((sub) => (
                    <FieldInput
                      key={sub.name}
                      field={sub}
                      prefix={`${id}-${i}`}
                      value={item[sub.name]}
                      ctx={ctx}
                      onChange={(v) => onChange(list.map((x, j) => (j === i ? { ...x, [sub.name]: v } : x)))}
                    />
                  ))}
                </div>
                <RowTools i={i} count={list.length} label={field.itemLabel.toLowerCase()} onMove={(by) => onChange(move(list, i, by))} onRemove={() => onChange(list.filter((_, j) => j !== i))} />
              </li>
            ))}
          </ul>
          <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => onChange([...list, blank])}>
            Add a {field.itemLabel.toLowerCase()}
          </Button>
        </div>
      );
    }
  }
}

export function RecordForm({
  fields,
  value,
  onChange,
  refOptions,
  previews,
  addPreview,
  canSourceClaims,
}: {
  fields: FieldDef[];
  value: Data;
  onChange: (v: Data) => void;
  refOptions: RefOptions;
  previews: Previews;
  addPreview: Ctx["addPreview"];
  canSourceClaims: boolean;
}) {
  const ctx: Ctx = { refOptions, previews, addPreview, canSourceClaims };
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => (
        <FieldInput key={f.name} field={f} prefix="record" value={value[f.name]} ctx={ctx} onChange={(v) => onChange({ ...value, [f.name]: v })} />
      ))}
    </div>
  );
}
