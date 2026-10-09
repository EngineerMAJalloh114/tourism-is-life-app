/**
 * The first-time setup: before any team account exists, the owner asks for a
 * "set your password" link for the BOOTSTRAP_ADMIN_EMAIL address. Following it
 * verifies the mailbox, which is what lets that account sign in and make the
 * single SUPER_ADMIN claim at /admin (SEC-1).
 */
import type { Sql } from "@/lib/sql";

/** Open while there is no team account and no claim. */
export async function setupOpen(sql: Sql): Promise<boolean> {
  const rows = await sql<{ staff: number; claimed: number }>`
    select (select count(*)::int from staff_profiles) as staff, (select count(*)::int from bootstrap_lock) as claimed
  `;
  return rows[0]?.staff === 0 && rows[0]?.claimed === 0;
}
