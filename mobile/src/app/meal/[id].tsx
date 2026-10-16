import { Stack, useLocalSearchParams } from 'expo-router';

import { MEALS, MEAL_ADDR } from '@/data/trip';
import { useTrip } from '@/state/trip';
import { Card, Chip, Chips, H3, Plain, T } from '@/ui/kit';
import { Address3 } from '@/ui/trip-ui';

export default function MealScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const m = MEALS[id];
  const { diet } = useTrip();
  if (!m) return <Plain><T>Ресторан не найден</T></Plain>;
  const [ru, en] = MEAL_ADDR[id] || ['', ''];
  return (
    <Plain>
      <Stack.Screen options={{ title: m.title }} />
      <Card>
        <T muted>{m.when}</T>
        <H3 style={{ fontSize: 20 }}>{m.place}</H3>
        <T>{m.cuisine}</T>
        <Chip tone="ok">забронировано</Chip>
      </Card>
      <Card>
        <H3>Варианты меню</H3>
        <Chips>{m.options.map((o) => <Chip key={o} tone="plain">{o}</Chip>)}</Chips>
        <T muted>{diet ? `Ваши предпочтения: ${diet} — координатор передаст в ресторан.` : 'Укажите предпочтения в еде во вкладке «Поездка».'}</T>
      </Card>
      <Address3 zh={m.addrZh} ru={ru} en={en} note="Точный адрес — в брони; координатор добавит его до поездки." />
    </Plain>
  );
}
