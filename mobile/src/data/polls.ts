// Опросы в группе (решение пользователя 27.10.2026): «как доп. функцию, которую может координатор подключить, чтобы можно было
// использовать в нужные моменты, иначе будет неразбериха, так как такие вещи готовятся заранее». Поэтому: функция выключена,
// пока её не включит координатор; опросы готовятся черновиками и уходят делегатам только по кнопке «Запустить».
// Виды: выбор ресторана, дополнительная экскурсия, вопросы к компании перед визитом (делегаты пишут и поддерживают
// чужие, координатор отправляет компании самые популярные), свой опрос. В демо остальные 17 делегатов «отвечают» сами.
import { DELEGATES, ME } from './trip';

export type PollKind = 'restaurant' | 'excursion' | 'questions' | 'custom';
export type PollOption = { id: string; text: string };
export type Question = { id: string; text: string; by: string; at: string; likes: string[] };
export type Poll = {
  id: string; kind: PollKind; title: string; note: string; options: PollOption[];
  status: 'draft' | 'live' | 'closed'; until: string; showResults: boolean; visitId?: string;
  startedAt?: number; closedAt?: number; votes: Record<string, string>; questions: Question[]; sentAt?: string;
};

export const KIND_RU: Record<PollKind, string> = { restaurant: 'Выбор ресторана', excursion: 'Дополнительная экскурсия', questions: 'Вопросы к компании', custom: 'Свой опрос' };
export const KIND_ICON: Record<PollKind, 'food' | 'culture' | 'building' | 'msg'> = { restaurant: 'food', excursion: 'culture', questions: 'building', custom: 'msg' };

const opts = (...t: string[]): PollOption[] => t.map((text, i) => ({ id: `o${i + 1}`, text }));
const SEED_Q: [string, string][] = [
  ['d4', 'Какая доля онлайн-заказов доставляется за 30 минут?'],
  ['d9', 'Как устроена логистика живой рыбы и морепродуктов?'],
  ['d6', 'Сколько позиций в магазине и как часто меняется ассортимент?'],
  ['d12', 'Какие собственные марки продаются лучше всего?'],
  ['d3', 'Как считают окупаемость магазина при доставке из него же?'],
];

/** Новый опрос по шаблону (черновик). */
export function fromTemplate(kind: PollKind, id: string): Poll {
  const base = { id, kind, status: 'draft' as const, showResults: true, votes: {}, questions: [] as Question[] };
  switch (kind) {
    case 'restaurant': return { ...base, title: 'Ужин в среду: куда идём?', note: 'Бронь подтверждаем в 16:00 — ответьте до 15:00.', until: '15:00',
      options: opts('Шанхайская кухня и сяолунбао', 'Хого — горячий котёл', 'Европейская кухня с видом на Бунд') };
    case 'excursion': return { ...base, title: 'Пятница, 16:30: дополнительная программа', note: 'По желанию, после чайной церемонии. Автобус один — решаем большинством.', until: '12:00',
      options: opts('Прогулка на лодке по озеру Сиху · 1,5 ч', 'Пагода Лэйфэн · 1 ч', 'Свободное время в отеле') };
    case 'questions': return { ...base, visitId: 'hema', title: 'Вопросы к Hema (Freshippo) перед визитом', note: 'Пишите свои и поддерживайте чужие — 5 самых популярных координатор отправит компании по-китайски за день до визита.', until: 'вт 20:00',
      options: [], questions: SEED_Q.map(([by, text], i) => ({ id: `q${i + 1}`, text, by, at: '09:00', likes: [] })) };
    default: return { ...base, title: 'Новый опрос', note: '', until: '', options: opts('Вариант 1', 'Вариант 2') };
  }
}

/** Черновики, подготовленные заранее (в демо — к поездке «Новый ритейл Китая»). */
export const DRAFTS0 = (): Poll[] => [fromTemplate('restaurant', 'p1'), fromTemplate('questions', 'p2'), fromTemplate('excursion', 'p3')];

const OTHERS = DELEGATES.filter((d) => d.id !== ME.id).map((d) => d.id);
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Сколько «ответили» вымышленные делегаты к моменту t: 2 сразу, дальше по одному каждые ~6 с, всего до 14 из 17. */
function simCount(p: Poll, t: number) {
  if (!p.startedAt) return 0;
  const end = p.closedAt ?? t;
  return Math.min(14, 2 + Math.floor(Math.max(0, end - p.startedAt) / 6000));
}

/** Голоса: вымышленные + настоящие (Анна на этом телефоне). */
export function votesOf(p: Poll, t = Date.now()): Record<string, string> {
  const out: Record<string, string> = {};
  if (p.kind !== 'questions' && p.options.length) {
    OTHERS.slice(0, simCount(p, t)).forEach((id) => {
      const h = hash(id + p.id);
      // первый вариант чуть популярнее — так итог виден, а не ничья
      const i = h % 10 < 4 ? 0 : h % p.options.length;
      out[id] = p.options[i].id;
    });
  }
  return { ...out, ...p.votes };
}

/** Итог по вариантам, от большего к меньшему. */
export function tally(p: Poll, t = Date.now()) {
  const v = votesOf(p, t);
  const total = Object.keys(v).length;
  const rows = p.options.map((o) => ({ ...o, n: Object.values(v).filter((x) => x === o.id).length })).sort((a, b) => b.n - a.n);
  return { rows, total, left: DELEGATES.length - total };
}

/** Вопросы с поддержками: вымышленные «лайки» растут, пока опрос идёт. */
export function questionsOf(p: Poll, t = Date.now()) {
  const n = simCount(p, t);
  return p.questions.map((q) => {
    const sim = OTHERS.slice(0, n).filter((id) => hash(id + q.id) % 3 === 0 && id !== q.by);
    return { ...q, likes: [...new Set([...sim, ...q.likes])] };
  }).sort((a, b) => b.likes.length - a.likes.length);
}

export const pollLeft = (p: Poll) => (p.until ? `до ${p.until}` : '');
