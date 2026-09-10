import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminListStaff, adminSetRole } from "@/lib/server/ops";
import { Button } from "@/components/ui/button";
import { ROLES, type Role } from "@/lib/roles";

export const Route = createFileRoute("/admin/users")({ component: UsersPage });

function UsersPage() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminListStaff>>>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  function load() {
    void adminListStaff()
      .then(setRows)
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load staff"));
  }

  useEffect(() => {
    load();
  }, []);

  async function change(userId: string, role: Role) {
    setBusy(userId);
    setErr(null);
    try {
      await adminSetRole({ data: { userId, role } });
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not update role");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <p className="text-sm text-muted">
        Server-side RBAC. Changing roles requires ADMIN or SUPER_ADMIN. Authorization is not “hide the
        link”.
      </p>
      {err ? <p className="mt-3 text-sm text-danger">{err}</p> : null}
      <ul className="mt-6 space-y-3">
        {rows.map((r) => (
          <li
            key={r.user_id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface px-4 py-3"
          >
            <div>
              <p className="font-medium">{r.name || r.email || r.user_id}</p>
              <p className="text-xs text-muted">{r.email}</p>
            </div>
            <label className="text-sm">
              Role
              <select
                className="ml-2 min-h-10 rounded-md border border-line bg-ivory px-2"
                value={r.role}
                disabled={busy === r.user_id}
                onChange={(e) => void change(r.user_id, e.target.value as Role)}
              >
                {ROLES.filter((role) => role !== "CUSTOMER").map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
          </li>
        ))}
      </ul>
      {rows.length === 0 ? <p className="mt-4 text-muted">No staff rows yet.</p> : null}
      <Button type="button" variant="outline" className="mt-6" onClick={() => load()}>
        Refresh
      </Button>
    </div>
  );
}
