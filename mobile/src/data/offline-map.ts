// Офлайн-карта города (решение пользователя 27.10.2026: «идеальный формат, чтобы было всё всегда под рукой»): метро со станциями,
// главные дороги, реки и озёра, вокзалы и аэропорты — из OpenStreetMap (© участники OpenStreetMap, ODbL), уже в приложении,
// поэтому работают без интернета и без Google. Данные пишет tools/offline-maps.py в data/maps/<город>.json: координаты —
// целые (градусы × q от левого нижнего угла), линии — разности соседних точек. Здесь — распаковка в пути SVG и поиск
// ближайшей станции метро. Где вы — по GPS: ему интернет не нужен.
import beijing from './maps/beijing.json';
import guangzhou from './maps/guangzhou.json';
import hangzhou from './maps/hangzhou.json';
import shanghai from './maps/shanghai.json';
import shenzhen from './maps/shenzhen.json';
import { distM } from './live-geo';

type Poly = number[]; // [x0, y0, dx1, dy1, …]
type Named = { zh: string; en: string; ru: string; x: number; y: number };
type RawMap = {
  id: string; ru: string; zh: string; en: string; bbox: [number, number, number, number]; q: number;
  roads: { major: Poly[]; minor: Poly[] }; water: { lines: Poly[]; areas: Poly[] };
  metro: { lines: { ref: string; zh: string; ru: string; color: string; paths: Poly[] }[]; stations: (Named & { lines: string[] })[] };
  rail: Named[]; airports: Named[]; source: string; date: string;
};

export type Place = { zh: string; en: string; ru: string; lat: number; lng: number; X: number; Y: number };
export type Station = Place & { lines: string[] };
export type MetroLine = { ref: string; zh: string; ru: string; color: string; d: string };
export type CityMap = {
  id: string; ru: string; zh: string; en: string; W: number; H: number;
  roads: { major: string; minor: string }; water: { lines: string; areas: string };
  metro: MetroLine[]; stations: Station[]; rail: Place[]; airports: Place[]; source: string; date: string;
  project: (lat: number, lng: number) => [number, number];
  unproject: (X: number, Y: number) => { lat: number; lng: number };
  contains: (lat: number, lng: number) => boolean;
};

const RAW: Record<string, RawMap> = { beijing, shanghai, shenzhen, hangzhou, guangzhou } as unknown as Record<string, RawMap>;
/** Города, для которых карта уже в приложении. */
export const OFFLINE_CITIES = Object.keys(RAW);
export const hasOfflineMap = (cityKey: string) => cityKey in RAW;

const cache = new Map<string, CityMap>();

/** Карта города (распаковывается один раз). Единицы карты: 1 ≈ 1 м по широте; по долготе поправка на косинус широты. */
export function cityMap(cityKey: string): CityMap | null {
  const hit = cache.get(cityKey);
  if (hit) return hit;
  const r = RAW[cityKey];
  if (!r) return null;
  const [minLng, minLat, maxLng, maxLat] = r.bbox;
  const k = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const s = 111320 / r.q; // метров в единице кванта по широте
  const H = (maxLat - minLat) * r.q * s;
  const W = (maxLng - minLng) * r.q * s * k;
  const X = (x: number) => x * s * k;
  const Y = (y: number) => H - y * s;
  const path = (polys: Poly[], close = false) => polys.map((p) => {
    let x = p[0], y = p[1];
    let d = `M${Math.round(X(x))} ${Math.round(Y(y))}`;
    for (let i = 2; i + 1 < p.length; i += 2) { x += p[i]; y += p[i + 1]; d += `L${Math.round(X(x))} ${Math.round(Y(y))}`; }
    return close ? `${d}Z` : d;
  }).join('');
  const place = (n: Named): Place => ({ zh: n.zh, en: n.en, ru: n.ru, X: X(n.x), Y: Y(n.y), lat: minLat + n.y / r.q, lng: minLng + n.x / r.q });
  const m: CityMap = {
    id: r.id, ru: r.ru, zh: r.zh, en: r.en, W, H,
    roads: { major: path(r.roads.major), minor: path(r.roads.minor) },
    water: { lines: path(r.water.lines), areas: path(r.water.areas, true) },
    metro: r.metro.lines.map((l) => ({ ref: l.ref, zh: l.zh, ru: l.ru, color: l.color, d: path(l.paths) })),
    stations: r.metro.stations.map((st) => ({ ...place(st), lines: st.lines })),
    rail: r.rail.map(place), airports: r.airports.map(place), source: r.source, date: r.date,
    project: (lat, lng) => [(lng - minLng) * r.q * s * k, H - (lat - minLat) * r.q * s],
    unproject: (x, y) => ({ lng: minLng + x / (r.q * s * k), lat: minLat + (H - y) / (r.q * s) }),
    contains: (lat, lng) => lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng,
  };
  cache.set(cityKey, m);
  return m;
}

/** Ближайшая станция метро и расстояние до неё, метры; пешком — ~75 м в минуту по городу. */
export function nearestStation(m: CityMap, lat: number, lng: number) {
  let best: Station | null = null, bd = Infinity;
  for (const st of m.stations) {
    const d = distM({ lat, lng }, st);
    if (d < bd) { bd = d; best = st; }
  }
  return best ? { station: best, dist: bd, walkMin: Math.max(1, Math.round((bd * 1.3) / 75)) } : null;
}

/** Цвет линии метро по номеру. */
export const lineColor = (m: CityMap, ref: string) => m.metro.find((l) => l.ref === ref)?.color || '#8a94a6';
