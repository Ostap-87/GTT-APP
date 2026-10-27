// Геопозиция и SOS (решение пользователя 27.10.2026; коннектор — data/live-geo.ts, пока ни к чему не подключён).
// Делегат: отдельное согласие (по умолчанию выключено), последняя своя точка, SOS. Координатор: последние точки группы,
// кто отстал от точки сбора, чья точка устарела, кто не давал согласия; SOS — наверху «Пульта».
// В демо координатор и делегат — на одном телефоне, поэтому SOS Анны сразу виден на пульте; точки остальных — вымышленные.
import * as Location from 'expo-location';
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';

import { DELEGATES, ME, TRIP } from '@/data/trip';
import { FIX_EVERY_MS, LAG_M, STALE_MIN, distM, geoConnector, type GeoFix } from '@/data/live-geo';
import { meetingPoint } from '@/data/places-geo';
import { useStored } from '@/state/store';

export type Sos = { id: string; whoId: string; who: string; fix: GeoFix | null; at: string; delivered: boolean; status: 'new' | 'resolved' };
export type MemberView = { id: string; name: string; consent: boolean; fix: GeoFix | null; dist: number | null; lag: boolean; stale: boolean; minsAgo: number | null };

const hhmm = () => new Date().toTimeString().slice(0, 5);
const TRIP_ID = () => TRIP.programId || 'new-retail-2026-11';
/** Демо: кто из группы не давал согласия на геопозицию. */
const NO_CONSENT = ['d5', 'd11', 'd16'];
/** Демо: смещения от точки сбора, метры (север, восток); Ольга Морозова (d7) отстала, у Андрея Васильева (d12) точка старая. */
const OFFSET: Record<string, [number, number]> = { d7: [-380, 520], d4: [140, -60], d12: [260, -330] };

function demoFix(id: string, base: { lat: number; lng: number }, now: number): GeoFix {
  const n = Number(id.slice(1)) || 1;
  const [dn, de] = OFFSET[id] || [((n * 37) % 90) - 45, ((n * 53) % 110) - 55];
  const lat = base.lat + dn / 111320;
  const lng = base.lng + de / (111320 * Math.cos((base.lat * Math.PI) / 180));
  const ago = id === 'd12' ? 26 : 1 + (n % 4);
  return { lat, lng, acc: 12 + (n % 5) * 6, at: now - ago * 60000 };
}

function useGeoState() {
  const [consent, setConsentRaw] = useStored<{ on: boolean; at: string | null }>('geo.consent', { on: false, at: null });
  const [myFix, setMyFix] = useStored<GeoFix | null>('geo.myFix', null);
  const [sos, setSos] = useStored<Sos[]>('geo.sos', []);

  // При согласии — последняя точка раз в несколько минут, пока приложение открыто; разрешение не спрашиваем сами,
  // только если его уже дали (экран согласия или «Помощь»). Фоновое слежение — не делаем.
  useEffect(() => {
    if (!consent.on) return;
    let alive = true;
    const tick = async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (!perm.granted) return;
        const pos = await Location.getLastKnownPositionAsync({ maxAge: FIX_EVERY_MS });
        if (!pos || !alive) return;
        const fix = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy ?? undefined, at: Date.now() };
        setMyFix(fix);
        geoConnector.sendFix(TRIP_ID(), ME.id, fix).catch(() => {});
      } catch { /* нет GPS — попробуем в следующий раз */ }
    };
    tick();
    const t = setInterval(tick, FIX_EVERY_MS);
    return () => { alive = false; clearInterval(t); };
  }, [consent.on, setMyFix]);

  return useMemo(() => {
    const setConsent = (on: boolean) => {
      setConsentRaw({ on, at: on ? `${new Date().toLocaleDateString('ru-RU')} ${hhmm()}` : null });
      if (!on) setMyFix(null); // выключили — последняя точка удаляется
      geoConnector.setConsent(TRIP_ID(), ME.id, on).catch(() => {});
    };
    /** SOS: сохранить и отправить; вернуть, дошло ли до сервера (в демо — нет, координатор видит на этом телефоне). */
    const sendSos = async (fix: GeoFix | null) => {
      const delivered = await geoConnector.sendSos(TRIP_ID(), ME.id, fix).catch(() => false);
      setSos((x) => [{ id: `s${Date.now()}`, whoId: ME.id, who: ME.ru, fix, at: hhmm(), delivered, status: 'new' }, ...x]);
      return delivered;
    };
    const resolveSos = (id: string) => setSos((x) => x.map((s) => (s.id === id ? { ...s, status: 'resolved' } : s)));

    /** Группа глазами координатора: в демо — вымышленные точки вокруг места сбора, Анна — своя точка, если она рядом. */
    const group = (now = Date.now()): MemberView[] => {
      const mp = meetingPoint();
      return DELEGATES.map((d) => {
        const isMe = d.id === ME.id;
        const ok = isMe ? consent.on : !NO_CONSENT.includes(d.id);
        let fix: GeoFix | null = null;
        if (ok && mp) fix = isMe && myFix && distM(myFix, mp) < 30000 ? myFix : demoFix(d.id, mp, now);
        const dist = fix && mp ? distM(fix, mp) : null;
        const minsAgo = fix ? Math.max(0, Math.round((now - fix.at) / 60000)) : null;
        return { id: d.id, name: d.ru, consent: ok, fix, dist, lag: dist != null && dist > LAG_M, stale: minsAgo != null && minsAgo >= STALE_MIN, minsAgo };
      });
    };

    return { consent, setConsent, myFix, sos, sendSos, resolveSos, openSos: sos.filter((s) => s.status === 'new'), group, meeting: meetingPoint };
  }, [consent, myFix, sos, setConsentRaw, setMyFix, setSos]);
}

type Geo = ReturnType<typeof useGeoState>;
const Ctx = createContext<Geo | null>(null);

export function GeoProvider({ children }: { children: ReactNode }) {
  const v = useGeoState();
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useGeo() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useGeo вне GeoProvider');
  return v;
}
