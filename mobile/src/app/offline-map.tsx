// «Карта без интернета» (решение пользователя 27.10.2026): город поездки с метро, дорогами и реками (data/offline-map.ts),
// отель, визиты, рестораны и культурная программа (data/places-geo.ts), «Я здесь» по GPS. У каждой точки — ближайшая
// станция метро (название по-русски и по-китайски, линия, сколько идти) и «Показать водителю» — адрес по-китайски.
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { cityMap, hasOfflineMap, lineColor, nearestStation } from '@/data/offline-map';
import { cityPoints, todayCity, type MapPoint } from '@/data/places-geo';
import { STOPS } from '@/data/route';
import { distText } from '@/data/live-geo';
import { useGeo } from '@/state/geo';
import { useToast } from '@/state/toast';
import { CityMap, POINT_STYLE as KIND, focusOn, type Marker } from '@/ui/CityMap';
import { Icon } from '@/ui/Icon';
import { Button, Card, Chip, Chips, H3, Pick, Plain, Row, T } from '@/ui/kit';
import { C, F } from '@/ui/theme';

export default function OfflineMap() {
  const g = useGeo();
  const toast = useToast();
  const [city, setCity] = useState(() => (hasOfflineMap(todayCity()) ? todayCity() : STOPS.find((s) => hasOfflineMap(s.key))?.key || todayCity()));
  const [sel, setSel] = useState<string | undefined>();
  const [me, setMe] = useState<{ lat: number; lng: number; acc?: number } | null>(g.myFix);
  const m = useMemo(() => cityMap(city), [city]);
  const pts = useMemo(() => cityPoints(city), [city]);
  const p = pts.find((x) => x.key === sel);
  const near = (x: { lat: number; lng: number }) => (m ? nearestStation(m, x.lat, x.lng) : null);

  const locate = async () => {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) { toast('Разрешите геопозицию — GPS работает и без интернета'); return; }
      const pos = (await Location.getLastKnownPositionAsync({ maxAge: 60000 })) || (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      const fix = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy ?? undefined };
      setMe(fix);
      if (m && !m.contains(fix.lat, fix.lng)) toast(`Вы сейчас не в городе «${m.ru}» — точка за краем карты`);
    } catch {
      toast('Не удалось определить место');
    }
  };

  const markers: Marker[] = pts.map((x) => ({ key: x.key, lat: x.lat, lng: x.lng, icon: KIND[x.kind].icon, color: KIND[x.kind].color, label: `${KIND[x.kind].ru}: ${x.ru}` }));
  const meNear = me && m && m.contains(me.lat, me.lng) ? near(me) : null;

  return (
    <Plain>
      <Chips>
        {STOPS.map((s) => <Pick key={s.key} title={hasOfflineMap(s.key) ? s.ru : `${s.ru} · нет карты`} on={city === s.key} onPress={() => { setCity(s.key); setSel(undefined); }} />)}
      </Chips>
      {m ? (
        <>
          <CityMap key={city} map={m} markers={markers} me={me} selected={sel} onSelect={setSel} height={430}
            focus={p ? focusOn(p.lat, p.lng) : pts[0] ? focusOn(pts[0].lat, pts[0].lng, 9000) : undefined} focusKey={sel} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Button title="Где я" icon="locate" kind="light" onPress={locate} /></View>
            {sel ? <View style={{ flex: 1 }}><Button title="Все точки" icon="map" kind="light" onPress={() => setSel(undefined)} /></View> : null}
          </View>
          {meNear ? <T muted>{`Вы здесь · ближайшее метро — ${meNear.station.ru || meNear.station.en} ${meNear.station.zh}, ${distText(meNear.dist)}, ~${meNear.walkMin} мин пешком`}</T> : null}
          {p ? <PointCard p={p} near={near(p)} lineOf={(r) => lineColor(m, r)} /> : null}
          {pts.length ? (
            <Card>
              <H3>{`Точки поездки · ${m.ru}`}</H3>
              {pts.map((x, i) => {
                const n = near(x);
                return (
                  <Row key={x.key} first={i === 0} onPress={() => setSel(x.key)} label={`${KIND[x.kind].ru}: ${x.ru}`}
                    left={<View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: KIND[x.kind].color, alignItems: 'center', justifyContent: 'center' }}><Icon name={KIND[x.kind].icon} size={17} color="#fff" /></View>}
                    title={x.ru} sub={`${x.sub}${n ? ` · метро ${n.station.ru || n.station.en}, ${distText(n.dist)}` : ''}`}
                    right={x.key === sel ? <Chip tone="info">на карте</Chip> : null} />
                );
              })}
            </Card>
          ) : (
            <Card tone="info">
              <T>Карта города и метро уже в телефоне. Отель и места визитов появятся на ней, когда координатор подтвердит адреса.</T>
            </Card>
          )}
          <T muted>{`Работает без интернета: карта хранится в приложении, место — по GPS, ему интернет не нужен. Метро: ${m.metro.length} линий, ${m.stations.length} станций. Данные © участники OpenStreetMap (ODbL), ${m.date.split('-').reverse().join('.')}. В демо точки примерные.`}</T>
        </>
      ) : (
        <Card tone="warn">
          <T bold>{`Карты города «${STOPS.find((s) => s.key === city)?.ru || city}» пока нет в приложении`}</T>
          <T muted>{`Уже есть: ${STOPS.filter((s) => hasOfflineMap(s.key)).map((s) => s.ru).join(', ') || 'Шанхай, Пекин, Шэньчжэнь, Ханчжоу, Гуанчжоу'}. Новые города добавляет tools/offline-maps.py.`}</T>
        </Card>
      )}
    </Plain>
  );
}

function PointCard({ p, near, lineOf }: { p: MapPoint; near: ReturnType<typeof nearestStation>; lineOf: (ref: string) => string }) {
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: KIND[p.kind].color, alignItems: 'center', justifyContent: 'center' }}><Icon name={KIND[p.kind].icon} size={20} color="#fff" /></View>
        <View style={{ flex: 1 }}>
          <H3>{p.ru}</H3>
          <T muted>{p.sub}</T>
        </View>
      </View>
      {p.addr ? <T>{p.addr}</T> : null}
      {p.zh ? <Text selectable style={{ fontFamily: F.medium, fontSize: 18, color: C.ink }}>{p.zh}</Text> : null}
      {near ? (
        <View style={{ gap: 6, paddingTop: 4 }}>
          <T bold>Ближайшее метро</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {near.station.lines.map((r) => (
              <View key={r} style={{ minWidth: 26, height: 22, paddingHorizontal: 6, borderRadius: 11, backgroundColor: lineOf(r), alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: F.bold, fontSize: 12, color: '#fff' }}>{r}</Text>
              </View>
            ))}
            <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>{near.station.ru || near.station.en}</Text>
            <Text selectable style={{ fontFamily: F.medium, fontSize: 15, color: C.ink }}>{near.station.zh}</Text>
          </View>
          <T muted>{`${distText(near.dist)} · ~${near.walkMin} мин пешком${near.station.en ? ` · ${near.station.en}` : ''}`}</T>
        </View>
      ) : null}
      {p.zh ? <Button title="Показать водителю" icon="car" onPress={() => router.push({ pathname: '/driver', params: { zh: p.zh, ru: p.addr || p.ru } })} /> : null}
    </Card>
  );
}
