import { SvgXml } from 'react-native-svg';

import { ICONS, type IconName } from './icon-paths';
import { C } from './theme';

export function Icon({ name, size = 22, color = C.ink }: { name: IconName; size?: number; color?: string }) {
  const xml = `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
  return <SvgXml xml={xml} width={size} height={size} />;
}
