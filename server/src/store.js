// Хранилище: JSON-файл (демо и пилот). Позже заменяется на PostgreSQL основного сервера — интерфейс тот же.
// Здесь же правила доступа: принимающая сторона видит только свой визит и никогда — телефоны и паспорта.
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'node:fs';
import path from 'node:path';

export const ROLES = ['host', 'colleague'];

export class Store {
  constructor({ dataDir, seedFile }) {
    this.dataDir = dataDir;
    this.file = path.join(dataDir, 'state.json');
    mkdirSync(dataDir, { recursive: true });
    const source = existsSync(this.file) ? this.file : seedFile;
    this.state = JSON.parse(readFileSync(source, 'utf8'));
    for (const key of ['visits', 'invites', 'members', 'orders']) this.state[key] ||= [];
    this.state.subscriptions ||= {};
  }

  save() {
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.state, null, 1));
    renameSync(tmp, this.file);
  }

  visit(id) { return this.state.visits.find((v) => v.id === id) || null; }
  invite(code) { return this.state.invites.find((i) => i.code === code) || null; }
  order(id) { return this.state.orders.find((o) => o.id === id) || null; }
  orderByTradeNo(no) { return this.state.orders.find((o) => o.outTradeNo === no) || null; }

  member(openid, visitId) {
    return this.state.members.find((m) => m.openid === openid && m.visitId === visitId) || null;
  }

  membershipsOf(openid) { return this.state.members.filter((m) => m.openid === openid); }
  membersOf(visitId) { return this.state.members.filter((m) => m.visitId === visitId); }

  // Вход по приглашению. Хозяин визита не теряет роль, если потом откроет ссылку коллеги.
  join(openid, invite) {
    const existing = this.member(openid, invite.visitId);
    if (existing) {
      if (existing.role === 'colleague' && invite.role === 'host') existing.role = 'host';
      return existing;
    }
    const m = { openid, visitId: invite.visitId, role: invite.role, joinedAt: new Date().toISOString(), via: invite.code };
    this.state.members.push(m);
    invite.uses = (invite.uses || 0) + 1;
    return m;
  }

  addInvite(invite) { this.state.invites.push(invite); return invite; }

  // Разовые подписки: одно «разрешаю» в WeChat = одно уведомление.
  grant(openid, templateId) {
    const s = (this.state.subscriptions[openid] ||= {});
    s[templateId] = Math.min((s[templateId] || 0) + 1, 50);
  }

  take(openid, templateId) {
    const s = this.state.subscriptions[openid];
    if (!s || !s[templateId]) return false;
    s[templateId] -= 1;
    return true;
  }

  allowance(openid, templateId) { return this.state.subscriptions[openid]?.[templateId] || 0; }
}

const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));
const PUBLIC_DELEGATE = ['id', 'nameLatin', 'initials', 'roleZh', 'roleEn', 'companyZh', 'companyEn', 'cityZh', 'cityEn', 'industry'];

// То, что видит принимающая сторона. role: host — менеджер визита, colleague — коллега по ссылке «поделиться».
export function visitView(visit, role) {
  const byId = new Map(visit.delegates.map((d) => [d.id, d]));
  const industries = {};
  for (const d of visit.delegates) industries[d.industry] = (industries[d.industry] || 0) + 1;
  const author = (id) => {
    const d = byId.get(id);
    return d ? { zh: `${d.roleZh} · ${d.companyZh}`, en: `${d.roleEn} · ${d.companyEn}` } : null;
  };
  const pending = (visit.proposals || []).filter((p) => p.status === 'pending').at(-1) || null;
  return {
    id: visit.id,
    role,
    trip: pick(visit.trip, ['zh', 'en']),
    company: visit.company,
    date: visit.date,
    start: visit.start,
    end: visit.end,
    status: visit.status,
    proposal: pending && pick(pending, ['date', 'start', 'note', 'createdAt']),
    group: visit.group,
    info: visit.info,
    program: visit.program,
    coordinator: visit.coordinator,
    delegates: visit.delegates.map((d) => pick(d, PUBLIC_DELEGATE)),
    industries,
    questions: visit.questions.map((q) => ({ id: q.id, zh: q.zh, en: q.en, author: author(q.delegateId) })),
    materials: visit.materials.map((m) => pick(m, ['id', 'name', 'sizeMb', 'status'])),
    feedback: visit.feedback,
    requests: visit.requests.map((r) => {
      const d = byId.get(r.delegateId) || {};
      const contact = role === 'host' && r.consent && d.private?.email ? { email: d.private.email } : null;
      return {
        id: r.id,
        nameLatin: d.nameLatin,
        company: { zh: d.cityZh ? `${d.companyZh}（${d.cityZh}）` : d.companyZh, en: d.cityEn ? `${d.companyEn} (${d.cityEn})` : d.companyEn },
        zh: r.zh,
        en: r.en,
        consent: Boolean(r.consent),
        contact,
      };
    }),
    can: {
      confirm: role === 'host',
      proposeTime: role === 'host',
      upload: role === 'host',
      reply: role === 'host',
      share: role === 'host',
      guestList: role === 'host',
    },
  };
}

// Список гостей для охраны: имя латиницей, должность, компания. Паспорта — только через координатора.
export function guestListRows(visit) {
  return [
    ['№', '姓名（护照拼写）/ Name (passport)', '职位 / Position', '公司类型 / Company type'],
    ...visit.delegates.map((d, i) => [String(i + 1), d.nameLatin, `${d.roleZh} / ${d.roleEn}`, `${d.companyZh} / ${d.companyEn}`]),
  ];
}
