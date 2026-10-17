// Агент (турагентства и агенты-партнёры, решение 16.10.2026) — как в прототипе: выезды и места, заявки, запрос на расчёт.
// Программы — из каталога сайта (catalog.json). Выезды, места и агентство — пример; в приложении их ведёт координатор.
import catalog from './catalog.json';
import { COUNTRY_RU } from './catalog-meta';

export type Tour = (typeof catalog)[number];
export const tourById: Record<string, Tour> = Object.fromEntries(catalog.map((t) => [t.id, t]));

export const AGENCY = '«Пример Тревел»';
export const AGENT_NAME = 'Ирина Миронова';

export type Dep = { id: string; tour: string; dates: string; short: string; month: string; total: number; taken: number };
export const DEPS: Dep[] = [
  { id: 'dep1', tour: 'china-retail-showrooms-expedition', dates: '9–14 ноября 2026', short: '9–14 ноя', month: '11', total: 18, taken: 18 },
  { id: 'dep2', tour: 'china-auto-plants-expedition', dates: '23–27 ноября 2026', short: '23–27 ноя', month: '11', total: 20, taken: 13 },
  { id: 'dep3', tour: 'china-ai-expedition', dates: '7–11 декабря 2026', short: '7–11 дек', month: '12', total: 20, taken: 8 },
  { id: 'dep4', tour: 'robotics-expedition', dates: '14–18 декабря 2026', short: '14–18 дек', month: '12', total: 20, taken: 16 },
  { id: 'dep5', tour: 'china-beauty-antiage-expedition', dates: '18–22 января 2027', short: '18–22 янв', month: '01', total: 20, taken: 5 },
  { id: 'dep6', tour: 'korea-beauty-industry-expedition', dates: '1–5 февраля 2027', short: '1–5 фев', month: '02', total: 20, taken: 6 },
  { id: 'dep7', tour: 'thailand-retail-expedition', dates: '22–27 февраля 2027', short: '22–27 фев', month: '02', total: 20, taken: 4 },
  { id: 'dep8', tour: 'uae-fintech-expedition', dates: '9–13 марта 2027', short: '9–13 мар', month: '03', total: 20, taken: 2 },
  { id: 'dep9', tour: 'japan-retail-expedition', dates: '15–20 марта 2027', short: '15–20 мар', month: '03', total: 20, taken: 0 },
];
export const depById: Record<string, Dep> = Object.fromEntries(DEPS.map((d) => [d.id, d]));
export const depsOf = (tour: string) => DEPS.filter((d) => d.tour === tour);
export const MONTHS = [['all', 'Все'], ['11', 'Ноябрь'], ['12', 'Декабрь'], ['01', 'Январь'], ['02', 'Февраль'], ['03', 'Март']] as const;
export const MONTH_FULL: Record<string, string> = { '11': 'Ноябрь 2026', '12': 'Декабрь 2026', '01': 'Январь 2027', '02': 'Февраль 2027', '03': 'Март 2027' };

/** Гражданство делегации: Россия и страны СНГ — чтобы сразу видеть, кому нужна виза. */
export const CIS = [['ru', 'Россия'], ['by', 'Беларусь'], ['kz', 'Казахстан'], ['uz', 'Узбекистан'], ['kg', 'Кыргызстан'], ['tj', 'Таджикистан'], ['am', 'Армения'], ['az', 'Азербайджан'], ['md', 'Молдова'], ['tm', 'Туркменистан'], ['other', 'Другая страна']] as const;
export const CIS_RU: Record<string, string> = Object.fromEntries(CIS);
export const SECTORS = ['Ритейл', 'Автопром', 'ИИ и IT', 'Роботы', 'Еда и напитки', 'Бьюти', 'Медицина и фарма', 'Финтех', 'Логистика', 'Производство', 'Энергетика', 'Недвижимость', 'Гостиничный бизнес'];
export const GOALS = ['Поиск поставщиков', 'Партнёрство и дистрибуция', 'Опыт и технологии', 'Инвестиции', 'Нетворкинг'];
export const LEVELS = ['Собственники', 'Топ-менеджмент', 'Специалисты', 'Смешанная'];
export const FROM_CITY = ['Москва', 'Санкт-Петербург', 'Алматы', 'Ташкент', 'Минск', 'Другой'];
export const INCL = [['visa', 'Визовая поддержка'], ['transfer', 'Трансферы'], ['meals', 'Питание'], ['interp', 'Переводчик'], ['culture', 'Культурная программа'], ['ins', 'Страховка'], ['media', 'Фото и видео'], ['b2b', 'B2B-встречи']] as const;
export const INCL_RU: Record<string, string> = Object.fromEntries(INCL);
export const DUE = ['1–2 дня', '3–5 дней', 'Неделя'];

export type AppStatus = 'new' | 'work' | 'confirmed';
export const APP_ST: Record<AppStatus, ['info' | 'warn' | 'ok', string]> = { new: ['info', 'отправлена'], work: ['warn', 'в работе'], confirmed: ['ok', 'подтверждена'] };
export type CalcStatus = 'new' | 'calc' | 'done';
export const CALC_ST: Record<CalcStatus, ['info' | 'warn' | 'ok', string]> = { new: ['info', 'отправлен'], calc: ['warn', 'считаем'], done: ['ok', 'расчёт готов'] };

export type AgentApp = { id: string; agency: string; tour: string; dep: string | null; dates: string; people: number; client: string; cit: string; status: AppStatus; note: string; time: string; mine: boolean; upd: boolean };
export type Cit = { c: string; n: number };
export type CalcReq = {
  id: string; mode: 'ready' | 'custom'; tour: string; country: string; cities: string; changes: string; sectors: string[]; goals: string[]; companies: string[]; pickCos: boolean;
  people: number; cit: Cit[]; level: string; lang: string; dates: string; days: string; from: string; flight: boolean; hotel: string; room: string; incl: string[];
  client: string; budget: string; due: string; note: string; file: boolean; status: CalcStatus; time: string; upd: boolean;
};

export const SEED_APPS: AgentApp[] = [
  { id: 'ap0', agency: AGENCY, tour: 'korea-tech-internet-giants-expedition', dep: null, dates: '12–16 апреля 2027 · под группу', people: 12, client: 'Сеть магазинов электроники · Казань', cit: 'ru', status: 'confirmed', note: 'Даты согласованы, договор отправлен на почту агентства', time: '02.10', mine: true, upd: false },
  { id: 'ap1', agency: AGENCY, tour: 'china-auto-plants-expedition', dep: 'dep2', dates: '23–27 ноября 2026', people: 4, client: 'Автодилер · Екатеринбург', cit: 'ru', status: 'work', note: 'Остап Доценко: проверяю места в автобусе, отвечу сегодня', time: 'вчера', mine: true, upd: false },
  // Заявки других агентов и с формы сайта — их видит только координатор
  { id: 'o1', agency: '«Восток Тур»', tour: 'china-ai-expedition', dep: 'dep3', dates: '7–11 декабря 2026', people: 6, client: 'IT-интегратор · Москва', cit: 'ru', status: 'work', note: '', time: '14.10', mine: false, upd: false },
  { id: 'o2', agency: 'Сайт globaltechtour.ru', tour: 'china-tech-giants-expedition', dep: null, dates: 'даты под группу', people: 10, client: 'Заявка с формы сайта', cit: 'ru', status: 'new', note: '', time: 'сегодня', mine: false, upd: false },
];

export const SEED_CALC: CalcReq[] = [
  { id: 'R-014', mode: 'custom', tour: '', country: 'cn', cities: '', changes: '', sectors: ['Медицина и фарма'], goals: ['Опыт и технологии'], companies: ['Mindray', 'United Imaging'], pickCos: true, people: 9, cit: [{ c: 'ru', n: 7 }, { c: 'kz', n: 2 }], level: 'Собственники', lang: 'Русский', dates: 'март 2027', days: '6', from: 'Москва', flight: true, hotel: '5★', room: 'Одноместное', incl: ['visa', 'transfer', 'meals', 'interp', 'b2b'], client: 'Сеть клиник · Самара', budget: '', due: 'Неделя', note: 'Интересуют производство оборудования и частные клиники', file: true, status: 'done', time: '08.10', upd: false },
];

/** Поля для агента подготовлены, значения не заданы (решение 16.10.2026) — заполняем только по решению пользователя. */
export const AGENT_PRICE: string | null = null;
export const AGENT_FEE: string | null = null;

export const citLine = (cit: Cit[]) => cit.filter((r) => r.c).map((r) => `${CIS_RU[r.c]}${r.n ? ` ${r.n}` : ''}`).join(', ') || 'гражданство не указано';


export const calcTitle = (r: Pick<CalcReq, 'mode' | 'tour' | 'country' | 'sectors'>) =>
  r.mode === 'ready' && r.tour ? tourById[r.tour].title : `Своя программа: ${COUNTRY_RU[r.country]}${r.sectors.length ? ` · ${r.sectors.slice(0, 2).join(', ')}` : ''}`;

/** Черновик запроса на расчёт — блоки конструктора агента. */
export type CalcDraft = {
  mode: 'ready' | 'custom'; tour: string; dep: string; country: string; cities: string; changes: string; sectors: string[]; goals: string[]; companies: string[]; pickCos: boolean;
  people: string; cit: { c: string; n: string }[]; level: string; lang: string; dates: string; days: string; from: string; flight: boolean; hotel: string; room: string; incl: string[];
  client: string; budget: string; due: string; note: string; file: boolean;
};
export const freshCalc = (): CalcDraft => ({
  mode: 'ready', tour: '', dep: '', country: 'cn', cities: '', changes: '', sectors: [], goals: [], companies: [], pickCos: true, people: '', cit: [{ c: 'ru', n: '' }],
  level: 'Топ-менеджмент', lang: 'Русский', dates: '', days: '', from: 'Москва', flight: true, hotel: '5★', room: 'Одноместное', incl: ['visa', 'transfer', 'meals', 'interp'],
  client: '', budget: '', due: '3–5 дней', note: '', file: false,
});
