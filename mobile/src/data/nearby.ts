// «Рядом с вами» (решение пользователя 26.10.2026: «сделай встраиваемый модуль для Amap, чтобы мы могли быстро его
// интегрировать»): ближайшие аптеки и фруктовые лавки по картам Amap — сервер приложения (server/src/amap) спрашивает Amap
// и переводит названия, адреса и часы на язык раздела. Приложение знает только адрес сервера:
//   EXPO_PUBLIC_NEARBY_URL   — например https://api.globaltechtour.ru (без него блок не показывается);
//   EXPO_PUBLIC_NEARBY_TOKEN — если на сервере задан NEARBY_APP_TOKEN.
// Ключ Amap в приложении не хранится никогда — только на сервере.
import * as Location from 'expo-location';

import { CITIES } from './geo';
import type { Lang } from './lang';
import type { ShopCity } from './shops';

export const NEARBY_URL = (process.env.EXPO_PUBLIC_NEARBY_URL || '').replace(/\/+$/, '');
const TOKEN = process.env.EXPO_PUBLIC_NEARBY_TOKEN || '';

/** pharmacy, fruit — «Рядом с вами» в разделах; food, cafe, sights, mall — путеводитель «Еда и места рядом» (/around). */
export type NearbyKind = 'pharmacy' | 'fruit' | 'food' | 'cafe' | 'sights' | 'mall';
export type NearbyItem = {
  id: string;
  name: string;
  branch: string | null;
  chain: string | null;
  type: string | null;
  address: string | null;
  hours: string | null;
  open24: boolean;
  tel: string[];
  rating: number | null;
  /** Средний чек на человека, юани (рестораны и кафе). */
  cost: number | null;
  photo: string | null;
  tag: string | null;
  distance: number;
  walkMin: number;
  zh: { name: string; address: string; city: string };
  links: { amap: string; route: string };
  demo?: boolean;
};
export type NearbyReply = { source: 'amap' | 'demo'; items: NearbyItem[] };
export type Spot = { lat: number; lng: number; exact: boolean };

/** Где человек: GPS, если разрешил; иначе центр города раздела (exact: false). */
export async function whereAmI(city: ShopCity): Promise<Spot | null> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status === 'granted') {
      const pos = (await Location.getLastKnownPositionAsync({ maxAge: 120000 }))
        || (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      return { lat: pos.coords.latitude, lng: pos.coords.longitude, exact: true };
    }
  } catch {
    // геопозиция недоступна — ниже центр города
  }
  const g = CITIES.find((x) => x.id === city.id);
  const lat = g?.lat ?? city.lat;
  const lng = g?.lng ?? city.lng;
  return lat != null && lng != null ? { lat, lng, exact: false } : null;
}

export async function fetchNearby(kind: NearbyKind, lang: Lang, at: Spot): Promise<NearbyReply> {
  const qs = `kind=${kind}&lang=${lang}&lat=${at.lat.toFixed(6)}&lng=${at.lng.toFixed(6)}`;
  const res = await fetch(`${NEARBY_URL}/api/nearby?${qs}`, { headers: TOKEN ? { 'x-app-token': TOKEN } : {} });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data as NearbyReply;
}

/** 350 м · 1,2 км (en/uz — m, km и точка). */
export function distanceText(m: number, lang: Lang) {
  const cyr = lang === 'ru' || lang === 'kk';
  if (m < 1000) return `${Math.round(m / 10) * 10} ${cyr ? 'м' : 'm'}`;
  const km = (m / 1000).toFixed(1);
  return `${cyr ? km.replace('.', ',') : km} ${cyr ? 'км' : 'km'}`;
}
