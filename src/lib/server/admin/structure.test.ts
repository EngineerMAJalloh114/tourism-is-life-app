import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, "..", "..", "..");

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
}

describe("admin server functions", () => {
  const files = readdirSync(HERE).filter((f) => f.endsWith(".functions.ts"));

  it("live in src/lib/server/admin/*.functions.ts", () => {
    assert.ok(files.length >= 5, files.join(", "));
  });

  for (const file of files) {
    it(`${file}: every server function uses staffMiddleware and calls an admin operation`, () => {
      const text = readFileSync(join(HERE, file), "utf8");
      const chains = text.split("createServerFn(").slice(1);
      assert.ok(chains.length > 0, "no server functions found");
      for (const chain of chains) {
        assert.match(chain, /^\{ method: "(GET|POST)" \}\)\s*\.middleware\(\[staffMiddleware\]\)/, chain.slice(0, 120));
        assert.match(
          chain,
          /\.handler\(async \(\{[^}]*context[^}]*\}\) =>\s*\w+\(await getSql\(\), context\.actor,/,
          chain.slice(0, 240),
        );
      }
    });
  }

  it("no route or component imports an admin function from ops.ts any more", () => {
    const offenders = walk(join(SRC, "routes"))
      .concat(walk(join(SRC, "components")))
      .filter((f) => /\.(ts|tsx)$/.test(f))
      .filter((f) => /import\s*\{[^}]*\badmin\w*[^}]*\}\s*from\s*"@\/lib\/server\/ops"/.test(readFileSync(f, "utf8")));
    assert.deepEqual(offenders, []);
  });

  it("no server module outside admin/ defines an admin* server function", () => {
    const adminDir = `${sep}server${sep}admin${sep}`;
    const offenders = walk(join(SRC, "lib", "server"))
      .filter((f) => !f.includes(adminDir) && f.endsWith(".ts") && !f.endsWith(".test.ts"))
      .filter((f) => /export const admin\w+ = createServerFn/.test(readFileSync(f, "utf8")));
    assert.deepEqual(offenders, []);
  });
});
