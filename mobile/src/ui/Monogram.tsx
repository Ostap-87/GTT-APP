// Монограмма организатора (white label) в цветах его бренда — пока у клиента нет загруженного логотипа.
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from 'react-native';

import type { Tenant } from '@/data/tenant';
import { F } from './theme';

export function Monogram({ t, size = 44 }: { t: Tenant; size?: number }) {
  return (
    <LinearGradient colors={[t.heroFrom, t.heroTo]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}
      style={{ width: size, height: size, borderRadius: size * 0.32, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: F.display, fontSize: size * 0.42, color: '#fff' }}>{t.short}</Text>
    </LinearGradient>
  );
}

