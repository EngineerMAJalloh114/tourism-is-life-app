/**
 * Creating team accounts, sending password links and resetting two-factor
 * (task A5). Role and status changes live in `./staff.ts`; both files share its
 * lock and rules: SUPER_ADMIN only, nobody acts on their own account, and the
 * last active SUPER_ADMIN is protected.
 *
 * A new account has no password. The member sets one through the emailed link,
 * which also proves the mailbox, then enrols two-factor on first sign-in. The
 * email goes out after the transaction commits, never inside it, and the desk
 * is told whether it was delivered.
 */
import { isStaffRole, type StaffRole } from "@/lib/capabilities";
import type { PasswordLinkKind, PasswordLinks } from "@/lib/auth/team-links";
import { inTransaction, type Sql } from "@/lib/sql";
import { adminOperation, type Actor } from "@/lib/server/access";
import { audit } from "@/lib/server/audit";
import { publicId } from "@/lib/server/crypto";
import { ConflictError, HttpError, InvalidRequestError, NotFoundError } from "@/lib/server/errors";
import { assertNotSelf, clearCredentials, loadStaffProfile, lockStaffChanges } from "@/lib/server/team/staff";

export type CreateTeamAccountInput = { name: string; email: string; role: StaffRole };

function requireLinks(links: PasswordLinks | undefined): PasswordLinks {
  if (!links) throw new HttpError(500, "LINKS_UNCONFIGURED", "Password links are not configured on this server.");
  return links;
}

/** Send the link and record that it was sent (or not) in the audit log. */
async function sendLink(
  sql: Sql,
  actor: Actor,
  links: PasswordLinks,
  user: { id: string; email: string; name: string | null },
  kind: PasswordLinkKind,
): Promise<boolean> {
  const { sent } = await links.send(user, kind);
  await inTransaction(sql, (tx) =>
    audit(tx, {
      actor,
      action: "staff.password_link",
      entity: "staff_profiles",
      entityId: user.id,
      after: { kind, delivered: sent },
    }),
  );
  return sent;
}

async function hasPassword(sql: Sql, userId: string): Promise<boolean> {
  const rows = await sql`select 1 from "account" where "userId" = ${userId} and "providerId" = 'credential' limit 1`;
  return rows.length > 0;
}

/**
 * Create a team account and email its "set your password" link.
 *
 * An address that already belongs to an active or disabled team account is
 * refused. An address held by a removed team account, or by an old customer
 * account from before team sign-in, is taken over as a fresh account: its old
 * password, sign-in methods, two-factor and sessions are deleted first, so only
 * the person who receives the new link can get in.
 */
export const createTeamAccount = adminOperation(
  "users.manage",
  async (sql, actor, input: CreateTeamAccountInput, links: PasswordLinks | undefined) => {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (!name || name.length > 100) throw new InvalidRequestError("Enter a name of up to 100 characters.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      throw new InvalidRequestError("Enter a valid email address.");
    }
    if (!isStaffRole(input.role)) throw new InvalidRequestError("Choose a team role.");
    const sender = requireLinks(links);

    const userId = await inTransaction(sql, async (tx) => {
      await lockStaffChanges(tx);
      const existing = await tx<{ id: string; status: string | null; role: string | null }>`
        select u.id, s.status, s.role
        from "user" u left join staff_profiles s on s.user_id = u.id
        where lower(u.email) = ${email}
        limit 1
      `;
      const found = existing[0];
      if (found?.status === "active" || found?.status === "disabled") {
        throw new ConflictError("That email already has a team account.", "ACCOUNT_EXISTS");
      }
      let id: string;
      if (found) {
        id = found.id;
        await clearCredentials(tx, id);
        await tx`update "user" set name = ${name}, email = ${email}, "emailVerified" = false, "updatedAt" = now() where id = ${id}`;
      } else {
        id = publicId(16);
        await tx`
          insert into "user" (id, name, email, "emailVerified", "twoFactorEnabled", "createdAt", "updatedAt")
          values (${id}, ${name}, ${email}, ${false}, ${false}, now(), now())
        `;
      }
      await tx`
        insert into staff_profiles (user_id, role, status, updated_by)
        values (${id}, ${input.role}, 'active', ${actor.userId})
        on conflict (user_id) do update
          set role = ${input.role}, status = 'active', disabled_at = null, disabled_by = null,
              updated_at = now(), updated_by = ${actor.userId}
      `;
      await audit(tx, {
        actor,
        action: "staff.create",
        entity: "staff_profiles",
        entityId: id,
        before: found ? { role: found.role, status: found.status ?? "not a team account" } : null,
        after: { name, email, role: input.role, status: "active" },
      });
      return id;
    });

    const linkSent = await sendLink(sql, actor, sender, { id: userId, email, name }, "invite");
    return { userId, linkSent };
  },
);

/**
 * Email an active member a password link: "set your password" when they have
 * not set one yet, otherwise "reset your password".
 */
export const sendPasswordLink = adminOperation(
  "users.manage",
  async (sql, actor, input: { userId: string }, links: PasswordLinks | undefined) => {
    assertNotSelf(actor.userId, input.userId, "send a password link to");
    const sender = requireLinks(links);
    const profile = await loadStaffProfile(sql, input.userId);
    if (!profile) throw new NotFoundError("That account is not a team account.");
    if (profile.status !== "active") {
      throw new ConflictError("Re-enable this account before sending it a password link.", "NOT_ACTIVE");
    }
    const user = await sql<{ email: string; name: string }>`select email, name from "user" where id = ${input.userId} limit 1`;
    if (!user[0]) throw new NotFoundError("That account does not exist.");
    const kind: PasswordLinkKind = (await hasPassword(sql, input.userId)) ? "reset" : "invite";
    const sent = await sendLink(sql, actor, sender, { id: input.userId, email: user[0].email, name: user[0].name || null }, kind);
    return { userId: input.userId, kind, linkSent: sent };
  },
);

/**
 * Reset another member's two-factor: their authenticator and recovery codes are
 * deleted and every session ends, so their next sign-in goes through enrolment
 * again. For a lost phone. The password is unchanged.
 */
export const resetTwoFactor = adminOperation(
  "users.reset_two_factor",
  async (sql, actor, input: { userId: string }) => {
    assertNotSelf(actor.userId, input.userId, "reset two-factor on");
    return inTransaction(sql, async (tx) => {
      await lockStaffChanges(tx);
      const profile = await loadStaffProfile(tx, input.userId);
      if (!profile) throw new NotFoundError("That account is not a team account.");
      const user = await tx<{ enabled: boolean | null }>`
        select "twoFactorEnabled" as enabled from "user" where id = ${input.userId} limit 1
      `;
      await tx`delete from "twoFactor" where "userId" = ${input.userId}`;
      await tx`update "user" set "twoFactorEnabled" = false, "updatedAt" = now() where id = ${input.userId}`;
      await tx`delete from "session" where "userId" = ${input.userId}`;
      await audit(tx, {
        actor,
        action: "staff.reset_two_factor",
        entity: "staff_profiles",
        entityId: input.userId,
        before: { twoFactorEnabled: user[0]?.enabled === true },
        after: { twoFactorEnabled: false, sessionsEnded: true },
      });
      return { userId: input.userId };
    });
  },
);

