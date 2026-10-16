import { Stack, router, useLocalSearchParams } from 'expo-router';

import { algNames, foodLine } from '@/data/profile';
import { MEALS, MEAL_ADDR } from '@/data/trip';
import { useTrip } from '@/state/trip';
import { Button, Card, Chip, Chips, H3, Plain, T } from '@/ui/kit';
import { Address3 } from '@/ui/trip-ui';

export default function MealScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const m = MEALS[id];
  const { profile } = useTrip();
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
      </Card>
      <Card tone={profile.saved ? 'info' : 'warn'}>
        <T>{profile.saved ? `Ваше меню: ${foodLine(profile)} — ресторан предупреждён.` : 'Укажите питание и аллергии в профиле — ресторан учтёт их.'}</T>
        {profile.saved
          ? (algNames(profile).length ? <Button title="Карточка для официанта" icon="translate" kind="light" onPress={() => router.push('/waiter')} /> : null)
          : <Button title="Заполнить профиль" kind="light" onPress={() => router.push('/profile')} />}
      </Card>
      <Address3 zh={m.addrZh} ru={ru} en={en} note="Точный адрес — в брони; координатор добавит его до поездки." />
    </Plain>
  );
}
