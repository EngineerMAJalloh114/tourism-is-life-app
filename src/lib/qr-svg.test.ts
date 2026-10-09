import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import { Ecc, QrCode } from "@/lib/vendor/qrcodegen";
import { qrSvg } from "./qr-svg.ts";

function fingerprint(text: string) {
  const c = QrCode.encodeText(text, Ecc.MEDIUM);
  let bits = "";
  for (let y = 0; y < c.size; y += 1) for (let x = 0; x < c.size; x += 1) bits += c.getModule(x, y) ? "1" : "0";
  return { size: c.size, mask: c.mask, sha: createHash("sha256").update(bits).digest("hex") };
}

describe("vendored QR encoder", () => {
  // Fingerprints taken from the unmodified upstream file compiled with tsc
  // (8 October 2026). If these change, the adaptation changed the algorithm.
  it("matches the upstream output for a short text", () => {
    assert.deepEqual(fingerprint("HELLO WORLD"), {
      size: 21,
      mask: 0,
      sha: "98ee3af8dfb46e027fa18006e4cb5079826d9b1aeeec68886f356578867c468c",
    });
  });

  it("matches the upstream output for an authenticator URI", () => {
    assert.deepEqual(
      fingerprint("otpauth://totp/Tourism%20Is%20Life:owner%40example.test?secret=JBSWY3DPEHPK3PXP&issuer=Tourism%20Is%20Life"),
      { size: 41, mask: 3, sha: "542c03e02b0554e393c3d14d0439ac4ffa54e81929e6dfded1851412b9abfcb3" },
    );
  });

  it("draws an SVG path with a 4-module quiet zone", () => {
    const svg = qrSvg("HELLO WORLD");
    assert.equal(svg.size, 21);
    assert.equal(svg.viewBox, "0 0 29 29");
    assert.match(svg.path, /^M4,4h1v1h-1z/); // top-left finder pattern corner
  });
});
