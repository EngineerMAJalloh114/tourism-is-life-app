import { createFileRoute } from "@tanstack/react-router";
import { requirePageCapability } from "@/lib/admin-access";
import { AdminRouteError } from "@/components/admin/admin-route-error";
import { useEffect, useState } from "react";
import { adminListEnquiries, adminSetEnquiryStatus } from "@/lib/server/admin/enquiries.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/enquiries")({
  beforeLoad: ({ context }) => requirePageCapability(context.access, "enquiries.read"),
  errorComponent: AdminRouteError,
  component: Page,
});

function Page() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminListEnquiries>>>([]);
  async function load() {
    setRows(await adminListEnquiries());
  }
  useEffect(() => {
    void load().catch(() => setRows([]));
  }, []);
  return (
    <ul className="space-y-3">
      {rows.map((e) => (
        <li key={e.id} className="rounded-md border border-line bg-surface p-4 text-sm">
          <p className="font-medium">
            {e.type} · {e.status} · {e.guest_name || "Guest"} · {e.guest_email}
          </p>
          <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-xs text-muted">
            {e.payload}
          </pre>
          {e.status === "open" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={async () => {
                await adminSetEnquiryStatus({ data: { id: e.id, status: "closed" } });
                await load();
              }}
            >
              Close
            </Button>
          ) : null}
        </li>
      ))}
      {rows.length === 0 ? <p className="text-sm text-muted">No enquiries.</p> : null}
    </ul>
  );
}
