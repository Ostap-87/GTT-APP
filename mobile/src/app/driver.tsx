// «Показать водителю»: адрес на местном языке крупно и фраза «Отвезите меня сюда» на языке страны поездки.
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { countryOf } from '@/data/countries';
import { TRIP } from '@/data/trip';
import { C, F } from '@/ui/theme';

export default function Driver() {
  const { zh, ru } = useLocalSearchParams<{ zh: string; ru?: string }>();
  return (
    <View style={{ flex: 1, backgroundColor: C.card, padding: 24, justifyContent: 'center', gap: 18 }}>
      <Text style={{ fontFamily: F.medium, fontSize: 18, color: C.muted, textAlign: 'center' }}>{`${countryOf(TRIP.country).lang.driver} · Отвезите меня сюда`}</Text>
      <Text selectable style={{ fontSize: 40, lineHeight: 54, fontWeight: '700', color: C.ink, textAlign: 'center' }}>{zh}</Text>
      {ru ? <Text style={{ fontFamily: F.regular, fontSize: 15, color: C.muted, textAlign: 'center' }}>{ru}</Text> : null}
      <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.muted, textAlign: 'center' }}>Покажите экран водителю такси</Text>
    </View>
  );
}
