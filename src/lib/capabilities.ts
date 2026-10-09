/**
 * The one role-to-capability map (docs/CUSTOMIZATION_PLAN.md, section 8).
 *
 * Every admin server function and admin page asks for a capability, never for a
 * role or a rank. This file has no server imports, so the admin menu can use
 * the same map to hide items a role cannot open (hiding is a convenience; the
 * server check is what protects the data).
 */
import type { Role } from "@/lib/roles";

export const CAPABILITIES = [
  "dashboard.view",
  "enquiries.read",
  "enquiries.manage",
  "enquiries.export",
  "pages.edit",
  "pages.publish",
  "pages.delete",
  "navigation.edit",
  "navigation.publish",
  "theme.edit",
  "theme.publish",
  "collections.edit",
  "collections.delete",
  "media.upload",
  "media.publish",
  "announcements.edit",
  "claims.source",
  "legal.edit",
  "rates.manage",
  "team.profiles",
  "settings.edit",
  "audit.view",
  "users.view",
  "users.manage",
  "roles.manage",
  "users.reset_two_factor",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

/** The roles that make an account a team account. CUSTOMER is not one. */
export const STAFF_ROLES = ["STAFF", "BOOKING_MANAGER", "CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

/** Account management: only a SUPER_ADMIN may do these. */
const ACCOUNT_CAPABILITIES: readonly Capability[] = ["users.manage", "roles.manage", "users.reset_two_factor"];

const CONTENT_MANAGER: readonly Capability[] = [
  "dashboard.view",
  "pages.edit",
  "navigation.edit",
  "theme.edit",
  "collections.edit",
  "media.upload",
  "media.publish",
  "announcements.edit",
];

const BOOKING_MANAGER: readonly Capability[] = ["dashboard.view", "enquiries.read", "enquiries.manage"];

/** ADMIN is the developer: every capability except account management. */
const ADMIN: readonly Capability[] = CAPABILITIES.filter((c) => !ACCOUNT_CAPABILITIES.includes(c));

export const ROLE_CAPABILITIES: Readonly<Record<Role, readonly Capability[]>> = {
  CUSTOMER: [],
  STAFF: ["dashboard.view"],
  BOOKING_MANAGER,
  CONTENT_MANAGER,
  ADMIN,
  SUPER_ADMIN: CAPABILITIES,
};

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === "string" && (STAFF_ROLES as readonly string[]).includes(value);
}

/** Whether `role` holds `capability`. Unknown roles hold nothing. */
export function can(role: Role | string | null | undefined, capability: Capability): boolean {
  if (!role || !(role in ROLE_CAPABILITIES)) return false;
  return ROLE_CAPABILITIES[role as Role].includes(capability);
}

/** Every capability `role` holds (for the admin menu and the access summary). */
export function capabilitiesOf(role: Role | string | null | undefined): Capability[] {
  if (!role || !(role in ROLE_CAPABILITIES)) return [];
  return [...ROLE_CAPABILITIES[role as Role]];
}
