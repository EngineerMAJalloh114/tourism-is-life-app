import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { can, STAFF_ROLES } from "@/lib/capabilities";
import { isAdminOperation, type AdminOperation } from "@/lib/server/access";
import { forbiddenSql } from "@/lib/server/testing/test-db";
import * as auditLog from "@/lib/server/audit-log";
import * as dashboard from "@/lib/server/dashboard";
import * as desk from "@/lib/server/enquiries/desk";
import * as accounts from "@/lib/server/team/accounts";
import * as mediaLibrary from "@/lib/server/media/library";
import * as siteSettings from "@/lib/server/settings/site-settings";
import * as signInLog from "@/lib/server/team/sign-in-log";
import * as staff from "@/lib/server/team/staff";

/**
 * Every module that exports admin operations. The structure test checks that
 * each `*.functions.ts` file only calls operations, so adding a module here is
 * what brings its operations under this test.
 */
const OPERATION_MODULES: Record<string, Record<string, unknown>> = {
  "audit-log": auditLog,
  dashboard,
  "enquiries/desk": desk,
  "media/library": mediaLibrary,
  "settings/site-settings": siteSettings,
  "team/accounts": accounts,
  "team/sign-in-log": signInLog,
  "team/staff": staff,
};

function operations(): [string, AdminOperation<unknown, unknown>][] {
  const out: [string, AdminOperation<unknown, unknown>][] = [];
  for (const [mod, exports] of Object.entries(OPERATION_MODULES)) {
    for (const [name, value] of Object.entries(exports)) {
      if (isAdminOperation(value)) out.push([`${mod}.${name}`, value]);
    }
  }
  return out;
}

describe("every admin operation", () => {
  it("is registered (the registry is not empty)", () => {
    assert.ok(operations().length >= 8, `found ${operations().length}`);
  });

  for (const [name, op] of operations()) {
    it(`${name} (${op.capability}): signed out is 401 before any query`, async () => {
      await assert.rejects(op(forbiddenSql(), null, {} as never), (e: { status?: number }) => e.status === 401);
    });

    it(`${name} (${op.capability}): every role without the capability is 403 before any query`, async () => {
      for (const role of STAFF_ROLES) {
        if (can(role, op.capability)) continue;
        await assert.rejects(
          op(forbiddenSql(), { userId: `as-${role}`, email: null, role }, {} as never),
          (e: { status?: number }) => e.status === 403,
          `${role} should be refused`,
        );
      }
    });
  }
});
