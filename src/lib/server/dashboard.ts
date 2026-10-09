/**
 * Dashboard counts. `dashboard.view` holds no personal data: every figure here
 * is a count, never a name, email, phone number or message. The dormant booking
 * tables are not shown (they left the admin in task A4).
 */
import { tours } from "@/data/catalog";
import { can } from "@/lib/capabilities";
import { adminOperation } from "@/lib/server/access";

export type DashboardSnapshot = {
  openEnquiries: { type: string; n: number }[];
  enquiriesLast7Days: number;
  publishedTours: number;
  /** Only for roles that may see the team list. */
  activeTeamAccounts: number | null;
};

export const dashboardSnapshot = adminOperation("dashboard.view", async (sql, actor): Promise<DashboardSnapshot> => {
  const open = await sql<{ type: string; n: number }>`
    select type, count(*)::int as n from enquiries where status = 'open' group by type order by type
  `;
  const week = await sql<{ n: number }>`
    select count(*)::int as n from enquiries where created_at >= now() - interval '7 days'
  `;
  let activeTeamAccounts: number | null = null;
  if (can(actor.role, "users.view")) {
    const team = await sql<{ n: number }>`select count(*)::int as n from staff_profiles where status = 'active'`;
    activeTeamAccounts = team[0]?.n ?? 0;
  }
  return {
    openEnquiries: open,
    enquiriesLast7Days: week[0]?.n ?? 0,
    publishedTours: tours.length,
    activeTeamAccounts,
  };
});
