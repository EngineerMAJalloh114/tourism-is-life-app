import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { ADMIN_MENU, menuFor } from "@/lib/admin-menu";
import { CAPABILITIES, capabilitiesOf, STAFF_ROLES } from "@/lib/capabilities";

const ROUTES = join(dirname(fileURLToPath(import.meta.url)), "..", "routes");

function routeFile(to: string): string {
  return to === "/admin" ? join(ROUTES, "admin", "index.tsx") : join(ROUTES, `${to.slice(1)}.tsx`);
}

function labels(role: (typeof STAFF_ROLES)[number] | "CUSTOMER"): string[] {
  return menuFor(capabilitiesOf(role)).flatMap((g) => g.items.map((i) => i.label));
}

describe("admin menu", () => {
  const items = ADMIN_MENU.flatMap((g) => g.items);

  it("names only real capabilities", () => {
    for (const item of items) assert.ok((CAPABILITIES as readonly string[]).includes(item.capability), item.label);
  });

  it("has a page for every available item, and a reason for every disabled one", () => {
    for (const item of items) {
      if (item.available) assert.ok(existsSync(routeFile(item.to)), `${item.to} has no route file`);
      else assert.ok(item.comingIn, `${item.label} is disabled without saying when it arrives`);
    }
  });

  it("checks the same capability on the page as the menu shows it for", () => {
    for (const item of items.filter((i) => i.available)) {
      const text = readFileSync(routeFile(item.to), "utf8");
      assert.match(text, new RegExp(`requirePageCapability\\(context\\.access, "${item.capability.replace(".", "\\.")}"\\)`), item.to);
    }
  });

  it("never offers booking, payment or availability", () => {
    for (const item of items) assert.doesNotMatch(`${item.label} ${item.to}`, /book|payment|availab|checkout|hold/i);
  });

  it("gives a customer nothing", () => {
    assert.deepEqual(menuFor(capabilitiesOf("CUSTOMER")), []);
  });

  it("gives STAFF the dashboard only", () => {
    assert.deepEqual(labels("STAFF"), ["Dashboard"]);
  });

  it("gives BOOKING_MANAGER the dashboard and enquiries only", () => {
    assert.deepEqual(labels("BOOKING_MANAGER"), ["Dashboard", "Enquiries"]);
  });

  it("gives CONTENT_MANAGER content items and no team, security or enquiry items", () => {
    const seen = labels("CONTENT_MANAGER");
    for (const label of ["Pages", "Navigation", "Collections", "Media", "Announcements", "Theme"]) assert.ok(seen.includes(label), label);
    for (const label of ["Enquiries", "Team accounts", "Audit log", "Sign-in log", "Settings", "Rates and ratings"]) {
      assert.ok(!seen.includes(label), label);
    }
  });

  it("gives ADMIN and SUPER_ADMIN every item", () => {
    const all = items.map((i) => i.label);
    assert.deepEqual(labels("ADMIN"), all);
    assert.deepEqual(labels("SUPER_ADMIN"), all);
  });

  it("leaves out groups with nothing visible", () => {
    for (const role of STAFF_ROLES) {
      for (const group of menuFor(capabilitiesOf(role))) assert.ok(group.items.length > 0, `${role} ${group.label}`);
    }
  });
});
