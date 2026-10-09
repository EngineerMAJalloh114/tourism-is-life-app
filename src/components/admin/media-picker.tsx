import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { adminListMedia } from "@/lib/server/admin/media.functions";

type Item = Awaited<ReturnType<typeof adminListMedia>>["items"][number];

/**
 * Choose a photo for a record. Only published photos are offered: a photo is
 * placed only once its provenance is complete (the server checks this too).
 */
export function MediaPicker({ onPick, onClose }: { onPick: (item: Item) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      void adminListMedia({ data: { filter: "published", q: q.trim() || undefined, limit: 60 } })
        .then((r) => setItems(r.items))
        .catch((e) => setErr(e instanceof Error ? e.message : "Could not load photos."));
    }, 200);
    return () => clearTimeout(handle);
  }, [q]);

  return (
    <div role="dialog" aria-label="Choose a photo" className="mt-2 rounded-md border border-line bg-page p-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="w-full sm:w-64">
          <Label htmlFor="picker-search">Search published photos</Label>
          <Input id="picker-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
      {err ? <p className="mt-2 text-sm text-danger">{err}</p> : null}
      {items && items.length === 0 ? <p className="mt-2 text-sm text-muted">No published photos match.</p> : null}
      <ul className="mt-3 grid max-h-80 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 lg:grid-cols-6">
        {(items ?? []).map((item) => (
          <li key={item.id}>
            <button type="button" onClick={() => onPick(item)} className="block w-full overflow-hidden rounded border border-line hover:border-gold">
              <div className="aspect-[4/3] bg-surface">
                {item.previewUrl ? <img src={item.previewUrl} alt={item.alt} loading="lazy" className="h-full w-full object-cover" /> : null}
              </div>
              <p className="line-clamp-2 p-1 text-left text-[11px] text-ink">{item.alt}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
