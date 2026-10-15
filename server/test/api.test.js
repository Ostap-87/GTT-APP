// Сквозная проверка API на демо-данных: WeChat в режиме mock, бот WeCom — запись в массив.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadConfig } from '../src/config.js';
import { Store } from '../src/store.js';
import { WeChatClient } from '../src/wechat/client.js';
import { createApp } from '../src/app.js';

let base;
let server;
const teamLog = [];
const sent = [];

before(async () => {
  const cfg = loadConfig({ WX_MOCK: '1', DATA_DIR: mkdtempSync(path.join(tmpdir(), 'gtt-mp-')) });
  cfg.templates = {
    departed: { templateId: 'TPL_DEP', page: 'pages/visit/index', fields: { thing1: '{company}', time2: '{eta}' } },
    reschedule: { templateId: '', fields: {} },
  };
  const store = new Store(cfg);
  const wx = new WeChatClient({ ...cfg.wx, mock: true, log: (_, body) => sent.push(body) });
  const bot = { send: async (title, lines) => { teamLog.push([title, lines]); return true; } };
  server = createServer(createApp({ cfg, store, wx, pay: null, bot }));
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const call = async (method, url, { token, body, admin, raw } = {}) => {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (admin) headers['x-admin-token'] = 'dev-admin';
  if (body && !raw) headers['content-type'] = 'application/json';
  const res = await fetch(base + url, { method, headers: raw ? { ...headers, ...raw.headers } : headers, body: raw ? raw.body : body && JSON.stringify(body) });
  const type = res.headers.get('content-type') || '';
  return { status: res.status, data: type.includes('json') ? await res.json() : Buffer.from(await res.arrayBuffer()) };
};

test('без приглашения визита не видно', async () => {
  const { data } = await call('POST', '/api/wx/login', { body: { code: 'stranger' } });
  assert.deepEqual(data.visits, []);
  const r = await call('GET', '/api/wx/visits/jd-1110', { token: data.token });
  assert.equal(r.status, 403);
  assert.equal((await call('GET', '/api/wx/visits/jd-1110')).status, 401);
});

test('менеджер визита: вход по приглашению и все действия', async () => {
  const login = await call('POST', '/api/wx/login', { body: { code: 'host1', invite: 'demoJDhost01' } });
  assert.equal(login.data.joined, 'jd-1110');
  assert.equal(login.data.visits[0].role, 'host');
  const token = login.data.token;

  const v = await call('GET', '/api/wx/visits/jd-1110', { token });
  assert.equal(v.data.company.zh, '京东');
  assert.equal(v.data.can.upload, true);

  const bad = await call('POST', '/api/wx/visits/jd-1110/propose-time', { token, body: { date: '10.11', start: '14:00' } });
  assert.equal(bad.status, 400);
  const prop = await call('POST', '/api/wx/visits/jd-1110/propose-time', { token, body: { date: '2026-11-10', start: '14:00', note: '上午有会议' } });
  assert.equal(prop.data.status, 'time_proposed');
  assert.equal((await call('GET', '/api/wx/visits/jd-1110', { token })).data.proposal.start, '14:00');

  const fd = new FormData();
  fd.append('name', '京东介绍.pdf');
  fd.append('file', new Blob([Buffer.from('%PDF-1.4 test')]), 'tmp_abc.pdf');
  const up = await fetch(`${base}/api/wx/visits/jd-1110/materials`, { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: fd });
  const upData = await up.json();
  assert.equal(up.status, 200, JSON.stringify(upData));
  assert.equal(upData.material.name, '京东介绍.pdf');
  assert.equal(upData.material.status, 'review');

  const exe = new FormData();
  exe.append('file', new Blob([Buffer.from('MZ')]), 'run.exe');
  assert.equal((await fetch(`${base}/api/wx/visits/jd-1110/materials`, { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: exe })).status, 400);

  assert.equal((await call('POST', '/api/wx/visits/jd-1110/replies', { token, body: { requestId: 'r1', text: '欢迎联系我们的采购团队' } })).status, 200);

  const xl = await call('GET', '/api/wx/visits/jd-1110/guest-list.xlsx', { token });
  assert.equal(xl.status, 200);
  assert.equal(xl.data.subarray(0, 2).toString(), 'PK');

  const share = await call('POST', '/api/wx/visits/jd-1110/share', { token, body: {} });
  assert.match(share.data.path, /^\/pages\/visit\/index\?i=/);

  const colleague = await call('POST', '/api/wx/login', { body: { code: 'col1', invite: share.data.code } });
  assert.equal(colleague.data.visits[0].role, 'colleague');
  const cv = await call('GET', '/api/wx/visits/jd-1110', { token: colleague.data.token });
  assert.ok(cv.data.requests.every((r) => r.contact === null));
  assert.equal((await call('GET', '/api/wx/visits/jd-1110/guest-list.xlsx', { token: colleague.data.token })).status, 403);
  assert.equal((await call('POST', '/api/wx/visits/jd-1110/propose-time', { token: colleague.data.token, body: { date: '2026-11-10', start: '15:00' } })).status, 403);

  const titles = teamLog.map(([t]) => t).join(' | ');
  for (const part of ['новый вход', 'просит перенести', 'загрузила материал', 'ответила']) assert.ok(titles.includes(part), part);
});

test('подписка и уведомление «группа выехала»', async () => {
  const { data } = await call('POST', '/api/wx/login', { body: { code: 'host1' } });
  const cfgRes = await call('GET', '/api/wx/config');
  assert.deepEqual(cfgRes.data.templates, { departed: 'TPL_DEP' });
  assert.equal((await call('POST', '/api/wx/subscriptions', { token: data.token, body: { accepted: ['TPL_DEP', 'FAKE'] } })).data.granted, 1);

  sent.length = 0;
  const ev = await call('POST', '/api/admin/visits/jd-1110/events', { admin: true, body: { type: 'departed', eta: '10:25' } });
  assert.equal(ev.data.sent, 1);
  assert.equal(sent[0].template_id, 'TPL_DEP');
  assert.equal(sent[0].data.thing1.value, '京东');
  assert.equal(sent[0].page, 'pages/visit/index?v=jd-1110');
  const again = await call('POST', '/api/admin/visits/jd-1110/events', { admin: true, body: { type: 'departed', eta: '10:30' } });
  assert.equal(again.data.sent, 0, 'разовая подписка расходуется');

  const resched = await call('POST', '/api/admin/visits/jd-1110/events', { admin: true, body: { type: 'reschedule', date: '2026-11-10', start: '14:00' } });
  assert.equal(resched.data.reason, 'шаблон не настроен');
  const v = await call('GET', '/api/wx/visits/jd-1110', { token: data.token });
  assert.equal(v.data.start, '14:00');
  assert.equal(v.data.proposal, null);
});

test('координатор: приглашение, QR, входящие; без токена — отказ', async () => {
  assert.equal((await call('POST', '/api/admin/visits/jd-1110/invites', { body: {} })).status, 401);
  const inv = await call('POST', '/api/admin/visits/jd-1110/invites', { admin: true, body: { role: 'host' } });
  assert.match(inv.data.code, /^[A-Za-z2-9]{12}$/);
  const qr = await call('GET', inv.data.qr, { admin: true });
  assert.equal(qr.data.subarray(1, 4).toString(), 'PNG');
  const inbox = await call('GET', '/api/admin/visits/jd-1110/inbox', { admin: true });
  assert.ok(inbox.data.proposals.length >= 1);
  assert.ok(inbox.data.materials.some((m) => m.status === 'review' && m.file));
  const mid = inbox.data.materials.find((m) => m.file).id;
  const file = await call('GET', `/api/admin/visits/jd-1110/materials/${mid}/file`, { admin: true });
  assert.equal(file.data.toString(), '%PDF-1.4 test');
  await call('POST', `/api/admin/invites/${inv.data.code}/revoke`, { admin: true, body: {} });
  const l = await call('POST', '/api/wx/login', { body: { code: 'late', invite: inv.data.code } });
  assert.equal(l.data.inviteError, 'invite_invalid');
});

test('оплата без торгового счёта выключена', async () => {
  const { data } = await call('POST', '/api/wx/login', { body: { code: 'host1' } });
  const o = await call('GET', '/api/wx/orders/demo-0001', { token: data.token });
  assert.equal(o.data.totalFen, 1);
  assert.equal(o.data.payEnabled, false);
  assert.equal((await call('POST', '/api/wx/orders/demo-0001/pay', { token: data.token, body: {} })).status, 503);
  const stranger = await call('POST', '/api/wx/login', { body: { code: 'nobody' } });
  assert.equal((await call('GET', '/api/wx/orders/demo-0001', { token: stranger.data.token })).status, 404);
});

test('координатор заводит визит и заказ; номера паспортов не принимаются', async () => {
  const base2 = { trip: { zh: '考察团' }, company: { zh: '美团', en: 'Meituan' }, date: '2026-11-10', start: '15:30', end: '17:30',
    program: [], questions: [], materials: [], requests: [],
    delegates: [{ id: 'a', nameLatin: 'Test Person', industry: 'retail', private: { passportNo: '751234567' } }] };
  const bad = await call('PUT', '/api/admin/visits/meituan-1110', { admin: true, body: base2 });
  assert.equal(bad.status, 400);
  assert.match(bad.data.message, /паспорт/);
  base2.delegates[0].private = { phone: '+7 900 000-00-99' };
  const ok = await call('PUT', '/api/admin/visits/meituan-1110', { admin: true, body: base2 });
  assert.deepEqual(ok.data, { ok: true, created: true });
  const inv = await call('POST', '/api/admin/visits/meituan-1110/invites', { admin: true, body: {} });
  const login = await call('POST', '/api/wx/login', { body: { code: 'mt-host', invite: inv.data.code } });
  const v = await call('GET', '/api/wx/visits/meituan-1110', { token: login.data.token });
  assert.equal(v.data.company.en, 'Meituan');
  assert.ok(!JSON.stringify(v.data).includes('+7 900'));
  assert.equal((await call('PUT', '/api/admin/orders/o-1', { admin: true, body: { visitId: 'meituan-1110', totalFen: 0, description: { zh: 'x' } } })).status, 400);
  const order = await call('PUT', '/api/admin/orders/o-1', { admin: true, body: { visitId: 'meituan-1110', totalFen: 100, description: { zh: '订金' } } });
  assert.equal(order.data.path, '/pages/pay/index?o=o-1');
  assert.equal((await call('GET', '/api/wx/orders/o-1', { token: login.data.token })).data.totalFen, 100);
});
