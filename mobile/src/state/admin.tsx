// Состояние «Центра поездки» (шаг 1 — хранится на телефоне; на шаге 2 — сервер). «Смотреть как» переключает
// полный и ограниченный доступ, чтобы видеть, что останется у человека с ограниченным доступом.
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { LOG0, TEAM0, TRIPS0, can, type ADay, type AccessLevel, type AEvent, type APerson, type ATrip, type LogItem, type Member, type Program, tripFromProgram } from '@/data/admin';
import { nowLabel } from '@/data/media';
import { useStored } from '@/state/store';

const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

type AdminState = {
  /** Кем смотрим: владелец (полный) или Мария Ким (ограниченный). */
  me: Member;
  level: AccessLevel;
  setLevel: (l: AccessLevel) => void;
  can: (key: string) => boolean;
  team: Member[];
  invite: (m: Omit<Member, 'id' | 'status'>) => void;
  updateMember: (id: string, patch: Partial<Member>) => void;
  removeMember: (id: string) => void;
  trips: ATrip[];
  /** Поездки, которые видит текущий уровень. */
  myTrips: ATrip[];
  trip: (id: string) => ATrip | undefined;
  createTrip: (p: Program, start: string) => string;
  shiftStart: (id: string, days: number) => void;
  addEvent: (id: string, day: number, e: Omit<AEvent, 'id'>) => void;
  removeEvent: (id: string, day: number, eventId: string) => void;
  setCity: (id: string, day: number, city: string) => void;
  addPerson: (id: string, p: Omit<APerson, 'id' | 'invite'>) => void;
  replacePerson: (id: string, personId: string, name: string) => void;
  removePerson: (id: string, personId: string) => void;
  publish: (id: string) => void;
  log: LogItem[];
};

const Ctx = createContext<AdminState | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [team, setTeam] = useStored<Member[]>('admin.team', TEAM0);
  const [trips, setTrips] = useStored<ATrip[]>('admin.trips', TRIPS0);
  const [log, setLog] = useStored<LogItem[]>('admin.log', LOG0);
  const [level, setLevel] = useState<AccessLevel>('full');

  const value = useMemo<AdminState>(() => {
    const me = level === 'full' ? team.find((m) => m.level === 'full') || TEAM0[0] : team.find((m) => m.id === 'u-maria') || TEAM0[1];
    const note = (what: string, trip?: string) => setLog((l) => [{ id: uid('l'), at: nowLabel(), who: me.name, trip, what }, ...l]);
    /** Любая правка поездки — в черновик: делегаты увидят её после публикации. */
    const edit = (id: string, what: string, f: (t: ATrip) => ATrip) => {
      setTrips((all) => all.map((t) => (t.id === id ? { ...f(t), pending: t.pending + 1 } : t)));
      note(what, id);
    };
    const days = (id: string, f: (d: ADay[]) => ADay[]) => (t: ATrip) => (t.id === id ? { ...t, days: f(t.days) } : t);
    return {
      me, level, setLevel,
      can: (key) => can(level, key),
      team,
      invite: (m) => { setTeam((all) => [...all, { ...m, id: uid('u'), status: 'invited' }]); note(`Выдан доступ: ${m.name} — ${m.role}, ${m.level === 'full' ? 'полный' : 'ограниченный'}`); },
      updateMember: (id, patch) => { setTeam((all) => all.map((m) => (m.id === id ? { ...m, ...patch } : m))); const m = team.find((x) => x.id === id); if (m && patch.level) note(`${m.name}: доступ ${patch.level === 'full' ? 'полный' : 'ограниченный'}`); },
      removeMember: (id) => { const m = team.find((x) => x.id === id); setTeam((all) => all.filter((x) => x.id !== id)); if (m) note(`Доступ закрыт: ${m.name}`); },
      trips,
      myTrips: level === 'full' ? trips : trips.filter((t) => me.trips.includes(t.id)),
      trip: (id) => trips.find((t) => t.id === id),
      createTrip: (p, start) => {
        const id = uid('t');
        setTrips((all) => [tripFromProgram(p, id, start), ...all]);
        note(`Создана поездка из программы «${p.title}»`, id);
        return id;
      },
      shiftStart: (id, n) => {
        const t = trips.find((x) => x.id === id);
        if (!t) return;
        const d = new Date(`${t.start}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n);
        edit(id, `Даты сдвинуты на ${n > 0 ? '+' : ''}${n} дн.`, (x) => ({ ...x, start: d.toISOString().slice(0, 10) }));
      },
      addEvent: (id, day, e) => edit(id, `День ${day + 1}: добавлено «${e.name}» в ${e.t}`, (t) => days(id, (ds) => ds.map((d, i) => (i === day ? { ...d, events: [...d.events, { ...e, id: uid('e') }].sort((a, b) => a.t.localeCompare(b.t)) } : d)))(t)),
      removeEvent: (id, day, eventId) => {
        const name = trips.find((t) => t.id === id)?.days[day]?.events.find((e) => e.id === eventId)?.name;
        edit(id, `День ${day + 1}: убрано «${name}»`, (t) => days(id, (ds) => ds.map((d, i) => (i === day ? { ...d, events: d.events.filter((e) => e.id !== eventId) } : d)))(t));
      },
      setCity: (id, day, city) => edit(id, `День ${day + 1}: город — ${city}`, (t) => days(id, (ds) => ds.map((d, i) => (i === day ? { ...d, city } : d)))(t)),
      addPerson: (id, p) => edit(id, `Участник добавлен: ${p.name}`, (t) => ({ ...t, people: [...t.people, { ...p, id: uid('p'), invite: 'sent' }] })),
      replacePerson: (id, personId, name) => {
        const old = trips.find((t) => t.id === id)?.people.find((p) => p.id === personId)?.name;
        edit(id, `Замена: ${old} → ${name} (старое приглашение отключено)`, (t) => ({ ...t, people: t.people.map((p) => (p.id === personId ? { ...p, id: uid('p'), name, invite: 'sent' } : p)) }));
      },
      removePerson: (id, personId) => {
        const old = trips.find((t) => t.id === id)?.people.find((p) => p.id === personId)?.name;
        edit(id, `Участник убран: ${old}`, (t) => ({ ...t, people: t.people.filter((p) => p.id !== personId) }));
      },
      publish: (id) => {
        const t = trips.find((x) => x.id === id);
        if (!t) return;
        if (!can(level, 'trip.publish')) { note(`Отправлено администратору на публикацию: ${t.pending} изм.`, id); return; }
        setTrips((all) => all.map((x) => (x.id === id ? { ...x, status: 'published', pending: 0 } : x)));
        note(`Опубликовано: ${t.pending} изм. — делегаты получили уведомление`, id);
      },
      log,
    };
  }, [team, trips, log, level, setTeam, setTrips, setLog]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdmin() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAdmin вне AdminProvider');
  return v;
}
