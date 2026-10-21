// Интерактивный маршрут для делегатов (решения 21.10.2026): карта Китая по провинциям — как на сайте, города, как едем
// между ними, что в каждом городе. Координаты городов — из данных сайта (companies.json → cities).
// Данные — из тестовой поездки (trip.ts); на шаге 2 придут с сервера из «Центра поездки».
import { FULL_BOX, padBox, pointBox, project, provinceAt, unionBox, type Box } from './geo';
import { VISITS } from './group';
import { CULTURE, DAYS, HOTELS, WEATHER, dayEvents } from './trip';

export type Stop = { key: string; ru: string; zh: string; lng: number; lat: number; days: number[]; hotel?: string; side: 'left' | 'right' };
export type Leg = { from: string; to: string; how: 'plane' | 'train'; day: number; time: string; note: string };

/** Города по порядку (широта и долгота — как у городов на сайте). */
export const STOPS: Stop[] = [
  { key: 'beijing', ru: 'Пекин', zh: '北京', lng: 116.4, lat: 39.9, days: [0, 1], hotel: 'beijing', side: 'right' },
  { key: 'shanghai', ru: 'Шанхай', zh: '上海', lng: 121.5, lat: 31.2, days: [2, 3], hotel: 'shanghai', side: 'right' },
  { key: 'hangzhou', ru: 'Ханчжоу', zh: '杭州', lng: 120.2, lat: 30.3, days: [4], side: 'left' },
  { key: 'shenzhen', ru: 'Шэньчжэнь', zh: '深圳', lng: 114.1, lat: 22.5, days: [5], hotel: 'shenzhen', side: 'left' },
];

/** Переезды — по расписанию поездки (события «move»). */
export const LEGS: Leg[] = [
  { from: 'moscow', to: 'beijing', how: 'plane', day: 0, time: 'прилёт 14:00', note: 'Перелёт из Москвы, трансфер в отель' },
  { from: 'beijing', to: 'shanghai', how: 'plane', day: 2, time: '07:40', note: 'Перелёт, сбор в лобби в 05:45' },
  { from: 'shanghai', to: 'hangzhou', how: 'train', day: 4, time: '08:30', note: 'Скоростной поезд' },
  { from: 'hangzhou', to: 'shenzhen', how: 'plane', day: 4, time: '18:00', note: 'Перелёт вечером, заезд в отель около 21:00' },
  { from: 'shenzhen', to: 'moscow', how: 'plane', day: 5, time: '18:00', note: 'Итоги и вылет домой' },
];

export const MOSCOW = { key: 'moscow', ru: 'Москва', zh: '莫斯科' };
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

// ——— Точки на карте и «камера» ———

/** Москва — за краем карты на северо-западе, как прилёт на карте сайта. */
export const MOSCOW_XY: [number, number] = [FULL_BOX[2] * 0.05, FULL_BOX[3] * 0.1];
export const xyOf = (key: string): [number, number] => {
  if (key === 'moscow') return MOSCOW_XY;
  const s = STOPS.find((x) => x.key === key)!;
  return project(s.lng, s.lat);
};
export const provinceOf = (s: Stop) => provinceAt(s.lng, s.lat);
/** Провинции маршрута — подсвечены на карте. */
export const ROUTE_PROVINCES = new Set(STOPS.map((s) => provinceOf(s)?.en).filter(Boolean) as string[]);

const routeBoxRaw = STOPS.map((s) => xyOf(s.key)).reduce<Box>((b, [x, y]) => unionBox(b, pointBox(x, y, 1)), pointBox(...xyOf(STOPS[0].key), 1));
/** Весь маршрут с запасом по краям. */
export const ROUTE_BOX = padBox(routeBoxRaw, Math.max(routeBoxRaw[2], routeBoxRaw[3]) * 0.22);

/** Город крупно: его провинция с запасом, но не меньше 120 единиц — иначе Шанхай и Пекин были бы точкой. */
export function cityBox(key: string): Box {
  const s = STOPS.find((x) => x.key === key)!;
  const [x, y] = xyOf(key);
  const pb = provinceOf(s)?.box;
  const base = pb ? unionBox(pb, pointBox(x, y, 120)) : pointBox(x, y, 120);
  return padBox(base, Math.max(base[2], base[3]) * 0.25);
}

/** Переезд целиком: оба конца с запасом (для Москвы — весь Китай). */
export function legBox(l: Leg): Box {
  if (l.from === 'moscow' || l.to === 'moscow') return FULL_BOX;
  const [x1, y1] = xyOf(l.from), [x2, y2] = xyOf(l.to);
  const b = unionBox(pointBox(x1, y1, 1), pointBox(x2, y2, 1));
  return padBox(b, Math.max(b[2], b[3], 80) * 0.45);
}
