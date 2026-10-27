// Точки поездки на карте: отель, визиты, рестораны, культурная программа — с широтой и долготой (WGS-84, как GPS и OpenStreetMap).
// В подробном демо «Новый ритейл Китая» координаты примерные (район, а не дверь). На шаге 2 их пришлёт сервер: адреса из
// программы геокодирует модуль Amap (server/src/amap, его координаты GCJ-02 пересчитываются в WGS-84 — coords.js).
import { VISITS } from './group';
import { STOPS } from './route';
import { CULTURE, DAYS, HOTELS, MEALS, TRIP, dayEvents } from './trip';

type LL = [number, number]; // широта, долгота
const DEMO_HOTELS: Record<string, LL> = { beijing: [39.9142, 116.411], shanghai: [31.2405, 121.489], shenzhen: [22.541, 114.059] };
const DEMO_VISITS: Record<string, LL> = {
  jd: [39.786, 116.563], meituan: [39.997, 116.487], hema: [31.26, 121.588], pdd: [31.211, 121.408], rtmart: [31.283, 121.526],
  eleme: [31.2335, 121.417], alibaba: [30.2799, 120.0262], sams: [22.548, 114.03], yonghui: [22.535, 113.995],
};
const DEMO_REFS: Record<string, LL> = {
  'm-mon-d': [39.923, 116.416], 'm-tue-l': [39.79, 116.56], 'm-tue-d': [39.925, 116.425], 'm-wed-l': [31.23, 121.48],
  'm-thu-l': [31.281, 121.523], 'm-thu-d': [31.238, 121.491], 'm-fri-l': [30.253, 120.15], 'm-sat-l': [22.542, 114.06],
  'c-bund': [31.239, 121.49], 'c-tea': [30.224, 120.132],
};

export type PointKind = 'hotel' | 'visit' | 'meal' | 'culture';
export type MapPoint = { key: string; kind: PointKind; ru: string; sub: string; zh: string; addr: string; lat: number; lng: number; day: number | null };

/** Точки города поездки: отель и события его дней. У программ сайта координат пока нет — пустой список. */
export function cityPoints(cityKey: string): MapPoint[] {
  if (TRIP.programId) return [];
  const s = STOPS.find((x) => x.key === cityKey);
  if (!s) return [];
  const out: MapPoint[] = [];
  const h = s.hotel ? HOTELS[s.hotel] : undefined;
  const hll = s.hotel ? DEMO_HOTELS[s.hotel] : undefined;
  if (h && hll) out.push({ key: `h-${s.hotel}`, kind: 'hotel', ru: h.name, sub: h.nights, zh: h.addrZh, addr: h.addrRu, lat: hll[0], lng: hll[1], day: null });
  s.days.forEach((d) => dayEvents(d).forEach((e) => {
    const when = `${DAYS[d].wd} ${DAYS[d].n} · ${e.t}`;
    if (e.kind === 'co') {
      const v = VISITS.find((x) => x.name === e.name);
      const ll = v && DEMO_VISITS[v.id];
      if (v && ll) out.push({ key: `v-${v.id}`, kind: 'visit', ru: v.name, sub: `${when} · ${e.place}`, zh: v.zh || v.name, addr: v.addr || `${v.name}, ${s.ru}`, lat: ll[0], lng: ll[1], day: d });
    } else if ((e.kind === 'meal' || e.kind === 'culture') && e.ref && DEMO_REFS[e.ref]) {
      const ll = DEMO_REFS[e.ref];
      const m = MEALS[e.ref], c = CULTURE[e.ref];
      out.push({ key: `r-${e.ref}`, kind: e.kind, ru: m ? m.place : c ? c.title : e.name, sub: `${when} · ${e.name}`, zh: m?.addrZh || '', addr: m ? m.place : c?.desc || '', lat: ll[0], lng: ll[1], day: d });
    }
  }));
  return out;
}

/** Город на сегодня (первый город поездки, если сегодня день вне маршрута). */
export const todayCity = () => (STOPS.find((s) => s.days.includes(TRIP.today)) || STOPS[0])?.key || '';

/** Точка сбора группы сейчас: ближайший визит сегодня, иначе отель. */
export function meetingPoint(): MapPoint | null {
  const pts = cityPoints(todayCity());
  return pts.find((p) => p.kind === 'visit' && p.day === TRIP.today) || pts.find((p) => p.kind === 'hotel') || null;
}
