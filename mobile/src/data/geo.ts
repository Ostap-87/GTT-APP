// Карты стран по регионам — те же границы, что на картах маршрутов на сайте globaltechtour.ru (SINOTECH,
// src/data/<страна>-provinces.json; копирует tools/sync-catalog.mjs в data/geo/). Проекция как на сайте:
// равнопромежуточная с поправкой на косинус широты, ширина 1000. Считается один раз на страну, при первом обращении.
import ae from './geo/ae.json';
import cities from './geo/cities.json';
import cn from './geo/cn.json';
import id from './geo/id.json';
import inn from './geo/in.json';
import jp from './geo/jp.json';
import kr from './geo/kr.json';
import my from './geo/my.json';
import th from './geo/th.json';
import vn from './geo/vn.json';

type Ring = [number, number][];
type Polygon = Ring[];
type ProvinceRaw = { nameEn: string; nameRu: string; polygons: Polygon[] };
export type Box = [number, number, number, number]; // x, y, ширина, высота — в единицах карты
export type CountryCode = 'cn' | 'jp' | 'kr' | 'th' | 'vn' | 'id' | 'in' | 'my' | 'ae';
export type ProvinceShape = { en: string; ru: string; d: string; box: Box; label: [number, number] };
export type City = { id: string; ru: string; en: string; lat: number; lng: number; country: string };

const RAW: Record<CountryCode, unknown> = { cn, jp, kr, th, vn, id, in: inn, my, ae };
export const CITIES = cities as City[];
export const cityById = (cityId: string) => CITIES.find((c) => c.id === cityId);

export const MAP_W = 1000;

function inRing(lng: number, lat: number, ring: Ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function build(cc: CountryCode) {
  const provinces = RAW[cc] as ProvinceRaw[];
  const all = provinces.flatMap((p) => p.polygons.flatMap((poly) => poly.flatMap((r) => r)));
  const latMin = Math.min(...all.map((p) => p[1]));
  const latMax = Math.max(...all.map((p) => p[1]));
  const lngCos = Math.cos((((latMin + latMax) / 2) * Math.PI) / 180);
  const xMin = Math.min(...all.map((p) => p[0] * lngCos));
  const xMax = Math.max(...all.map((p) => p[0] * lngCos));
  const scale = MAP_W / (xMax - xMin);
  const H = (latMax - latMin) * scale;
  const project = (lng: number, lat: number): [number, number] => [(lng * lngCos - xMin) * scale, H - (lat - latMin) * scale];
  const ringPath = (ring: Ring) => ring.map(([lng, lat], i) => { const [x, y] = project(lng, lat); return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`; }).join('') + 'Z';
  /** Центр тяжести кольца — для подписи региона. */
  const centroid = (ring: Ring): [number, number, number] => {
    let a = 0, cx = 0, cy = 0;
    const pts = ring.map(([lng, lat]) => project(lng, lat));
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const f = pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
      a += f; cx += (pts[j][0] + pts[i][0]) * f; cy += (pts[j][1] + pts[i][1]) * f;
    }
    return a ? [cx / (3 * a), cy / (3 * a), Math.abs(a / 2)] : [pts[0][0], pts[0][1], 0];
  };
  const shapes: ProvinceShape[] = provinces.map((p) => {
    const pts = p.polygons.flatMap((poly) => poly[0].map(([lng, lat]) => project(lng, lat)));
    const x0 = Math.min(...pts.map((q) => q[0])), x1 = Math.max(...pts.map((q) => q[0]));
    const y0 = Math.min(...pts.map((q) => q[1])), y1 = Math.max(...pts.map((q) => q[1]));
    const biggest = p.polygons.map((poly) => centroid(poly[0])).sort((a, b) => b[2] - a[2])[0];
    return { en: p.nameEn, ru: p.nameRu, d: p.polygons.map((poly) => poly.map(ringPath).join('')).join(''), box: [x0, y0, x1 - x0, y1 - y0], label: [biggest[0], biggest[1]] };
  });
  /** В каком регионе точка — по настоящим границам; рядом с берегом — ближайший регион. */
  const provinceAt = (lng: number, lat: number) => {
    const i = provinces.findIndex((p) => p.polygons.some(([outer, ...holes]) => inRing(lng, lat, outer) && !holes.some((h) => inRing(lng, lat, h))));
    if (i >= 0) return shapes[i];
    const [x, y] = project(lng, lat);
    return [...shapes].sort((a, b) => Math.hypot(a.label[0] - x, a.label[1] - y) - Math.hypot(b.label[0] - x, b.label[1] - y))[0];
  };
  return { cc, W: MAP_W, H, project, shapes, provinceAt, full: [0, 0, MAP_W, H] as Box };
}

export type Geo = ReturnType<typeof build>;
const cache = new Map<CountryCode, Geo>();
export function geoOf(cc: string): Geo {
  const code = (cc in RAW ? cc : 'cn') as CountryCode;
  if (!cache.has(code)) cache.set(code, build(code));
  return cache.get(code)!;
}

export const padBox = ([x, y, w, h]: Box, p: number): Box => [x - p, y - p, w + 2 * p, h + 2 * p];
export const unionBox = (a: Box, b: Box): Box => {
  const x0 = Math.min(a[0], b[0]), y0 = Math.min(a[1], b[1]);
  return [x0, y0, Math.max(a[0] + a[2], b[0] + b[2]) - x0, Math.max(a[1] + a[3], b[1] + b[3]) - y0];
};
export const pointBox = (x: number, y: number, size: number): Box => [x - size / 2, y - size / 2, size, size];
