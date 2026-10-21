// White label (решение 21.10.2026: «давай начнём делать»). Организатор поездок — клиент платформы: у него свой бренд
// (название, монограмма, цвета, координатор), рыночный пакет (страна, откуда едут участники) и регион хранения данных.
// Участник попадает к своему организатору по коду приглашения; первый организатор — сам GTT. Разбор — docs/market-research.md.
import { C, SH } from '@/ui/theme';

/** Где хранятся данные участников клиента: Россия (152-ФЗ), Китай, Казахстан, ЕС, Ближний Восток, США. */
export type DataRegion = 'ru' | 'cn' | 'kz' | 'eu' | 'me' | 'us';
export const REGION_RU: Record<DataRegion, string> = { ru: 'Россия', cn: 'Китай', kz: 'Казахстан', eu: 'Евросоюз', me: 'Ближний Восток', us: 'США' };

export type Tenant = {
  id: string;
  name: string;
  /** Монограмма на заставке и в шапке. */
  short: string;
  tagline: string;
  /** Код приглашения, по которому участник открывает поездки организатора. */
  code: string;
  accent: string;
  accentInk: string;
  accentSoft: string;
  heroFrom: string;
  heroTo: string;
  /** accent в виде «r, g, b» — для теней. */
  rgb: string;
  /** Объёмные значки вкладок — свой набор есть только у GTT; у остальных контурные в цвете бренда. */
  icons3d: boolean;
  coordinator: { name: string; initials: string };
  /** Рыночный пакет: страна, откуда едут участники (язык, валюта отчёта, мессенджеры). Пока только Россия. */
  home: 'ru';
  region: DataRegion;
  /** Пример бренда для показа клиентам, а не настоящий организатор. */
  demo?: boolean;
};

export const TENANTS: Tenant[] = [
  {
    id: 'gtt', name: 'Global Tech Tour', short: 'GTT', tagline: 'Экспедиции к лидерам технологий', code: 'GTT',
    accent: '#1a73e8', accentInk: '#1558b8', accentSoft: '#dde8fb', heroFrom: '#2b80f2', heroTo: '#0f4fc0', rgb: '26, 115, 232',
    icons3d: true, coordinator: { name: 'Остап Доценко', initials: 'ОД' }, home: 'ru', region: 'ru',
  },
  {
    id: 'demo', name: 'Ваш бренд', short: 'ВБ', tagline: 'Так выглядит приложение под брендом организатора', code: 'DEMO',
    accent: '#0f8a6c', accentInk: '#0b6b54', accentSoft: '#d6efe7', heroFrom: '#1aa585', heroTo: '#0b6b54', rgb: '15, 138, 108',
    icons3d: false, coordinator: { name: 'Мария Иванова', initials: 'МИ' }, home: 'ru', region: 'ru', demo: true,
  },
];

/** Текущий организатор. Меняется на месте (как данные поездки в active.ts), экраны пересобираются через gen в _layout. */
export const TENANT: Tenant = { ...TENANTS[0] };

export const tenantByCode = (code: string) => TENANTS.find((t) => t.code.toLowerCase() === code.trim().toLowerCase());

/** Включает бренд организатора: цвета и тени темы берутся из него. Возвращает id, который сохраняется на телефоне. */
export function applyTenant(id: string | null | undefined) {
  const t = TENANTS.find((x) => x.id === id) || TENANTS[0];
  Object.assign(TENANT, t);
  Object.assign(C as unknown as Record<string, string>, { blue: t.accent, blueInk: t.accentInk, blueSoft: t.accentSoft, heroFrom: t.heroFrom, heroTo: t.heroTo });
  Object.assign(SH as unknown as Record<string, string>, {
    blue: `0px 8px 16px rgba(${t.rgb}, 0.32), inset -2px -3px 6px rgba(0, 0, 0, 0.12), inset 2px 2px 5px rgba(255, 255, 255, 0.25)`,
    hero: `0px 14px 30px rgba(${t.rgb}, 0.32), -6px -6px 16px #ffffff`,
  });
  return t.id;
}
