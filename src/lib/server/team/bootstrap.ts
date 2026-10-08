/**
 * The single-use SUPER_ADMIN claim. `bootstrap_lock` holds one row (id 1); the
 * first account to insert it owns the claim forever. A repeated claim by that
 * same account is a no-op (no second profile write, no second audit row); a
 * claim by anyone else is refused.
 */
import { inTransaction, type Sql } from "@/lib/sql";
import { audit } from "@/lib/server/audit";
import { ConflictError } from "@/lib/server/errors";

export async function claimBootstrap(
  sql: Sql,
  user: { userId: string; ip?: string | null },
): Promise<{ role: "SUPER_ADMIN"; newlyClaimed: boolean }> {
  return inTransaction(sql, async (tx) => {
    const claimed = await tx<{ user_id: string }>`
      insert into bootstrap_lock (id, user_id) values (${1}, ${user.userId})
      on conflict (id) do nothing
      returning user_id
    `;
    if (!claimed[0]) {
      const lock = await tx<{ user_id: string }>`select user_id from bootstrap_lock where id = 1`;
      if (lock[0]?.user_id !== user.userId) throw new ConflictError("Staff already provisioned.", "ALREADY_CLAIMED");
      return { role: "SUPER_ADMIN" as const, newlyClaimed: false };
    }
    await tx`
      insert into staff_profiles (user_id, role) values (${user.userId}, ${"SUPER_ADMIN"})
      on conflict (user_id) do nothing
    `;
    await audit(tx, {
      actor: { userId: user.userId, role: "SUPER_ADMIN", ip: user.ip ?? null },
      action: "staff.bootstrap",
      entity: "staff_profiles",
      entityId: user.userId,
      before: null,
      after: { role: "SUPER_ADMIN", status: "active" },
    });
    return { role: "SUPER_ADMIN" as const, newlyClaimed: true };
  });
}
