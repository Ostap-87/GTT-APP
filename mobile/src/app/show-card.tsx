// Крупная карточка «покажите фармацевту / продавцу» (26.10.2026): китайский текст во весь экран, пиньинь, английская строка
// и смысл на языке раздела — чтобы человек знал, что показывает. Как «Показать водителю» и «Карточка для официанта».
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { FR, FRUITS, FRUIT_PHRASES, fruitCard } from '@/data/fruit';
import { isLang, tr, type Lang } from '@/data/lang';
import { MEDS, PHARMA_PHRASES, PH, SYMPTOMS, medCard, type ShowCard } from '@/data/pharmacy';
import { UI, py, shopCity } from '@/data/shops';
import { C, F } from '@/ui/theme';

function findCard(id: string): ShowCard | undefined {
  return SYMPTOMS.find((c) => c.id === id) || PHARMA_PHRASES.find((c) => c.id === id) || FRUIT_PHRASES.find((c) => c.id === id)
    || MEDS.map(medCard).find((c) => c.id === id) || FRUITS.map(fruitCard).find((c) => c.id === id);
}

export default function ShowCardScreen() {
  const p = useLocalSearchParams<{ id: string; l?: string; c?: string; who?: string }>();
  const lang: Lang = isLang(p.l) ? p.l : 'ru';
  const card = findCard(p.id);
  const city = shopCity(p.c || '');
  const hk = city && city.region !== 'cn';
  const who = p.who === 'fr' ? FR.phrases : PH.show;
  if (!card) return <View style={{ flex: 1, backgroundColor: C.card }} />;
  const pinyin = py(card.zh);
  const size = card.zh.length > 24 ? 30 : card.zh.length > 12 ? 36 : 44;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.card }} contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center', gap: 16 }}>
      <Stack.Screen options={{ title: tr(who, lang) }} />
      <Text style={{ fontFamily: F.medium, fontSize: 16, color: C.muted, textAlign: 'center' }}>{`请看一下 · ${tr(UI.showScreen, lang)}`}</Text>
      {card.emoji ? <Text style={{ fontSize: 44, textAlign: 'center' }}>{card.emoji}</Text> : null}
      <Text selectable style={{ fontSize: size, lineHeight: Math.round(size * 1.4), fontWeight: '700', color: C.ink, textAlign: 'center' }}>{card.zh}</Text>
      {pinyin && !hk ? <Text selectable style={{ fontFamily: F.regular, fontSize: 16, lineHeight: 23, color: C.muted, textAlign: 'center' }}>{pinyin}</Text> : null}
      <Text selectable style={{ fontFamily: F.semibold, fontSize: hk ? 22 : 18, lineHeight: hk ? 30 : 25, color: C.ink, textAlign: 'center' }}>{card.en}</Text>
      {lang !== 'en' ? (
        <View style={{ backgroundColor: C.blueSoft, borderRadius: 16, padding: 14, gap: 4 }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.blueInk }}>{tr(UI.meaning, lang)}</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: C.ink }}>{tr(card.tx, lang)}</Text>
        </View>
      ) : null}
      {hk ? <Text style={{ fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: C.muted, textAlign: 'center' }}>{tr(UI.hkCard, lang)}</Text> : null}
      {p.who !== 'fr' ? <Text style={{ fontFamily: F.regular, fontSize: 12.5, lineHeight: 18, color: C.muted, textAlign: 'center' }}>{tr(PH.disclaimer, lang)}</Text> : null}
    </ScrollView>
  );
}
