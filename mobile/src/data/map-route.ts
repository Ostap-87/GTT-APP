// Маршрут для карты любой страны: города (широта и долгота) и переезды, «камера» — рамки для всего маршрута,
// города и переезда. Москва — за краем карты на северо-западе, как прилёт на карте сайта.
import { cityById, geoOf, padBox, pointBox, unionBox, type Box, type Geo } from './geo';

export type MapStop = { key: string; ru: string; sub: string; lng: number; lat: number; side?: 'left' | 'right' };
export type MapLeg = { from: string; to: string; how: 'plane' | 'train' };

export function mapRoute(cc: string, stops: MapStop[], legs: MapLeg[]) {
  const geo: Geo = geoOf(cc);
  const moscow: [number, number] = [geo.W * 0.05, geo.H * 0.1];
  const xy = (key: string): [number, number] => {
    if (key === 'moscow') return moscow;
    const s = stops.find((x) => x.key === key);
    return s ? geo.project(s.lng, s.lat) : moscow;
  };
  const province = (key: string) => { const s = stops.find((x) => x.key === key); return s ? geo.provinceAt(s.lng, s.lat) : undefined; };
  const provinces = new Set(stops.map((s) => province(s.key)?.en).filter(Boolean) as string[]);
  const raw = stops.length ? stops.map((s) => xy(s.key)).reduce<Box>((b, [x, y]) => unionBox(b, pointBox(x, y, 1)), pointBox(...xy(stops[0].key), 1)) : geo.full;
  const routeBox = padBox(raw, Math.max(raw[2], raw[3], 160) * 0.25);
  /** Город крупно: его регион с запасом, но не меньше 120 единиц. */
  const cityBox = (key: string): Box => {
    const [x, y] = xy(key);
    const pb = province(key)?.box;
    const base = pb ? unionBox(pb, pointBox(x, y, 120)) : pointBox(x, y, 120);
    return padBox(base, Math.max(base[2], base[3]) * 0.25);
  };
  /** Переезд целиком: оба конца с запасом (для Москвы — вся страна). */
  const legBox = (l: MapLeg): Box => {
    if (l.from === 'moscow' || l.to === 'moscow') return geo.full;
    const [x1, y1] = xy(l.from), [x2, y2] = xy(l.to);
    const b = unionBox(pointBox(x1, y1, 1), pointBox(x2, y2, 1));
    return padBox(b, Math.max(b[2], b[3], 80) * 0.45);
  };
  return { geo, xy, province, provinces, routeBox, cityBox, legBox };
}

/** Маршрут программы сайта: города подряд (повторы склеиваются), подпись — дни; переезды — по leg_mode, иначе перелёт. */
export function programRoute(route: { day: number; city: string; leg?: string }[]) {
  const stops: (MapStop & { days: number[] })[] = [];
  const legs: MapLeg[] = [];
  for (const r of route) {
    const c = cityById(r.city);
    if (!c) continue;
    const last = stops[stops.length - 1];
    if (last && last.key === c.id) { last.days.push(r.day); continue; }
    legs.push({ from: last ? last.key : 'moscow', to: c.id, how: r.leg === 'train' ? 'train' : 'plane' });
    stops.push({ key: c.id, ru: c.ru, sub: '', lng: c.lng, lat: c.lat, days: [r.day] });
  }
  for (const s of stops) s.sub = s.days.length > 1 ? `дни ${s.days[0]}–${s.days[s.days.length - 1]}` : `день ${s.days[0]}`;
  // подписи слева у городов к востоку от середины маршрута — чтобы не уходили за край
  const mid = stops.reduce((a, s) => a + s.lng, 0) / Math.max(1, stops.length);
  for (const s of stops) s.side = s.lng > mid ? 'left' : 'right';
  if (stops.length) legs.push({ from: stops[stops.length - 1].key, to: 'moscow', how: 'plane' });
  return { stops, legs };
}
