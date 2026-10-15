// Картинки экранов мини-программы из её настоящего кода: WXML + WXSS + данные страниц из сценариев mp-check.
// Это приближение (WeChat рисует сам), но разметка, тексты и стили — те же, что уйдут в WeChat.
// Запуск: node tools/mp-shots.mjs → design/previews/miniprogram/*.png и design/previews/_мини-программа.jpg
import { readFileSync, mkdtempSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const mp = path.join(root, 'miniprogram');
const outDir = path.join(root, 'design/previews/miniprogram');
mkdirSync(outDir, { recursive: true });
const require = createRequire(import.meta.url);
let pw;
for (const p of ['playwright-core', '/opt/node-tools/node_modules/playwright-core']) { try { pw = require(p); break; } catch {} }

const snaps = mkdtempSync(path.join(tmpdir(), 'mp-snap-'));
execFileSync(process.execPath, [path.join(root, 'tools/mp-check.mjs')], { env: { ...process.env, MP_SNAPSHOT_DIR: snaps }, stdio: 'inherit' });
const app = JSON.parse(readFileSync(path.join(mp, 'app.json'), 'utf8'));

// ——— WXML → дерево ———
function parse(src) {
  const rootNode = { tag: '#root', attrs: {}, children: [] };
  const stack = [rootNode];
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w-]*)((?:[^>"]|"[^"]*")*?)(\/?)>|([^<]+)/g;
  for (const m of src.matchAll(re)) {
    if (m[0].startsWith('<!--')) continue;
    if (m[5] !== undefined) {
      if (m[5].trim()) stack.at(-1).children.push({ text: m[5] });
      continue;
    }
    const [, close, tag, attrText, self] = m;
    if (close) { stack.pop(); continue; }
    const attrs = {};
    for (const a of attrText.matchAll(/([\w:.-]+)(?:="([^"]*)")?/g)) attrs[a[1]] = a[2] ?? 'true';
    const node = { tag, attrs, children: [] };
    stack.at(-1).children.push(node);
    if (!self) stack.push(node);
  }
  return rootNode;
}

// ——— вычисление {{…}} ———
const evalExpr = (expr, scope) => {
  try { return new Function('s', `with (s) { return (${expr}); }`)(scope); } catch { return ''; }
};
const interp = (text, scope) => {
  const whole = /^\s*\{\{((?:(?!\}\})[\s\S])+)\}\}\s*$/.exec(text);
  if (whole) return evalExpr(whole[1], scope);
  return text.replace(/\{\{([\s\S]+?)\}\}/g, (_, e) => { const v = evalExpr(e, scope); return v == null ? '' : String(v); });
};
const dataUri = (p) => `data:image/png;base64,${readFileSync(path.join(mp, p.replace(/^\//, ''))).toString('base64')}`;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TAGS = { view: 'div', text: 'span', button: 'button', image: 'img', picker: 'div', 'scroll-view': 'div', textarea: 'textarea', block: null };

function render(nodes, scope) {
  let html = '';
  let chain = null; // для wx:elif / wx:else
  for (const n of nodes) {
    if (n.text !== undefined) { html += esc(interp(n.text, scope)); continue; }
    const a = n.attrs;
    if ('wx:if' in a) { chain = Boolean(interp(a['wx:if'], scope)); if (!chain) continue; }
    else if ('wx:elif' in a) { if (chain) continue; chain = Boolean(interp(a['wx:elif'], scope)); if (!chain) continue; }
    else if ('wx:else' in a) { if (chain) continue; chain = null; }
    else chain = null;
    if ('wx:for' in a) {
      const list = interp(a['wx:for'], scope) || [];
      const name = a['wx:for-item'] || 'item';
      html += list.map((item, index) => renderNode(n, Object.assign(Object.create(scope), { [name]: item, index }), true)).join('');
      continue;
    }
    html += renderNode(n, scope, false);
  }
  return html;
}

function renderNode(n, scope) {
  const tag = TAGS[n.tag] === undefined ? 'div' : TAGS[n.tag];
  const inner = render(n.children, scope);
  if (tag === null) return inner;
  const attrs = [];
  for (const [k, v] of Object.entries(n.attrs)) {
    if (k.startsWith('wx:') || k.startsWith('bind') || k.startsWith('data-')) continue;
    const val = interp(v, scope);
    if (k === 'class' || k === 'style') attrs.push(`${k}="${esc(val)}"`);
    else if (k === 'src') attrs.push(`src="${dataUri(String(val))}"`);
    else if (k === 'placeholder' && n.tag === 'textarea') attrs.push(`placeholder="${esc(val)}"`);
    else if (k === 'disabled' && val === true) attrs.push('disabled');
  }
  if (n.tag === 'scroll-view') attrs.push('data-scroll="x"');
  if (n.tag === 'textarea') return `<textarea ${attrs.join(' ')}>${esc(interp(n.attrs.value || '', scope))}</textarea>`;
  if (tag === 'img') return `<img ${attrs.join(' ')}>`;
  return `<${tag} data-wx="${n.tag}" ${attrs.join(' ')}>${inner}</${tag}>`;
}

const rpx = (css) => css.replace(/(-?\d*\.?\d+)rpx/g, (_, n) => `${(Number(n) * 390 / 750).toFixed(2)}px`).replace(/(^|\})\s*page\s*\{/g, '$1 .wx-page {');
const appCss = rpx(readFileSync(path.join(mp, 'app.wxss'), 'utf8'));
const tabIcon = (p) => dataUri(p);

function frame(route, data) {
  const wxml = readFileSync(path.join(mp, `${route}.wxml`), 'utf8');
  const css = rpx(readFileSync(path.join(mp, `${route}.wxss`), 'utf8'));
  const body = render(parse(wxml).children, data);
  const tabIndex = app.tabBar.list.findIndex((t) => t.pagePath === route);
  const tabs = tabIndex === -1 ? '' : `<div class="tabbar">${app.tabBar.list.map((t, i) => `
    <div class="tab ${i === tabIndex ? 'on' : ''}"><img src="${tabIcon(i === tabIndex ? t.selectedIconPath : t.iconPath)}"><span>${esc((data.L && data.L.tabs && data.L.tabs[i]) || t.text)}</span></div>`).join('')}</div>`;
  const title = JSON.parse(readFileSync(path.join(mp, `${route}.json`), 'utf8')).navigationBarTitleText || app.window.navigationBarTitleText;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin: 0; width: 390px; font-family: -apple-system, 'PingFang SC', 'Noto Sans SC', 'WenQuanYi Zen Hei', sans-serif; }
    .wx-page, .shell { background: #f4f6fa; }
    .shell { min-height: 844px; display: flex; flex-direction: column; }
    .status { height: 47px; background: #fff; display: flex; align-items: flex-end; justify-content: space-between; padding: 0 28px 6px; font: 600 15px -apple-system, sans-serif; box-sizing: border-box; }
    .nav { height: 44px; background: #fff; display: flex; align-items: center; justify-content: center; position: relative; font-size: 17px; font-weight: 600; }
    .capsule { position: absolute; right: 7px; top: 6px; width: 87px; height: 32px; border-radius: 16px; border: 1px solid #e3e7ef; box-sizing: border-box; display: flex; align-items: center; justify-content: space-around; font-size: 14px; color: #0f1b2d; }
    .content { flex: 1; position: relative; }
    .tabbar { display: grid; grid-template-columns: repeat(4, 1fr); background: #fff; border-top: 1px solid #eef1f6; padding: 6px 0 30px; }
    .tab { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 10px; color: #5b6576; }
    .tab img { width: 24px; height: 24px; } .tab.on { color: #1a73e8; }
    div, span, button, textarea { box-sizing: border-box; }
    button { display: block; border: 0; font-family: inherit; cursor: pointer; }
    [data-scroll=x] { display: flex; overflow: hidden; white-space: nowrap; }
    .mask, .sheet { position: absolute !important; }
    ${appCss}
    ${css}
  </style></head><body><div class="shell wx-page">
    <div class="status"><span>9:41</span><span>●●● ▮</span></div>
    <div class="nav">${esc(title)}<div class="capsule"><span>•••</span><span>◎</span></div></div>
    <div class="content">${body}</div>${tabs}
  </div></body></html>`;
}

const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const shots = [];
for (const file of readdirSync(snaps).filter((f) => f.endsWith('.json')).sort()) {
  const { route, data } = JSON.parse(readFileSync(path.join(snaps, file), 'utf8'));
  await page.setContent(frame(route, data), { waitUntil: 'load' });
  const out = path.join(outDir, file.replace('.json', '.png'));
  await page.screenshot({ path: out, fullPage: true });
  shots.push(out);
  console.log('✓', path.relative(root, out));
}
await browser.close();

// Лист-обзор: 4 вкладки + английская версия + перенос времени + оплата
const sheet = path.join(root, 'design/previews/_мини-программа.jpg');
execFileSync('python3', ['-I', '-c', `
import sys
from PIL import Image, ImageDraw, ImageFont
files = sys.argv[2:]
names = ['1 · 概览 Обзор', '2 · 代表团 Делегация', '3 · 问题与资料 Вопросы', '4 · 访问后 После визита', '5 · Перенос времени', '6 · English', '7 · 微信支付 Оплата', '8 · Без приглашения']
H = 900
tiles = []
for f in files:
    im = Image.open(f).convert('RGB')
    im = im.crop((0, 0, im.width, min(im.height, 1688)))
    tiles.append(im.resize((round(im.width * H / im.height), H), Image.LANCZOS))
font = lambda s: ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', s)
W = 48 * 2 + sum(t.width for t in tiles) + 32 * (len(tiles) - 1)
out = Image.new('RGB', (W, 150 + H + 48), '#eef1f6')
d = ImageDraw.Draw(out)
d.text((48, 36), 'Мини-программа WeChat · страница визита для принимающей стороны', fill='#0f1b2d', font=font(44))
x = 48
for t, n in zip(tiles, names):
    d.text((x, 104), n, fill='#5b6576', font=font(24))
    out.paste(t, (x, 150))
    d.rectangle((x - 1, 149, x + t.width, 150 + H), outline='#d5dbe6')
    x += t.width + 32
out.save(sys.argv[1], quality=86)
print(sys.argv[1], out.size)
`, sheet, ...shots.filter((s) => existsSync(s))]);
console.log('✓ design/previews/_мини-программа.jpg');
