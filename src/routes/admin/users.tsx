import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { requirePageCapability, hasCapability } from "@/lib/admin-access";
import { AdminRouteError } from "@/components/admin/admin-route-error";
import { STAFF_ROLES, type StaffRole } from "@/lib/capabilities";
import {
  adminChangeRole,
  adminCreateTeamAccount,
  adminListTeam,
  adminResetTwoFactor,
  adminSendPasswordLink,
  adminSetStaffStatus,
} from "@/lib/server/admin/team.functions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export const Route = createFileRoute("/admin/users")({
  beforeLoad: ({ context }) => requirePageCapability(context.access, "users.view"),
  errorComponent: AdminRouteError,
  component: UsersPage,
});

type Member = Awaited<ReturnType<typeof adminListTeam>>[number];

/** Actions that cannot be undone ask once more, inline. */
type Confirming = { userId: string; action: "remove" | "two-factor" } | null;

const ROLE_HELP: Record<StaffRole, string> = {
  STAFF: "Dashboard only",
  BOOKING_MANAGER: "Enquiries",
  CONTENT_MANAGER: "Pages, collections, media, announcements",
  ADMIN: "Everything except team accounts",
  SUPER_ADMIN: "Everything, including team accounts",
};

function formatDate(value: string | null): string {
  if (!value) return "Never";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

function messageOf(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

function CreateMemberForm({ onCreated }: { onCreated: (notice: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Captured before any await: React clears currentTarget afterwards.
    const form = e.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setErr(null);
    try {
      const email = String(data.get("email") ?? "");
      const result = await adminCreateTeamAccount({
        data: { name: String(data.get("name") ?? ""), email, role: String(data.get("role")) as StaffRole },
      });
      form.reset();
      onCreated(
        result.linkSent
          ? `Account created. A "set your password" link was emailed to ${email.trim().toLowerCase()}.`
          : "Account created, but the email did not send. Use Send password link once email is working.",
      );
    } catch (e2) {
      setErr(messageOf(e2, "The account was not created."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-lg border border-line bg-surface p-4 sm:p-5">
      <h2 className="font-display text-xl text-heading">Add a team member</h2>
      <p className="mt-1 text-sm text-muted">
        They get an email to set their password, then set up two-factor sign-in the first time they sign in.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="member-name">Name</Label>
          <Input id="member-name" name="name" required maxLength={100} autoComplete="off" />
        </div>
        <div>
          <Label htmlFor="member-email">Email</Label>
          <Input id="member-email" name="email" type="email" required maxLength={254} autoComplete="off" />
        </div>
        <div>
          <Label htmlFor="member-role">Role</Label>
          <select
            id="member-role"
            name="role"
            defaultValue="STAFF"
            className="min-h-11 w-full rounded-md border border-line bg-page px-3 text-sm text-ink"
          >
            {STAFF_ROLES.map((role) => (
              <option key={role} value={role}>
                {role} ({ROLE_HELP[role]})
              </option>
            ))}
          </select>
        </div>
      </div>
      {err ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {err}
        </p>
      ) : null}
      <Button type="submit" className="mt-4" disabled={busy}>
        {busy ? "Creating…" : "Create and send link"}
      </Button>
    </form>
  );
}

function UsersPage() {
  const { access } = Route.useRouteContext();
  const canChangeRoles = hasCapability(access, "roles.manage");
  const canManageAccounts = hasCapability(access, "users.manage");
  const canResetTwoFactor = hasCapability(access, "users.reset_two_factor");
  const [rows, setRows] = useState<Member[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Confirming>(null);

  function load() {
    void adminListTeam()
      .then((r) => {
        setRows(r);
        setLoaded(true);
      })
      .catch((e) => setErr(messageOf(e, "Could not load the team.")));
  }

  useEffect(() => {
    load();
  }, []);

  async function run(userId: string, action: () => Promise<string | null>) {
    setBusy(userId);
    setErr(null);
    setNotice(null);
    setConfirming(null);
    try {
      setNotice(await action());
      load();
    } catch (e) {
      setErr(messageOf(e, "That change was not saved."));
    } finally {
      setBusy(null);
    }
  }

  const current = rows.filter((r) => r.status !== "removed");
  const removed = rows.filter((r) => r.status === "removed");

  return (
    <div>
      <h1 className="font-display text-3xl text-heading">Team accounts</h1>
      <p className="mt-2 text-sm text-muted">
        {canManageAccounts
          ? "Only a SUPER_ADMIN creates accounts or changes roles and status. Nobody changes their own account, and the last active SUPER_ADMIN is protected."
          : "You can see the team. Only a SUPER_ADMIN creates accounts or changes roles and status."}
      </p>

      {canManageAccounts ? (
        <CreateMemberForm
          onCreated={(text) => {
            setErr(null);
            setNotice(text);
            load();
          }}
        />
      ) : null}

      <div aria-live="polite" className="mt-4 space-y-2">
        {notice ? <p className="rounded-md border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ink">{notice}</p> : null}
        {err ? (
          <p role="alert" className="text-sm text-danger">
            {err}
          </p>
        ) : null}
      </div>

      <ul className="mt-6 space-y-3">
        {current.map((r) => {
          const self = r.userId === access.userId;
          const locked = self || busy === r.userId;
          const isConfirming = confirming?.userId === r.userId ? confirming.action : null;
          return (
            <li key={r.userId} className="rounded-md border border-line bg-surface px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-heading">
                    {r.name || r.email || r.userId}
                    {self ? <span className="ml-2 text-xs font-normal text-muted">(you)</span> : null}
                  </p>
                  <p className="break-all text-xs text-muted">{r.email}</p>
                </div>
                <p
                  className={
                    r.status === "active"
                      ? "rounded-full border border-ok/40 px-2.5 py-0.5 text-xs text-ok"
                      : "rounded-full border border-line px-2.5 py-0.5 text-xs text-muted"
                  }
                >
                  {r.status === "active" ? "Active" : "Disabled"}
                </p>
              </div>
              <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
                <div className="flex gap-1">
                  <dt className="text-muted">Password:</dt>
                  <dd>{r.passwordSet ? "Set" : "Not set yet"}</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="text-muted">Two-factor:</dt>
                  <dd>{r.twoFactorEnabled ? "On" : "Not set up"}</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="text-muted">Last sign-in:</dt>
                  <dd>{formatDate(r.lastSignInAt)}</dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="text-sm">
                  <span className="sr-only">Role for {r.name || r.email}</span>
                  <select
                    className="min-h-9 rounded-md border border-line bg-page px-2 text-sm"
                    value={r.role}
                    disabled={!canChangeRoles || locked}
                    onChange={(e) => {
                      const role = e.target.value as StaffRole;
                      void run(r.userId, async () => {
                        await adminChangeRole({ data: { userId: r.userId, role } });
                        return `Role changed to ${role}.`;
                      });
                    }}
                  >
                    {STAFF_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
                {canManageAccounts && !self ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={locked}
                      onClick={() =>
                        void run(r.userId, async () => {
                          const status = r.status === "active" ? "disabled" : "active";
                          await adminSetStaffStatus({ data: { userId: r.userId, status } });
                          return status === "disabled" ? "Account disabled. Its sessions have ended." : "Account re-enabled.";
                        })
                      }
                    >
                      {r.status === "active" ? "Disable" : "Re-enable"}
                    </Button>
                    {r.status === "active" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={locked}
                        onClick={() =>
                          void run(r.userId, async () => {
                            const res = await adminSendPasswordLink({ data: { userId: r.userId } });
                            if (!res.linkSent) return "The email did not send. Check the email settings and try again.";
                            return res.kind === "invite"
                              ? `A "set your password" link was emailed to ${r.email}.`
                              : `A password reset link was emailed to ${r.email}.`;
                          })
                        }
                      >
                        Send password link
                      </Button>
                    ) : null}
                  </>
                ) : null}
                {canResetTwoFactor && !self && r.twoFactorEnabled ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={locked}
                    onClick={() => setConfirming({ userId: r.userId, action: "two-factor" })}
                  >
                    Reset two-factor
                  </Button>
                ) : null}
                {canManageAccounts && !self ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={locked}
                    onClick={() => setConfirming({ userId: r.userId, action: "remove" })}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
              {isConfirming ? (
                <div role="alertdialog" aria-label="Confirm" className="mt-3 rounded-md border border-danger/40 bg-page p-3 text-sm">
                  <p>
                    {isConfirming === "remove"
                      ? "Remove this account? Its password, two-factor and sessions are deleted. This cannot be undone; you can invite the same email again as a new account."
                      : "Reset two-factor? Their authenticator and recovery codes stop working and they are signed out. They set it up again at their next sign-in."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="dark"
                      disabled={busy === r.userId}
                      onClick={() =>
                        void run(r.userId, async () => {
                          if (isConfirming === "remove") {
                            await adminSetStaffStatus({ data: { userId: r.userId, status: "removed" } });
                            return "Account removed.";
                          }
                          await adminResetTwoFactor({ data: { userId: r.userId } });
                          return "Two-factor reset. They will set it up again at their next sign-in.";
                        })
                      }
                    >
                      {isConfirming === "remove" ? "Remove account" : "Reset two-factor"}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setConfirming(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {loaded && current.length === 0 ? <p className="mt-4 text-muted">No team accounts yet.</p> : null}

      {removed.length > 0 ? (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-muted">Removed accounts ({removed.length})</summary>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {removed.map((r) => (
              <li key={r.userId} className="break-all">
                {r.name || r.email} · {r.email} · removed {formatDate(r.disabledAt)}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
