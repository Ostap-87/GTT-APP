// HTTP API мини-программы. Без фреймворков: маленький роутер на node:http.
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { signSession, verifySession, inviteCode, safeEqual } from './auth.js';
import { visitView, guestListRows } from './store.js';
import { xlsx } from './xlsx.js';
import { notifyVisitMembers, teamMessages } from './events.js';
import { createNearby, rateLimiter } from './amap/index.js';
import { AmapError } from './amap/client.js';

export class HttpError extends Error {
  constructor(status, code, message) { super(message || code); this.status = status; this.code = code; }
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function send(res, status, body, headers = {}) {
  if (Buffer.isBuffer(body)) {
    res.writeHead(status, { 'content-length': body.length, ...headers });
    return res.end(body);
  }
  const text = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(text), ...headers });
  res.end(text);
}

async function readBody(req, limitBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limitBytes) throw new HttpError(413, 'too_large', 'Файл или запрос слишком большой');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function parseMultipart(buf, contentType) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  if (!m) throw new HttpError(400, 'bad_multipart');
  const boundary = Buffer.from(`--${(m[1] || m[2]).trim()}`);
  const parts = [];
  let pos = buf.indexOf(boundary);
  while (pos !== -1) {
    pos += boundary.length;
    if (buf[pos] === 0x2d && buf[pos + 1] === 0x2d) break;
    pos += 2;
    const headerEnd = buf.indexOf('\r\n\r\n', pos);
    if (headerEnd === -1) break;
    const headers = buf.subarray(pos, headerEnd).toString('utf8');
    const next = buf.indexOf(boundary, headerEnd + 4);
    if (next === -1) break;
    const disp = /content-disposition:[^\r\n]*?\bname="([^"]*)"(?:;\s*filename="([^"]*)")?/i.exec(headers);
    parts.push({ name: disp?.[1], filename: disp?.[2], data: buf.subarray(headerEnd + 4, next - 2) });
    pos = next;
  }
  return parts;
}

export function validateVisit(v) {
  const errors = [];
  const need = (cond, msg) => { if (!cond) errors.push(msg); };
  const isText = (o) => o && typeof o.zh === 'string' && o.zh.length > 0;
  need(/^[a-z0-9-]{3,40}$/.test(v.id || ''), 'id: латиница, цифры, дефис');
  need(isText(v.company), 'company.zh');
  need(isText(v.trip), 'trip.zh');
  need(DATE.test(v.date || ''), 'date: YYYY-MM-DD');
  need(TIME.test(v.start || '') && TIME.test(v.end || ''), 'start, end: HH:MM');
  for (const key of ['program', 'delegates', 'questions', 'materials', 'requests']) need(Array.isArray(v[key]), `${key}: массив`);
  if (errors.length) return errors;
  const ids = new Set(v.delegates.map((d) => d.id));
  need(ids.size === v.delegates.length && v.delegates.every((d) => d.id && d.nameLatin && d.industry), 'delegates: id, nameLatin, industry у каждого');
  need(v.questions.every((q) => q.zh && (!q.delegateId || ids.has(q.delegateId))), 'questions: zh и существующий delegateId');
  need(v.requests.every((r) => r.id && r.zh && ids.has(r.delegateId)), 'requests: id, zh и существующий delegateId');
  need(v.delegates.every((d) => !d.private?.passportNo || d.private.passportNo.startsWith('[')), 'номера паспортов на этот сервер не передаём');
  return errors;
}

const ALLOWED_EXT = ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'mp4', 'mov'];
const cleanName = (name) => String(name || 'file').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(-120);

export function createApp({ cfg, store, wx, pay, bot, nearby, log = () => {} }) {
  nearby ||= createNearby({ key: cfg.amap?.key, mt: { ...cfg.mt, cacheFile: path.join(cfg.dataDir, 'mt-cache.json') }, log });
  const routes = [];
  const route = (method, pattern, body, handler) => {
    const keys = [];
    const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })}$`);
    routes.push({ method, re, keys, body, handler });
  };
  const team = (msg) => bot.send(...msg).catch((err) => log('wecom', err.message));

  const session = (req) => {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const openid = verifySession(cfg.sessionSecret, token);
    if (!openid) throw new HttpError(401, 'login_required', 'Нужно войти заново');
    return openid;
  };
  const memberOf = (req, visitId, needHost = false) => {
    const openid = session(req);
    const visit = store.visit(visitId);
    const m = visit && store.member(openid, visitId);
    if (!m) throw new HttpError(403, 'not_member', 'Нет доступа к этому визиту');
    if (needHost && m.role !== 'host') throw new HttpError(403, 'host_only', 'Действие доступно менеджеру визита');
    return { openid, visit, member: m };
  };
  const admin = (req) => {
    if (!safeEqual(req.headers['x-admin-token'], cfg.adminToken)) throw new HttpError(401, 'admin_only');
  };
  const visitOr404 = (id) => {
    const v = store.visit(id);
    if (!v) throw new HttpError(404, 'no_visit');
    return v;
  };

  // ——— Мини-программа ———

  route('GET', '/api/health', null, () => ({ ok: true }));

  route('GET', '/api/wx/config', null, () => ({
    payEnabled: cfg.pay.enabled,
    templates: Object.fromEntries(Object.entries(cfg.templates).filter(([k, t]) => !k.startsWith('_') && t.templateId).map(([k, t]) => [k, t.templateId])),
  }));

  route('POST', '/api/wx/login', 'json', async ({ body }) => {
    const { openid } = await wx.code2session(body.code);
    let joined = null;
    let inviteError = null;
    if (body.invite) {
      const inv = store.invite(String(body.invite));
      if (!inv || inv.revoked) inviteError = 'invite_invalid';
      else {
        const isNew = !store.member(openid, inv.visitId);
        const m = store.join(openid, inv);
        joined = inv.visitId;
        store.save();
        if (isNew) team(teamMessages.joined(store.visit(inv.visitId), m));
      }
    }
    const visits = store.membershipsOf(openid).map((m) => {
      const v = store.visit(m.visitId);
      return v && { id: v.id, role: m.role, company: v.company, date: v.date, start: v.start };
    }).filter(Boolean).sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
    return { token: signSession(cfg.sessionSecret, openid, cfg.sessionTtlDays), visits, joined, inviteError };
  });

  route('GET', '/api/wx/visits/:id', null, ({ req, params }) => {
    const { visit, member } = memberOf(req, params.id);
    return visitView(visit, member.role);
  });

  route('POST', '/api/wx/visits/:id/confirm', 'json', ({ req, params }) => {
    const { visit } = memberOf(req, params.id, true);
    visit.status = 'confirmed';
    store.save();
    team(teamMessages.confirmed(visit));
    return { status: visit.status };
  });

  route('POST', '/api/wx/visits/:id/propose-time', 'json', ({ req, params, body }) => {
    const { visit, openid } = memberOf(req, params.id, true);
    if (!DATE.test(body.date || '') || !TIME.test(body.start || '')) throw new HttpError(400, 'bad_time', 'Неверная дата или время');
    const proposal = { date: body.date, start: body.start, note: String(body.note || '').slice(0, 300), status: 'pending', by: openid, createdAt: new Date().toISOString() };
    (visit.proposals ||= []).forEach((p) => { if (p.status === 'pending') p.status = 'replaced'; });
    visit.proposals.push(proposal);
    visit.status = 'time_proposed';
    store.save();
    team(teamMessages.proposed(visit, proposal));
    return { status: visit.status, proposal };
  });

  route('POST', '/api/wx/visits/:id/materials', 'multipart', ({ req, params, parts }) => {
    const { visit, openid } = memberOf(req, params.id, true);
    const file = parts.find((p) => p.name === 'file' && p.data.length);
    if (!file) throw new HttpError(400, 'no_file', 'Файл не получен');
    const given = parts.find((p) => p.name === 'name')?.data.toString('utf8');
    const name = cleanName(given || file.filename);
    const ext = name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) throw new HttpError(400, 'bad_type', `Можно: ${ALLOWED_EXT.join(', ')}`);
    const id = `m${Date.now().toString(36)}`;
    const dir = path.join(cfg.dataDir, 'uploads', visit.id);
    mkdirSync(dir, { recursive: true });
    const stored = `${id}.${ext}`;
    writeFileSync(path.join(dir, stored), file.data);
    const material = { id, name, sizeMb: Math.max(0.1, Math.round(file.data.length / 1e5) / 10), status: 'review', file: stored, by: openid, createdAt: new Date().toISOString() };
    visit.materials.push(material);
    store.save();
    team(teamMessages.uploaded(visit, material));
    return { material: { id, name, sizeMb: material.sizeMb, status: material.status } };
  });

  route('POST', '/api/wx/visits/:id/replies', 'json', ({ req, params, body }) => {
    const { visit, openid } = memberOf(req, params.id, true);
    const text = String(body.text || '').trim().slice(0, 1000);
    if (!text) throw new HttpError(400, 'empty', 'Пустой ответ');
    const request = body.requestId ? visit.requests.find((r) => r.id === body.requestId) : null;
    const reply = { requestId: request?.id || null, text, by: openid, createdAt: new Date().toISOString() };
    (visit.replies ||= []).push(reply);
    store.save();
    team(teamMessages.replied(visit, reply, request));
    return { ok: true };
  });

  // Ссылка «поделиться» для коллег: роль colleague, без контактов и списка для охраны.
  route('POST', '/api/wx/visits/:id/share', 'json', ({ req, params }) => {
    const { visit, openid } = memberOf(req, params.id, true);
    let inv = store.state.invites.find((i) => i.visitId === visit.id && i.role === 'colleague' && i.createdBy === openid && !i.revoked);
    if (!inv) {
      inv = store.addInvite({ code: inviteCode(), visitId: visit.id, role: 'colleague', createdBy: openid, createdAt: new Date().toISOString() });
      store.save();
    }
    return { code: inv.code, path: `/pages/visit/index?i=${inv.code}` };
  });

  route('GET', '/api/wx/visits/:id/guest-list.xlsx', null, ({ req, params }) => {
    const { visit } = memberOf(req, params.id, true);
    return xlsx(guestListRows(visit), '访客名单');
  });

  route('POST', '/api/wx/subscriptions', 'json', ({ req, body }) => {
    const openid = session(req);
    const known = new Set(Object.values(cfg.templates).map((t) => t?.templateId).filter(Boolean));
    const accepted = (Array.isArray(body.accepted) ? body.accepted : []).filter((id) => known.has(id));
    accepted.forEach((id) => store.grant(openid, id));
    store.save();
    return { granted: accepted.length };
  });

  route('GET', '/api/wx/orders/:id', null, ({ req, params }) => {
    const openid = session(req);
    const order = store.order(params.id);
    if (!order || !store.member(openid, order.visitId)) throw new HttpError(404, 'no_order');
    return { id: order.id, description: order.description, totalFen: order.totalFen, status: order.status, payEnabled: cfg.pay.enabled };
  });

  route('POST', '/api/wx/orders/:id/pay', 'json', async ({ req, params }) => {
    const openid = session(req);
    const order = store.order(params.id);
    if (!order || !store.member(openid, order.visitId)) throw new HttpError(404, 'no_order');
    if (order.status === 'paid') throw new HttpError(409, 'already_paid', 'Уже оплачено');
    if (!cfg.pay.enabled || !pay) throw new HttpError(503, 'pay_disabled', '支付暂未开通');
    order.outTradeNo = `${order.id}-${Date.now().toString(36)}`.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32);
    order.status = 'paying';
    order.payer = openid;
    store.save();
    const params2 = await pay.jsapi({ outTradeNo: order.outTradeNo, description: order.description.zh, totalFen: order.totalFen, openid });
    return { payment: params2 };
  });

  route('POST', '/api/wx/pay/notify', 'raw', ({ req, raw, res }) => {
    if (!pay) throw new HttpError(503, 'pay_disabled');
    const parsed = pay.parseNotify(req.headers, raw.toString('utf8'));
    if (!parsed) {
      send(res, 401, { code: 'FAIL', message: 'signature' });
      return undefined;
    }
    const t = parsed.transaction;
    const order = store.orderByTradeNo(t.out_trade_no);
    if (order && t.trade_state === 'SUCCESS' && order.status !== 'paid') {
      order.status = 'paid';
      order.transactionId = t.transaction_id;
      order.paidAt = t.success_time;
      store.save();
      team(teamMessages.paid(order, t));
    }
    send(res, 204);
    return undefined;
  });

  // ——— Координатор (заголовок x-admin-token) ———

  // Завести или обновить визит целиком (формат — как в data/demo.json). Переносы, ответы и загруженные
  // компанией файлы сохраняются.
  route('PUT', '/api/admin/visits/:id', 'json', ({ req, params, body }) => {
    admin(req);
    const visit = { ...body, id: params.id };
    const errors = validateVisit(visit);
    if (errors.length) throw new HttpError(400, 'bad_visit', errors.join('; '));
    const old = store.visit(params.id);
    if (old) {
      visit.proposals = old.proposals || [];
      visit.replies = old.replies || [];
      const ids = new Set(visit.materials.map((m) => m.id));
      visit.materials = visit.materials.concat(old.materials.filter((m) => m.file && !ids.has(m.id)));
      store.state.visits[store.state.visits.indexOf(old)] = visit;
    } else {
      visit.proposals = [];
      visit.replies = [];
      store.state.visits.push(visit);
    }
    store.save();
    return { ok: true, created: !old };
  });

  route('PUT', '/api/admin/orders/:id', 'json', ({ req, params, body }) => {
    admin(req);
    visitOr404(body.visitId);
    const totalFen = Number(body.totalFen);
    if (!Number.isInteger(totalFen) || totalFen <= 0 || !body.description?.zh) throw new HttpError(400, 'bad_order', 'Нужны visitId, description.zh и totalFen (целое, в фэнях)');
    const old = store.order(params.id);
    if (old?.status === 'paid') throw new HttpError(409, 'already_paid');
    const order = { id: params.id, visitId: body.visitId, description: body.description, totalFen, status: 'created' };
    if (old) Object.assign(old, order); else store.state.orders.push(order);
    store.save();
    return { ok: true, path: `/pages/pay/index?o=${encodeURIComponent(params.id)}` };
  });

  route('POST', '/api/admin/visits/:id/invites', 'json', ({ req, params, body }) => {
    admin(req);
    const visit = visitOr404(params.id);
    const role = body.role === 'colleague' ? 'colleague' : 'host';
    const inv = store.addInvite({ code: inviteCode(), visitId: visit.id, role, createdBy: 'admin', createdAt: new Date().toISOString() });
    store.save();
    return { code: inv.code, path: `/pages/visit/index?i=${inv.code}`, qr: `/api/admin/invites/${inv.code}/qr.png` };
  });

  route('POST', '/api/admin/invites/:code/revoke', 'json', ({ req, params }) => {
    admin(req);
    const inv = store.invite(params.code);
    if (!inv) throw new HttpError(404, 'no_invite');
    inv.revoked = true;
    store.save();
    return { ok: true };
  });

  route('GET', '/api/admin/invites/:code/qr.png', null, async ({ req, params }) => {
    admin(req);
    if (!store.invite(params.code)) throw new HttpError(404, 'no_invite');
    return wx.inviteQr({ scene: params.code });
  });

  route('GET', '/api/admin/visits/:id/inbox', null, ({ req, params }) => {
    admin(req);
    const v = visitOr404(params.id);
    return {
      status: v.status,
      proposals: v.proposals || [],
      replies: v.replies || [],
      materials: v.materials,
      members: store.membersOf(v.id).map((m) => ({ role: m.role, joinedAt: m.joinedAt })),
    };
  });

  route('POST', '/api/admin/visits/:id/materials/:mid/publish', 'json', ({ req, params }) => {
    admin(req);
    const m = visitOr404(params.id).materials.find((x) => x.id === params.mid);
    if (!m) throw new HttpError(404, 'no_material');
    m.status = 'published';
    store.save();
    return { ok: true };
  });

  route('GET', '/api/admin/visits/:id/materials/:mid/file', null, ({ req, params }) => {
    admin(req);
    const v = visitOr404(params.id);
    const m = v.materials.find((x) => x.id === params.mid);
    const file = m?.file && path.join(cfg.dataDir, 'uploads', v.id, m.file);
    if (!file || !existsSync(file)) throw new HttpError(404, 'no_file');
    return readFileSync(file);
  });

  // События визита: группа выехала, перенос, новый запрос. Обновляют визит и рассылают подписочные уведомления.
  route('POST', '/api/admin/visits/:id/events', 'json', async ({ req, params, body }) => {
    admin(req);
    const visit = visitOr404(params.id);
    const company = visit.company.zh;
    let vars;
    if (body.type === 'departed') {
      if (!TIME.test(body.eta || '')) throw new HttpError(400, 'bad_eta');
      visit.group = { state: 'departed', eta: body.eta };
      vars = { company, eta: `${visit.date} ${body.eta}`, note: body.note || '代表团已出发' };
    } else if (body.type === 'reschedule') {
      if (!DATE.test(body.date || '') || !TIME.test(body.start || '')) throw new HttpError(400, 'bad_time');
      Object.assign(visit, { date: body.date, start: body.start, end: TIME.test(body.end || '') ? body.end : visit.end, status: 'confirmed' });
      (visit.proposals || []).forEach((p) => { if (p.status === 'pending') p.status = 'accepted'; });
      vars = { company, newTime: `${body.date} ${body.start}`, note: body.note || '访问时间已更新' };
    } else if (body.type === 'request') {
      vars = { title: body.title || '代表团的新请求', summary: body.summary || '请在小程序中查看' };
    } else {
      throw new HttpError(400, 'bad_type', 'type: departed | reschedule | request');
    }
    store.save();
    const result = await notifyVisitMembers({ store, wx, templates: cfg.templates, log }, visit, body.type, vars);
    return { ok: true, ...result };
  });

  // ——— Приложение: «Рядом» — аптеки и фруктовые лавки по Amap, уже на языке делегата (src/amap/README.md) ———

  const nearbyLimit = rateLimiter({ limit: cfg.amap?.ratePerMin || 30 });
  const cors = (res) => {
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('access-control-allow-headers', 'x-app-token');
    res.setHeader('access-control-allow-methods', 'GET, OPTIONS');
  };
  route('OPTIONS', '/api/nearby', null, ({ res }) => { cors(res); return {}; });
  route('GET', '/api/nearby', null, async ({ req, res, query }) => {
    cors(res);
    if (cfg.amap?.appToken && !safeEqual(req.headers['x-app-token'], cfg.amap.appToken)) throw new HttpError(401, 'app_token');
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;
    if (!nearbyLimit(ip)) throw new HttpError(429, 'too_many', 'Слишком много запросов — попробуйте через минуту');
    try {
      return await nearby.search({
        kind: query.get('kind') || 'pharmacy',
        lat: Number(query.get('lat')),
        lng: Number(query.get('lng')),
        coord: query.get('coord') === 'gcj02' ? 'gcj02' : 'wgs84',
        radius: Number(query.get('radius')) || 1500,
        lang: query.get('lang') || 'ru',
      });
    } catch (err) {
      if (['bad_kind', 'bad_location', 'out_of_china'].includes(err.code)) throw new HttpError(400, err.code, err.message);
      if (err instanceof AmapError || err.name === 'TimeoutError') {
        log('amap', err.message);
        throw new HttpError(502, 'amap_unavailable', 'Карты Amap сейчас не ответили — откройте поиск в Amap');
      }
      throw err;
    }
  });

  return async function handle(req, res) {
    const url = new URL(req.url, 'http://local');
    const r = routes.find((x) => x.method === req.method && x.re.test(url.pathname));
    try {
      if (!r) throw new HttpError(404, 'not_found');
      const match = r.re.exec(url.pathname);
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]));
      const ctx = { req, res, params, query: url.searchParams };
      if (r.body === 'json') {
        const raw = await readBody(req, 1e6);
        try { ctx.body = raw.length ? JSON.parse(raw.toString('utf8')) : {}; } catch { throw new HttpError(400, 'bad_json'); }
      } else if (r.body === 'multipart') {
        ctx.parts = parseMultipart(await readBody(req, cfg.maxUploadMb * 1e6), req.headers['content-type']);
      } else if (r.body === 'raw') {
        ctx.raw = await readBody(req, 1e6);
      }
      const out = await r.handler(ctx);
      if (res.headersSent) return;
      if (Buffer.isBuffer(out)) {
        const type = url.pathname.endsWith('.xlsx') ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : url.pathname.endsWith('.png') ? 'image/png' : 'application/octet-stream';
        send(res, 200, out, { 'content-type': type });
      } else {
        send(res, 200, out);
      }
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status === 500) log('error', req.method, url.pathname, err.stack || err.message);
      if (!res.headersSent) send(res, status, { error: err.code || 'server_error', message: status === 500 ? 'Ошибка сервера' : err.message });
    }
  };
}
