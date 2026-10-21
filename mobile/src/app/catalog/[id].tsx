// Карточка программы: позиционирование, маршрут на карте страны (регионы и города — как на сайте) и компании — дословно
// из данных сайта; памятка по стране; заявка — как на сайте.
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Text, View } from 'react-native';

import catalog from '@/data/catalog.json';
import { COUNTRY_RU, plural } from '@/data/catalog-meta';
import { programRoute } from '@/data/map-route';
import { useOpenDemo } from '@/state/reset';
import { Button, Card, Chip, H3, Plain, T } from '@/ui/kit';
import { RouteMap } from '@/ui/RouteMap';
import { C, F } from '@/ui/theme';

export default function Program() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = catalog.find((x) => x.id === id);
  const route = useMemo(() => programRoute(t?.route || []), [t]);
  const [boxW, setBoxW] = useState(0);
  const [shown, setShown] = useState(99);
  const openDemo = useOpenDemo();
  if (!t) return <Plain><T>Программа не найдена</T></Plain>;
  return (
    <Plain>
      <Stack.Screen options={{ title: COUNTRY_RU[t.country] ?? 'Программа' }} />
      <Card>
        <T muted>{t.eyebrow}</T>
        <Text style={{ fontFamily: F.display, fontSize: 32, lineHeight: 32, color: C.ink, textTransform: 'uppercase' }}>{t.title}</Text>
        <T>{t.positioning}</T>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <Chip>{`${t.days} ${plural(t.days ?? 0, 'день', 'дня', 'дней')}`}</Chip>
          <Chip>{`${t.companiesCount} ${plural(t.companiesCount, 'компания', 'компании', 'компаний')}`}</Chip>
          <Chip>{`${t.cities.length} ${plural(t.cities.length, 'город', 'города', 'городов')}`}</Chip>
        </View>
      </Card>
      <Card>
        <H3>Маршрут</H3>
        <T>{t.cities.join(' → ')}</T>
        {route.stops.length ? (
          <View onLayout={(e) => setBoxW(e.nativeEvent.layout.width)} style={{ borderRadius: 12, overflow: 'hidden' }}>
            {boxW ? <RouteMap cc={t.country} stops={route.stops} legs={route.legs} shown={Math.min(shown, route.legs.length)} width={boxW} height={Math.round(boxW * 0.9)} /> : <View style={{ height: 240 }} />}
          </View>
        ) : null}
        {route.stops.length ? (
          <Button title="Проиграть маршрут" icon="play" kind="light" small onPress={() => {
            setShown(0);
            route.legs.forEach((_, i) => setTimeout(() => setShown(i + 1), 400 + i * 1600));
          }} />
        ) : null}
      </Card>
      <Card tone="accent">
        <H3>Как это увидит делегат</H3>
        <T>Поездка по этой программе в приложении: «Сегодня», план по дням с визитами и переездами, маршрут на карте, справки о компаниях, памятка по стране.</T>
        <Button title="Посмотреть как делегат" icon="suitcase" onPress={() => { openDemo(t.id); setTimeout(() => router.replace('/trip'), 50); }} />
      </Card>
      <Card onPress={() => router.push({ pathname: '/country/[code]', params: { code: t.country } })} label={`Памятка: ${COUNTRY_RU[t.country]}`}>
        <T>{`Памятка: ${COUNTRY_RU[t.country]} — валюта, оплата, связь, розетки, приложения, фразы`}</T>
      </Card>
      <Card>
        <H3>Компании</H3>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {t.companies.map((n) => (
            <View key={n} style={{ backgroundColor: C.line2, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 }}>
              <Text style={{ fontFamily: F.semibold, fontSize: 12.5, color: C.ink }}>{n}</Text>
            </View>
          ))}
        </View>
      </Card>
      <Card tone="info">
        <H3>Хотите поехать?</H3>
        <T>Даты и стоимость координатор пришлёт после заявки. Заявки из приложения появятся на шаге 2; сейчас — на сайте.</T>
        <Button title="Открыть на globaltechtour.ru" onPress={() => Linking.openURL('https://globaltechtour.ru/')} />
      </Card>
    </Plain>
  );
}
