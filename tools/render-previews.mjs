// Рендер PNG-превью всех экранов из design/canvas (по размерам из canvas.json)
// Запуск: node tools/render-previews.mjs  (нужен playwright-core и Chromium)
import { readFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let pw;
for (const p of ['playwright-core', '/opt/node-tools/node_modules/playwright-core']) {
  try { pw = require(p); break; } catch {}
}
if (!pw) throw new Error('Нужен playwright-core: npm i -D playwright-core');

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const canvasDir = path.join(root, 'design/canvas');
const outDir = path.join(root, 'design/previews');
mkdirSync(outDir, { recursive: true });
const canvas = JSON.parse(readFileSync(path.join(canvasDir, 'canvas.json'), 'utf8'));

const launch = { executablePath: process.env.CHROMIUM_PATH || undefined };
if (process.env.HTTPS_PROXY) launch.proxy = { server: process.env.HTTPS_PROXY };
if (!launch.executablePath) {
  const guess = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  try { readFileSync(guess, { flag: 'r' }); launch.executablePath = guess; } catch {}
}
const browser = await pw.chromium.launch({ ...launch, args: ['--ignore-certificate-errors'] });
const only = process.argv.slice(2);
for (const [file, b] of Object.entries(canvas.boards)) {
  if (only.length && !only.some((o) => file.includes(o))) continue;
  const page = await browser.newPage({ viewport: { width: b.w, height: b.h }, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(path.join(canvasDir, file)).href, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const name = file.replace('.dc.html', '.png');
  await page.screenshot({ path: path.join(outDir, name), fullPage: b.h > 900 });
  console.log('✓', name);
  await page.close();
}
await browser.close();
