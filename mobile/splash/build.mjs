// Сборка заставки в одну HTML-страницу без внешних файлов: three + сцена (esbuild), шрифт букв GTT вшит в страницу.
// Запуск: npm run splash → src/splash/splash-html.ts. Шрифт — Sofia Sans Extra Condensed 800 (OFL), только буквы G и T:
// pyftsubset …/SofiaSansExtraCondensed_800ExtraBold.ttf --text="GT" --output-file=splash/sofia-800-GT.ttf
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const res = await build({ entryPoints: [join(here, 'scene.js')], bundle: true, format: 'iife', minify: true, target: 'es2020', write: false, legalComments: 'none' });
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const font = readFileSync(join(here, 'sofia-800-GT.ttf')).toString('base64');
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"><style>
@font-face{font-family:"Sofia Sans Extra Condensed";font-weight:800;src:url(data:font/ttf;base64,${font}) format("truetype")}
html,body{margin:0;height:100%;overflow:hidden;background:radial-gradient(110% 70% at 50% 45%,#fff 0%,#f1f6ff 55%,#e3edfd 100%);-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
canvas{position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none}
#labels{position:fixed;inset:0;pointer-events:none}
.lbl{position:absolute;transform:translate(-50%,-130%);font:600 10.5px/1 -apple-system,system-ui,"Segoe UI",Roboto,sans-serif;padding:4px 7px;border-radius:8px;white-space:nowrap;transition:opacity .4s;background:#fff;color:#1558b8;box-shadow:0 4px 12px -4px rgba(26,115,232,.45)}
</style></head><body><canvas id="cv"></canvas><div id="labels"></div>
<script>window.GTT_SPLASH=/*CFG*/{}/*CFG*/;</script><script>${js}</script></body></html>`;
writeFileSync(join(here, '../src/splash/splash-html.ts'), `// Сгенерировано splash/build.mjs (npm run splash) — руками не править, правки — в splash/scene.js.\n// eslint-disable-next-line\nexport const SPLASH_HTML = ${JSON.stringify(html)};\n`);
console.log(`splash-html.ts: ${(html.length / 1024).toFixed(0)} КБ`);
