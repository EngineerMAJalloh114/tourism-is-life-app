import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { provenanceStatus, type Provenance } from "@/lib/media-provenance";
import { createTestDb } from "@/lib/server/testing/test-db";
import { BEGIN, END, MIGRATION, mediaSeedRows, mediaSeedSql } from "../../../../scripts/content/generate-media-seed.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const records: (Provenance & { filename: string })[] = JSON.parse(
  readFileSync(join(ROOT, "public", "images", "image-sources.json"), "utf8"),
);

describe("media seed (0008_media)", () => {
  it("is exactly what the generator prints for today's files and image-sources.json", async () => {
    const text = readFileSync(MIGRATION, "utf8").replace(/\r\n/g, "\n");
    const block = text.slice(text.indexOf(BEGIN), text.indexOf(END) + END.length);
    assert.equal(
      block,
      await mediaSeedSql(),
      "public/images or image-sources.json changed after 0008 was written. Record the change in the admin, or add a follow-up seed migration; do not edit 0008.",
    );
  });

  it("applied to a database, every photo's provenance equals its image-sources.json record", async () => {
    const db = await createTestDb();
    try {
      const rows = await db.sql<{ repo_path: string; alt: string; provenance: Provenance; provenance_status: string; published: boolean }>`
        select repo_path, alt, provenance, provenance_status, published from media where origin = 'repository' order by repo_path
      `;
      const { rows: files } = await mediaSeedRows();
      assert.equal(rows.length, files.length, "one row per image file");
      const byPath = new Map(records.map((r) => [r.filename, r]));
      for (const row of rows) {
        const record = byPath.get(row.repo_path);
        assert.deepEqual(row.provenance, record ?? {}, row.repo_path);
        assert.equal(row.alt, record?.alt ?? "", row.repo_path);
        assert.equal(row.provenance_status, provenanceStatus(row.provenance, row.alt), `${row.repo_path}: the seed and media-provenance.ts disagree`);
        assert.equal(row.published, row.provenance_status === "complete", row.repo_path);
      }
      // Photos without a record, or whose licence or place is unconfirmed, are never published.
      for (const path of ["/images/misc/og-image.jpg", "/images/beaches/sandbank-aerial.jpg", "/images/services/ticketing.jpg"]) {
        assert.equal(rows.find((r) => r.repo_path === path)?.published, false, path);
      }
    } finally {
      await db.close();
    }
  });
});
