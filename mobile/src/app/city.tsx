// «Город» — свободное время: подборка координатора рядом с отелем (шопинг, ночная жизнь, магазины 24/7, туалеты),
// отметка «Иду гулять» (координатор знает, что всё в порядке; где человек — не отслеживается), такси в отель.
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { CAT_COLOR, CITY_CATS, PLACES, cityMapXml, type PlaceCat } from '@/data/extras';
import { hotelOf } from '@/data/trip';
import { useCoord } from '@/state/coord';
import { useToast } from '@/state/toast';
import { Converter } from '@/ui/Converter';
import { Button, Card, Chip, Chips, H3, Pick, Plain, Row, Seg, T } from '@/ui/kit';
import { OfflineNote } from '@/ui/OfflineNote';
import { C } from '@/ui/theme';

export default function City() {
  const { out, setOut } = useCoord();
  const toast = useToast();
  const [cat, setCat] = useState<PlaceCat>('shop');
  const [pickBack, setPickBack] = useState(false);
  const h = hotelOf(1)!;
  return (
    <Plain>
      <OfflineNote what="Подборка мест, адрес отеля для такси и конвертер (по последнему курсу)" />
      {out ? (
        <Card tone="info">
          <Row title="Вы гуляете самостоятельно" sub={`Координатор знает · вернуться до ${out}`} right={<Button title="Я в отеле" small onPress={() => { setOut(null); toast('Отмечено: вы в отеле'); }} />} />
        </Card>
      ) : (
        <Card>
          <Row title="Идёте гулять сами?" sub="Отметьтесь — координатор будет знать, что всё в порядке" right={<Button title="Иду гулять" kind="light" small onPress={() => setPickBack(!pickBack)} />} />
          {pickBack ? (
            <>
              <T muted>Вернусь в отель до</T>
              <Chips>{['21:00', '22:00', '23:00', '00:00'].map((t) => <Pick key={t} title={t} on={false} onPress={() => { setOut(t); setPickBack(false); toast(`Координатор видит: гуляете до ${t}`); }} />)}</Chips>
              <T muted>Где вы — не отслеживается.</T>
            </>
          ) : null}
        </Card>
      )}
      <Converter />
      <Seg options={CITY_CATS} value={cat} onChange={setCat} />
      <Card style={{ padding: 8 }}>
        <View style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: 340 / 220 }}><SvgXml xml={cityMapXml(cat)} width="100%" height="100%" /></View>
        <T muted>Схема для примера. В приложении — карта Amap с поиском рядом с вами.</T>
      </Card>
      <Card>
        {PLACES[cat].map((p) => (
          <Row key={p.id} onPress={() => router.push(`/place/${p.id}`)} label={p.ru}
            left={<View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: CAT_COLOR[cat] }} />}
            title={`${p.ru}  ${p.zh}`} sub={`${p.what}\n${p.hours} · ${p.dist}`}
            right={<Chip tone="info">{cat === 'store' || cat === 'wc' ? 'рядом' : 'подборка'}</Chip>} />
        ))}
      </Card>
      <Card tone="dark">
        <H3 style={{ color: '#fff' }}>Вернуться в отель</H3>
        <T style={{ color: C.onDark }}>{`DiDi или такси на улице — адрес по-китайски готов. ${h.name}.`}</T>
        <Button title="Показать адрес водителю" icon="car" kind="light" onPress={() => router.push({ pathname: '/driver', params: { zh: h.addrZh, ru: h.addrRu } })} />
      </Card>
      <T muted>Места, часы работы и расстояния — примеры. Подборку для каждого города делает координатор, магазины 24/7 и туалеты ищутся на карте автоматически.</T>
    </Plain>
  );
}
