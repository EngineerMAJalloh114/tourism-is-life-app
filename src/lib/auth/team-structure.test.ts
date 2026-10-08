import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

describe("team sign-in wiring (A3)", () => {
  it("no longer registers the Grok gate session plugin, and bearer() only in the workspace preview", () => {
    const server = read("src/lib/auth/server.ts");
    assert.doesNotMatch(server, /gateIdentitySessions\s*\(/);
    assert.doesNotMatch(server, /import[^;]*gate-session\.server/);
    assert.match(server, /\.\.\.\(isWorkspacePreview\(\) \? \[bearer\(\)\] : \[\]\)/);
    assert.match(server, /team\.twoFactorPlugin/);
    assert.match(server, /hooks: team\.hooks/);
    assert.match(server, /databaseHooks: team\.databaseHooks/);
  });

  it("disallows /admin and /team in robots.txt", () => {
    const robots = read("public/robots.txt");
    assert.match(robots, /^Disallow: \/admin$/m);
    assert.match(robots, /^Disallow: \/team$/m);
  });

  it("marks every /team page and the admin shell noindex", () => {
    const dir = join(ROOT, "src/routes/team");
    const files = readdirSync(dir).filter((f) => f.endsWith(".tsx"));
    assert.ok(files.length >= 6, files.join(", "));
    for (const f of files) assert.match(readFileSync(join(dir, f), "utf8"), /"noindex,nofollow"/, f);
    assert.match(read("src/routes/admin.tsx"), /"noindex,nofollow"/);
  });

  it("sends the old sign-in addresses to the team pages with a permanent redirect", () => {
    for (const f of ["login", "register", "forgot-password", "reset-password"]) {
      const text = read(`src/routes/${f}.tsx`);
      assert.match(text, /statusCode: 301/, f);
      assert.match(text, /\/team\//, f);
    }
  });

  it("links Team access from the footer and points sign-in gates at /team/sign-in", () => {
    assert.match(read("src/components/layout/site-footer.tsx"), /to="\/team\/sign-in"[\s\S]{0,80}Team access/);
    assert.match(read("src/lib/auth/gates.tsx"), /SIGN_IN_PATH = "\/team\/sign-in"/);
  });

  it("never sends a visitor from a tour page to a sign-in page", () => {
    assert.doesNotMatch(read("src/routes/tours/$slug.tsx"), /\/login/);
  });
});
