// Открытый каталог: 76 программ с сайта globaltechtour.ru по странам. Цен нет (правило репозитория).
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import catalog from '@/data/catalog.json';
import { COUNTRY_RU, COUNTRY_ORDER, plural } from '@/data/catalog-meta';
import { Card, Chips, Pick, Row, T } from '@/ui/kit';
import { C } from '@/ui/theme';

export default function Catalog() {
  const [country, setCountry] = useState<string>('all');
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    catalog.forEach((t) => { m[t.country] = (m[t.country] || 0) + 1; });
    return m;
  }, []);
  const list = catalog.filter((t) => country === 'all' || t.country === country);
  return (
    <FlatList
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 40 }}
      data={list}
      keyExtractor={(t) => t.id}
      ListHeaderComponent={
        <View style={{ gap: 10 }}>
          <Card>
            <Chips>
              <Pick title={`Все · ${catalog.length}`} on={country === 'all'} onPress={() => setCountry('all')} />
              {COUNTRY_ORDER.map((k) => <Pick key={k} title={`${COUNTRY_RU[k]} · ${counts[k] || 0}`} on={country === k} onPress={() => setCountry(k)} />)}
            </Chips>
          </Card>
          {country !== 'all' ? (
            <Card onPress={() => router.push({ pathname: '/country/[code]', params: { code: country } })} label={`Памятка: ${COUNTRY_RU[country]}`}>
              <Row title={`Памятка: ${COUNTRY_RU[country]}`} sub="Карта регионов, валюта, оплата, связь, розетки, приложения, фразы" />
            </Card>
          ) : null}
          <T muted>Программы, маршруты и компании — с сайта globaltechtour.ru.</T>
        </View>
      }
      renderItem={({ item: t }) => (
        <Card style={{ paddingVertical: 4 }}>
          <Row
            title={t.title}
            sub={`${COUNTRY_RU[t.country] ?? t.country} · ${t.days} ${plural(t.days ?? 0, 'день', 'дня', 'дней')} · ${t.companiesCount} ${plural(t.companiesCount, 'компания', 'компании', 'компаний')} · ${t.cities.slice(0, 4).join(' → ')}`}
            onPress={() => router.push(`/catalog/${t.id}`)}
            label={t.title}
          />
        </Card>
      )}
    />
  );
}
