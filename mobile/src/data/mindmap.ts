// Майндмэп дня и всей поездки (решение 20.10.2026). Карта дня: день → компании → темы, договорённости, контакты.
// Карта поездки: поездка → главные темы (в каких компаниях звучали) и ветка «Вехи и договорённости» по дням.
// Собирается на телефоне из заметок, рассказа гида и визиток. На шаге 2 сервер с ИИ будет отдавать дерево того же вида
// (MindTree) — экран и PDF менять не придётся.
import type { BizCard } from './card';
import { VISITS } from './group';
import { CITY, DAYS, TRIP, dayEvents } from './trip';
import { keyPoints, sentences } from './summary';
import { THEMES, findDeal, findThemes, snippet, themeOf } from './themes';
import type { VNote } from '@/state/visits';

export type MindLeaf = { text: string; sub?: string; kind?: 'theme' | 'deal' | 'contact' | 'empty' };
export type MindBranch = { key: string; label: string; color: string; leaves: MindLeaf[] };
export type MindTree = { title: string; sub: string; branches: MindBranch[] };
export type MindSource = { visit: string; notes: VNote[]; cards: BizCard[] };

const CO_COLORS = ['#1a73e8', '#e8590c', '#2b8a3e', '#7048e8', '#c2255c', '#0c8599'];
const DEAL_COLOR = '#0f1b2d';

/** В какой день поездки визит (по расписанию). */
export const VISIT_DAY: Record<string, number> = Object.fromEntries(VISITS.map((v) => [v.id, DAYS.findIndex((_, i) => dayEvents(i).some((e) => e.kind === 'co' && e.name === v.name))]));
export const DAYS_WITH_VISITS = DAYS.map((_, i) => i).filter((i) => VISITS.some((v) => VISIT_DAY[v.id] === i));
export const dayLabel = (i: number) => `${DAYS[i].wd}, ${DAYS[i].n} ноября`;
export const visitName = (id: string) => VISITS.find((v) => v.id === id)?.name || id;

const hasText = (n: VNote) => (n.kind === 'text' || n.kind === 'guide') && !!n.text;
export const noteThemes = (n: VNote) => n.tags ?? (hasText(n) ? findThemes(n.text) : []);
export const noteDeal = (n: VNote) => n.deal ?? (hasText(n) && findDeal(n.text));
/** Текст договорённости: короткая заметка целиком, из длинной расшифровки — фраза с договорённостью. */
export const dealText = (n: VNote) => (!n.text || n.text.length < 200 ? n.text || '' : sentences(n.text).find((s) => findDeal(s)) || snippet(n.text, 120));
/** Цитата к теме: фраза заметки, в которой тема прозвучала (или первая фраза). */
function quote(n: VNote, key?: string) {
  if (!n.text) return n.kind === 'voice' ? 'голосовая заметка' : 'фото';
  const th = key ? themeOf(key) : undefined;
  const phrases = n.text.match(/[^.!?]+[.!?]*/g) || [n.text];
  const hit = (th && phrases.find((p) => th.words.test(p.toLowerCase()))) || phrases[0];
  return `${n.kind === 'guide' ? 'Гид: ' : ''}${snippet(hit, 64)}`;
}

/** Темы визита по частоте: сколько заметок и цитата — из первой своей заметки, рассказ гида — если своих нет. */
function visitThemes(notes: VNote[]) {
  const m = new Map<string, { n: number; first: VNote }>();
  for (const note of [...notes].reverse()) { // заметки хранятся новыми вперёд — цитату берём из первой по времени
    for (const k of noteThemes(note)) {
      const cur = m.get(k);
      const better = !cur || (cur.first.kind === 'guide' && note.kind === 'text');
      m.set(k, { n: (cur?.n || 0) + 1, first: better ? note : cur.first });
    }
  }
  return [...m.entries()].sort((a, b) => b[1].n - a[1].n).map(([key, v]) => ({ key, ...v, quote: quote(v.first, key) }));
}

const contactLeaf = (cards: BizCard[]): MindLeaf => ({
  kind: 'contact', text: `Контакты · ${cards.length}`,
  sub: cards.slice(0, 2).map((c) => c.latin || c.name).filter(Boolean).join(', ') + (cards.length > 2 ? '…' : ''),
});

export function dayTree(day: number, src: MindSource[]): MindTree {
  const visits = VISITS.filter((v) => VISIT_DAY[v.id] === day);
  return {
    title: dayLabel(day),
    sub: CITY[day],
    branches: visits.map((v, i) => {
      const s = src.find((x) => x.visit === v.id);
      const notes = s?.notes || [];
      const leaves: MindLeaf[] = visitThemes(notes).slice(0, 4).map((t) => ({ kind: 'theme', text: themeOf(t.key)?.ru || t.key, sub: t.quote }));
      notes.filter(noteDeal).slice(0, 2).forEach((n) => leaves.push({ kind: 'deal', text: 'Договорённость', sub: snippet(dealText(n), 64) }));
      if (s?.cards.length) leaves.push(contactLeaf(s.cards));
      if (!leaves.length) leaves.push({ kind: 'empty', text: notes.length ? 'Заметки без тем' : 'Заметок нет' });
      return { key: v.id, label: v.name, color: CO_COLORS[i % CO_COLORS.length], leaves };
    }),
  };
}

export function tripTree(src: MindSource[]): MindTree {
  const s = tripSummary(src);
  const branches: MindBranch[] = s.themes.slice(0, 6).map((t) => ({
    key: t.key, label: t.ru, color: t.color,
    leaves: t.visits.slice(0, 4).map((v) => ({ kind: 'theme' as const, text: visitName(v.visit), sub: v.quote })),
  }));
  const deals: MindLeaf[] = s.deals.slice(0, 6).map((d) => ({ kind: 'deal', text: `${DAYS[d.day]?.wd || ''} ${DAYS[d.day]?.n || ''} · ${visitName(d.visit)}`.trim(), sub: snippet(d.text, 64) }));
  if (s.contacts) deals.push({ kind: 'contact', text: `Контакты · ${s.contacts}`, sub: `визитки из ${s.contactCompanies} ${s.contactCompanies === 1 ? 'компании' : 'компаний'}` });
  if (deals.length) branches.push({ key: 'deals', label: 'Вехи и договорённости', color: DEAL_COLOR, leaves: deals });
  return { title: TRIP.title, sub: TRIP.dates, branches };
}

/** Главное за день или за поездку — для текста рядом с картой. */
export function tripSummary(src: MindSource[], day?: number) {
  const list = src.filter((s) => day === undefined || VISIT_DAY[s.visit] === day);
  const byTheme = new Map<string, { visit: string; n: number; quote: string }[]>();
  for (const s of list) {
    for (const t of visitThemes(s.notes)) byTheme.set(t.key, [...(byTheme.get(t.key) || []), { visit: s.visit, n: t.n, quote: t.quote }]);
  }
  const themes = THEMES.filter((t) => byTheme.has(t.key))
    .map((t) => ({ ...t, visits: byTheme.get(t.key)!, n: byTheme.get(t.key)!.reduce((a, v) => a + v.n, 0) }))
    .sort((a, b) => b.visits.length - a.visits.length || b.n - a.n);
  const deals = list.flatMap((s) => [...s.notes].reverse().filter(noteDeal).map((n) => ({ visit: s.visit, day: VISIT_DAY[s.visit], text: dealText(n) })))
    .sort((a, b) => a.day - b.day);
  const cards = list.flatMap((s) => s.cards);
  // «Коротко»: главные фразы заметок и расшифровок — бесплатно, на телефоне
  const brief = keyPoints(list.flatMap((s) => [...s.notes].reverse().filter(hasText).map((n) => ({ text: n.text || '', from: s.visit }))), day === undefined ? 7 : 4, day === undefined ? 1 : 2);
  return {
    themes, deals, brief,
    contacts: cards.length,
    contactCompanies: new Set(cards.map((c) => c.visit)).size,
    notes: list.reduce((a, s) => a + s.notes.length, 0),
    visits: list.filter((s) => s.notes.length || s.cards.length).length,
  };
}

// ——— Рисунок: классическая двусторонняя карта (корень в центре, ветки налево и направо) ———

export type MindFonts = { regular: string; semibold: string; bold: string };
/** Для PDF и браузерной печати — системные шрифты. */
export const PRINT_FONTS: MindFonts = { regular: "-apple-system, 'Helvetica Neue', Arial, sans-serif", semibold: "-apple-system, 'Helvetica Neue', Arial, sans-serif", bold: "-apple-system, 'Helvetica Neue', Arial, sans-serif" };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
/** Ширина строки на глаз: у Inter кириллица ≈ 0,58 em, жирная ≈ 0,62 em. */
const tw = (s: string, size: number, bold = false) => s.length * size * (bold ? 0.62 : 0.58);
function wrap(text: string, max: number, lines = 3) {
  const out: string[] = [];
  let cur = '';
  for (const w of text.split(/\s+/)) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= max) cur += ' ' + w;
    else { out.push(cur); cur = w; }
  }
  if (cur) out.push(cur);
  if (out.length > lines) { out.length = lines; out[lines - 1] = out[lines - 1].replace(/[,.;:—-]?$/, '…'); }
  return out;
}

export const MAP_W = 1000;

export function mindSvg(tree: MindTree, fonts: MindFonts) {
  const cx = MAP_W / 2;
  const LEAF_X = 276; // от центра до начала подписи листа
  const LEAF_MAX = MAP_W / 2 - LEAF_X - 14;
  const BR_X = 122; // от центра до ближнего края плашки ветки
  const BR_MAX = LEAF_X - BR_X - 24;

  // корень: заглавные шире строчных — ≈ 0,74 em
  const titleLines = wrap(tree.title.toUpperCase(), 13, 3);
  const rw = Math.min(222, Math.max(150, ...titleLines.map((l) => l.length * 18 * 0.74 + 30), tw(tree.sub, 12) + 30));
  const rh = titleLines.length * 22 + 40;

  // ветки и листья: размеры
  const branches = tree.branches.map((b) => {
    const label = wrap(b.label, Math.floor((BR_MAX - 22) / (13.5 * 0.62)), 3);
    const bw = Math.min(BR_MAX, Math.max(...label.map((l) => tw(l, 13.5, true))) + 24);
    const bh = label.length * 17 + 14;
    const leaves = b.leaves.map((l) => {
      const title = wrap(l.text, Math.floor(LEAF_MAX / (13 * 0.62)), 2);
      const sub = l.sub ? wrap(l.sub, Math.floor(LEAF_MAX / (11.5 * 0.58)), 2) : [];
      const w = Math.min(LEAF_MAX, Math.max(...title.map((t) => tw(t, 13, true)), ...sub.map((t) => tw(t, 11.5)), 40) + 6);
      return { ...l, title, subLines: sub, w, h: title.length * 16 + sub.length * 14 + 14 };
    });
    const leavesH = leaves.reduce((a, l) => a + l.h, 0);
    return { ...b, label, bw, bh, leaves, leavesH, h: Math.max(bh, leavesH) + 16 };
  });

  // стороны: справа сверху вниз, затем слева; уравниваем высоты
  const sides: { right: typeof branches; left: typeof branches } = { right: [], left: [] };
  const sideH = { right: 0, left: 0 };
  branches.forEach((b, i) => {
    const side = i === 0 || sideH.right <= sideH.left ? 'right' : 'left';
    sides[side].push(b);
    sideH[side] += b.h;
  });
  const H = Math.max(sideH.right, sideH.left, rh) + 48;
  const cy = H / 2;

  const parts: string[] = [];
  const text = (x: number, y: number, s: string, size: number, font: string, fill: string, anchor = 'start') =>
    `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" font-family="${font}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`;
  const curve = (x1: number, y1: number, x2: number, y2: number, color: string, width: number) => {
    const xm = (x1 + x2) / 2;
    return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} C${xm.toFixed(1)} ${y1.toFixed(1)}, ${xm.toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
  };

  (['right', 'left'] as const).forEach((side) => {
    const dir = side === 'right' ? 1 : -1;
    let y = cy - sideH[side] / 2;
    for (const b of sides[side]) {
      const by = y + b.h / 2;
      const bxNear = cx + dir * BR_X;
      const bxFar = bxNear + dir * b.bw;
      // ствол от корня к ветке
      parts.push(curve(cx + dir * (rw / 2 - 6), cy, bxNear, by, b.color, 5));
      // листья
      let ly = by - b.leavesH / 2;
      for (const l of b.leaves) {
        const lineY = ly + 7 + l.title.length * 16;
        const x0 = cx + dir * LEAF_X;
        parts.push(curve(bxFar, by, x0, lineY, b.color, 2));
        parts.push(`<path d="M${x0.toFixed(1)} ${lineY.toFixed(1)} H${(x0 + dir * l.w).toFixed(1)}" stroke="${b.color}" stroke-width="2" stroke-linecap="round" opacity="${l.kind === 'empty' ? 0.4 : 1}"/>`);
        const tx = x0 + dir * 3;
        const anchor = dir === 1 ? 'start' : 'end';
        const titleFill = l.kind === 'deal' ? '#a2470a' : l.kind === 'empty' ? '#8a93a3' : '#0f1b2d';
        l.title.forEach((t, k) => parts.push(text(tx, lineY - 5 - (l.title.length - 1 - k) * 16, t, 13, fonts.semibold, titleFill, anchor)));
        l.subLines.forEach((t, k) => parts.push(text(tx, lineY + 14 + k * 14, t, 11.5, fonts.regular, '#5b6576', anchor)));
        ly += l.h;
      }
      // плашка ветки поверх линий
      const rx = Math.min(bxNear, bxFar);
      parts.push(`<rect x="${rx.toFixed(1)}" y="${(by - b.bh / 2).toFixed(1)}" width="${b.bw.toFixed(1)}" height="${b.bh}" rx="${Math.min(14, b.bh / 2)}" fill="${b.color}"/>`);
      b.label.forEach((t, k) => parts.push(text(rx + b.bw / 2, by - (b.label.length - 1) * 8.5 + k * 17 + 5, t, 13.5, fonts.bold, '#ffffff', 'middle')));
      y += b.h;
    }
  });

  // корень поверх стволов
  parts.push(`<rect x="${(cx - rw / 2).toFixed(1)}" y="${(cy - rh / 2).toFixed(1)}" width="${rw.toFixed(1)}" height="${rh}" rx="18" fill="#1a73e8"/>`);
  const ty = cy - rh / 2 + 29;
  titleLines.forEach((t, k) => parts.push(text(cx, ty + k * 22, t, 18, fonts.bold, '#ffffff', 'middle')));
  parts.push(text(cx, ty + titleLines.length * 22 - 1, tree.sub, 12, fonts.regular, '#d6e6ff', 'middle'));

  if (!tree.branches.length) parts.push(text(cx, cy + rh / 2 + 28, 'Добавьте заметки к визитам — карта соберётся из них', 13, fonts.regular, '#5b6576', 'middle'));

  return { xml: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MAP_W} ${H.toFixed(0)}" width="${MAP_W}" height="${H.toFixed(0)}"><rect width="${MAP_W}" height="${H.toFixed(0)}" fill="#ffffff"/>${parts.join('')}</svg>`, h: H };
}
