import { Stack, useLocalSearchParams } from 'expo-router';
import { Linking } from 'react-native';

import { HOTELS } from '@/data/trip';
import { Button, Card, H3, Plain, T } from '@/ui/kit';
import { Address3 } from '@/ui/trip-ui';

export default function HotelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const h = HOTELS[id];
  if (!h) return <Plain><T>Отель не найден</T></Plain>;
  return (
    <Plain>
      <Stack.Screen options={{ title: h.city }} />
      <Card>
        <H3 style={{ fontSize: 20 }}>{h.name}</H3>
        <T muted>{h.nights}</T>
        <T>{h.desc}</T>
      </Card>
      <Address3 zh={h.addrZh} ru={h.addrRu} en={h.addrEn} />
      <Card>
        <H3>Телефон отеля</H3>
        <T>{h.phone} (пример)</T>
        <Button title="Позвонить" kind="ghost" icon="phone" onPress={() => Linking.openURL(`tel:${h.phone.replace(/\s/g, '')}`)} />
      </Card>
    </Plain>
  );
}
