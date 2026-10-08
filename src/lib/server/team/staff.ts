/**
 * Team accounts and roles (SEC-6).
 *
 * Rules, all enforced here and tested on PGLite:
 *   - Only a SUPER_ADMIN changes the role or status of any account
 *     (`roles.manage`, `users.manage`); an ADMIN gets 403.
 *   - Nobody changes their own role, or disables or removes themselves.
 *   - The last active SUPER_ADMIN can never be demoted, disabled or removed.
 *
 * Every change runs in one transaction that first takes a transaction-scoped
 * advisory lock (one fixed key for all account changes) and then locks the
 * active SUPER_ADMIN rows with `for update`, so two concurrent changes cannot
 * both see "another SUPER_ADMIN exists" and leave none.
 */
import { STAFF_ROLES, isStaffRole, type StaffRole } from "@/lib/capabilities";
import { inTransaction, type Sql, type TxSql } from "@/lib/sql";
import { adminOperation, type StaffStatus } from "@/lib/server/access";
import { audit } from "@/lib/server/audit";
import { ConflictError, InvalidRequestError, NotFoundError } from "@/lib/server/errors";

/** The advisory lock key every account change takes first. */
export const STAFF_CHANGE_LOCK_KEY = 7_214_001;

export const STAFF_STATUSES = ["active", "disabled", "removed"] as const;

export type StaffProfile = { userId: string; role: StaffRole; status: StaffStatus };

export type TeamMember = {
  userId: string;
  role: StaffRole;
  status: StaffStatus;
  email: string | null;
  name: string | null;
  createdAt: string;
  disabledAt: string | null;
};

/** The staff profile for `userId`, or null when there is none or the role is unknown. */
export async function loadStaffProfile(sql: Sql, userId: string): Promise<StaffProfile | null> {
  const rows = await sql<{ role: string; status: string }>`
    select role, status from staff_profiles where user_id = ${userId} limit 1
  `;
  const row = rows[0];
  if (!row || !isStaffRole(row.role)) return null;
  const status = (STAFF_STATUSES as readonly string[]).includes(row.status) ? (row.status as StaffStatus) : "disabled";
  return { userId, role: row.role, status };
}

async function lockStaffChanges(tx: TxSql): Promise<string[]> {
  await tx`select pg_advisory_xact_lock(${STAFF_CHANGE_LOCK_KEY})`;
  const supers = await tx<{ user_id: string }>`
    select user_id from staff_profiles
    where role = 'SUPER_ADMIN' and status = 'active'
    for update
  `;
  return supers.map((r) => r.user_id);
}

function assertNotSelf(actorId: string, targetId: string, what: string) {
  if (actorId === targetId) {
    throw new ConflictError(`You cannot ${what} your own account. Ask another SUPER_ADMIN.`, "SELF_CHANGE");
  }
}

function assertAnotherActiveSuper(activeSupers: string[], targetId: string) {
  if (activeSupers.includes(targetId) && activeSupers.filter((id) => id !== targetId).length === 0) {
    throw new ConflictError(
      "This is the last active SUPER_ADMIN. Make another account SUPER_ADMIN first.",
      "LAST_SUPER_ADMIN",
    );
  }
}

/** The team list: every account with a staff profile, oldest first. */
export const listTeam = adminOperation("users.view", async (sql): Promise<TeamMember[]> => {
  const rows = await sql<{
    user_id: string;
    role: string;
    status: string;
    email: string | null;
    name: string | null;
    created_at: string;
    disabled_at: string | null;
  }>`
    select s.user_id, s.role, s.status, u.email, u.name, s.created_at, s.disabled_at
    from staff_profiles s
    left join "user" u on u.id = s.user_id
    order by s.created_at asc
  `;
  return rows
    .filter((r) => isStaffRole(r.role))
    .map((r) => ({
      userId: r.user_id,
      role: r.role as StaffRole,
      status: (STAFF_STATUSES as readonly string[]).includes(r.status) ? (r.status as StaffStatus) : "disabled",
      email: r.email,
      name: r.name,
      createdAt: String(r.created_at),
      disabledAt: r.disabled_at ? String(r.disabled_at) : null,
    }));
});

/** Change another account's role. SUPER_ADMIN only. */
export const changeRole = adminOperation(
  "roles.manage",
  async (sql, actor, input: { userId: string; role: StaffRole }) => {
    if (!isStaffRole(input.role)) {
      throw new InvalidRequestError(`Role must be one of ${STAFF_ROLES.join(", ")}.`);
    }
    assertNotSelf(actor.userId, input.userId, "change the role of");
    return inTransaction(sql, async (tx) => {
      const activeSupers = await lockStaffChanges(tx);
      const user = await tx<{ id: string }>`select id from "user" where id = ${input.userId} limit 1`;
      if (!user[0]) throw new NotFoundError("That account does not exist.");
      const current = await loadStaffProfile(tx, input.userId);
      if (current?.role === "SUPER_ADMIN" && current.status === "active" && input.role !== "SUPER_ADMIN") {
        assertAnotherActiveSuper(activeSupers, input.userId);
      }
      await tx`
        insert into staff_profiles (user_id, role, updated_by)
        values (${input.userId}, ${input.role}, ${actor.userId})
        on conflict (user_id) do update
          set role = ${input.role}, updated_at = now(), updated_by = ${actor.userId}
      `;
      await audit(tx, {
        actor,
        action: "staff.role",
        entity: "staff_profiles",
        entityId: input.userId,
        before: current ? { role: current.role, status: current.status } : null,
        after: { role: input.role, status: current?.status ?? "active" },
      });
      return { userId: input.userId, role: input.role, previousRole: current?.role ?? null };
    });
  },
);

/**
 * Disable, re-enable or remove another account. SUPER_ADMIN only. Disabling or
 * removing deletes every session of that account in the same transaction, so
 * its next request is signed out.
 */
export const setStaffStatus = adminOperation(
  "users.manage",
  async (sql, actor, input: { userId: string; status: StaffStatus }) => {
    if (!(STAFF_STATUSES as readonly string[]).includes(input.status)) {
      throw new InvalidRequestError("Status must be active, disabled or removed.");
    }
    assertNotSelf(actor.userId, input.userId, input.status === "active" ? "re-enable" : "disable or remove");
    return inTransaction(sql, async (tx) => {
      const activeSupers = await lockStaffChanges(tx);
      const current = await loadStaffProfile(tx, input.userId);
      if (!current) throw new NotFoundError("That account is not a team account.");
      if (current.role === "SUPER_ADMIN" && input.status !== "active") {
        assertAnotherActiveSuper(activeSupers, input.userId);
      }
      const leaving = input.status !== "active";
      await tx`
        update staff_profiles
        set status = ${input.status},
            disabled_at = ${leaving ? new Date().toISOString() : null},
            disabled_by = ${leaving ? actor.userId : null},
            updated_at = now(),
            updated_by = ${actor.userId}
        where user_id = ${input.userId}
      `;
      if (leaving) await tx`delete from "session" where "userId" = ${input.userId}`;
      await audit(tx, {
        actor,
        action: `staff.${input.status}`,
        entity: "staff_profiles",
        entityId: input.userId,
        before: { role: current.role, status: current.status },
        after: { role: current.role, status: input.status, sessionsEnded: leaving },
      });
      return { userId: input.userId, status: input.status, previousStatus: current.status };
    });
  },
);
