import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const outDir = "C:\\Users\\MOHAMED ABASS JALLOH\\Documents\\tourism_is_life_final_web\\tourism-is-life-app\\screenshots";
mkdirSync(outDir, { recursive: true });

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
];

async function main() {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const results = {};

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
    page.on("pageerror", (err) => pageErrors.push(String(err?.message || err)));

    await page.goto("http://localhost:8080/services/vehicle-rental", { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(1500);

    const title = await page.title();
    const bodyText = await page.locator("body").innerText().catch(() => "");
    const hasCanvas = (await page.locator("canvas").count()) > 0;
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

    await page.screenshot({ path: `${outDir}/vehicle-rental-${vp.name}.png`, fullPage: false });
    await page.close();

    results[vp.name] = {
      width: vp.width,
      height: vp.height,
      status: 200,
      title,
      bodyTextLen: bodyText.length,
      hasCanvas,
      horizontalOverflow,
      consoleErrors,
      pageErrors,
      screenshot: `${outDir}/vehicle-rental-${vp.name}.png`,
    };
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => { console.error(err); process.exit(1); });
