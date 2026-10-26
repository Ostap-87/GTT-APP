// «Город» — свободное время: подборка координатора рядом с отелем (шопинг, ночная жизнь, магазины 24/7, туалеты),
// отметка «Иду гулять» (координатор знает, что всё в порядке; где человек — не отслеживается), такси в отель.
// В Китае — входы в «Аптеки» и «Фруктовые лавки» (26.10.2026).
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { CAT_COLOR, CITY_CATS, PLACES, PLACES_CITY, cityMapXml, type PlaceCat } from '@/data/extras';
import { HOTELS, TRIP, hotelOf } from '@/data/trip';
import { useCoord } from '@/state/coord';
import { useToast } from '@/state/toast';
import { CountryApps } from '@/ui/ChinaApps';
import { Converter } from '@/ui/Converter';
import { Icon } from '@/ui/Icon';
import { Button, Card, Chip, Chips, H3, Pick, Plain, Row, Seg, T } from '@/ui/kit';
import { Press } from '@/ui/motion';
import { OfflineNote } from '@/ui/OfflineNote';
import { C, F, SH } from '@/ui/theme';

export default function City() {
  const { out, setOut } = useCoord();
  const toast = useToast();
  const [cat, setCat] = useState<PlaceCat>('shop');
  const [pickBack, setPickBack] = useState(false);
  const h = hotelOf(TRIP.today) || Object.values(HOTELS)[0];
  const hasPlaces = PLACES[cat].length > 0;
  return (
    <Plain>
      <Stack.Screen options={{ title: `Город · ${PLACES_CITY.ru}` }} />
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
      {TRIP.country === 'cn' ? <ShopTiles /> : null}
      <Converter />
      <Seg options={CITY_CATS} value={cat} onChange={setCat} />
      {hasPlaces ? (
        <Card style={{ padding: 8 }}>
          <View style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: 340 / 220 }}><SvgXml xml={cityMapXml(cat)} width="100%" height="100%" /></View>
          <T muted>{`Схема для примера. В приложении — карта ${TRIP.country === 'cn' ? 'Amap' : 'Google Карты'} с поиском рядом с вами.`}</T>
        </Card>
      ) : (
        <Card tone="info">
          <T>{`Подборку мест в городе ${PLACES_CITY.ru} — шопинг, вечер, магазины 24/7 и туалеты рядом с отелем — координатор добавит перед поездкой.`}</T>
        </Card>
      )}
      {hasPlaces ? <Card>
        {PLACES[cat].map((p) => (
          <Row key={p.id} onPress={() => router.push(`/place/${p.id}`)} label={p.ru}
            left={<View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: CAT_COLOR[cat] }} />}
            title={`${p.ru}  ${p.zh}`} sub={`${p.what}\n${p.hours} · ${p.dist}`}
            right={<Chip tone="info">{cat === 'store' || cat === 'wc' ? 'рядом' : 'подборка'}</Chip>} />
        ))}
      </Card> : null}
      {h ? (
        <Card tone="dark">
          <H3 style={{ color: '#fff' }}>Вернуться в отель</H3>
          <T style={{ color: C.onDark }}>{h.addrZh ? `${TRIP.country === 'cn' ? 'DiDi или такси на улице — адрес по-китайски готов' : 'Приложение такси или такси на улице — адрес на местном языке готов'}. ${h.name}.` : `${h.name}. Адрес для водителя появится, когда координатор подтвердит отель.`}</T>
          {h.addrZh ? <Button title="Показать адрес водителю" icon="car" kind="light" onPress={() => router.push({ pathname: '/driver', params: { zh: h.addrZh, ru: h.addrRu } })} /> : null}
        </Card>
      ) : null}
      <CountryApps />
      <T muted>Места, часы работы и расстояния — примеры. Подборку для каждого города делает координатор, магазины 24/7 и туалеты ищутся на карте автоматически.</T>
    </Plain>
  );
}

/** «Аптеки» и «Фруктовые лавки» — две плитки рядом (решение пользователя 26.10.2026). */
function ShopTiles() {
  const tiles = [
    { to: '/pharmacy', icon: 'pill', title: 'Аптеки', sub: 'Карточки для фармацевта по-китайски' },
    { to: '/fruit', icon: 'apple', title: 'Фруктовые лавки', sub: 'Цена за 斤 = 500 г, фразы продавцу' },
  ] as const;
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {tiles.map((x) => (
        <Press key={x.to} onPress={() => router.push(x.to)} label={x.title} scaleTo={0.95}
          style={{ flex: 1, gap: 8, padding: 14, borderRadius: 22, backgroundColor: C.card, boxShadow: SH.clay }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: C.well, boxShadow: SH.inset }}>
            <Icon name={x.icon} size={22} color={C.blueInk} />
          </View>
          <Text style={{ fontFamily: F.bold, fontSize: 14.5, color: C.ink }}>{x.title}</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 12, lineHeight: 16, color: C.muted }}>{x.sub}</Text>
        </Press>
      ))}
    </View>
  );
}
