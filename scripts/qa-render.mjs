#!/usr/bin/env node
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const outDir = resolve("C:\\workspace\\screenshots");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
const errors = [];

page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
});
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

const url = process.argv[2] || "http://127.0.0.1:8080/";
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

const bodyText = (await page.locator("body").innerText()).trim();
const html = await page.content();

const desktopShot = resolve(outDir, "app-builder-preview.png");
const mobileShot = resolve(outDir, "app-builder-preview-mobile.png");

await page.setViewportSize({ width: 1280, height: 800 });
await page.screenshot({ path: desktopShot, fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: mobileShot, fullPage: true });

await browser.close();

const verdict = {
  ok: errors.length === 0 && bodyText.length > 0,
  url,
  bodyTextLength: bodyText.length,
  bodyTextPrefix: bodyText.slice(0, 200),
  errors,
  desktopShot,
  mobileShot,
  htmlLength: html.length,
};

console.log(JSON.stringify(verdict, null, 2));
process.exit(verdict.ok ? 0 : 1);