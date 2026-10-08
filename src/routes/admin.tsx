import { createFileRoute, Link, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { SIGN_IN_PATH } from "@/lib/auth/gates";
import type { Capability } from "@/lib/capabilities";
import { hasCapability } from "@/lib/admin-access";
import { bootstrapStaff, getAdminAccess } from "@/lib/server/admin-access.functions";
import { pageHead } from "@/lib/seo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => pageHead("Operations", "Tourism Is Life operations desk.", "/admin", "noindex,nofollow"),
  // Runs on the server for the first load and on the client for navigation.
  // Signed-out visitors never see the shell; every child page checks its own
  // capability, and every server function checks again.
  beforeLoad: async () => {
    const access = await getAdminAccess();
    if (!access.signedIn) throw redirect({ to: SIGN_IN_PATH });
    return { access };
  },
  component: AdminLayout,
});

const LINKS: { to: string; label: string; capability: Capability }[] = [
  { to: "/admin", label: "Dashboard", capability: "dashboard.view" },
  { to: "/admin/enquiries", label: "Enquiries", capability: "enquiries.read" },
  { to: "/admin/bookings", label: "Bookings", capability: "enquiries.read" },
  { to: "/admin/availability", label: "Availability", capability: "enquiries.read" },
  { to: "/admin/tours", label: "Tours", capability: "collections.edit" },
  { to: "/admin/reviews", label: "Reviews", capability: "enquiries.manage" },
  { to: "/admin/users", label: "Team", capability: "users.view" },
  { to: "/admin/audit", label: "Audit log", capability: "audit.view" },
];

function AdminLayout() {
  const { access } = Route.useRouteContext();
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);

  if (access.capabilities.length === 0 && !access.canBootstrap) {
    return (
      <div className="container-page py-12">
        <h1 className="font-display text-3xl text-heading">Staff only</h1>
        <p className="mt-3 text-muted">
          {access.status && access.status !== "active"
            ? "This team account is not active. Ask a SUPER_ADMIN to re-enable it."
            : "This desk is limited to team accounts."}
        </p>
      </div>
    );
  }

  if (access.capabilities.length === 0 && access.canBootstrap) {
    return (
      <div className="container-page py-12">
        <h1 className="font-display text-3xl text-heading">Provision operations</h1>
        <p className="mt-3 max-w-xl text-muted">
          No team accounts exist yet. This account may claim SUPER_ADMIN once. After that, roles are granted only
          from this desk.
        </p>
        {err ? <p className="mt-3 text-sm text-danger">{err}</p> : null}
        <Button
          className="mt-6"
          type="button"
          onClick={async () => {
            try {
              await bootstrapStaff();
              await router.invalidate();
            } catch (e) {
              setErr(e instanceof Error ? e.message : "Could not claim SUPER_ADMIN.");
            }
          }}
        >
          Claim SUPER_ADMIN
        </Button>
      </div>
    );
  }

  const links = LINKS.filter((l) => hasCapability(access, l.capability));
  return (
    <div className="container-page py-12">
      <p className="text-xs uppercase tracking-[0.16em] text-gold-ink">Operations · {access.role}</p>
      <h1 className="mt-2 font-display text-4xl text-heading">Command centre</h1>
      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Admin">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            activeOptions={{ exact: l.to === "/admin" }}
            className="min-h-10 rounded-full border border-line px-4 py-2 text-sm hover:border-gold"
            activeProps={{ className: "border-brand bg-brand text-ivory" }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="py-8">
        <Outlet />
      </div>
    </div>
  );
}
