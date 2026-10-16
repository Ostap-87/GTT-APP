import { Stack, useLocalSearchParams } from 'expo-router';

import { CULTURE } from '@/data/trip';
import { Card, Chip, H3, Plain, T } from '@/ui/kit';

export default function CultureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = CULTURE[id];
  if (!c) return <Plain><T>Программа не найдена</T></Plain>;
  return (
    <Plain>
      <Stack.Screen options={{ title: 'Культурная программа' }} />
      <Card>
        <Chip tone="dark">культура</Chip>
        <H3 style={{ fontSize: 20 }}>{c.title}</H3>
        <T muted>{c.when}</T>
        <T>{c.desc}</T>
      </Card>
      <Card tone="info">
        <H3>Что взять</H3>
        <T>{c.bring}</T>
      </Card>
    </Plain>
  );
}
