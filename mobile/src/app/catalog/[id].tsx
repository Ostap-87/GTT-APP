// Карточка программы: позиционирование, маршрут и компании — дословно из данных сайта; заявка — как на сайте.
import { Stack, useLocalSearchParams } from 'expo-router';
import { Linking, Text, View } from 'react-native';

import catalog from '@/data/catalog.json';
import { COUNTRY_RU, plural } from '@/data/catalog-meta';
import { Button, Card, Chip, H3, Plain, T } from '@/ui/kit';
import { C, F } from '@/ui/theme';

export default function Program() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = catalog.find((x) => x.id === id);
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
