// Стартовый экран: вход делегата по приглашению (в демо — сразу), вход координатора и открытый каталог программ.
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import catalog from '@/data/catalog.json';
import { ME, TRIP } from '@/data/trip';
import { Button, Card, T } from '@/ui/kit';
import { C, F } from '@/ui/theme';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[st.wrap, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <View style={{ gap: 10 }}>
        <Text style={st.brand}>GLOBAL TECH TOUR</Text>
        <Text style={st.title}>Ваша экспедиция в кармане</Text>
        <Text style={st.sub}>Программа по дням, адреса для такси по-китайски, материалы без интернета и связь с координатором.</Text>
      </View>
      <View style={{ gap: 12 }}>
        <Card tone="dark">
          <Text style={[st.cardEyebrow]}>ПРИГЛАШЕНИЕ · ДЕМО</Text>
          <Text style={st.cardTitle}>{TRIP.title}</Text>
          <T style={{ color: C.onDark }}>{TRIP.dates} · {TRIP.route}</T>
          <T style={{ color: C.onDark }}>Вы входите как {ME.ru} — участник вымышленный.</T>
          <Button title="Войти в поездку" onPress={() => router.replace('/trip')} />
        </Card>
        <Button title="Войти как координатор" kind="dark" icon="grid" onPress={() => router.replace('/coord')} />
        <Button title={`Программы GTT · ${catalog.length}`} kind="ghost" icon="globe" onPress={() => router.push('/catalog')} />
        <T muted style={{ textAlign: 'center' }}>Шаг 1: данные поездки тестовые, вход по ссылке-приглашению и роли по доступу появятся на шаге 2.</T>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 18, justifyContent: 'space-between' },
  brand: { fontFamily: F.bold, fontSize: 13, letterSpacing: 1.2, color: C.blue },
  title: { fontFamily: F.display, fontSize: 52, lineHeight: 50, color: C.ink, textTransform: 'uppercase' },
  sub: { fontFamily: F.regular, fontSize: 16, lineHeight: 23, color: C.muted },
  cardEyebrow: { fontFamily: F.bold, fontSize: 11.5, letterSpacing: 0.6, color: C.orange },
  cardTitle: { fontFamily: F.display, fontSize: 30, lineHeight: 30, color: '#fff', textTransform: 'uppercase' },
});
