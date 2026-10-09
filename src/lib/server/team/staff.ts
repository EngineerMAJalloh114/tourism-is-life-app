/**
 * Team accounts and roles (SEC-6).
 *
 * Rules, all enforced here and tested on PGLite:
 *   - Only a SUPER_ADMIN changes the role or status of any account
 *     (`roles.manage`, `users.manage`); an ADMIN gets 403.
 *   - Nobody changes their own role, or disables or removes themselves.
 *   - The last active SUPER_ADMIN can never be demoted, disabled or removed.
 *   - Disabling ends every session and open password link; removing also
 *     deletes the password, other sign-in methods and two-factor, and is final
 *     (the address can be invited again as a fresh account).
 *   - Only an existing team account changes role. A plain account becomes a
 *     team account only through `createTeamAccount`, which clears its old
 *     password first.
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
  twoFactorEnabled: boolean;
  /** False until the member follows their "set your password" link. */
  passwordSet: boolean;
  lastSignInAt: string | null;
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

export async function lockStaffChanges(tx: TxSql): Promise<string[]> {
  await tx`select pg_advisory_xact_lock(${STAFF_CHANGE_LOCK_KEY})`;
  const supers = await tx<{ user_id: string }>`
    select user_id from staff_profiles
    where role = 'SUPER_ADMIN' and status = 'active'
    for update
  `;
  return supers.map((r) => r.user_id);
}

export function assertNotSelf(actorId: string, targetId: string, what: string) {
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

/** End every session and every open password link of an account. */
export async function endAccess(tx: TxSql, userId: string) {
  await tx`delete from "session" where "userId" = ${userId}`;
  await tx`delete from "verification" where identifier like ${"reset-password:%"} and value = ${userId}`;
}

/** Wipe every way into an account: password and other sign-in methods, two-factor, sessions, open links. */
export async function clearCredentials(tx: TxSql, userId: string) {
  await tx`delete from "account" where "userId" = ${userId}`;
  await tx`delete from "twoFactor" where "userId" = ${userId}`;
  await tx`update "user" set "twoFactorEnabled" = false, "updatedAt" = now() where id = ${userId}`;
  await endAccess(tx, userId);
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
    two_factor: boolean | null;
    password_set: boolean;
    last_sign_in: string | null;
  }>`
    select s.user_id, s.role, s.status, u.email, u.name, s.created_at, s.disabled_at,
      u."twoFactorEnabled" as two_factor,
      exists (select 1 from "account" a where a."userId" = s.user_id and a."providerId" = ${"credential"}) as password_set,
      (select max(a.created_at)::text from sign_in_attempts a
        where a.user_id = s.user_id and a.outcome in (${"signed-in"}, ${"two-factor-ok"})) as last_sign_in
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
      twoFactorEnabled: r.two_factor === true,
      passwordSet: r.password_set === true,
      lastSignInAt: r.last_sign_in,
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
      const current = await loadStaffProfile(tx, input.userId);
      if (!current) throw new NotFoundError("That account is not a team account. Create it from the team page.");
      if (current.status === "removed") throw new ConflictError("This account was removed.", "REMOVED");
      if (current.role === "SUPER_ADMIN" && current.status === "active" && input.role !== "SUPER_ADMIN") {
        assertAnotherActiveSuper(activeSupers, input.userId);
      }
      await tx`
        update staff_profiles set role = ${input.role}, updated_at = now(), updated_by = ${actor.userId}
        where user_id = ${input.userId}
      `;
      await audit(tx, {
        actor,
        action: "staff.role",
        entity: "staff_profiles",
        entityId: input.userId,
        before: { role: current.role, status: current.status },
        after: { role: input.role, status: current.status },
      });
      return { userId: input.userId, role: input.role, previousRole: current.role };
    });
  },
);

/**
 * Disable, re-enable or remove another account. SUPER_ADMIN only. Disabling or
 * removing deletes every session of that account in the same transaction, so
 * its next request is signed out. Removing also deletes its password and
 * two-factor, and cannot be undone here.
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
      if (current.status === "removed") {
        throw new ConflictError("A removed account stays removed. Create the account again to invite this person.", "REMOVED");
      }
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
      if (input.status === "removed") await clearCredentials(tx, input.userId);
      else if (leaving) await endAccess(tx, input.userId);
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
