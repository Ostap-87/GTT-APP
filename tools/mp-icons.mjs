// Иконки мини-программы (PNG) из тех же SVG, что в макетах: вкладки 81×81 серые и синие, значки.
// Запуск: node tools/mp-icons.mjs
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
let pw;
for (const p of ['playwright-core', '/opt/node-tools/node_modules/playwright-core']) { try { pw = require(p); break; } catch {} }
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = (p) => path.join(root, 'miniprogram/assets', p);

const ICONS = {
  visit: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  delegation: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
  prep: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/>',
  after: '<path d="M4 5h16v11H9l-5 4z"/>',
  bus: '<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M8 21v-3M16 21v-3"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
};
const svg = (body, color, size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

const jobs = [];
for (const name of ['visit', 'delegation', 'prep', 'after']) {
  jobs.push([out(`tab/${name}.png`), svg(ICONS[name], '#5b6576', 81)]);
  jobs.push([out(`tab/${name}-on.png`), svg(ICONS[name], '#1a73e8', 81)]);
}
jobs.push([out('icons/bus.png'), svg(ICONS.bus, '#0f1b2d', 96)]);
jobs.push([out('icons/lock.png'), svg(ICONS.lock, '#1558b8', 72)]);

const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();
for (const [file, markup] of jobs) {
  await page.setContent(`<html><body style="margin:0;background:transparent">${markup}</body></html>`);
  await page.locator('svg').screenshot({ path: file, omitBackground: true });
  console.log('✓', path.relative(root, file));
}
await browser.close();
