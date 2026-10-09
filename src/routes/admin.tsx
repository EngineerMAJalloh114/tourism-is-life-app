import { createFileRoute, Link, Outlet, redirect, useRouter, useRouterState } from "@tanstack/react-router";
import { ChevronDown, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { SIGN_IN_PATH } from "@/lib/auth/gates";
import { signOut } from "@/lib/auth/client";
import { menuFor } from "@/lib/admin-menu";
import { bootstrapStaff, getAdminAccess } from "@/lib/server/admin-access.functions";
import { pageHead } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => pageHead("Operations", "Tourism Is Life operations desk.", "/admin", "noindex,nofollow"),
  // Runs on the server for the first load and on the client for navigation.
  // Signed-out visitors never see the shell; every child page checks its own
  // capability, and every server function checks again.
  beforeLoad: async ({ location }) => {
    const access = await getAdminAccess();
    if (!access.signedIn) throw redirect({ to: SIGN_IN_PATH, search: { next: location.href } });
    // Every team account enrols two-factor before any admin page opens. The
    // one exception is the owner making the single SUPER_ADMIN claim.
    if (access.capabilities.length > 0 && !access.twoFactorEnabled) throw redirect({ to: "/team/enrol" });
    return { access };
  },
  component: AdminLayout,
});

function AccountBar({ email, role }: { email: string | null; role: string | null }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.16em] text-gold-ink">Operations desk</p>
        <p className="mt-1 truncate text-sm text-muted">
          {email}
          {role ? ` · ${role}` : ""}
        </p>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={() => void signOut(SIGN_IN_PATH)}>
        <LogOut className="size-4" aria-hidden="true" />
        Sign out
      </Button>
    </div>
  );
}

function AdminNav({ capabilities }: { capabilities: Parameters<typeof menuFor>[0] }) {
  const groups = menuFor(capabilities);
  return (
    <nav aria-label="Admin" className="space-y-5">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-xs uppercase tracking-[0.16em] text-muted">{group.label}</p>
          <ul className="mt-2 space-y-1">
            {group.items.map((item) =>
              item.available ? (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    activeOptions={{ exact: item.to === "/admin" }}
                    className="block min-h-10 rounded-md px-3 py-2 text-sm text-ink hover:bg-brand/10 hover:text-heading"
                    activeProps={{ className: "bg-brand text-ivory hover:bg-brand hover:text-ivory" }}
                  >
                    {item.label}
                  </Link>
                </li>
              ) : (
                <li key={item.to}>
                  <span
                    aria-disabled="true"
                    title={item.comingIn ? `Arrives with ${item.comingIn}` : undefined}
                    className="flex min-h-10 items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-muted"
                  >
                    {item.label}
                    <span className="text-xs">Later</span>
                  </span>
                </li>
              ),
            )}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function AdminLayout() {
  const { access } = Route.useRouteContext();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [err, setErr] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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
          from this desk, and you will set up two-factor sign-in next.
        </p>
        {err ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {err}
          </p>
        ) : null}
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

  return (
    <div className="container-page py-8 lg:py-10">
      <AccountBar email={access.email} role={access.role} />
      <div className="mt-6 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
        <div className="lg:hidden">
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="admin-menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex min-h-11 w-full items-center justify-between rounded-md border border-line bg-surface px-4 text-sm font-medium text-heading"
          >
            Menu
            <ChevronDown className={cn("size-4 transition-transform", menuOpen && "rotate-180")} aria-hidden="true" />
          </button>
          {menuOpen ? (
            <div id="admin-menu" className="mt-3 rounded-md border border-line bg-surface p-3">
              <AdminNav capabilities={access.capabilities} />
            </div>
          ) : null}
        </div>
        <aside className="hidden lg:block">
          <AdminNav capabilities={access.capabilities} />
        </aside>
        <div className="mt-6 min-w-0 lg:mt-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
