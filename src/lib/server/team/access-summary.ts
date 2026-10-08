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
  /** The caller's own account id (to mark their own row on the team page). */
  userId: string | null;
  /** The caller's own email (shown in the admin header). */
  email: string | null;
  role: StaffRole | null;
  status: StaffStatus | null;
  capabilities: Capability[];
  /** Team accounts must enrol two-factor before any admin page opens. */
  twoFactorEnabled: boolean;
  canBootstrap: boolean;
  bootstrapLocked: boolean;
};

export const SIGNED_OUT: AccessSummary = {
  signedIn: false,
  userId: null,
  email: null,
  role: null,
  status: null,
  capabilities: [],
  twoFactorEnabled: false,
  canBootstrap: false,
  bootstrapLocked: false,
};

export async function summarizeAccess(
  sql: Sql,
  user: { id: string; email: string | null; twoFactorEnabled?: boolean } | null,
  bootstrap: { emailAllowed: (email: string | null) => boolean; deployed: boolean },
): Promise<AccessSummary> {
  if (!user) return SIGNED_OUT;
  const profile = await loadStaffProfile(sql, user.id);
  const staffCount = await sql<{ n: number }>`select count(*)::int as n from staff_profiles`;
  const empty = (staffCount[0]?.n ?? 0) === 0;
  const active = profile?.status === "active";
  return {
    signedIn: true,
    userId: user.id,
    email: user.email,
    role: profile?.role ?? null,
    status: profile?.status ?? null,
    capabilities: active ? capabilitiesOf(profile?.role) : [],
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
    canBootstrap: empty && bootstrap.emailAllowed(user.email),
    bootstrapLocked: empty && bootstrap.deployed && !bootstrap.emailAllowed(user.email),
  };
}
