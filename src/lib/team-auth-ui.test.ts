import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { authErrorMessage, safeNext } from "./team-auth-ui.ts";

describe("team sign-in helpers", () => {
  it("only lets a sign-in continue to an admin or enrolment path", () => {
    assert.equal(safeNext("/admin/audit"), "/admin/audit");
    assert.equal(safeNext("/team/enrol"), "/team/enrol");
    assert.equal(safeNext("https://evil.example/admin"), "/admin");
    assert.equal(safeNext("//evil.example"), "/admin");
    assert.equal(safeNext("/tours"), "/admin");
    assert.equal(safeNext(undefined), "/admin");
  });

  it("shows the rate-limit wording for a 429", () => {
    assert.match(authErrorMessage({ status: 429, message: "x" }, "fallback"), /Wait 15 minutes/);
    assert.equal(authErrorMessage({ message: "Email or password is incorrect." }, "fallback"), "Email or password is incorrect.");
    assert.equal(authErrorMessage(null, "fallback"), "fallback");
  });
});
