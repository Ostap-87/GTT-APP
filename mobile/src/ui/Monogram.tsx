// Знак организатора (white label): загруженный в конструкторе логотип, а пока его нет — монограмма в цветах бренда.
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

import type { Tenant } from '@/data/tenant';
import { F, SH } from './theme';

export function Monogram({ t, size = 44 }: { t: Pick<Tenant, 'logo' | 'short' | 'heroFrom' | 'heroTo'>; size?: number }) {
  if (t.logo) {
    return (
      <View style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', boxShadow: SH.small }}>
        <Image source={{ uri: t.logo }} contentFit="contain" style={{ width: size * 0.8, height: size * 0.8 }} accessibilityIgnoresInvertColors />
      </View>
    );
  }
  return (
    <LinearGradient colors={[t.heroFrom, t.heroTo]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}
      style={{ width: size, height: size, borderRadius: size * 0.32, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: F.display, fontSize: size * 0.42, color: '#fff' }}>{t.short || '•'}</Text>
    </LinearGradient>
  );
}
