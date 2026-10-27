// Живая геопозиция и SOS (решение пользователя 27.10.2026): «Координатор видит на карте, кто отстал от группы. Кнопка SOS
// отправляет точку и сразу набирает координатора… тут можно просто заготовку для коннектора сделать, пока не подключать ничего».
// Здесь — коннектор: один интерфейс и два исполнения. Пока EXPO_PUBLIC_GEO_URL пустой, работает demoConnector: точки никуда
// не уходят, координатор видит их только в этой демо-версии (общее состояние на телефоне). Когда появится сервер (шаг 2,
// в России — 152-ФЗ), достаточно задать адрес: httpConnector ходит по контракту из docs/live-geo.md.
// Правила (там же): только с отдельного согласия участника, только в дни поездки, хранится последняя точка, не история;
// при выключении согласия и после поездки точка удаляется. SOS отправляет точку и без постоянного согласия — по нажатию.

export type GeoFix = { lat: number; lng: number; acc?: number; at: number };
/** Последняя точка участника для координатора (без согласия точки нет). */
export type MemberFix = { id: string; consent: boolean; fix: GeoFix | null };

export interface LiveGeoConnector {
  readonly kind: 'demo' | 'http';
  /** Включить или выключить согласие; при выключении сервер удаляет последнюю точку. */
  setConsent(tripId: string, memberId: string, on: boolean): Promise<boolean>;
  /** Отправить позицию участника (только при согласии и в дни поездки — проверяет и сервер). */
  sendFix(tripId: string, memberId: string, fix: GeoFix): Promise<boolean>;
  /** SOS: точка (если удалось определить) — координатору сразу, звонок приложение набирает само. */
  sendSos(tripId: string, memberId: string, fix: GeoFix | null): Promise<boolean>;
  /** Последние точки группы — только для координатора этой поездки. */
  groupFixes(tripId: string): Promise<MemberFix[]>;
}

const GEO_URL = (process.env.EXPO_PUBLIC_GEO_URL || '').replace(/\/$/, '');
const GEO_TOKEN = process.env.EXPO_PUBLIC_GEO_TOKEN || '';

/** Демо: ничего не отправляет и не принимает — координатор видит точки из общего состояния телефона (state/geo.tsx). */
const demoConnector: LiveGeoConnector = {
  kind: 'demo',
  setConsent: async () => false,
  sendFix: async () => false,
  sendSos: async () => false,
  groupFixes: async () => [],
};

/** Сервер по контракту docs/live-geo.md. Ошибка сети — false: SOS всё равно идёт звонком. */
function httpConnector(base: string): LiveGeoConnector {
  const call = async (path: string, body?: unknown) => {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 8000);
    try {
      const r = await fetch(base + path, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json', ...(GEO_TOKEN ? { 'x-app-token': GEO_TOKEN } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: ctl.signal,
      });
      return r.ok ? await r.json().catch(() => ({})) : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };
  return {
    kind: 'http',
    setConsent: async (trip, member, on) => !!(await call('/api/geo/consent', { trip, member, on })),
    sendFix: async (trip, member, fix) => !!(await call('/api/geo/fix', { trip, member, ...fix })),
    sendSos: async (trip, member, fix) => !!(await call('/api/geo/sos', { trip, member, fix })),
    groupFixes: async (trip) => {
      const r = await call(`/api/geo/group?trip=${encodeURIComponent(trip)}`);
      return Array.isArray(r?.members) ? (r.members as MemberFix[]) : [];
    },
  };
}

export const GEO_CONNECTED = !!GEO_URL;
export const geoConnector: LiveGeoConnector = GEO_URL ? httpConnector(GEO_URL) : demoConnector;

/** Расстояние по поверхности Земли, метры. */
export function distM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Отстал: дальше этого от точки сбора группы. */
export const LAG_M = 300;
/** Точка устарела: давно не обновлялась. */
export const STALE_MIN = 15;
/** Как часто приложение отправляет позицию при согласии (пока открыто). */
export const FIX_EVERY_MS = 3 * 60 * 1000;

export const distText = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} м` : `${(m / 1000).toFixed(1).replace('.', ',')} км`);
