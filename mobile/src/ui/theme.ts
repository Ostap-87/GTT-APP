// Цвета и шрифты — как у сайта, презентаций и прототипа GTT (синий #1a73e8, Inter, Sofia Sans Extra Condensed).
// Стиль «пластилин» (решение 21.10.2026): мягкий серо-голубой фон, выпуклые карточки без рамок, вдавленные поля ввода.
export const C = {
  bg: '#e8edf4',
  card: '#eef2f8',
  ink: '#0f1b2d',
  muted: '#5b6576',
  line: '#d6dde8',
  line2: '#dfe5ee',
  blue: '#1a73e8',
  blueInk: '#1558b8',
  blueSoft: '#dde8fb',
  ok: '#1e6b45',
  okSoft: '#dcf1e4',
  warn: '#a2470a',
  warnSoft: '#fdeadb',
  warnLine: '#ffd2b0',
  orange: '#ffb27a',
  green: '#1e8e5a',
  violet: '#7048e8',
  dark: '#0f1b2d',
  dark2: '#233350',
  onDark: '#c9d4e8',
  red: '#c5321b',
  well: '#e3e9f2',
} as const;

/** Тени «пластилина»: свет сверху слева, тень снизу справа; inset — вдавленное поле. */
export const SH = {
  clay: '8px 8px 18px #cdd5e1, -8px -8px 18px #ffffff',
  small: '4px 4px 10px #cdd5e1, -4px -4px 10px #ffffff',
  inset: 'inset 3px 3px 6px #cdd5e1, inset -3px -3px 6px #ffffff',
  blue: '0px 8px 16px rgba(26, 115, 232, 0.32), inset -2px -3px 6px rgba(0, 0, 0, 0.12), inset 2px 2px 5px rgba(255, 255, 255, 0.25)',
  dark: '6px 8px 18px rgba(15, 27, 45, 0.28), -6px -6px 14px #ffffff',
  hero: '0px 14px 30px rgba(26, 115, 232, 0.32), -6px -6px 16px #ffffff',
  float: '0px 12px 34px rgba(15, 27, 45, 0.16)',
} as const;

export const F = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  display: 'SofiaSansExtraCondensed_800ExtraBold',
} as const;
