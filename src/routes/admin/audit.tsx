import { createFileRoute } from "@tanstack/react-router";
import { requirePageCapability } from "@/lib/admin-access";
import { AdminRouteError } from "@/components/admin/admin-route-error";
import { useEffect, useState } from "react";
import { adminListAudit } from "@/lib/server/admin/audit.functions";

export const Route = createFileRoute("/admin/audit")({
  beforeLoad: ({ context }) => requirePageCapability(context.access, "audit.view"),
  errorComponent: AdminRouteError,
  component: Page,
});

function Page() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminListAudit>>>([]);
  useEffect(() => {
    void adminListAudit().then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <ul className="space-y-2 text-sm">
      {rows.map((a) => (
        <li key={a.id} className="rounded-md border border-line bg-surface px-4 py-2">
          <span className="font-mono text-xs text-muted">{a.created_at}</span> · {a.action} · {a.entity}{" "}
          {a.entity_id}
        </li>
      ))}
      {rows.length === 0 ? <p className="text-muted">No audit events.</p> : null}
    </ul>
  );
}
