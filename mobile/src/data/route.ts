// Интерактивный маршрут для делегатов (решение 21.10.2026): города, как едем между ними, что в каждом городе.
// Схема без границ — города стоят примерно по географии; точная карта — Amap в приложении (шаг 2).
// Данные — из тестовой поездки (trip.ts); на шаге 2 придут с сервера из «Центра поездки».
import { VISITS } from './group';
import { CULTURE, DAYS, HOTELS, WEATHER, dayEvents } from './trip';

export type Stop = { key: string; ru: string; zh: string; x: number; y: number; days: number[]; hotel?: string; side: 'left' | 'right' };
export type Leg = { from: string; to: string; how: 'plane' | 'train'; day: number; time: string; note: string };

export const MOSCOW = { key: 'moscow', ru: 'Москва', zh: '莫斯科', x: 34, y: 40 };

/** Города по порядку; x, y — точки на схеме 360 × 430 (север сверху). */
export const STOPS: Stop[] = [
  { key: 'beijing', ru: 'Пекин', zh: '北京', x: 196, y: 104, days: [0, 1], hotel: 'beijing', side: 'right' },
  { key: 'shanghai', ru: 'Шанхай', zh: '上海', x: 318, y: 238, days: [2, 3], hotel: 'shanghai', side: 'left' },
  { key: 'hangzhou', ru: 'Ханчжоу', zh: '杭州', x: 270, y: 282, days: [4], side: 'left' },
  { key: 'shenzhen', ru: 'Шэньчжэнь', zh: '深圳', x: 176, y: 384, days: [5], hotel: 'shenzhen', side: 'left' },
];

/** Переезды — по расписанию поездки (события «move»). */
export const LEGS: Leg[] = [
  { from: 'moscow', to: 'beijing', how: 'plane', day: 0, time: 'прилёт 14:00', note: 'Перелёт из Москвы, трансфер в отель' },
  { from: 'beijing', to: 'shanghai', how: 'plane', day: 2, time: '07:40', note: 'Перелёт, сбор в лобби в 05:45' },
  { from: 'shanghai', to: 'hangzhou', how: 'train', day: 4, time: '08:30', note: 'Скоростной поезд' },
  { from: 'hangzhou', to: 'shenzhen', how: 'plane', day: 4, time: '18:00', note: 'Перелёт вечером, заезд в отель около 21:00' },
  { from: 'shenzhen', to: 'moscow', how: 'plane', day: 5, time: '18:00', note: 'Итоги и вылет домой' },
];

export const pointOf = (key: string) => (key === 'moscow' ? MOSCOW : STOPS.find((s) => s.key === key)!);
export const dayShort = (i: number) => `${DAYS[i].wd} ${DAYS[i].n}`;
export const stopDays = (s: Stop) => (s.days.length > 1 ? `${dayShort(s.days[0])} – ${dayShort(s.days[s.days.length - 1])} ноября` : `${dayShort(s.days[0])} ноября`);

/** Что в городе: компании, культура, отель, погода, как уезжаем. */
export function stopInfo(s: Stop) {
  const events = s.days.flatMap((d) => dayEvents(d).map((e) => ({ ...e, day: d })));
  return {
    visits: events.filter((e) => e.kind === 'co').map((e) => ({ day: e.day, t: e.t, name: e.name, place: e.place, id: VISITS.find((v) => v.name === e.name)?.id })),
    culture: events.filter((e) => e.kind === 'culture').map((e) => ({ day: e.day, t: e.t, name: e.name, id: e.ref && CULTURE[e.ref] ? e.ref : undefined })),
    hotel: s.hotel ? { key: s.hotel, ...HOTELS[s.hotel] } : undefined,
    weather: s.days.map((d) => WEATHER[d]),
    next: LEGS.find((l) => l.from === s.key),
    arrive: LEGS.find((l) => l.to === s.key),
  };
}

export const ROUTE_TEXT = ['Москва', ...STOPS.map((s) => s.ru), 'Москва'].join(' → ');
export const ROUTE_STATS = { cities: STOPS.length, days: DAYS.length, visits: VISITS.length };

/** Подписи Пекина и Шанхая чуть выше точки — под ними проходят линии переездов. */
const LABEL_DY: Record<string, number> = { beijing: -16, shanghai: -10 };
const PLANE = 'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z';

/** Схема маршрута. shown — сколько переездов уже «проехали» (для проигрывания), sel — выбранный город. */
export function routeSvg(shown: number, sel: string | undefined, font: { regular: string; bold: string }) {
  const W = 360, H = 430;
  const dots: string[] = [];
  for (let y = 14; y < H; y += 18) for (let x = 12 + ((y / 18) % 2) * 9; x < W; x += 18) dots.push(`<circle cx="${x}" cy="${y}" r="1.3" fill="#d6dfee"/>`);
  const legs = LEGS.map((l, i) => {
    const a = pointOf(l.from), b = pointOf(l.to);
    const done = i < shown;
    // дуга: самолёт — выше и пунктиром, поезд — прямее и сплошной
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const bend = l.how === 'plane' ? Math.min(60, len * 0.28) : len * 0.08;
    const cx = mx + (dy / len) * bend * (l.to === 'moscow' ? -1 : 1), cy = my - (dx / len) * bend * (l.to === 'moscow' ? -1 : 1);
    const color = done ? '#1a73e8' : '#c3cad6';
    const dash = l.how === 'plane' ? ' stroke-dasharray="7 6"' : '';
    // самолётик в середине дуги, носом по направлению
    const px = 0.25 * a.x + 0.5 * cx + 0.25 * b.x, py = 0.25 * a.y + 0.5 * cy + 0.25 * b.y;
    const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 90;
    const icon = l.how === 'plane'
      ? `<g transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${ang.toFixed(0)}) scale(0.8) translate(-12 -12)"><path d="${PLANE}" fill="${color}"/></g>`
      : `<rect x="${(px - 9).toFixed(1)}" y="${(py - 7).toFixed(1)}" width="18" height="14" rx="4" fill="${color}"/><path d="M${(px - 5).toFixed(1)} ${(py + 1).toFixed(1)}h10" stroke="#fff" stroke-width="2"/>`;
    return `<path d="M${a.x} ${a.y} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x} ${b.y}" fill="none" stroke="${color}" stroke-width="${l.how === 'train' ? 4 : 3}" stroke-linecap="round"${dash}/>${icon}`;
  }).join('');
  const reached = new Set(LEGS.slice(0, shown).map((l) => l.to));
  const stops = STOPS.map((s, i) => {
    const on = sel === s.key;
    const lit = reached.has(s.key) || shown >= LEGS.length;
    const fill = lit ? '#1a73e8' : '#9aa6b8';
    const left = s.side === 'left';
    const tx = left ? s.x - 20 : s.x + 20, anchor = left ? 'end' : 'start';
    const ty = s.y + (LABEL_DY[s.key] || 0);
    return `${on ? `<circle cx="${s.x}" cy="${s.y}" r="24" fill="#1a73e8" opacity="0.14"/>` : ''}
      <circle cx="${s.x}" cy="${s.y}" r="${on ? 15 : 13}" fill="${fill}" stroke="#ffffff" stroke-width="3"/>
      <text x="${s.x}" y="${s.y + 4.5}" font-size="13" font-family="${font.bold}" fill="#ffffff" text-anchor="middle">${i + 1}</text>
      <text x="${tx}" y="${ty - 1}" font-size="15" font-family="${font.bold}" fill="#0f1b2d" text-anchor="${anchor}">${s.ru}</text>
      <text x="${tx}" y="${ty + 15}" font-size="11" font-family="${font.regular}" fill="#5b6576" text-anchor="${anchor}">${s.zh} · ${s.days.length > 1 ? `${dayShort(s.days[0])}–${DAYS[s.days[s.days.length - 1]].n}` : dayShort(s.days[0])}</text>`;
  }).join('');
  const m = MOSCOW;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#f6f9ff"/>${dots.join('')}
    ${legs}
    <circle cx="${m.x}" cy="${m.y}" r="9" fill="#0f1b2d" stroke="#fff" stroke-width="3"/>
    <text x="${m.x - 8}" y="${m.y - 16}" font-size="14" font-family="${font.bold}" fill="#0f1b2d">Москва</text>
    ${stops}
  </svg>`;
}
