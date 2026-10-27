// Бренд приложения GTT: название, цвета, координатор, блоки экрана «Сегодня» и плитки «Под рукой».
// Цвета темы берутся отсюда при запуске (applyTenant). White label — другие организаторы, коды приглашения, конструктор —
// живёт отдельно, в репозитории Ostap-87/GTT-PLATFORM (решение пользователя 21.10.2026: «чтобы они не смешивались»).
import type { IconName } from '@/ui/icon-paths';
import { C, SH } from '@/ui/theme';

/** Блоки экрана «Сегодня» в порядке показа. */
export type TodayBlock = 'now' | 'next' | 'ann' | 'poll' | 'tools' | 'coord' | 'weather' | 'route';
const ALL_BLOCKS: TodayBlock[] = ['now', 'next', 'ann', 'poll', 'tools', 'coord', 'weather', 'route'];
/** Плитки «Под рукой»: ключ, подпись, значок, экран. */
export type ToolKey = 'translator' | 'docs' | 'help' | 'expenses' | 'city' | 'guide' | 'cards' | 'chat' | 'map';
export const TOOLS: [ToolKey, string, IconName, string][] = [
  ['translator', 'Переводчик', 'translate', '/translator'], ['docs', 'Документы', 'passport', '/docs'], ['help', 'Помощь', 'help', '/help'],
  ['expenses', 'Расходы', 'receipt', '/expenses'], ['city', 'Город', 'building', '/city'], ['guide', 'Гид', 'headphones', '/guide'],
  ['cards', 'Визитки', 'card', '/cards'], ['chat', 'Чат', 'chat', '/chat'], ['map', 'Карта без интернета', 'map', '/offline-map'],
];

export type Tenant = {
  id: string;
  name: string;
  /** Монограмма. */
  short: string;
  tagline: string;
  accent: string;
  accentInk: string;
  accentSoft: string;
  heroFrom: string;
  heroTo: string;
  /** accent в виде «r, g, b» — для теней. */
  rgb: string;
  /** Объёмные значки вкладок. */
  icons3d: boolean;
  coordinator: { name: string; initials: string };
  /** Телефон координатора для кнопки «Позвонить» (нет — экран «Контакты»). */
  phone?: string;
  /** Блоки «Сегодня» в порядке показа; on: false — блок скрыт. */
  blocks: { key: TodayBlock; on: boolean }[];
  tools: ToolKey[];
  /** Необязательные вкладки делегата. */
  tabs: { library: boolean; people: boolean };
};

const GTT: Tenant = {
  id: 'gtt', name: 'Global Tech Tour', short: 'GTT', tagline: 'Экспедиции к лидерам технологий',
  accent: '#1a73e8', accentInk: '#1558b8', accentSoft: '#dde8fb', heroFrom: '#2b80f2', heroTo: '#0f4fc0', rgb: '26, 115, 232',
  icons3d: true, coordinator: { name: 'Остап Доценко', initials: 'ОД' },
  blocks: ALL_BLOCKS.map((key) => ({ key, on: true })), tools: ['translator', 'docs', 'help', 'expenses', 'city', 'guide', 'map'],
  tabs: { library: true, people: true },
};

/** Бренд, который сейчас применён к теме. */
export const TENANT: Tenant = { ...GTT };

/** Применяет бренд к цветам и теням темы. Возвращает id. */
export function applyTenant() {
  const t = GTT;
  Object.assign(TENANT, t);
  Object.assign(C as unknown as Record<string, string>, { blue: t.accent, blueInk: t.accentInk, blueSoft: t.accentSoft, heroFrom: t.heroFrom, heroTo: t.heroTo });
  Object.assign(SH as unknown as Record<string, string>, {
    blue: `0px 8px 16px rgba(${t.rgb}, 0.32), inset -2px -3px 6px rgba(0, 0, 0, 0.12), inset 2px 2px 5px rgba(255, 255, 255, 0.25)`,
    hero: `0px 14px 30px rgba(${t.rgb}, 0.32), -6px -6px 16px #ffffff`,
  });
  return t.id;
}
