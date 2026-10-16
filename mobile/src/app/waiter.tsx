// Карточка для официанта: аллергии и питание по-китайски крупно, ниже перевод (из «Моего профиля»).
import { Text, View } from 'react-native';

import { waiterText } from '@/data/profile';
import { useTrip } from '@/state/trip';
import { C, F } from '@/ui/theme';

export default function Waiter() {
  const { profile } = useTrip();
  const w = waiterText(profile);
  return (
    <View style={{ flex: 1, backgroundColor: C.card, padding: 24, justifyContent: 'center', gap: 18 }}>
      <Text style={{ fontFamily: F.medium, fontSize: 16, color: C.muted, textAlign: 'center' }}>请看一下 · Покажите официанту</Text>
      <Text selectable style={{ fontSize: 28, lineHeight: 42, fontWeight: '700', color: C.ink }}>{w.zh}</Text>
      <Text style={{ fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.muted }}>{w.ru}</Text>
      <Text style={{ fontFamily: F.regular, fontSize: 12.5, color: C.muted }}>Китайский текст проверит переводчик группы{profile.algOther.trim() ? '; «Другое» он переведёт сам' : ''}.</Text>
    </View>
  );
}
