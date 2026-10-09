import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name === "node_modules" || e.name.startsWith(".")) return [];
    const full = join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
}

const SOURCES = [...walk(join(ROOT, "src")), ...walk(join(ROOT, "scripts")), join(ROOT, ".env.example"), join(ROOT, "vite.config.ts")]
  .filter((f) => /\.(ts|tsx|mjs|js|example)$/.test(f))
  .map((f) => ({ path: relative(ROOT, f).split(sep).join("/"), text: readFileSync(f, "utf8") }))
  // This file names the markers it looks for.
  .filter((f) => f.path !== "src/lib/server/media/secrets.test.ts" && !f.path.startsWith("scripts/check-built-assets"));

describe("the Supabase service key stays on the server (A6)", () => {
  it("no VITE_SUPABASE_* name exists anywhere (Vite would put it in the browser bundle)", () => {
    assert.deepEqual(SOURCES.filter((f) => /VITE_SUPABASE/.test(f.text)).map((f) => f.path), []);
  });

  it("only storage.server.ts reads SUPABASE_SERVICE_KEY", () => {
    const readers = SOURCES.filter((f) => f.path.startsWith("src/") && f.text.includes("SUPABASE_SERVICE_KEY")).map((f) => f.path);
    assert.deepEqual(
      readers.filter((p) => p !== "src/lib/server/media/storage.server.ts" && p !== "src/lib/server/media/library.ts"),
      [],
      "library.ts names it only in the 'uploads are off' message",
    );
    const library = SOURCES.find((f) => f.path === "src/lib/server/media/library.ts")!.text;
    assert.doesNotMatch(library, /process\.env|env\(/, "library.ts never reads the environment");
  });

  it("nothing a route or component imports reads the storage environment directly", () => {
    const client = SOURCES.filter((f) => /^src\/(routes|components)\//.test(f.path));
    assert.deepEqual(client.filter((f) => /SUPABASE_|storage\.server/.test(f.text) && !f.path.startsWith("src/routes/api/")).map((f) => f.path), []);
  });

  it(".env.example names the four storage variables, empty", () => {
    const example = SOURCES.find((f) => f.path === ".env.example")!.text;
    for (const name of ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "SUPABASE_PUBLIC_BUCKET", "SUPABASE_INCOMING_BUCKET"]) {
      assert.match(example, new RegExp(`^# ${name}=$`, "m"), name);
    }
  });
});
