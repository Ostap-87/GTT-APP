#!/usr/bin/env node
// Рендер объёмных значков вкладок: 6 стилей × 5 вкладок × (активная, неактивная) → design/variants/icons/*.png.
// Запуск: node design/variants/render-icons.mjs (нужны Chromium и Playwright; three.js грузится с jsdelivr).
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(process.env.PW_MODULES || '/opt/node-tools/node_modules/');
const pw = require('playwright-core');
const here = dirname(fileURLToPath(import.meta.url));
const proxy = process.env.HTTPS_PROXY ? [`--proxy-server=${process.env.HTTPS_PROXY}`] : [];
const b = await pw.chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-certificate-errors', ...proxy] });
const p = await b.newPage();
p.on('pageerror', (e) => console.error('page:', e.message));
await p.goto(`file://${join(here, 'icons3d.html')}`);
await p.waitForFunction(() => window.iconsReady === true, null, { timeout: 60000 });
const only = process.argv[2];
for (const v of ['glossy', 'clay', 'glass', 'tiles', 'neon', 'iso']) {
  if (only && only !== v) continue;
  for (const icon of ['today', 'plan', 'library', 'people', 'trip']) {
    for (const on of [true, false]) {
      const url = await p.evaluate(([v, i, o]) => window.renderIcon(v, i, o), [v, icon, on]);
      writeFileSync(join(here, 'icons', `${v}-${icon}-${on ? 'on' : 'off'}.png`), Buffer.from(url.split(',')[1], 'base64'));
    }
  }
  console.log('готово:', v);
}
await b.close();
