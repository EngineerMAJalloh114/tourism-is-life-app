import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { requirePageCapability, hasCapability } from "@/lib/admin-access";
import { AdminRouteError } from "@/components/admin/admin-route-error";
import { STAFF_ROLES, type StaffRole } from "@/lib/capabilities";
import { adminChangeRole, adminListTeam, adminSetStaffStatus } from "@/lib/server/admin/team.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/users")({
  beforeLoad: ({ context }) => requirePageCapability(context.access, "users.view"),
  errorComponent: AdminRouteError,
  component: UsersPage,
});

type Member = Awaited<ReturnType<typeof adminListTeam>>[number];

function UsersPage() {
  const { access } = Route.useRouteContext();
  const canChangeRoles = hasCapability(access, "roles.manage");
  const canManageAccounts = hasCapability(access, "users.manage");
  const [rows, setRows] = useState<Member[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  function load() {
    void adminListTeam()
      .then(setRows)
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load the team."));
  }

  useEffect(() => {
    load();
  }, []);

  async function run(userId: string, action: () => Promise<unknown>) {
    setBusy(userId);
    setErr(null);
    try {
      await action();
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "That change was not saved.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-heading">Team accounts</h1>
      <p className="mt-2 text-sm text-muted">
        {canChangeRoles
          ? "Only a SUPER_ADMIN changes roles or account status. Nobody can change their own account, and the last active SUPER_ADMIN is protected."
          : "You can see the team. Only a SUPER_ADMIN changes roles or account status."}
      </p>
      {err ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {err}
        </p>
      ) : null}
      <ul className="mt-6 space-y-3">
        {rows.map((r) => (
          <li
            key={r.userId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface px-4 py-3"
          >
            <div className="min-w-0">
              <p className="font-medium">{r.name || r.email || r.userId}</p>
              <p className="break-all text-xs text-muted">
                {r.email} · {r.status}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm">
                Role
                <select
                  className="ml-2 min-h-10 rounded-md border border-line bg-page px-2"
                  value={r.role}
                  disabled={!canChangeRoles || busy === r.userId}
                  onChange={(e) => {
                    const role = e.target.value as StaffRole;
                    void run(r.userId, () => adminChangeRole({ data: { userId: r.userId, role } }));
                  }}
                >
                  {STAFF_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
              {canManageAccounts ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy === r.userId}
                  onClick={() =>
                    void run(r.userId, () =>
                      adminSetStaffStatus({
                        data: { userId: r.userId, status: r.status === "active" ? "disabled" : "active" },
                      }),
                    )
                  }
                >
                  {r.status === "active" ? "Disable" : "Re-enable"}
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {rows.length === 0 ? <p className="mt-4 text-muted">No team accounts yet.</p> : null}
      <Button type="button" variant="outline" className="mt-6" onClick={() => load()}>
        Refresh
      </Button>
    </div>
  );
}
