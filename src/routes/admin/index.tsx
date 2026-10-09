import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { hasCapability, requirePageCapability } from "@/lib/admin-access";
import { AdminRouteError } from "@/components/admin/admin-route-error";
import { adminSnapshot } from "@/lib/server/admin/dashboard.functions";

export const Route = createFileRoute("/admin/")({
  beforeLoad: ({ context }) => requirePageCapability(context.access, "dashboard.view"),
  errorComponent: AdminRouteError,
  component: Dashboard,
});

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl text-heading">{value}</p>
    </div>
  );
}

function Dashboard() {
  const { access } = Route.useRouteContext();
  const [data, setData] = useState<Awaited<ReturnType<typeof adminSnapshot>> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void adminSnapshot()
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load the dashboard."));
  }, []);

  if (err) return <p role="alert" className="text-danger">{err}</p>;
  if (!data) return <p className="text-muted">Loading…</p>;
  const openTotal = data.openEnquiries.reduce((sum, row) => sum + row.n, 0);

  return (
    <div>
      <h1 className="font-display text-3xl text-heading">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="New enquiries" value={String(openTotal)} />
        <Stat label="Enquiries in the last 7 days" value={String(data.enquiriesLast7Days)} />
        <Stat label="Tours in the catalogue" value={String(data.publishedTours)} />
        {data.activeTeamAccounts !== null ? <Stat label="Active team accounts" value={String(data.activeTeamAccounts)} /> : null}
      </div>
      <h2 className="mt-10 font-display text-2xl text-heading">New enquiries by type</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {data.openEnquiries.map((e) => (
          <li key={e.type}>
            {e.type}: {e.n}
          </li>
        ))}
        {data.openEnquiries.length === 0 ? <li className="text-muted">None waiting.</li> : null}
      </ul>
      {hasCapability(access, "enquiries.read") ? (
        <p className="mt-4 text-sm">
          <Link to="/admin/enquiries" className="text-heading underline-offset-4 hover:underline">
            Open the enquiry desk
          </Link>
        </p>
      ) : null}
    </div>
  );
}
