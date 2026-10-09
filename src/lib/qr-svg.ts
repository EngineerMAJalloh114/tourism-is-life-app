/**
 * Draw a QR code as one SVG path, entirely in the browser (no third-party QR
 * service ever sees the two-factor secret). Uses the vendored encoder.
 */
import { Ecc, QrCode } from "@/lib/vendor/qrcodegen";

export type QrSvg = { size: number; path: string; viewBox: string };

/** `border` is the quiet zone in modules (4 is the standard minimum). */
export function qrSvg(text: string, border = 4): QrSvg {
  const qr = QrCode.encodeText(text, Ecc.MEDIUM);
  const parts: string[] = [];
  for (let y = 0; y < qr.size; y += 1) {
    for (let x = 0; x < qr.size; x += 1) {
      if (qr.getModule(x, y)) parts.push(`M${x + border},${y + border}h1v1h-1z`);
    }
  }
  const total = qr.size + border * 2;
  return { size: qr.size, path: parts.join(""), viewBox: `0 0 ${total} ${total}` };
}
