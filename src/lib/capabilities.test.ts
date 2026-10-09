import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CAPABILITIES, ROLE_CAPABILITIES, can, type Capability } from "./capabilities.ts";

type Staff = "STAFF" | "BOOKING_MANAGER" | "CONTENT_MANAGER" | "ADMIN" | "SUPER_ADMIN";

/** The capability table from docs/CUSTOMIZATION_PLAN.md section 8, row by row. */
const EXPECTED: Record<Capability, Staff[]> = {
  "dashboard.view": ["STAFF", "BOOKING_MANAGER", "CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "enquiries.read": ["BOOKING_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "enquiries.manage": ["BOOKING_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "enquiries.export": ["ADMIN", "SUPER_ADMIN"],
  "pages.edit": ["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "pages.publish": ["ADMIN", "SUPER_ADMIN"],
  "pages.delete": ["ADMIN", "SUPER_ADMIN"],
  "navigation.edit": ["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "navigation.publish": ["ADMIN", "SUPER_ADMIN"],
  "theme.edit": ["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "theme.publish": ["ADMIN", "SUPER_ADMIN"],
  "collections.edit": ["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "collections.delete": ["ADMIN", "SUPER_ADMIN"],
  "media.upload": ["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "media.publish": ["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "announcements.edit": ["CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"],
  "claims.source": ["ADMIN", "SUPER_ADMIN"],
  "legal.edit": ["ADMIN", "SUPER_ADMIN"],
  "rates.manage": ["ADMIN", "SUPER_ADMIN"],
  "team.profiles": ["ADMIN", "SUPER_ADMIN"],
  "settings.edit": ["ADMIN", "SUPER_ADMIN"],
  "audit.view": ["ADMIN", "SUPER_ADMIN"],
  "users.view": ["ADMIN", "SUPER_ADMIN"],
  "users.manage": ["SUPER_ADMIN"],
  "roles.manage": ["SUPER_ADMIN"],
  "users.reset_two_factor": ["SUPER_ADMIN"],
};

const ALL_ROLES = ["CUSTOMER", "STAFF", "BOOKING_MANAGER", "CONTENT_MANAGER", "ADMIN", "SUPER_ADMIN"] as const;

describe("capability map", () => {
  it("matches the plan's table for all six roles", () => {
    assert.deepEqual(Object.keys(EXPECTED).sort(), [...CAPABILITIES].sort());
    for (const cap of CAPABILITIES) {
      for (const role of ALL_ROLES) {
        assert.equal(can(role, cap), (EXPECTED[cap] as string[]).includes(role), `${role} / ${cap}`);
      }
    }
  });

  it("gives SUPER_ADMIN everything and ADMIN everything except account management", () => {
    assert.deepEqual([...ROLE_CAPABILITIES.SUPER_ADMIN].sort(), [...CAPABILITIES].sort());
    const missing = CAPABILITIES.filter((c) => !can("ADMIN", c));
    assert.deepEqual(missing, ["users.manage", "roles.manage", "users.reset_two_factor"]);
  });

  it("gives CUSTOMER and unknown roles nothing", () => {
    assert.equal(ROLE_CAPABILITIES.CUSTOMER.length, 0);
    assert.equal(can("OWNER", "dashboard.view"), false);
    assert.equal(can(null, "dashboard.view"), false);
  });
});
