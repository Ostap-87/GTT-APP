// «Выбрать поездку» (решение 21.10.2026): сначала страна, потом программа — и любая из программ сайта открывается
// глазами делегата: «Сегодня», план по дням, маршрут на карте, компании, памятка по стране. Подробное демо
// «Новый ритейл Китая» (с отелями, ресторанами, культурной программой и примером заметок) — первой строкой.
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import { COUNTRY_ORDER, COUNTRY_RU, plural } from '@/data/catalog-meta';
import { PROGRAMS, type Program } from '@/data/demo-trip';
import { TRIP } from '@/data/trip';
import { useOpenDemo } from '@/state/reset';
import { Card, Chip, Chips, H3, Pick, Row, T } from '@/ui/kit';
import { C } from '@/ui/theme';

/** Дни, компании и города программы — одной строкой. */
const facts = (p: Program) => {
  const co = new Set(p.route.flatMap((r) => r.co)).size;
  const n = p.route.length; // дней программы — столько, сколько будет в демо
  return `${n} ${plural(n, 'день', 'дня', 'дней')} · ${co} ${plural(co, 'компания', 'компании', 'компаний')} · ${p.cities.slice(0, 4).join(' → ')}`;
};

export default function DemoPicker() {
  const openDemo = useOpenDemo();
  const [country, setCountry] = useState(TRIP.country);
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    PROGRAMS.forEach((p) => { m[p.country] = (m[p.country] || 0) + 1; });
    return m;
  }, []);
  const list = PROGRAMS.filter((p) => p.country === country);
  // данные поездки подменяются, экраны пересобираются — и сразу открывается «Сегодня» новой поездки
  const open = (id: string) => { openDemo(id); setTimeout(() => router.replace('/trip'), 50); };

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 40 }}
      data={list}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={
        <View style={{ gap: 10 }}>
          <Card>
            <H3>1. Страна</H3>
            <Chips>
              {COUNTRY_ORDER.map((k) => <Pick key={k} title={`${COUNTRY_RU[k]} · ${counts[k] || 0}`} on={country === k} onPress={() => setCountry(k)} />)}
            </Chips>
          </Card>
          {country === 'cn' ? (
            <Card tone={TRIP.programId ? 'accent' : 'info'} onPress={() => open('')} label="Подробное демо: Новый ритейл Китая">
              <Row title="Подробное демо: Новый ритейл Китая" sub="Отели, рестораны, культурная программа, объявления и пример заметок — всё заполнено"
                right={TRIP.programId ? <Chip tone="info">демо</Chip> : <Chip tone="ok">открыто</Chip>} />
            </Card>
          ) : null}
          <H3 style={{ paddingHorizontal: 4 }}>{`2. Программа · ${list.length}`}</H3>
        </View>
      }
      renderItem={({ item: p }) => (
        <Card style={{ paddingVertical: 4 }}>
          <Row title={p.title} sub={facts(p)} onPress={() => open(p.id)} label={`Открыть как делегат: ${p.title}`}
            right={TRIP.programId === p.id ? <Chip tone="ok">открыто</Chip> : undefined} />
        </Card>
      )}
      ListFooterComponent={
        <T muted style={{ paddingHorizontal: 4 }}>
          Дни, города, компании, время визитов и переезды — из программы на сайте globaltechtour.ru. Даты, отели и рестораны в демо — для примера: в настоящей поездке их задаёт координатор.
        </T>
      }
    />
  );
}
