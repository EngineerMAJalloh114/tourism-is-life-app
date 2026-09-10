/**
 * Object storage abstraction (Cloudflare R2 / Amazon S3).
 * Existing public/ and catalog image URLs keep working until a bucket is configured.
 */

export type StorageBackend = "r2" | "s3" | "public";

export function storageBackend(): StorageBackend {
  if (process.env.R2_BUCKET?.trim() && process.env.R2_ACCESS_KEY_ID?.trim()) return "r2";
  if (process.env.S3_BUCKET?.trim() && process.env.S3_ACCESS_KEY_ID?.trim()) return "s3";
  return "public";
}

export function storageConfig() {
  const backend = storageBackend();
  if (backend === "r2") {
    return {
      backend,
      bucket: process.env.R2_BUCKET!,
      endpoint: process.env.R2_ENDPOINT ?? null,
      configured: true,
    };
  }
  if (backend === "s3") {
    return {
      backend,
      bucket: process.env.S3_BUCKET!,
      endpoint: process.env.S3_ENDPOINT ?? null,
      configured: true,
    };
  }
  return { backend, bucket: "public", endpoint: null, configured: false };
}

/** Public URL for a stored object. Local catalog images are already absolute URLs. */
export function publicAssetUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const cfg = storageConfig();
  if (cfg.backend === "r2" && process.env.R2_PUBLIC_BASE) {
    return `${process.env.R2_PUBLIC_BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  }
  if (cfg.backend === "s3" && process.env.S3_PUBLIC_BASE) {
    return `${process.env.S3_PUBLIC_BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  }
  return path.startsWith("/") ? path : `/${path}`;
}
