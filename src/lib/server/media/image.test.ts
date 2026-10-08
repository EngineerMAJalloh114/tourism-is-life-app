import assert from "node:assert/strict";
import { describe, it } from "node:test";
import sharp from "sharp";
import { ANALYSIS_WIDTH, MAX_UPLOAD_BYTES, checkUpload, processImage, sniffImage } from "@/lib/server/media/image";

function rejectsCode(code: string) {
  return (err: unknown) => {
    assert.equal((err as { code?: string }).code, code, String(err));
    return true;
  };
}

async function photo(width: number, height: number, format: "jpeg" | "png" | "webp", alpha = false) {
  const img = sharp({ create: { width, height, channels: alpha ? 4 : 3, background: { r: 30, g: 120, b: 90, alpha: alpha ? 0.5 : 1 } } });
  return new Uint8Array(await img[format]().toBuffer());
}

const keyFor = (name: string) => `media/m/f/${name}`;

describe("upload checks", () => {
  it("recognises JPEG, PNG and WebP by their first bytes, and nothing else", async () => {
    assert.equal(sniffImage(await photo(4, 4, "jpeg")), "jpeg");
    assert.equal(sniffImage(await photo(4, 4, "png")), "png");
    assert.equal(sniffImage(await photo(4, 4, "webp")), "webp");
    assert.equal(sniffImage(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>")), null);
    assert.equal(sniffImage(new TextEncoder().encode("GIF89a......")), null);
    assert.equal(sniffImage(new Uint8Array()), null);
  });

  it("refuses an oversize file, a wrong type and a spoofed signature", async () => {
    const png = await photo(4, 4, "png");
    assert.throws(() => checkUpload("image/png", MAX_UPLOAD_BYTES + 1, png), rejectsCode("TOO_LARGE"));
    assert.throws(() => checkUpload("image/gif", 100, png), rejectsCode("UNSUPPORTED_TYPE"));
    assert.throws(() => checkUpload("image/svg+xml", 100, png), rejectsCode("UNSUPPORTED_TYPE"));
    // A PNG renamed and declared as a JPEG.
    assert.throws(() => checkUpload("image/jpeg", png.byteLength, png), rejectsCode("SIGNATURE_MISMATCH"));
    // A script with a JPEG name.
    const script = new TextEncoder().encode("<script>alert(1)</script>");
    assert.throws(() => checkUpload("image/jpeg", script.byteLength, script), rejectsCode("SIGNATURE_MISMATCH"));
    assert.throws(() => checkUpload("image/jpeg", 0, new Uint8Array()), rejectsCode("EMPTY_FILE"));
    assert.equal(checkUpload("image/png", png.byteLength, png), "png");
  });

  it("refuses a file that starts like a JPEG but is not one", async () => {
    const fake = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new TextEncoder().encode("not really a jpeg at all, just bytes")]);
    await assert.rejects(processImage(fake, "image/jpeg", keyFor), rejectsCode("UNDECODABLE"));
  });
});

describe("processing", () => {
  it("makes WebP variants at 480, 960 and 1600, a JPEG fallback, and a raw RGB analysis raster", async () => {
    const out = await processImage(await photo(3000, 2000, "jpeg"), "image/jpeg", keyFor);
    assert.deepEqual([out.width, out.height], [2400, 1600], "longest side capped at 2400");
    assert.deepEqual(
      out.variants.map((v) => [v.key, v.format, v.width, v.height]),
      [
        ["media/m/f/w480.webp", "webp", 480, 320],
        ["media/m/f/w960.webp", "webp", 960, 640],
        ["media/m/f/w1600.webp", "webp", 1600, 1067],
        ["media/m/f/w1600.jpg", "jpeg", 1600, 1067],
      ],
    );
    for (const v of out.variants) {
      const meta = await sharp(v.body).metadata();
      assert.equal(meta.format, v.format);
      assert.equal(meta.width, v.width);
    }
    assert.equal(out.analysis.width, ANALYSIS_WIDTH);
    assert.equal(out.analysis.body.byteLength, out.analysis.width * out.analysis.height * 3, "raw RGB, three bytes a pixel");
    assert.match(out.sha256, /^[0-9a-f]{64}$/);
  });

  it("never enlarges a small photo and does not repeat sizes", async () => {
    const out = await processImage(await photo(600, 400, "png"), "image/png", keyFor);
    assert.deepEqual([out.width, out.height], [600, 400]);
    assert.deepEqual(out.variants.map((v) => `${v.format}:${v.width}`), ["webp:480", "webp:600", "jpeg:600"]);
  });

  it("applies the EXIF orientation and drops every metadata block, including GPS", async () => {
    // 400 x 200 pixels stored, with orientation 6 (shown rotated 90 degrees) and GPS in EXIF.
    const input = await sharp({ create: { width: 400, height: 200, channels: 3, background: "#808080" } })
      .withExif({ IFD0: { Copyright: "someone" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "8/1 29/1 0/1" } })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();
    const before = await sharp(input).metadata();
    assert.equal(before.orientation, 6);
    // EXIF tag 0x8825 points at the GPS block (little-endian in this file).
    assert.ok(before.exif?.includes(Buffer.from([0x25, 0x88])), "the test photo carries a GPS block");
    const out = await processImage(new Uint8Array(input), "image/jpeg", keyFor);
    assert.deepEqual([out.width, out.height], [200, 400], "turned upright");
    for (const v of out.variants) {
      const meta = await sharp(v.body).metadata();
      assert.equal(meta.exif, undefined, `${v.key} has no EXIF (so no GPS)`);
      assert.equal(meta.xmp, undefined, `${v.key} has no XMP`);
      assert.equal(meta.orientation, undefined, `${v.key} needs no orientation flag`);
    }
  });

  it("puts a transparent PNG on white for the JPEG fallback", async () => {
    const out = await processImage(await photo(800, 800, "png", true), "image/png", keyFor);
    const jpeg = out.variants.find((v) => v.format === "jpeg")!;
    const meta = await sharp(jpeg.body).metadata();
    assert.equal(meta.hasAlpha, false);
  });

  it("refuses an animated image", async (t) => {
    let animated: Buffer;
    try {
      const black = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#000" } }).png().toBuffer();
      const white = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#fff" } }).png().toBuffer();
      animated = await sharp([black, white], { join: { animated: true } }).webp().toBuffer();
    } catch {
      t.skip("this sharp build cannot write animated WebP");
      return;
    }
    await assert.rejects(processImage(new Uint8Array(animated), "image/webp", keyFor), rejectsCode("ANIMATED"));
  });
});
