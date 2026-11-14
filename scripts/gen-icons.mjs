// Génère les PNG de l'app à partir de public/icons/icon.svg (via Chromium/Playwright)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); // Playwright global ou local
import { readFile } from 'node:fs/promises';

const svg = await readFile(new URL('../public/icons/icon.svg', import.meta.url), 'utf8');
const out = (f) => new URL(`../public/icons/${f}`, import.meta.url).pathname;
const browser = await chromium.launch();
const page = await browser.newPage();

// padding = zone de sécurité pour l'icône "maskable"
const jobs = [
  ['icon-192.png', 192, 0], ['icon-512.png', 512, 0],
  ['maskable-512.png', 512, 0.12], ['apple-touch-icon.png', 180, 0], ['favicon-32.png', 32, 0]
];
for (const [file, size, pad] of jobs) {
  await page.setViewportSize({ width: size, height: size });
  const inner = Math.round(size * (1 - pad * 2));
  await page.setContent(`<body style="margin:0;background:#0a0f2c;display:grid;place-items:center;width:${size}px;height:${size}px">
    <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div></body>`);
  await page.screenshot({ path: out(file), omitBackground: false });
}
await browser.close();
console.log('icônes générées');
