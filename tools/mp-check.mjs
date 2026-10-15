// Проверка мини-программы без WeChat DevTools:
// 1) статика: JSON, наличие файлов страниц и иконок, синтаксис JS, парность тегов WXML, обработчики событий;
// 2) сценарии: страницы запускаются с имитацией wx.* против настоящего сервера (server/, режим WX_MOCK).
// Запуск: node tools/mp-check.mjs
import { readFileSync, existsSync, readdirSync, statSync, mkdtempSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const mp = path.join(root, 'miniprogram');
const require = createRequire(path.join(mp, 'app.js'));
const problems = [];
const ok = (msg) => console.log(`✓ ${msg}`);
// MP_SNAPSHOT_DIR — сохранить состояние страниц для tools/mp-shots.mjs (картинки экранов)
const snapDir = process.env.MP_SNAPSHOT_DIR;
const snap = (name, page) => {
  if (snapDir) writeFileSync(path.join(snapDir, `${name}.json`), JSON.stringify({ route: page.route, data: page.data }));
};

// ——— 1. Статика ———
const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = path.join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const files = walk(mp);
for (const f of files.filter((f) => f.endsWith('.json'))) {
  try { JSON.parse(readFileSync(f, 'utf8')); } catch (e) { problems.push(`JSON ${path.relative(root, f)}: ${e.message}`); }
}
for (const f of files.filter((f) => f.endsWith('.js'))) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); } catch (e) { problems.push(`JS ${path.relative(root, f)}: ${e.stderr}`); }
}
const app = JSON.parse(readFileSync(path.join(mp, 'app.json'), 'utf8'));
for (const page of app.pages) {
  for (const ext of ['js', 'json', 'wxml', 'wxss']) {
    if (!existsSync(path.join(mp, `${page}.${ext}`))) problems.push(`нет файла ${page}.${ext}`);
  }
}
for (const item of app.tabBar.list) {
  for (const k of ['iconPath', 'selectedIconPath']) if (item[k] && !existsSync(path.join(mp, item[k]))) problems.push(`нет иконки ${item[k]}`);
  if (!app.pages.includes(item.pagePath)) problems.push(`вкладка ${item.pagePath} не в pages`);
}

// Глобальные объекты мини-программы
let appDef = null;
let lastPage = null;
globalThis.App = (def) => { appDef = def; };
globalThis.Page = (def) => { lastPage = def; };
globalThis.getApp = () => appDef;

const pageDefs = {};
for (const page of app.pages) {
  lastPage = null;
  require(path.join(mp, `${page}.js`));
  pageDefs[page] = lastPage;
  const wxml = readFileSync(path.join(mp, `${page}.wxml`), 'utf8');
  const stack = [];
  for (const m of wxml.matchAll(/<(\/?)([a-zA-Z][\w-]*)((?:[^>"]|"[^"]*")*?)(\/?)>/g)) {
    const [, close, tag, , self] = m;
    if (self) continue;
    if (!close) stack.push(tag);
    else if (stack.pop() !== tag) { problems.push(`${page}.wxml: непарный тег </${tag}>`); break; }
  }
  if (stack.length) problems.push(`${page}.wxml: не закрыты ${stack.join(', ')}`);
  for (const m of wxml.matchAll(/bind\w+="(\w+)"/g)) {
    if (typeof lastPage[m[1]] !== 'function') problems.push(`${page}.wxml: нет обработчика ${m[1]}`);
  }
  if (wxml.includes('open-type="share"') && typeof lastPage.onShareAppMessage !== 'function') problems.push(`${page}: нет onShareAppMessage`);
  for (const m of wxml.matchAll(/src="(\/[^"{}]+)"/g)) if (!existsSync(path.join(mp, m[1]))) problems.push(`${page}.wxml: нет файла ${m[1]}`);
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
ok(`статика: ${app.pages.length} страниц, JSON, JS, WXML, обработчики, иконки`);

// ——— 2. Сценарии против сервера ———
const dataDir = mkdtempSync(path.join(tmpdir(), 'mp-check-'));
const tplFile = path.join(dataDir, 'tpl.json');
writeFileSync(tplFile, JSON.stringify({ departed: { templateId: 'TPL_DEP', fields: { thing1: '{company}' } } }));
const { loadConfig } = await import(path.join(root, 'server/src/config.js'));
const { Store } = await import(path.join(root, 'server/src/store.js'));
const { WeChatClient } = await import(path.join(root, 'server/src/wechat/client.js'));
const { createApp } = await import(path.join(root, 'server/src/app.js'));
const cfg = loadConfig({ WX_MOCK: '1', DATA_DIR: dataDir, WX_TEMPLATES_FILE: tplFile });
const server = createServer(createApp({ cfg, store: new Store(cfg), wx: new WeChatClient({ ...cfg.wx, mock: true }), pay: null, bot: { send: async () => true } }));
await new Promise((r) => server.listen(0, r));
const config = require(path.join(mp, 'config.js'));
config.API_BASE = `http://127.0.0.1:${server.address().port}`;

let user = 'host1';
let pending = 0;
const calls = [];
const storage = new Map();
const later = (fn) => { pending += 1; setTimeout(() => { try { fn(); } finally { pending -= 1; } }, 1); };
const track = async (promise, ok2, fail) => {
  pending += 1;
  try { ok2(await promise); } catch (e) { fail(e); } finally { pending -= 1; }
};
const tmpFiles = new Map();

globalThis.wx = {
  login: ({ success }) => later(() => success({ code: user })),
  request: ({ url, method = 'GET', data, header = {}, success, fail }) => track((async () => {
    const init = { method, headers: { ...header } };
    if (data !== undefined && method !== 'GET') { init.body = JSON.stringify(data); init.headers['content-type'] = 'application/json'; }
    const res = await fetch(url, init);
    const text = await res.text();
    let body = text;
    try { body = JSON.parse(text); } catch {}
    return { statusCode: res.status, data: body };
  })(), success, (e) => fail && fail({ errMsg: e.message })),
  uploadFile: ({ url, filePath, name, formData = {}, header = {}, success, fail }) => track((async () => {
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
    fd.append(name, new Blob([readFileSync(filePath)]), path.basename(filePath));
    const res = await fetch(url, { method: 'POST', headers: header, body: fd });
    return { statusCode: res.status, data: await res.text() };
  })(), success, (e) => fail && fail({ errMsg: e.message })),
  downloadFile: ({ url, header = {}, success, fail }) => track((async () => {
    const res = await fetch(url, { headers: header });
    const buf = Buffer.from(await res.arrayBuffer());
    const p = path.join(dataDir, `dl-${Date.now()}`);
    writeFileSync(p, buf);
    tmpFiles.set(p, buf);
    return { statusCode: res.status, tempFilePath: p };
  })(), success, (e) => fail && fail({ errMsg: e.message })),
  openDocument: (o) => { calls.push(['openDocument', o]); later(() => o.success && o.success({})); },
  chooseMessageFile: ({ success }) => {
    const p = path.join(dataDir, 'tmp_upload.pdf');
    writeFileSync(p, '%PDF-1.4 demo');
    later(() => success({ tempFiles: [{ path: p, name: '京东物流介绍.pdf', size: 13 }] }));
  },
  requestSubscribeMessage: ({ tmplIds, success }) => later(() => success(Object.fromEntries(tmplIds.map((id) => [id, 'accept'])))),
  requestPayment: (o) => later(() => o.fail({ errMsg: 'requestPayment:fail cancel' })),
  showModal: (o) => { calls.push(['showModal', o]); later(() => o.success && o.success({ confirm: false })); },
  showToast: (o) => calls.push(['showToast', o]),
  setClipboardData: (o) => { calls.push(['setClipboardData', o]); later(() => o.success && o.success()); },
  getStorageSync: (k) => storage.get(k) || '',
  setStorageSync: (k, v) => storage.set(k, v),
  setTabBarItem: () => {},
  hideShareMenu: () => calls.push(['hideShareMenu']),
  stopPullDownRefresh: () => {},
  makePhoneCall: () => {},
  getAppBaseInfo: () => ({ language: 'zh_CN' }),
};

const settle = async () => {
  for (let i = 0; i < 400; i++) {
    await new Promise((r) => setTimeout(r, 5));
    if (pending === 0) { await new Promise((r) => setTimeout(r, 10)); if (pending === 0) return; }
  }
  throw new Error('операции не завершились');
};

require(path.join(mp, 'app.js'));
const freshApp = (launchQuery) => {
  appDef.globalData = { lang: 'zh', invite: null, lastInvite: null, visitId: null, visit: null, visits: [], token: null, config: null, share: null, sessionReady: false };
  storage.clear();
  appDef.onLaunch({ query: launchQuery || {} });
};
const setPath = (obj, key, value) => {
  const parts = key.split('.');
  let o = obj;
  parts.slice(0, -1).forEach((p) => { o = o[p]; });
  o[parts.at(-1)] = value;
};
const open = async (route, query = {}) => {
  const def = pageDefs[route];
  const page = { data: structuredClone(def.data), route };
  page.setData = (patch, cb) => { Object.entries(patch).forEach(([k, v]) => setPath(page.data, k, v)); if (cb) cb(); };
  for (const [k, v] of Object.entries(def)) if (typeof v === 'function') page[k] = v.bind(page);
  if (page.onLoad) page.onLoad(query);
  if (page.onShow) page.onShow();
  await settle();
  return page;
};

try {
  // Менеджер визита открывает QR-код с приглашением
  freshApp({ scene: encodeURIComponent('demoJDhost01') });
  const visit = await open('pages/visit/index');
  assert.equal(visit.data.error, '', visit.data.error);
  assert.equal(visit.data.v.trip, '俄罗斯零售考察团');
  assert.match(visit.data.v.when, /^京东 · 11月10日（周二）10:30–12:30$/);
  assert.equal(visit.data.v.group.title, '代表团已出发');
  assert.equal(visit.data.v.canPropose, true);
  assert.equal(visit.data.canSubscribe, true);
  snap('1-visit', visit);
  ok('вход по QR-приглашению, обзор визита на китайском');

  visit.subscribe();
  await settle();
  assert.equal(visit.data.subscribed, true);
  ok('подписка на уведомления');

  visit.openSheet();
  visit.onTime({ detail: { value: '14:00' } });
  visit.onNote({ detail: { value: '上午有内部会议' } });
  snap('5-visit-sheet', visit);
  visit.submitProposal();
  await settle();
  assert.match(visit.data.v.proposal, /14:00/);
  assert.equal(visit.data.v.statusText, '已提议新时间');
  ok('предложение другого времени');

  visit.setEn();
  await settle();
  assert.equal(visit.data.v.trip, 'Russian Retail Delegation');
  assert.match(visit.data.v.when, /^JD\.com · Tue, Nov 10/);
  snap('6-visit-en', visit);
  visit.setZh();
  await settle();
  ok('переключение 中文 / EN');

  const share = visit.onShareAppMessage();
  assert.match(share.path, /^\/pages\/visit\/index\?i=[A-Za-z2-9]{12}$/);
  ok('карточка «поделиться» с отдельным кодом для коллег');

  const deleg = await open('pages/delegation/index');
  assert.equal(deleg.data.people.length, 18);
  assert.equal(deleg.data.title, '代表团 · 18 人');
  snap('2-delegation', deleg);
  deleg.setFilter({ currentTarget: { dataset: { key: 'retail' } } });
  assert.equal(deleg.data.people.length, 9);
  deleg.downloadList();
  await settle();
  const doc = calls.filter((c) => c[0] === 'openDocument').at(-1)[1];
  assert.equal(doc.fileType, 'xlsx');
  assert.equal(tmpFiles.get(doc.filePath).subarray(0, 2).toString(), 'PK');
  ok('делегация, фильтр по отраслям, список для охраны в Excel');

  const prep = await open('pages/prep/index');
  assert.equal(prep.data.questions.length, 7);
  assert.equal(prep.data.materials.length, 1);
  prep.upload();
  await settle();
  assert.equal(prep.data.materials.length, 2);
  assert.equal(prep.data.materials[1].name, '京东物流介绍.pdf');
  assert.equal(prep.data.materials[1].statusText, '协调人审核中');
  snap('3-prep', prep);
  ok('вопросы на китайском, загрузка материала на проверку');

  const after = await open('pages/after/index');
  snap('4-after', after);
  assert.equal(after.data.rating.avg, 4.8);
  assert.equal(after.data.requests.length, 3);
  after.showContact({ currentTarget: { dataset: { id: 'r1' } } });
  assert.equal(calls.filter((c) => c[0] === 'showModal').at(-1)[1].content, 'anna.smirnova@example.com');
  assert.equal(after.data.requests[2].contact, null);
  after.openReply();
  after.onTarget({ detail: { value: '1' } });
  after.onText({ detail: { value: '欢迎联系我们的自有品牌团队' } });
  after.sendReply();
  await settle();
  assert.equal(calls.filter((c) => c[0] === 'showToast').at(-1)[1].title, '已发送给协调人');
  ok('после визита: оценка, контакты с согласия, ответ через координатора');

  const pay = await open('pages/pay/index', { o: 'demo-0001' });
  assert.equal(pay.data.order.amount, '0.01');
  assert.equal(pay.data.order.payEnabled, false);
  snap('7-pay', pay);
  ok('страница оплаты (без торгового счёта кнопка выключена)');

  // Коллега открывает карточку, которую переслал менеджер
  freshApp({ i: share.path.split('i=')[1] });
  user = 'colleague1';
  const cv = await open('pages/visit/index');
  assert.equal(cv.data.v.canPropose, false);
  assert.equal(cv.data.v.canShare, false);
  const ca = await open('pages/after/index');
  assert.ok(ca.data.requests.every((r) => !r.contact));
  const cd = await open('pages/delegation/index');
  assert.equal(cd.data.canGuestList, false);
  ok('коллега по ссылке: только просмотр, без контактов и списка для охраны');

  // Человек без приглашения
  freshApp({});
  user = 'stranger';
  const sv = await open('pages/visit/index');
  assert.equal(sv.data.error, '请通过协调人发送的邀请链接或小程序码打开');
  snap('8-no-invite', sv);
  ok('без приглашения — понятное сообщение');
} finally {
  server.close();
}
console.log('Все проверки мини-программы пройдены');
