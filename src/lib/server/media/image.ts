/**
 * Checking and processing an uploaded photo (task A6).
 *
 * Checks, in order: size (up to 15 MB), the declared type is JPEG, PNG or
 * WebP, the file's own signature matches the declared type, `sharp` can
 * decode it, and it is a single still frame within a pixel limit. Processing:
 * orientation fixed from EXIF, every metadata block (EXIF, GPS, XMP, ICC
 * comments) dropped, longest side at most 2400 px, then WebP variants at 480,
 * 960 and 1600 px wide, a JPEG fallback at 1600, and a small raw RGB raster
 * (about 320 px wide) that the photo contrast check in task B7 reads.
 *
 * `sharp` is imported only when an image is processed, so a public page's
 * cold start never loads it.
 */
import { createHash } from "node:crypto";
import { InvalidRequestError } from "@/lib/server/errors";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const MAX_SIDE = 2400;
export const VARIANT_WIDTHS = [480, 960, 1600] as const;
export const FALLBACK_WIDTH = 1600;
export const ANALYSIS_WIDTH = 320;
/** About 8000 x 7500; a decompression bomb is refused before any resize. */
export const MAX_INPUT_PIXELS = 60_000_000;

export const IMAGE_TYPES = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" } as const;
export type ImageMime = keyof typeof IMAGE_TYPES;
export type ImageFormat = (typeof IMAGE_TYPES)[ImageMime];

export function isImageMime(value: string): value is ImageMime {
  return Object.hasOwn(IMAGE_TYPES, value);
}

/** The format a file's first bytes say it is, or null. */
export function sniffImage(head: Uint8Array): ImageFormat | null {
  const b = head;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (b.length >= 8 && png.every((v, i) => b[i] === v)) return "png";
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (b.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

/** The checks that need no decoding: size, declared type, signature. */
export function checkUpload(declared: string, bytes: number, head: Uint8Array): ImageFormat {
  if (!isImageMime(declared)) throw new InvalidRequestError("Upload a JPEG, PNG or WebP photo.", "UNSUPPORTED_TYPE");
  if (bytes <= 0) throw new InvalidRequestError("The file is empty.", "EMPTY_FILE");
  if (bytes > MAX_UPLOAD_BYTES) throw new InvalidRequestError("The photo is larger than 15 MB.", "TOO_LARGE");
  const actual = sniffImage(head);
  if (actual !== IMAGE_TYPES[declared]) {
    throw new InvalidRequestError("The file's contents do not match its type. Upload the original photo.", "SIGNATURE_MISMATCH");
  }
  return actual;
}

export type ProcessedVariant = { key: string; width: number; height: number; format: "webp" | "jpeg"; bytes: number; body: Uint8Array };

export type ProcessedImage = {
  width: number;
  height: number;
  sha256: string;
  format: ImageFormat;
  variants: ProcessedVariant[];
  analysis: { width: number; height: number; body: Uint8Array };
};

/** Decode, clean and resize. `keyFor` names each variant's storage key. */
export async function processImage(
  input: Uint8Array,
  declared: string,
  keyFor: (name: string) => string,
): Promise<ProcessedImage> {
  const format = checkUpload(declared, input.byteLength, input.subarray(0, 16));
  const { default: sharp } = await import("sharp");
  const open = (data: Uint8Array | Buffer) => sharp(data, { failOn: "error", limitInputPixels: MAX_INPUT_PIXELS });

  let meta;
  try {
    meta = await open(input).metadata();
  } catch {
    throw new InvalidRequestError("This file could not be read as a photo.", "UNDECODABLE");
  }
  if (meta.format !== format) throw new InvalidRequestError("The file's contents do not match its type.", "SIGNATURE_MISMATCH");
  if ((meta.pages ?? 1) > 1) throw new InvalidRequestError("Animated images are not supported. Upload a still photo.", "ANIMATED");

  let master: Buffer;
  let info: { width: number; height: number };
  try {
    // rotate() with no angle applies the EXIF orientation; no withMetadata(),
    // so nothing from the original's metadata is written out.
    const out = await open(input)
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .toColourspace("srgb")
      .png()
      .toBuffer({ resolveWithObject: true });
    master = out.data;
    info = out.info;
  } catch {
    throw new InvalidRequestError("This file could not be read as a photo.", "UNDECODABLE");
  }

  const variants: ProcessedVariant[] = [];
  const seen = new Set<number>();
  for (const target of VARIANT_WIDTHS) {
    const out = await sharp(master)
      .resize({ width: target, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
    if (seen.has(out.info.width)) continue; // a small photo yields fewer distinct sizes
    seen.add(out.info.width);
    variants.push({
      key: keyFor(`w${out.info.width}.webp`),
      width: out.info.width,
      height: out.info.height,
      format: "webp",
      bytes: out.data.byteLength,
      body: new Uint8Array(out.data),
    });
  }
  const jpeg = await sharp(master)
    .resize({ width: FALLBACK_WIDTH, withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  variants.push({
    key: keyFor(`w${jpeg.info.width}.jpg`),
    width: jpeg.info.width,
    height: jpeg.info.height,
    format: "jpeg",
    bytes: jpeg.data.byteLength,
    body: new Uint8Array(jpeg.data),
  });

  const raster = await sharp(master)
    .resize({ width: ANALYSIS_WIDTH })
    .flatten({ background: "#ffffff" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    width: info.width,
    height: info.height,
    sha256: createHash("sha256").update(input).digest("hex"),
    format,
    variants,
    analysis: { width: raster.info.width, height: raster.info.height, body: new Uint8Array(raster.data) },
  };
}
