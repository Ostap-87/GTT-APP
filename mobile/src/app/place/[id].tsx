// Место из подборки «Город»: что это, часы, расстояние, адрес на 3 языках и такси сюда.
import { router, useLocalSearchParams } from 'expo-router';

import { placeById } from '@/data/extras';
import { Button, H3, Plain, Row, T } from '@/ui/kit';
import { Address3 } from '@/ui/trip-ui';

export default function PlaceScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const p = placeById(id);
  if (!p) return <Plain><T>Место не найдено.</T></Plain>;
  return (
    <Plain>
      <H3>{p.ru}</H3>
      <T muted>{p.what}</T>
      <Row title="Часы" right={<T>{p.hours}</T>} />
      <Row title="Как далеко" right={<T>{p.dist}</T>} />
      <Address3 zh={p.zh} ru={p.ru} en={p.en} name={p.zh} note="Название по-китайски таксисты понимают; точный адрес — в карте" />
      <Button title="Такси сюда — показать водителю" icon="car" onPress={() => router.push({ pathname: '/driver', params: { zh: p.zh, ru: p.ru } })} />
      <T muted>DiDi работает на английском и принимает иностранные карты; его можно вызвать и из WeChat или Alipay. Свободное такси на улице — с зелёной табличкой «空车».</T>
    </Plain>
  );
}
