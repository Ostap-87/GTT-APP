// Блок «Рядом с вами» в разделах «Аптеки» и «Фруктовые лавки»: по кнопке — ближайшие места по картам Amap, уже на языке
// раздела, с китайским оригиналом. На каждом месте — маршрут в Amap, карточка для таксиста, звонок.
// Без адреса сервера (EXPO_PUBLIC_NEARBY_URL) блок не показывается: остаются слова для поиска в Amap.
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Linking, Text, View } from 'react-native';

import { fill, t, tr, type Lang } from '@/data/lang';
import { NEARBY_URL, distanceText, fetchNearby, whereAmI, type NearbyItem, type NearbyKind, type NearbyReply, type Spot } from '@/data/nearby';
import type { ShopCity } from '@/data/shops';
import { Icon } from './Icon';
import { Button, Card, Chip, H3, T } from './kit';
import { OpenInApps, OpenInAppsHint } from './OpenInApps';
import { C, F, SH } from './theme';

const NB = {
  title: t('Рядом с вами', 'Near you', 'Жаныңызда', 'Yaqiningizda'),
  pharmacy: t(
    'Ближайшие аптеки по картам Amap — названия, адреса и часы работы на вашем языке, рядом китайский оригинал.',
    'Nearest pharmacies from Amap — names, addresses and hours in your language, with the Chinese original.',
    'Amap картасы бойынша ең жақын дәріханалар — атауы, мекенжайы және жұмыс уақыты сіздің тіліңізде, қасында қытайша түпнұсқа.',
    'Amap xaritasi boʻyicha eng yaqin dorixonalar — nomi, manzili va ish vaqti sizning tilingizda, yonida xitoycha asli.',
  ),
  fruit: t(
    'Ближайшие фруктовые лавки и рынки по картам Amap — на вашем языке, рядом китайский оригинал.',
    'Nearest fruit shops and markets from Amap — in your language, with the Chinese original.',
    'Amap картасы бойынша ең жақын жеміс дүкендері мен базарлар — сіздің тіліңізде, қасында қытайша түпнұсқа.',
    'Amap xaritasi boʻyicha eng yaqin meva doʻkonlari va bozorlar — sizning tilingizda, yonida xitoycha asli.',
  ),
  show: t('Показать ближайшие', 'Show the nearest', 'Ең жақындарын көрсету', 'Eng yaqinlarini koʻrsatish'),
  again: t('Обновить', 'Refresh', 'Жаңарту', 'Yangilash'),
  wait: t('Ищем рядом с вами…', 'Searching near you…', 'Жаныңыздан іздеп жатырмыз…', 'Yaqiningizdan qidirilmoqda…'),
  noGps: t(
    'Нет доступа к геопозиции — показываем места у центра города. Разрешите доступ в настройках телефона.',
    'No location access — showing places near the city centre. Allow location in phone settings.',
    'Геолокацияға рұқсат жоқ — қала орталығына жақын орындар көрсетілді. Телефон баптауларында рұқсат беріңіз.',
    'Joylashuvga ruxsat yoʻq — shahar markazi yaqinidagi joylar koʻrsatildi. Telefon sozlamalarida ruxsat bering.',
  ),
  fail: t(
    'Карты сейчас не ответили. Найдите место словом ниже — оно откроется в Amap.',
    'The maps did not answer. Search with the word below — it opens in Amap.',
    'Карта қазір жауап бермеді. Төмендегі сөзбен іздеңіз — ол Amap-та ашылады.',
    'Xarita hozir javob bermadi. Quyidagi soʻz bilan qidiring — u Amap’da ochiladi.',
  ),
  none: t('Рядом ничего не нашлось — попробуйте поиск в Amap ниже.', 'Nothing found nearby — try the Amap search below.', 'Жақын жерде ештеңе табылмады — төмендегі Amap іздеуін қолданыңыз.', 'Yaqin atrofda hech narsa topilmadi — quyidagi Amap qidiruvini sinab koʻring.'),
  demo: t(
    'Демо: так будет выглядеть ответ Amap. Места и адреса вымышленные — настоящие появятся после подключения ключа Amap.',
    'Demo: this is how the Amap answer will look. Places are fictional — real ones appear once the Amap key is connected.',
    'Демо: Amap жауабы осылай көрінеді. Орындар ойдан алынған — нақтылары Amap кілті қосылғаннан кейін шығады.',
    'Demo: Amap javobi shunday koʻrinadi. Joylar toʻqima — haqiqiylari Amap kaliti ulangandan keyin chiqadi.',
  ),
  walk: t('{m} мин пешком', '{m} min walk', 'жаяу {m} мин', 'piyoda {m} daq'),
  open24: t('Круглосуточно', '24 hours', 'Тәулік бойы', 'Kecha-kunduz'),
  route: t('Маршрут', 'Route', 'Маршрут', 'Yoʻnalish'),
  taxi: t('Таксисту', 'For a taxi', 'Таксиге', 'Taksiga'),
  call: t('Позвонить', 'Call', 'Қоңырау', 'Qoʻngʻiroq'),
  source: t(
    'Данные — карты Amap (高德地图). Перевод автоматический: имена — русскими буквами, оригинал — по-китайски.',
    'Data: Amap (高德地图). Translated automatically: names in pinyin, original in Chinese.',
    'Деректер — Amap (高德地图) картасы. Аударма автоматты: атаулар кириллицамен, түпнұсқа — қытайша.',
    'Maʼlumotlar — Amap (高德地图) xaritasi. Tarjima avtomatik: nomlar lotincha, asli — xitoycha.',
  ),
};

function Place({ p, lang }: { p: NearbyItem; lang: Lang }) {
  return (
    <View style={{ gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.line2 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {p.photo ? <Image source={{ uri: p.photo }} style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: C.well }} /> : null}
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ fontFamily: F.bold, fontSize: 15.5, lineHeight: 20, color: C.ink }}>{p.name}</Text>
          {p.branch ? <Text style={{ fontFamily: F.medium, fontSize: 13, lineHeight: 18, color: C.blueInk }}>{p.branch}</Text> : null}
          <Text selectable style={{ fontSize: 14, lineHeight: 19, color: C.muted }}>{p.zh.name}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.ink }}>{distanceText(p.distance, lang)}</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.muted }}>{fill(tr(NB.walk, lang), { m: p.walkMin })}</Text>
        </View>
      </View>
      {p.address ? <T>{p.address}</T> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {p.open24 ? <Chip tone="ok">{tr(NB.open24, lang)}</Chip> : p.hours ? <Chip tone="plain">{p.hours}</Chip> : null}
        {p.rating ? <Chip tone="plain">{`★ ${p.rating.toFixed(1)}`}</Chip> : null}
        {p.type ? <Chip tone="plain">{p.type}</Chip> : null}
        {p.tag ? <Chip tone="plain">{p.tag}</Chip> : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><Button title={tr(NB.route, lang)} icon="route" kind="light" small onPress={() => { Linking.openURL(p.links.route).catch(() => Linking.openURL(p.links.amap)); }} /></View>
        <View style={{ flex: 1 }}>
          <Button title={tr(NB.taxi, lang)} icon="car" kind="ghost" small
            onPress={() => router.push({ pathname: '/driver', params: { zh: `${p.zh.name}\n${p.zh.address}`, ru: [p.name, p.address].filter(Boolean).join('\n') } })} />
        </View>
        {p.tel[0] ? <View style={{ flex: 1 }}><Button title={tr(NB.call, lang)} icon="phone" kind="ghost" small onPress={() => { Linking.openURL(`tel:${p.tel[0].replace(/[^\d+]/g, '')}`).catch(() => {}); }} /></View> : null}
      </View>
      <OpenInApps q={p.zh.name.replace(/[(（].*$/, '')} lang={lang} />
    </View>
  );
}

export function NearbyCard({ kind, lang, city }: { kind: NearbyKind; lang: Lang; city: ShopCity }) {
  const [state, setState] = useState<'idle' | 'wait' | 'done' | 'fail'>('idle');
  const [reply, setReply] = useState<NearbyReply | null>(null);
  const [spot, setSpot] = useState<Spot | null>(null);
  // Amap — карты материкового Китая; в Гонконге и Макао остаются слова для поиска в Google Картах
  if (!NEARBY_URL || city.region !== 'cn') return null;

  const load = async () => {
    setState('wait');
    try {
      const at = await whereAmI(city);
      if (!at) throw new Error('no location');
      setSpot(at);
      setReply(await fetchNearby(kind, lang, at));
      setState('done');
    } catch {
      setState('fail');
    }
  };

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center', boxShadow: SH.small }}>
          <Icon name="pin" size={20} color={C.blueInk} />
        </View>
        <View style={{ flex: 1 }}><H3>{tr(NB.title, lang)}</H3></View>
      </View>
      <T muted>{tr(NB[kind], lang)}</T>
      {state === 'idle' ? <Button title={tr(NB.show, lang)} icon="search" full onPress={load} /> : null}
      {state === 'wait' ? <T>{tr(NB.wait, lang)}</T> : null}
      {state === 'fail' ? <><T>{tr(NB.fail, lang)}</T><Button title={tr(NB.again, lang)} kind="ghost" small onPress={load} /></> : null}
      {state === 'done' && reply ? (
        <>
          {reply.source === 'demo' ? <Card tone="warn"><T>{tr(NB.demo, lang)}</T></Card> : null}
          {spot && !spot.exact ? <T muted>{tr(NB.noGps, lang)}</T> : null}
          {reply.items.length ? reply.items.slice(0, 8).map((p) => <Place key={p.id} p={p} lang={lang} />) : <T>{tr(NB.none, lang)}</T>}
          <OpenInAppsHint lang={lang} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ flex: 1, fontFamily: F.regular, fontSize: 12, lineHeight: 17, color: C.muted }}>{tr(NB.source, lang)}</Text>
            <Button title={tr(NB.again, lang)} kind="ghost" small onPress={load} />
          </View>
        </>
      ) : null}
    </Card>
  );
}
