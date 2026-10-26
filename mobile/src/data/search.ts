// «Поиск по поездке» (решение 21.10.2026): одна строка ищет по расписанию, компаниям, отелям, ресторанам, контактам,
// экстренным номерам, маршруту, памятке, своим заметкам, визиткам, документам и расходам — «где был Meituan»,
// «телефон гида», «паспорт». Всё на телефоне, без интернета.
import type { BizCard } from './card';
import { countryOf } from './countries';
import type { TripDoc } from './docs';
import { docKindRu } from './docs';
import { catRu, money, type Expense } from './expenses';
import { PLACES } from './extras';
import { VISITS } from './group';
import { STOPS, stopDays } from './route';
import { CONTACTS, DAYS, EVENTS, HOTELS, MATERIALS, MEALS, PINNED, TRIP } from './trip';
import type { VNote } from '@/state/visits';

export type Hit = { group: string; title: string; sub: string; href: string | { pathname: string; params: Record<string, string> }; hay: string; tel?: string };
export type Personal = { notesOf: (visit: string) => VNote[]; cards: BizCard[]; docs: TripDoc[]; expenses: Expense[]; myNotes: { text: string; time: string }[] };

export const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е').replace(/[«»"'().,:;!?·—–-]+/g, ' ').replace(/\s+/g, ' ').trim();
const digits = (s: string) => s.replace(/\D/g, '');

/** Все записи поездки, в которых можно искать. */
export function searchIndex(p: Personal): Hit[] {
  const hits: Hit[] = [];
  const add = (group: string, title: string, sub: string, href: Hit['href'], extra = '', tel = '') => hits.push({ group, title, sub, href, hay: norm(`${title} ${sub} ${extra}`), tel });
  const dayRu = (i: number) => `${DAYS[i].wd} ${DAYS[i].n} ноября`;

  EVENTS.forEach((day, i) => day.forEach((e) => {
    const v = e.kind === 'co' ? VISITS.find((x) => x.name === e.name) : undefined;
    const href = v ? `/company/${v.id}` : e.ref?.startsWith('m-') ? `/meal/${e.ref}` : e.ref?.startsWith('c-') ? `/culture/${e.ref}` : { pathname: '/trip/plan', params: { day: String(i) } };
    add('Расписание', `${e.t}  ${e.name}`, `${dayRu(i)} · ${e.place}`, href, DAYS[i].city);
  }));
  VISITS.forEach((v) => add('Компании', v.name, `${v.when}${v.desc ? ` · ${v.desc}` : ''}`, `/company/${v.id}`, `${v.zh || ''} ${v.addr || ''}`));
  Object.entries(HOTELS).forEach(([k, h]) => add('Отели', h.name, `${h.city} · ${h.nights} · ${h.addrRu}`, `/hotel/${k}`, `${h.addrZh} ${h.addrEn} отель гостиница телефон`, digits(h.phone)));
  Object.entries(MEALS).forEach(([k, m]) => add('Рестораны', `${m.title}: ${m.place}`, `${m.when} · ${m.cuisine}`, `/meal/${k}`, 'ресторан еда обед ужин'));
  CONTACTS.forEach((c) => add('Контакты', c.name, `${c.role} · ${c.phones.join(', ') || c.im}`, '/contacts', `${c.im} телефон${/перевод|гид/i.test(c.role) ? ' гид переводчик' : ''}`, c.phones.map(digits).join(' ')));
  const cc = countryOf(TRIP.country);
  cc.emergency.forEach(([n, l]) => add('Экстренные номера', `${n} — ${l}`, cc.ru, '/help', 'экстренный помощь скорая полиция пожар sos'));
  add('Помощь', 'Помощь: карточка на местном языке', 'Позвонить координатору, отправить, где я', '/help', 'потерялся sos помощь где я');
  if (TRIP.country === 'cn') {
    add('Аптеки и фрукты', 'Аптеки: покажите фармацевту', 'Симптомы и лекарства по-китайски, ближайшая аптека на карте', '/pharmacy', 'аптека лекарство таблетки болит голова температура простуда кашель диарея аллергия 药店 pharmacy');
    add('Аптеки и фрукты', 'Еда и места рядом', 'Рестораны, кафе, достопримечательности и ТЦ рядом — по-русски; отзывы в Dianping, доставка в Meituan', '/around', 'ресторан кафе еда поесть кофе чай достопримечательности музей парк храм торговый центр dianping meituan 美食 大众点评 美团');
    add('Аптеки и фрукты', 'Фруктовые лавки', 'Цена за 斤 = 500 г, фразы продавцу, фрукты на вес и нарезка с фото, сезоны', '/fruit', 'фрукты фруктовая лавка рынок манго личи дуриан арбуз нарезка нарезанные джекфрут 水果 果切 fruit');
  }
  STOPS.forEach((s) => add('Маршрут', s.ru, `${stopDays(s)}${s.zh ? ` · ${s.zh}` : ''}`, '/route', 'город маршрут'));
  cc.prep.forEach((x) => add('Памятка', x.title, x.sub, { pathname: '/country/[code]', params: { code: cc.code } }, x.how.join(' ')));
  cc.apps.forEach((a) => add('Приложения', a.name, a.what, { pathname: '/country/[code]', params: { code: cc.code } }, a.zh || ''));
  Object.values(PLACES).flat().forEach((pl) => add('Город', pl.ru, `${pl.what} · ${pl.hours}`, `/place/${pl.id}`, `${pl.zh} ${pl.en}`));
  [...PINNED, ...MATERIALS].forEach((m) => add('Материалы', m.title, m.sub, '/trip/library'));

  VISITS.forEach((v) => p.notesOf(v.id).forEach((n) => {
    const text = n.text || (n.kind === 'voice' ? 'голосовая заметка' : n.kind === 'photo' ? 'фото' : '');
    add('Мои заметки', text.slice(0, 120), `${v.name} · ${n.at}`, `/company/${v.id}`, text);
  }));
  p.myNotes.forEach((n) => add('Мои заметки', n.text.slice(0, 120), `Материалы · ${n.time}`, '/trip/library', n.text));
  p.cards.forEach((c) => add('Визитки', c.latin || c.name || 'Без имени', [c.titleRu || c.title, c.companyRu || c.company, c.phones[0]].filter(Boolean).join(' · '),
    { pathname: '/card-scan', params: { visit: c.visit, id: c.id } }, `${c.name} ${c.company} ${c.title} ${c.email} ${c.wechat} визитка телефон`, c.phones.map(digits).join(' ')));
  p.docs.forEach((d) => add('Документы', d.title, `${docKindRu(d.kind)} · ${d.at}`, `/doc/${d.id}`, 'документ'));
  p.expenses.filter((e) => e.trip === (TRIP.programId || 'demo')).forEach((e) => add('Расходы', `${money(e.amount)} ${e.sym} · ${catRu(e.cat)}`, e.note || new Date(e.at).toLocaleDateString('ru-RU'), '/expenses', 'расход чек'));
  return hits;
}

const STOP = new Set(['где', 'был', 'была', 'были', 'было', 'когда', 'как', 'какой', 'какая', 'какие', 'мой', 'моя', 'мои', 'что', 'это', 'в', 'на', 'с', 'у', 'к', 'по', 'и', 'про']);
const ORDER = ['Контакты', 'Экстренные номера', 'Помощь', 'Компании', 'Расписание', 'Отели', 'Рестораны', 'Документы', 'Визитки', 'Мои заметки', 'Расходы', 'Маршрут'];

/** Все слова запроса должны найтись; телефон ищется и по цифрам. Сверху — совпадения в названии. */
export function search(index: Hit[], q: string): Hit[] {
  const words = norm(q).split(' ').filter((w) => w && !STOP.has(w));
  if (!words.length) return [];
  const qd = digits(q);
  // падежи: «гида» найдёт «гид», «отеля» — «отель», «паспорта» — «паспорт»
  const has = (hay: string, w: string) => hay.includes(w) || (w.length >= 4 && hay.includes(w.slice(0, -1))) || (w.length >= 6 && hay.includes(w.slice(0, -2)));
  const found = index.filter((h) => words.every((w) => has(h.hay, w)) || (qd.length >= 4 && !!h.tel && h.tel.includes(qd)));
  const rank = (g: string) => { const i = ORDER.indexOf(g); return i < 0 ? ORDER.length : i; };
  const score = (h: Hit) => (has(norm(h.title), words[0]) ? 0 : 100) + rank(h.group);
  return found.sort((a, b) => score(a) - score(b)).slice(0, 80);
}
