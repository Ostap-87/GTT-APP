// Группа глазами координатора (как в прототипе v9): профили остальных делегатов, этапы анкеты, переезды дня, шаблоны
// объявлений, визиты компаний. Все люди вымышленные; телефоны — примеры.
import { DELEGATES, type Delegate } from './trip';
import { ALLERGENS, DIET_OPTS, type Profile } from './profile';

const PF = (diets: string[], alg: string[], severe: boolean, room: Profile['room'], mate: string, eng: Profile['eng'], msg: Profile['msg'], interests: string[], health: string[] = [], healthNote = ''): Profile =>
  ({ diets, algOn: alg.length > 0, alg, algOther: '', severe, room, mate, eng, msg, interests, health, healthNote, consent: true, keep: true, saved: true });

/** Профили остальных делегатов; у d16 и d17 профиль ещё не заполнен (видно «Напомнить»). */
export const PROFILES: Record<string, Profile> = {
  d2: PF(['none'], [], false, 'single', '', 'fluent', 'Telegram', ['Доставка', 'Технологии']),
  d3: PF(['veg'], [], false, 'double', 'd13', 'basic', 'WhatsApp', ['Поставщики', 'Собственные марки']),
  d4: PF(['pork'], ['shellfish'], false, 'single', '', 'fluent', 'Telegram', ['Инвестиции', 'Автоматизация']),
  d5: PF(['spicy'], ['peanut', 'sesame'], true, 'double', 'd9', 'fluent', 'Telegram', ['Маркетинг', 'Доставка'], [], 'Ношу с собой адреналин (EpiPen)'),
  d6: PF(['halal'], [], false, 'single', '', 'no', 'WhatsApp', ['Логистика и склады', 'Автоматизация']),
  d7: PF(['none'], [], false, 'double', 'd1', 'basic', 'Telegram', ['Поставщики', 'Собственные марки']),
  d8: PF(['none'], [], false, 'double', 'd14', 'basic', 'Telegram', ['Логистика и склады'], ['Укачивает в транспорте']),
  d9: PF(['spicy', 'lactose'], [], false, 'double', 'd5', 'fluent', 'Telegram', ['Маркетинг', 'Технологии']),
  d10: PF(['none'], [], false, 'single', '', 'basic', 'WhatsApp', ['Поставщики', 'Технологии']),
  d11: PF(['vegan'], ['nuts'], false, 'double', 'd18', 'fluent', 'Telegram', ['Собственные марки', 'Поставщики']),
  d12: PF(['pork', 'beef'], [], false, 'single', '', 'no', 'WhatsApp', ['Автоматизация', 'Поставщики'], ['Тяжело долго ходить']),
  d13: PF(['veg'], ['shellfish'], false, 'double', 'd3', 'basic', 'Telegram', ['Логистика и склады', 'Поставщики']),
  d14: PF(['spicy'], [], false, 'double', 'd8', 'basic', 'Telegram', ['Автоматизация', 'Технологии']),
  d15: PF(['none'], [], false, 'single', '', 'fluent', 'Telegram', ['Инвестиции', 'Технологии']),
  d18: PF(['sea'], [], false, 'double', 'd11', 'fluent', 'Telegram', ['Маркетинг', 'Технологии']),
};

/** Путь профиля (CJM): приглашён → заполняет → ждёт проверки → проверен. d16 не открыл приглашение, d17 заполняет. */
export const NOT_READY: Record<string, { st: 'invited' | 'filling'; text: string; sub: string }> = {
  d16: { st: 'invited', text: 'не открыл приглашение', sub: 'Ссылка отправлена 20.10 в WhatsApp, напоминание — 23.10' },
  d17: { st: 'filling', text: 'заполняет · шаг 3 из 4', sub: 'Начал 24.10, остановился на «Проживании и здоровье»' },
};

export const BASE_HISTORY: Record<string, [string, string][]> = {
  d5: [['10.11, 21:40', 'Марина: добавила аллергию «кунжут», отметила «серьёзная»'], ['10.11, 21:45', 'Система: координатору — уведомление, сводка ресторанам устарела'], ['28.10', 'Остап: проверено'], ['24.10', 'Марина: заполнила профиль']],
  d4: [['06.11', 'Остап: проверено'], ['05.11', 'Игорь: заполнил профиль']],
};

export const byId: Record<string, Delegate> = Object.fromEntries(DELEGATES.map((d) => [d.id, d]));
/** Род для «заполнил / заполнила». */
export const fem = (id: string) => /[ая]$/.test(byId[id].ru.split(' ')[0]);
export const firstName = (id: string) => byId[id].ru.split(' ')[0];
export const phoneOf = (id: string) => `+7 900 000-00-${String(Number(id.slice(1))).padStart(2, '0')} (пример)`;
/** Имя для отеля — как в паспорте: SMIRNOVA Anna. */
export const passportName = (id: string) => byId[id].lat.split(' ').reverse().map((w, i) => (i === 0 ? w.toUpperCase() : w)).join(' ');

export const DIET_BY = Object.fromEntries(DIET_OPTS.map((x) => [x[0], x]));
export const ALG_BY = Object.fromEntries(ALLERGENS.map((x) => [x[0], x]));

// ——— Переезды (решение пользователя 16.10.2026): «Выехали» и «Прибыли», время в пути — в журнал ———
export type Leg = { id: string; from: string; to: string; plan: string; min: number };
export const LEGS: Leg[] = [
  { id: 'l1', from: 'Отель', to: 'JD.com', plan: '09:30', min: 55 },
  { id: 'l2', from: 'JD.com', to: 'Обед · кантонская кухня', plan: '12:40', min: 20 },
  { id: 'l3', from: 'Обед', to: 'Meituan', plan: '14:45', min: 45 },
  { id: 'l4', from: 'Meituan', to: 'Ужин · хого', plan: '18:15', min: 45 },
  { id: 'l5', from: 'Ужин', to: 'Отель', plan: '21:00', min: 30 },
];
export const PAST_LEGS: { day: string; from: string; to: string; dep: string; arr: string; min: number }[] = [
  { day: 'Пн, 9 ноября', from: 'Аэропорт', to: 'Отель', dep: '14:20', arr: '15:35', min: 60 },
  { day: 'Пн, 9 ноября', from: 'Отель', to: 'Ужин · пекинская утка', dep: '19:02', arr: '19:24', min: 20 },
];
export const toMin = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
export const fromMin = (n: number) => { const x = ((n % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };
export const dur = (m: number) => (m < 60 ? `${m} мин` : `${Math.floor(m / 60)} ч${m % 60 ? ` ${m % 60} мин` : ''}`);
export const diffTxt = (fact: number, plan: number) => { const d = fact - plan; return d === 0 ? 'ровно по плану' : d > 0 ? `+${d} мин к плану` : `на ${-d} мин быстрее плана`; };
export const plural = (n: number, a: string, b: string, c: string) => { const m10 = n % 10; const m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c; };

// ——— Визиты: что видит координатор по компаниям поездки ———
/** zh — название для водителя, desc — справка с сайта, place — где (у программ с сайта). */
export type Visit = { id: string; name: string; when: string; st: ['ok' | 'warn' | 'info', string]; zh?: string; addr?: string; desc?: string };
export const VISITS: Visit[] = [
  { id: 'jd', name: 'JD.com', when: 'Вт 10 · 10:30', st: ['ok', 'подтверждено'], zh: '京东集团总部', addr: 'Штаб-квартира JD.com, Пекин' },
  { id: 'meituan', name: 'Meituan', when: 'Вт 10 · 15:30', st: ['ok', 'перенос согласован'] },
  { id: 'hema', name: 'Hema (Freshippo)', when: 'Ср 11 · 13:30', st: ['warn', 'предлагает 14:00'] },
  { id: 'pdd', name: 'Pinduoduo', when: 'Ср 11 · 16:30', st: ['warn', 'ссылку не открыли'] },
  { id: 'rtmart', name: 'RT-Mart', when: 'Чт 12 · 10:00', st: ['ok', 'подтверждено'] },
  { id: 'eleme', name: 'Ele.me', when: 'Чт 12 · 14:30', st: ['ok', 'подтверждено'] },
  { id: 'alibaba', name: 'Alibaba', when: 'Пт 13 · 11:00', st: ['ok', 'подтверждено'] },
  { id: 'sams', name: "Sam's Club", when: 'Сб 14 · 10:00', st: ['ok', 'подтверждено'] },
  { id: 'yonghui', name: 'Yonghui', when: 'Сб 14 · 14:00', st: ['ok', 'подтверждено'] },
];

// ——— Объявления ———
export const TEMPLATES = [
  { key: 'late', label: 'Задержка 10 мин', ru: 'Автобус задерживается на 10 минут: выезд в 09:40.', zh: '大巴推迟10分钟，09:40出发。' },
  { key: 'lobby', label: 'Сбор в лобби', ru: 'Сбор в лобби отеля в 09:20, не опаздывайте.', zh: '代表团09:20在酒店大堂集合。' },
  { key: 'meituan', label: 'Перенос встречи', ru: 'Встреча в Meituan перенесена на 15:30. Автобус от JD.com — в 14:50.', zh: '美团的会面改到15:30，14:50从京东出发。' },
] as const;

/** Демо-время пульта: вторник, 10 ноября, утро. */
export const NOW = '09:05';
