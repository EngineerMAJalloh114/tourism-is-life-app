import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { requirePageCapability } from "@/lib/admin-access";
import { AdminRouteError } from "@/components/admin/admin-route-error";
import { adminListAudit, adminListAuditEntities } from "@/lib/server/admin/audit.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/audit")({
  beforeLoad: ({ context }) => requirePageCapability(context.access, "audit.view"),
  errorComponent: AdminRouteError,
  component: Page,
});

type Row = Awaited<ReturnType<typeof adminListAudit>>["rows"][number];

function pretty(value: Row["before"]): string {
  if (value === null || value === undefined) return "none";
  return JSON.stringify(value, null, 2);
}

function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [entities, setEntities] = useState<string[]>([]);
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (more: boolean) => {
      setLoading(true);
      setErr(null);
      try {
        const page = await adminListAudit({
          data: { entity: entity || undefined, action: action.trim() || undefined, cursor: more ? cursor ?? undefined : undefined },
        });
        setRows((prev) => (more ? [...prev, ...page.rows] : page.rows));
        setCursor(page.nextCursor);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Could not load the audit log.");
      } finally {
        setLoading(false);
      }
    },
    [entity, action, cursor],
  );

  useEffect(() => {
    void adminListAuditEntities().then(setEntities).catch(() => setEntities([]));
  }, []);

  useEffect(() => {
    void load(false);
    // Reload from the first page whenever a filter changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, action]);

  return (
    <div>
      <p className="text-sm text-muted">
        Every change made in the admin, with who made it and the value before and after. Entries cannot be edited
        or deleted.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="block text-xs uppercase tracking-[0.14em] text-muted">Area</span>
          <select
            className="mt-1 min-h-10 rounded-md border border-line bg-page px-2"
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
          >
            <option value="">All areas</option>
            {entities.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-xs uppercase tracking-[0.14em] text-muted">Action starts with</span>
          <input
            className="mt-1 min-h-10 w-48 rounded-md border border-line bg-page px-2"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="staff."
          />
        </label>
      </div>
      {err ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {err}
        </p>
      ) : null}
      <ul className="mt-6 space-y-2 text-sm">
        {rows.map((a) => (
          <li key={a.id} className="rounded-md border border-line bg-surface px-4 py-2">
            <details>
              <summary className="cursor-pointer list-none">
                <span className="font-mono text-xs text-muted">{new Date(a.created_at).toLocaleString()}</span>
                <span className="ml-2 font-medium">{a.action}</span>
                <span className="ml-2 text-muted">
                  {a.entity} {a.entity_id}
                </span>
                <span className="ml-2 break-all text-xs text-muted">
                  by {a.actor_email ?? a.actor_id ?? "system"}
                  {a.actor_role ? ` (${a.actor_role})` : ""}
                </span>
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">Before</p>
                  <pre className="mt-1 max-h-60 overflow-auto whitespace-pre-wrap break-all rounded bg-page p-2 text-xs">
                    {pretty(a.before)}
                  </pre>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">After</p>
                  <pre className="mt-1 max-h-60 overflow-auto whitespace-pre-wrap break-all rounded bg-page p-2 text-xs">
                    {pretty(a.after)}
                  </pre>
                </div>
                {a.detail ? <p className="text-xs text-muted sm:col-span-2">Note: {a.detail}</p> : null}
                {a.ip ? <p className="text-xs text-muted sm:col-span-2">From {a.ip}</p> : null}
              </div>
            </details>
          </li>
        ))}
      </ul>
      {rows.length === 0 && !loading ? <p className="mt-4 text-muted">No audit entries match.</p> : null}
      {cursor ? (
        <Button type="button" variant="outline" className="mt-6" disabled={loading} onClick={() => void load(true)}>
          {loading ? "Loading…" : "Load older entries"}
        </Button>
      ) : null}
    </div>
  );
}
