/**
 * What the admin shell needs to know about the caller: signed in or not, the
 * team role, the capabilities it grants, and whether the single-use
 * SUPER_ADMIN claim is open to this account. Holds no personal data beyond the
 * caller's own role.
 */
import { capabilitiesOf, type Capability, type StaffRole } from "@/lib/capabilities";
import type { Sql } from "@/lib/sql";
import type { StaffStatus } from "@/lib/server/access";
import { loadStaffProfile } from "@/lib/server/team/staff";

export type AccessSummary = {
  signedIn: boolean;
  role: StaffRole | null;
  status: StaffStatus | null;
  capabilities: Capability[];
  canBootstrap: boolean;
  bootstrapLocked: boolean;
};

export const SIGNED_OUT: AccessSummary = {
  signedIn: false,
  role: null,
  status: null,
  capabilities: [],
  canBootstrap: false,
  bootstrapLocked: false,
};

export async function summarizeAccess(
  sql: Sql,
  user: { id: string; email: string | null } | null,
  bootstrap: { emailAllowed: (email: string | null) => boolean; deployed: boolean },
): Promise<AccessSummary> {
  if (!user) return SIGNED_OUT;
  const profile = await loadStaffProfile(sql, user.id);
  const staffCount = await sql<{ n: number }>`select count(*)::int as n from staff_profiles`;
  const empty = (staffCount[0]?.n ?? 0) === 0;
  const active = profile?.status === "active";
  return {
    signedIn: true,
    role: profile?.role ?? null,
    status: profile?.status ?? null,
    capabilities: active ? capabilitiesOf(profile?.role) : [],
    canBootstrap: empty && bootstrap.emailAllowed(user.email),
    bootstrapLocked: empty && bootstrap.deployed && !bootstrap.emailAllowed(user.email),
  };
}
