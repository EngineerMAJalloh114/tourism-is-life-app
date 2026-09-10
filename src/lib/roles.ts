export const ROLES = [
  "CUSTOMER",
  "STAFF",
  "BOOKING_MANAGER",
  "CONTENT_MANAGER",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

export type Role = (typeof ROLES)[number];

const RANK: Record<Role, number> = {
  CUSTOMER: 0,
  STAFF: 1,
  BOOKING_MANAGER: 2,
  CONTENT_MANAGER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export function isStaff(role: Role | string | null | undefined): boolean {
  return Boolean(role && role !== "CUSTOMER" && role in RANK);
}

export function atLeast(role: Role | string | null | undefined, min: Role): boolean {
  if (!role || !(role in RANK)) return false;
  return RANK[role as Role] >= RANK[min];
}

export function parseRole(value: string | null | undefined): Role {
  if (value && (ROLES as readonly string[]).includes(value)) return value as Role;
  return "CUSTOMER";
}
