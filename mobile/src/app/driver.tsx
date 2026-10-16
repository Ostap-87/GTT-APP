// «Показать водителю»: адрес по-китайски крупно и фраза «Отвезите меня сюда».
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { C, F } from '@/ui/theme';

export default function Driver() {
  const { zh, ru } = useLocalSearchParams<{ zh: string; ru?: string }>();
  return (
    <View style={{ flex: 1, backgroundColor: C.card, padding: 24, justifyContent: 'center', gap: 18 }}>
      <Text style={{ fontFamily: F.medium, fontSize: 18, color: C.muted, textAlign: 'center' }}>请带我去这里 · Отвезите меня сюда</Text>
      <Text selectable style={{ fontSize: 40, lineHeight: 54, fontWeight: '700', color: C.ink, textAlign: 'center' }}>{zh}</Text>
      {ru ? <Text style={{ fontFamily: F.regular, fontSize: 15, color: C.muted, textAlign: 'center' }}>{ru}</Text> : null}
      <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.muted, textAlign: 'center' }}>Покажите экран водителю такси</Text>
    </View>
  );
}
