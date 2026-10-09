/**
 * Deterministic ids for seeded content (docs/CUSTOMIZATION_PLAN.md section 11):
 * UUID v5 from one fixed namespace and the record's key, so a seed run twice,
 * or regenerated later, produces the same ids. RFC 9562 section 5.5, built on
 * node:crypto (no dependency).
 */
import { createHash } from "node:crypto";

/** The namespace for every Tourism Is Life content id. Never change it. */
export const CONTENT_NAMESPACE = "6f1d2c1e-8a4b-5c3d-9e7f-1a2b3c4d5e6f";

export function uuidV5(name: string, namespace = CONTENT_NAMESPACE): string {
  const ns = Buffer.from(namespace.replace(/-/g, ""), "hex");
  const hash = createHash("sha1").update(Buffer.concat([ns, Buffer.from(name, "utf8")])).digest();
  const b = hash.subarray(0, 16);
  b[6] = (b[6] & 0x0f) | 0x50; // version 5
  b[8] = (b[8] & 0x3f) | 0x80; // RFC variant
  const h = b.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** A collection record's id: stable for the record's life, even when its key changes later. */
export const collectionItemId = (collection: string, key: string) => uuidV5(`collection:${collection}:${key}`);

/** A photo that ships with the site (`media.repo_path`); the same rule as the A6 media seed. */
export const repositoryMediaId = (repoPath: string) => `img_${createHash("sha256").update(repoPath).digest("hex").slice(0, 16)}`;
