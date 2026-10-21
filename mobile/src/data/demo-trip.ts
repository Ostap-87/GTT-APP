// Демо-поездка из любой программы сайта (решение 21.10.2026: «сделать для всех программ и по всем странам… сразу
// выбирать страну, потом программу»). Дни, города, компании, время визитов, переезды и примечания — дословно из программы
// на сайте (catalog.json, companies.json). Отелей, ресторанов, погоды и телефонов в программах сайта нет — в демо они
// явно помечены «уточняется», их задаёт координатор. Даты — для примера, как у подробного демо: с понедельника 9 ноября 2026.
import catalog from './catalog.json';
import companies from './companies.json';
import { countryOf } from './countries';
import { cityById } from './geo';
import { fromMin, plural, toMin, type Leg as CoordLeg, type Visit } from './group';
import { programRoute } from './map-route';
import type { Leg as RouteLeg, Stop } from './route';
import type { TripEvent } from './trip';
import type { Hotel, Meal, Weather } from './trip-base';

type Day = { day: number; city: string; ru: string; area: string; time: string; co: string[]; leg?: string; tr?: string; note?: string };
export type Program = Omit<(typeof catalog)[number], 'route'> & { route: Day[] };
type Co = { n: string; zh?: string; c: string; d: string };
const CO = companies as Record<string, Co>;
export const PROGRAMS = catalog as Program[];
export const programById = (id: string) => PROGRAMS.find((p) => p.id === id);
export const companyOf = (id: string): Co | undefined => CO[id];
const CO_BY_NAME = new Map(Object.values(CO).map((c) => [c.n.toLowerCase(), c]));
/** Справка о компании по названию — для визитов подробного демо, у которых свои id. */
export const companyByName = (name: string) => CO_BY_NAME.get(name.toLowerCase());

const START = Date.UTC(2026, 10, 9); // пн, 9 ноября 2026
const WD = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const dateOf = (i: number) => new Date(START + i * 86400000);
const round15 = (m: number) => Math.round(m / 15) * 15;
/** Визиты дня равномерно в окне программы: 10:00–13:00 на две компании → 10:00 и 11:30; на выставке с десятком
 *  компаний — шаг 5 минут. */
const spread = (a: number, b: number, k: number) => Array.from({ length: k }, (_, j) => {
  const m = a + (j * (b - a)) / k;
  return (b - a) / k < 30 ? Math.round(m / 5) * 5 : round15(m);
});
/** «в Осаку», «в Нагою», «в Шанхай», «в Мумбаи». */
const toCity = (ru: string) => ru.replace(/([^аеёиоуыэюя])а$/, '$1у').replace(/я$/, 'ю');
const clean = (s: string) => s.replace(/[✈🚄]️?/gu, '').replace(/\s+/g, ' ').trim();

const MEAL_NOTE = 'Ресторан и меню координатор подтвердит перед поездкой; ограничения по питанию из вашего профиля передадим ресторану.';
const NO_WEATHER: Weather = { icon: 'cloud', max: '', min: '', text: 'Прогноз появится за неделю до поездки' };

/** Окно визитов дня: «10:00–13:00»; «утро», «полдня» и т. п. — как обычно, 10:00–13:00. */
function block(time: string): [number, number] {
  const m = time.match(/(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})/);
  return m ? [Number(m[1]) * 60 + Number(m[2]), Number(m[3]) * 60 + Number(m[4])] : [600, 780];
}

type Move = { how: 'plane' | 'train'; t: string; evening: boolean; text: string };
/** Переезд из текста программы: «✈ ~20:00 → Шанхай», «🚄 Утром — поезд…». Прочие тексты — примечания дня. */
function parseMove(tr: string | undefined, arrivedToday: boolean): Move | null {
  if (!tr) return null;
  const how = /✈|перел[её]т/i.test(tr) ? 'plane' : /🚄|поезд|синкансэн|всжд/i.test(tr) ? 'train' : null;
  if (!how) return null;
  const tm = tr.match(/(\d{1,2}):(\d{2})/);
  const evening = /вечер/i.test(tr) || (tm ? Number(tm[1]) >= 15 : /утр/i.test(tr) ? false : !arrivedToday);
  const t = tm ? `${tm[1].padStart(2, '0')}:${tm[2]}` : evening ? '19:00' : '08:00';
  return { how, t, evening, text: clean(tr) };
}

export function buildTrip(p: Program) {
  const country = countryOf(p.country);
  const R = p.route;
  const n = R.length;
  const pre = `p${PROGRAMS.indexOf(p)}`;
  const cityRu = (i: number) => cityById(R[i].city)?.ru || R[i].ru || R[i].city;
  const days = R.map((_, i) => { const d = dateOf(i); return { wd: WD[d.getUTCDay()], n: d.getUTCDate(), city: cityRu(i) }; });
  const dateRu = (i: number) => { const d = dateOf(i); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };
  const extraNight = /следующего дня|дополнительная ночь/i.test(p.departure);

  const events: TripEvent[][] = [];
  const notes: string[] = [];
  const meals: Record<string, Meal> = {};
  const mealAddr: Record<string, [string, string]> = {};
  const visits: Visit[] = [];
  const moves: { to: string; day: number; t: string; how: 'plane' | 'train'; note: string }[] = [];
  const night: (string | null)[] = [];
  let movedLastEvening = false;

  const meal = (i: number, kind: 'l' | 'd', t: number): TripEvent => {
    const ref = `m-${pre}-${i}-${kind}`;
    const title = kind === 'l' ? 'Обед' : 'Ужин';
    meals[ref] = { title, when: `${days[i].wd}, ${dateRu(i)} · ${fromMin(t)}`, place: `Ресторан · ${cityRu(i)}`, addrZh: '', cuisine: MEAL_NOTE, options: ['Классическое меню', 'Вегетарианское', 'Без свинины'] };
    mealAddr[ref] = [`${cityRu(i)} · адрес пришлёт координатор`, ''];
    return { t: fromMin(t), name: title, place: 'Ресторан уточняется', kind: 'meal', ref };
  };

  for (let i = 0; i < n; i++) {
    const r = R[i];
    const last = i === n - 1;
    const ev: TripEvent[] = [];
    const note: string[] = [];
    const arrivedToday = i > 0 && r.city !== R[i - 1].city && !movedLastEvening;
    const mv = parseMove(r.tr, arrivedToday);
    if (i === 0 && p.arrival) note.push(`Прилёт: ${p.arrival}`);
    if (r.tr && !mv) note.push(clean(r.tr));
    if (r.note) note.push(r.note);
    const [s, e] = block(r.time);

    // утро: прилёт, переезд в город дня или выезд из отеля
    const morning: Move | null = mv && !mv.evening ? mv : arrivedToday ? { how: r.leg === 'train' ? 'train' : 'plane', t: '08:00', evening: false, text: '' } : null;
    if (i === 0 && /прил[её]т делегации|день прил[её]та/i.test(r.tr || '')) {
      ev.push({ t: fromMin(Math.max(360, s - 120)), name: 'Прилёт и трансфер в отель', place: 'Встреча в аэропорту, заселение', kind: 'move' });
    } else if (morning) {
      const place = morning.text || (morning.how === 'train' ? 'Скоростной поезд' : 'Внутренний перелёт');
      ev.push({ t: morning.t, name: `${morning.how === 'train' ? 'Поезд' : 'Перелёт'} в ${toCity(cityRu(i))}`, place, kind: 'move' });
      moves.push({ to: r.city, day: i, t: morning.t, how: morning.how, note: place });
    } else {
      ev.push({ t: fromMin(s - 45), name: 'Выезд из отеля', place: 'Лобби отеля · автобус группы', kind: 'move' });
    }

    // визиты и обед
    const co = r.co.map((id) => ({ id, ...CO[id] })).filter((c) => c.n);
    const LUNCH = 780;
    let times: number[];
    let lunch: number;
    if (e - s > 240 && s < LUNCH && e > LUNCH + 60 && co.length > 1) {
      const am = Math.ceil(co.length / 2);
      times = [...spread(s, LUNCH, am), ...spread(LUNCH + 60, e, co.length - am)];
      lunch = LUNCH;
    } else if (s >= LUNCH) { times = spread(s, e, co.length); lunch = s - 90; } else { times = spread(s, e, co.length); lunch = Math.max(720, round15(e)); }
    const place = r.area || cityRu(i);
    if (!co.length) ev.push({ t: fromMin(s), name: 'Визиты дня — по согласованию', place, kind: 'info' });
    co.forEach((c, k) => {
      const t = fromMin(times[k]);
      ev.push({ t, name: c.n, place, kind: 'co' });
      if (!visits.some((v) => v.id === c.id)) visits.push({ id: c.id, name: c.n, when: `${days[i].wd} ${days[i].n} · ${t}`, st: ['info', 'по программе'], zh: c.zh, addr: `${c.n}, ${cityRu(i)}`, desc: c.d });
    });
    ev.push(meal(i, 'l', lunch));

    // вечер: переезд в следующий город, вылет домой или ужин
    if (mv && mv.evening && !last) {
      const to = R[i + 1].city !== r.city ? cityRu(i + 1) : '';
      ev.push({ t: mv.t, name: `${mv.how === 'train' ? 'Поезд' : 'Перелёт'}${to ? ` в ${toCity(to)}` : ''}`, place: mv.text, kind: 'move' });
      if (to) moves.push({ to: R[i + 1].city, day: i, t: mv.t, how: mv.how, note: mv.text });
      movedLastEvening = !!to;
    } else {
      movedLastEvening = false;
      if (last && !extraNight) ev.push({ t: '18:00', name: 'Итоги и вылет домой', place: p.departure ? `Вылет: ${p.departure}` : 'Трансфер в аэропорт', kind: 'move' });
      else ev.push(meal(i, 'd', 1140));
    }
    if (last && extraNight && p.departure) note.push(`Вылет: ${p.departure}`);
    ev.sort((a, b) => toMin(a.t) - toMin(b.t));
    events.push(ev);
    notes.push(note.join('\n'));
    night.push(movedLastEvening ? R[i + 1].city : last ? (extraNight ? r.city : null) : r.city);
  }

  // отели: ночи подряд в одном городе — один отель
  const hotels: Record<string, Hotel> = {};
  const hotelByDay: (string | null)[] = night.map(() => null);
  for (let i = 0; i < n; i++) {
    const c = night[i];
    if (!c) continue;
    let j = i;
    while (j + 1 < n && night[j + 1] === c) j++;
    const key = `h-${pre}-${i}`;
    const ru = cityById(c)?.ru || R.find((x) => x.city === c)?.ru || c;
    const nights = j - i + 1;
    hotels[key] = {
      name: `Отель группы · ${ru}`, city: ru, addrZh: '', addrRu: 'Адрес пришлёт координатор', addrEn: '', phone: '',
      nights: `${dateOf(i).getUTCDate()}–${dateRu(j + 1)} · ${nights} ${plural(nights, 'ночь', 'ночи', 'ночей')}`,
      desc: 'Отель подтверждает координатор перед поездкой — здесь появятся адрес на трёх языках, телефон, время завтрака и заселения.',
    };
    for (let k = i; k <= j; k++) hotelByDay[k] = key;
    i = j;
  }

  // маршрут на карте: города подряд и переезды — с днём и временем из расписания
  const pr = programRoute(R);
  const idxOf = (day: number) => Math.max(0, R.findIndex((x) => x.day === day));
  const stops: Stop[] = pr.stops.map((s) => {
    const ds = s.days.map(idxOf);
    const h = ds.map((d) => (night[d] === s.key ? hotelByDay[d] : null)).find(Boolean);
    return { key: s.key, ru: s.ru, zh: '', lng: s.lng, lat: s.lat, days: ds, side: s.side || 'right', ...(h ? { hotel: h } : {}) };
  });
  const used = new Set<number>();
  const legs: RouteLeg[] = pr.legs.map((l) => {
    if (l.from === 'moscow') return { ...l, how: 'plane', day: 0, time: /вечерн/i.test(p.arrival) ? 'прилёт накануне вечером' : 'прилёт', note: p.arrival ? `Перелёт из Москвы · ${p.arrival}` : 'Перелёт из Москвы' };
    if (l.to === 'moscow') return { ...l, how: 'plane', day: n - 1, time: extraNight ? 'утром следующего дня' : 'вечером', note: p.departure || 'Вылет домой' };
    const k = moves.findIndex((m, j) => m.to === l.to && !used.has(j));
    if (k >= 0) { used.add(k); const m = moves[k]; return { ...l, how: m.how, day: m.day, time: m.t, note: m.note }; }
    const day = stops.find((s) => s.key === l.to)?.days[0] ?? 0;
    return { ...l, day, time: 'утром', note: l.how === 'train' ? 'Скоростной поезд' : 'Внутренний перелёт' };
  });

  // переезды «сегодня» для пульта координатора: отель → визиты и обед → отель
  const today = Math.min(1, n - 1);
  const coordLegs = (d: number): CoordLeg[] => {
    const pts = events[d].filter((e) => e.kind === 'co' || e.kind === 'meal');
    const out: CoordLeg[] = [];
    let from = 'Отель';
    pts.forEach((e, k) => {
      const to = e.kind === 'meal' ? `${e.name} · ${cityRu(d)}` : e.name;
      out.push({ id: `l${k + 1}`, from, to, plan: fromMin(toMin(e.t) - 45), min: 40 });
      from = e.name;
    });
    if (pts.length) out.push({ id: `l${pts.length + 1}`, from, to: 'Отель', plan: fromMin(toMin(pts[pts.length - 1].t) + 90), min: 40 });
    return out;
  };
  const pastLegs = coordLegs(0).slice(0, 2).map((l) => ({ day: `${days[0].wd}, ${dateRu(0)}`, from: l.from, to: l.to, dep: fromMin(toMin(l.plan) + 3), arr: fromMin(toMin(l.plan) + 3 + l.min), min: l.min }));

  const cities = R.map((_, i) => cityRu(i)).filter((c, i, a) => i === 0 || a[i - 1] !== c);
  const companiesN = visits.length;
  const lang = country.lang.ru.split(' ')[0];

  return {
    trip: { title: p.title, dates: `${dateOf(0).getUTCDate()}–${dateRu(n - 1)} ${dateOf(n - 1).getUTCFullYear()}`, route: cities.join(' → '), today, country: p.country, programId: p.id },
    days,
    city: days.map((d) => d.city),
    weather: days.map(() => ({ ...NO_WEATHER })),
    hotels,
    hotelByDay,
    dayNotes: notes,
    meals,
    mealAddr,
    culture: {},
    events,
    contacts: [
      { name: 'Остап Доценко', role: 'Координатор · круглосуточно', phones: ['+7 900 000-00-00'], im: 'WeChat · Telegram · WhatsApp' },
      { name: 'Гид-переводчик', role: `Переводчик: ${lang} — русский`, phones: [], im: 'Имя и контакт пришлёт координатор' },
    ],
    pinned: [{ key: 'trip', title: `Презентация поездки «${p.title}»`, sub: 'От Global Tech Tour · PDF' }],
    materials: [
      { key: 'memo', title: `Памятка: ${country.ru}`, sub: 'Связь, оплата, розетки, приложения · PDF' },
      { key: 'program', title: 'Программа поездки', sub: `${n} ${plural(n, 'день', 'дня', 'дней')}, ${companiesN} ${plural(companiesN, 'компания', 'компании', 'компаний')} · PDF` },
      { key: 'companies', title: 'Справки о компаниях', sub: `${companiesN} ${plural(companiesN, 'карточка', 'карточки', 'карточек')} с сайта globaltechtour.ru` },
    ],
    checklist: [
      { key: 'passport', title: 'Скан паспорта', sub: 'Проверен координатором' },
      { key: 'tickets', title: 'Билеты и страховка', sub: 'Загружены' },
      { key: 'interests', title: 'Отрасль и интересы', sub: 'Что хотите узнать у компаний программы' },
      { key: 'memo', title: `Прочитать памятку: ${country.ru}`, sub: 'Связь, оплата, этикет' },
      { key: 'profile', title: 'Мой профиль: питание, аллергии, номер', sub: 'Учтём в отеле и во всех забронированных ресторанах' },
    ],
    visits,
    coordLegs: coordLegs(today),
    pastLegs,
    stops,
    legs,
    guide: { name: 'Гид-переводчик', role: `${lang} — русский` },
    placesCity: cityRu(today),
    follow: visits.slice(0, 3).map((v) => v.name),
  };
}

export type TripData = ReturnType<typeof buildTrip>;
