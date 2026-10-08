/**
 * Server functions for the admin shell itself. These are not admin operations:
 * `getAdminAccess` answers for signed-out callers too (so the shell can send
 * them to sign in), and `bootstrapStaff` is the single-use SUPER_ADMIN claim,
 * which by definition runs before any team account exists.
 */
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { inTransaction } from "@/lib/sql";
import { writeAudit } from "@/lib/server/audit";
import { bootstrapEmailAllowed, isDeployedRuntime } from "@/lib/server/config";
import { log } from "@/lib/server/logger";
import { summarizeAccess } from "@/lib/server/team/access-summary";

export const getAdminAccess = createServerFn({ method: "GET" }).handler(async () => {
  const { resolveSessionUser } = await import("@/lib/server/actor.server");
  const user = await resolveSessionUser();
  return summarizeAccess(await getSql(), user, {
    emailAllowed: bootstrapEmailAllowed,
    deployed: isDeployedRuntime(),
  });
});

/**
 * Claim the single-use SUPER_ADMIN bootstrap. `context.email` is the verified
 * session email from `authMiddleware` (never client input); `bootstrapEmailAllowed`
 * restricts the claim to `BOOTSTRAP_ADMIN_EMAIL` outside local/preview, and a
 * deployment without that variable is locked.
 *
 * KNOWN LIMITATION until task A3: this checks WHICH address may claim, not that
 * the claiming account owns it (no email verification yet). A3 adds the
 * email-verified first-time setup (SEC-1).
 */
export const bootstrapStaff = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!bootstrapEmailAllowed(context.email)) {
      throw new Error(
        isDeployedRuntime()
          ? "Staff bootstrap is locked. Set BOOTSTRAP_ADMIN_EMAIL to the first operator’s address."
          : "A verified email is required to claim operations.",
      );
    }
    const sql = await getSql();
    return inTransaction(sql, async (tx) => {
      const claimed = await tx<{ user_id: string }>`
        insert into bootstrap_lock (id, user_id) values (${1}, ${context.userId})
        on conflict (id) do nothing
        returning user_id
      `;
      const lock = claimed[0] ?? (await tx<{ user_id: string }>`select user_id from bootstrap_lock where id = 1`)[0];
      if (!lock || lock.user_id !== context.userId) {
        throw new Error("Staff already provisioned.");
      }
      await tx`
        insert into staff_profiles (user_id, role) values (${context.userId}, ${"SUPER_ADMIN"})
        on conflict (user_id) do nothing
      `;
      await writeAudit(tx, context.userId, "staff.bootstrap", "staff_profiles", context.userId);
      log.info("staff.bootstrap", { userId: context.userId });
      return { role: "SUPER_ADMIN" as const };
    });
  });
