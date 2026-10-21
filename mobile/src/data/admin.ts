// Роль «Администратор» (решение 21.10.2026): «Центр поездки» — поездки из программ сайта, даты, дни, люди, публикация
// изменений делегатам, доступы команды. Два уровня доступа — полный и ограниченный; что именно входит в каждый,
// пользователь решит отдельно — ниже предварительный вариант, скелет. На шаге 2 всё это живёт на сервере.
import catalog from './catalog.json';
import { CITY, DAYS, DELEGATES, TRIP, dayEvents, type EventKind } from './trip';

export type AccessLevel = 'full' | 'limited';

export const ACCESS: Record<AccessLevel, { ru: string; sub: string }> = {
  full: { ru: 'Полный', sub: 'Все поездки и программы, публикация изменений, люди и доступы команды' },
  limited: { ru: 'Ограниченный', sub: 'Только назначенные поездки; изменения уходят администратору на публикацию' },
};

/** Что разрешено на каждом уровне — предварительно, решим отдельно (docs/decisions.md). */
export const PERMS: { key: string; ru: string; full: boolean; limited: boolean | 'own' }[] = [
  { key: 'trips.all', ru: 'Видеть все поездки', full: true, limited: false },
  { key: 'trip.create', ru: 'Создавать поездку из программы', full: true, limited: false },
  { key: 'trip.edit', ru: 'Менять даты, дни, отели, рестораны', full: true, limited: 'own' },
  { key: 'people.edit', ru: 'Добавлять и заменять участников', full: true, limited: 'own' },
  { key: 'trip.publish', ru: 'Публиковать изменения делегатам', full: true, limited: false },
  { key: 'access.manage', ru: 'Выдавать и забирать доступы', full: true, limited: false },
];
export const can = (level: AccessLevel, key: string) => !!PERMS.find((p) => p.key === key)?.[level];

export const ROLES = ['Администратор', 'Координатор', 'Гид-переводчик', 'Менеджер продаж'] as const;

export type Member = { id: string; name: string; contact: string; role: string; level: AccessLevel; trips: string[]; status: 'active' | 'invited' };
export type AEvent = { id: string; t: string; name: string; kind: EventKind };
export type ADay = { city: string; events: AEvent[] };
export type APerson = { id: string; name: string; role: string; invite: 'joined' | 'sent' };
export type ATrip = {
  id: string; title: string; programId: string; start: string; status: 'draft' | 'published';
  pending: number; days: ADay[]; people: APerson[]; team: string[];
};
export type LogItem = { id: string; at: string; who: string; trip?: string; what: string };

/** Команда — вымышленные люди, кроме владельца. */
export const TEAM0: Member[] = [
  { id: 'u-owner', name: 'Остап Доценко', contact: 'владелец', role: 'Администратор', level: 'full', trips: [], status: 'active' },
  { id: 'u-maria', name: 'Мария Ким', contact: 'maria@example.com', role: 'Координатор', level: 'limited', trips: ['t-retail'], status: 'active' },
  { id: 'u-li', name: 'Ли Мэй', contact: 'WeChat: limei_demo', role: 'Гид-переводчик', level: 'limited', trips: ['t-retail'], status: 'invited' },
];

/** Тестовая поездка приложения — как черновик в «Центре поездки». */
export const TRIPS0: ATrip[] = [{
  id: 't-retail', title: TRIP.title, programId: 'china-retail-showrooms-expedition', start: '2026-11-09', status: 'published', pending: 0,
  days: DAYS.map((_, i) => ({ city: CITY[i], events: dayEvents(i).map((e, k) => ({ id: `e${i}-${k}`, t: e.t, name: e.name, kind: e.kind })) })),
  people: DELEGATES.map((d) => ({ id: d.id, name: d.ru, role: d.roleRu, invite: d.id === 'd4' ? 'sent' : 'joined' })),
  team: ['u-maria', 'u-li'],
}];

export const LOG0: LogItem[] = [
  { id: 'l1', at: '20.10, 18:40', who: 'Мария Ким', trip: 't-retail', what: 'Встреча в Meituan перенесена на 15:30' },
  { id: 'l2', at: '20.10, 18:42', who: 'Остап Доценко', trip: 't-retail', what: 'Опубликовано: 1 изменение — делегаты получили уведомление' },
];

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WD = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const toDate = (iso: string) => new Date(`${iso}T12:00:00Z`);
export const addDays = (iso: string, n: number) => { const d = toDate(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const dayTitle = (iso: string, i: number) => { const d = toDate(addDays(iso, i)); return `${WD[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };
export function datesText(t: ATrip) {
  const a = toDate(t.start), b = toDate(addDays(t.start, Math.max(0, t.days.length - 1)));
  return a.getUTCMonth() === b.getUTCMonth()
    ? `${a.getUTCDate()}–${b.getUTCDate()} ${MONTHS[b.getUTCMonth()]} ${b.getUTCFullYear()}`
    : `${a.getUTCDate()} ${MONTHS[a.getUTCMonth()]} – ${b.getUTCDate()} ${MONTHS[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
}

export type Program = (typeof catalog)[number];
export const PROGRAMS = catalog as Program[];

/** Новая поездка из программы сайта: дни и города — по программе, расписание заполняет координатор. */
export function tripFromProgram(p: Program, id: string, start: string): ATrip {
  const n = Math.max(1, p.days || 1);
  const cities = p.cities.length ? p.cities : ['—'];
  return {
    id, title: p.title, programId: p.id, start, status: 'draft', pending: 1, people: [], team: [],
    days: Array.from({ length: n }, (_, i) => ({ city: cities[Math.min(cities.length - 1, Math.floor((i * cities.length) / n))], events: [] })),
  };
}
