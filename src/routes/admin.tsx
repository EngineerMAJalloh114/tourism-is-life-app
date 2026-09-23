import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { bootstrapStaff, getMyRole } from "@/lib/server/ops";
import { isStaff } from "@/lib/roles";
import { pageHead } from "@/lib/seo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => pageHead("Operations", "Tourism Is Life operations desk.", "/admin", "noindex,nofollow"),
  component: AdminLayout,
});

const LINKS = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/bookings", label: "Bookings" },
  { to: "/admin/enquiries", label: "Enquiries" },
  { to: "/admin/availability", label: "Availability" },
  { to: "/admin/tours", label: "Tours" },
  { to: "/admin/reviews", label: "Reviews" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/audit", label: "Audit log" },
];

function AdminLayout() {
  const { user, isPending } = useCurrentUserState();
  const [role, setRole] = useState<string>("CUSTOMER");
  const [canBootstrap, setCanBootstrap] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void getMyRole()
      .then((r) => {
        setRole(r.role);
        setCanBootstrap(r.canBootstrap);
      })
      .catch(() => setRole("CUSTOMER"));
  }, [user]);

  if (isPending) return <div className="container-page py-24">Loading operations…</div>;
  if (!user) return <RedirectToSignIn />;

  if (!isStaff(role) && !canBootstrap) {
    return (
      <div className="container-page py-20">
        <h1 className="font-display text-3xl text-heading">Staff only</h1>
        <p className="mt-3 text-muted">This desk is limited to provisioned operations roles.</p>
      </div>
    );
  }

  if (!isStaff(role) && canBootstrap) {
    return (
      <div className="container-page py-20">
        <h1 className="font-display text-3xl text-heading">Provision operations</h1>
        <p className="mt-3 max-w-xl text-muted">
          No staff roles exist yet. The first signed-in user may claim SUPER_ADMIN. After that, roles are
          granted only from this desk.
        </p>
        {err ? <p className="mt-3 text-sm text-danger">{err}</p> : null}
        <Button
          className="mt-6"
          type="button"
          onClick={async () => {
            try {
              const r = await bootstrapStaff();
              setRole(r.role);
              setCanBootstrap(false);
            } catch (e) {
              setErr(e instanceof Error ? e.message : "Could not bootstrap");
            }
          }}
        >
          Claim SUPER_ADMIN
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <p className="text-xs uppercase tracking-[0.16em] text-gold-ink">Operations · {role}</p>
      <h1 className="mt-2 font-display text-4xl text-heading">Command centre</h1>
      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Admin">
        {LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
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
