/**
 * Vehicle Rental image sourcing — download candidates from Pexels/Pixabay,
 * optimize to local WebP assets in public/images/vehicles/.
 * Run once: node scripts/download-vehicle-images.mjs
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import sharp from "sharp";

const ROOT = process.cwd();
const TMP = `${ROOT}/.vehicle-img-tmp`;
const OUT = `${ROOT}/public/images/vehicles`;
mkdirSync(TMP, { recursive: true });
mkdirSync(OUT, { recursive: true });

/** [outName, pexelsId | url, width] — width = source request width (px) */
const CANDIDATES = [
  // Economy
  ["economy-corolla-beachfront", "37620310", 1600],
  ["economy-elantra-city", "32911906", 1600],
  ["sedan-camry-parked", "11285174", 1600],
  // Sedan
  ["sedan-camry-highway", "28688908", 1600],
  ["sedan-white-desert", "32422135", 1600],
  // SUV
  ["suv-land-cruiser-coast", "18847999", 1600],
  ["suv-rav4-mountains", "2036544", 1600],
  ["suv-coastal-family", "33431510", 1600],
  ["suv-desert-road", "2994133", 1600],
  // 4x4
  ["4x4-hilux-mud-trail", "9355994", 1600],
  ["4x4-suv-dirt-road", "13381210", 1600],
  ["4x4-desert-dunes", "20584984", 1600],
  // Van
  ["van-airport-minivan", "39075475", 1600],
  ["van-passenger-office", "35831379", 1600],
  ["van-hiace-street", "19548262", 1600],
  // Minibus
  ["minibus-rural-road", "31374505", 1600],
  ["minibus-group-boarding", "33693159", 1600],
  // Luxury
  ["luxury-eclass-white", "17233279", 1600],
  ["luxury-sclass-office", "12274363", 1600],
  ["luxury-chauffeur-umbrella", "8425052", 1600],
  ["luxury-black-city", "17300902", 1600],
  ["luxury-interior-red", "10358205", 1600],
  // Bus
  ["bus-luxury-coach-blue", "29586609", 1600],
  ["bus-coaches-row", "12202915", 1600],
  ["bus-coaches-parked", "18029643", 1600],
  // Hero candidates (wider)
  ["hero-safari-savannah", "16444274", 1920],
  ["hero-safari-kenya-road", "36298870", 1920],
];

const PIXABAY = [
  // Scania touring coach — Pixabay (direct large image URL)
  ["bus-touring-coach", "https://pixabay.com/get/g5ae252fc9b40e94cf81420ad3b877671b111c467f82c94f9d8937384d51acc0834d90dc81c879bc7cbe76cab07632f997c94b08446eb66f5d3ccd5f109ee4207_1280.jpg"],
];

function pexelsUrl(id, w) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
}

async function download(url, file) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(file, buf);
  return buf.length;
}

async function toWebp(src, out, width, quality) {
  const img = sharp(src).rotate(); // respect EXIF orientation
  const meta = await img.metadata();
  const pipeline = meta.width && meta.width > width
    ? sharp(src).rotate().resize({ width })
    : sharp(src).rotate();
  await pipeline.webp({ quality, effort: 5 }).toFile(out);
  const outMeta = await sharp(out).metadata();
  return { w: outMeta.width, h: outMeta.height };
}

async function main() {
  const report = [];
  for (const [name, idOrUrl, w] of CANDIDATES) {
    const url = idOrUrl.startsWith("http") ? idOrUrl : pexelsUrl(idOrUrl, w ?? 1600);
    const src = `${TMP}/${name}-src.jpg`;
    try {
      if (!existsSync(src)) {
        const bytes = await download(url, src);
        if (bytes < 20000) throw new Error(`suspiciously small (${bytes}B)`);
      }
      const maxW = w ?? 1600;
      const quality = maxW > 1600 ? 78 : 82;
      const dims = await toWebp(src, `${OUT}/${name}.webp`, maxW, quality);
      report.push({ name, ok: true, ...dims });
    } catch (err) {
      report.push({ name, ok: false, error: String(err.message || err) });
    }
  }
  for (const [name, url] of PIXABAY) {
    const src = `${TMP}/${name}-src.jpg`;
    try {
      if (!existsSync(src)) {
        const bytes = await download(url, src);
        if (bytes < 20000) throw new Error(`suspiciously small (${bytes}B)`);
      }
      const dims = await toWebp(src, `${OUT}/${name}.webp`, 1280, 82);
      report.push({ name, ok: true, source: "pixabay", ...dims });
    } catch (err) {
      report.push({ name, ok: false, source: "pixabay", error: String(err.message || err) });
    }
  }
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
