// «Еда и места рядом» — свой путеводитель на русском на данных Amap (решение пользователя 26.10.2026, вариант «б»):
// рестораны с кухней и средним чеком, кафе и чайные, достопримечательности, торговые центры — названия, адреса и часы на
// языке раздела, китайский оригинал для таксиста. Отзывы и доставка — кнопками Dianping и Meituan (вариант «в»).
// Без сервера (EXPO_PUBLIC_NEARBY_URL) экран предлагает поиск рядом прямо в Dianping и Meituan.
import { Stack } from 'expo-router';
import { Linking, Text, View } from 'react-native';

import { countryOf } from '@/data/countries';
import { t, tr, type Lang } from '@/data/lang';
import { NEARBY_URL, type NearbyKind } from '@/data/nearby';
import { useStored } from '@/state/store';
import { useRate } from '@/ui/Converter';
import { Button, Card, H3, Plain, Seg, T } from '@/ui/kit';
import { NEARBY_TEXT as NB, NearbyPlace, useNearby } from '@/ui/NearbyCard';
import { OpenInApps, OpenInAppsHint } from '@/ui/OpenInApps';
import { ShopHead, useShopCity, useShopLang } from '@/ui/shops-ui';
import { C, F } from '@/ui/theme';

type GuideKind = Extract<NearbyKind, 'food' | 'cafe' | 'sights' | 'mall'>;

const GD = {
  title: t('Еда и места рядом', 'Food and places nearby', 'Жақын маңдағы тамақ пен орындар', 'Yaqin atrofdagi ovqat va joylar'),
  tabs: {
    food: t('Еда', 'Food', 'Тамақ', 'Ovqat'),
    cafe: t('Кафе и чай', 'Cafés & tea', 'Кафе мен шай', 'Kafe va choy'),
    sights: t('Места', 'Sights', 'Көрікті жерлер', 'Joylar'),
    mall: t('ТЦ', 'Malls', 'СО', 'Savdo markazlari'),
  } as Record<GuideKind, ReturnType<typeof t>>,
  sub: {
    food: t('Рестораны рядом: кухня, средний чек, часы работы и рейтинг Amap.', 'Restaurants nearby: cuisine, average bill, hours and Amap rating.', 'Жақын мейрамханалар: асхана, орташа чек, жұмыс уақыты, Amap рейтингі.', 'Yaqin restoranlar: oshxona, oʻrtacha chek, ish vaqti va Amap reytingi.'),
    cafe: t('Кофейни, чайные, десерты и пекарни рядом.', 'Coffee shops, tea houses, desserts and bakeries nearby.', 'Жақын кофеханалар, шайханалар, десерттер мен наубайханалар.', 'Yaqin qahvaxonalar, choyxonalar, desertlar va novvoyxonalar.'),
    sights: t('Парки, храмы, музеи и смотровые площадки в радиусе 5 км.', 'Parks, temples, museums and viewpoints within 5 km.', '5 км радиустағы саябақтар, ғибадатханалар, мұражайлар.', '5 km radiusdagi bogʻlar, ibodatxonalar, muzeylar va tomosha joylari.'),
    mall: t('Торговые центры и универмаги в радиусе 3 км.', 'Malls and department stores within 3 km.', '3 км радиустағы сауда орталықтары мен әмбебап дүкендер.', '3 km radiusdagi savdo markazlari va univermaglar.'),
  } as Record<GuideKind, ReturnType<typeof t>>,
  noServer: t(
    'Список с переводом появится, когда подключим карты Amap. Пока ищите рядом прямо в Dianping и Meituan — слово поиска уже по-китайски.',
    'The translated list appears once Amap maps are connected. Meanwhile search nearby in Dianping and Meituan — the search word is already in Chinese.',
    'Аудармасы бар тізім Amap картасы қосылғанда шығады. Әзірге Dianping пен Meituan-да іздеңіз — іздеу сөзі қытайша.',
    'Tarjimali roʻyxat Amap xaritasi ulanganda chiqadi. Hozircha Dianping va Meituan’da qidiring — qidiruv soʻzi xitoycha.',
  ),
  hk: t(
    'Amap, Dianping и Meituan работают на материке. В Гонконге и Макао ищите на Google Картах.',
    'Amap, Dianping and Meituan cover the mainland. In Hong Kong and Macao use Google Maps.',
    'Amap, Dianping және Meituan материкте жұмыс істейді. Гонконг пен Макаода Google Карталарын қолданыңыз.',
    'Amap, Dianping va Meituan materikda ishlaydi. Gonkong va Makaoda Google Xaritalaridan foydalaning.',
  ),
  google: t('Искать на Google Картах', 'Search Google Maps', 'Google Карталарынан іздеу', 'Google Xaritalarida qidirish'),
};
// Слово поиска рядом в Dianping / Meituan и на Google Картах (Гонконг, Макао)
const WORD: Record<GuideKind, { zh: string; en: string }> = {
  food: { zh: '美食', en: 'restaurants' },
  cafe: { zh: '咖啡', en: 'cafe' },
  sights: { zh: '景点', en: 'attractions' },
  mall: { zh: '商场', en: 'shopping mall' },
};
const KINDS: readonly (readonly [GuideKind, string])[] = [['food', ''], ['cafe', ''], ['sights', ''], ['mall', '']];

function GuideList({ kind, lang, cityId }: { kind: GuideKind; lang: Lang; cityId: string }) {
  const cs = useShopCity();
  const { state, reply, spot, load } = useNearby(kind, lang, cs.city);
  const [rate] = useRate(countryOf('cn').currency);
  return (
    <Card key={`${kind}-${cityId}`}>
      <H3>{tr(GD.tabs[kind], lang)}</H3>
      <T muted>{tr(GD.sub[kind], lang)}</T>
      {state === 'idle' ? <Button title={tr(NB.show, lang)} icon="search" full onPress={load} /> : null}
      {state === 'wait' ? <T>{tr(NB.wait, lang)}</T> : null}
      {state === 'fail' ? <><T>{tr(NB.fail, lang)}</T><Button title={tr(NB.again, lang)} kind="ghost" small onPress={load} /></> : null}
      {state === 'done' && reply ? (
        <>
          {reply.source === 'demo' ? <Card tone="warn"><T>{tr(NB.demo, lang)}</T></Card> : null}
          {spot && !spot.exact ? <T muted>{tr(NB.noGps, lang)}</T> : null}
          {reply.items.length ? reply.items.slice(0, 12).map((p) => <NearbyPlace key={p.id} p={p} lang={lang} rub={rate.rub || undefined} />) : <T>{tr(NB.none, lang)}</T>}
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

export default function Around() {
  const [lang, setLang] = useShopLang();
  const cs = useShopCity();
  const { city } = cs;
  const [kind, setKind] = useStored<GuideKind>('around.kind', 'food');
  const k: GuideKind = WORD[kind] ? kind : 'food';
  const tabs = KINDS.map(([id]) => [id, tr(GD.tabs[id], lang)] as const);
  const cn = city.region === 'cn';
  return (
    <Plain>
      <Stack.Screen options={{ title: tr(GD.title, lang) }} />
      <ShopHead lang={lang} setLang={setLang} cs={cs} />
      <Seg options={tabs} value={k} onChange={setKind} />
      {!cn ? (
        <Card tone="info">
          <T>{tr(GD.hk, lang)}</T>
          <Button title={tr(GD.google, lang)} icon="map" kind="light" onPress={() => { Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(WORD[k].en)}`).catch(() => {}); }} />
        </Card>
      ) : NEARBY_URL ? (
        <GuideList key={`${k}-${city.id}-${lang}`} kind={k} lang={lang} cityId={city.id} />
      ) : (
        <Card>
          <H3>{tr(GD.tabs[k], lang)}</H3>
          <T>{tr(GD.noServer, lang)}</T>
          <Text selectable style={{ fontSize: 26, fontWeight: '700', color: C.ink }}>{WORD[k].zh}</Text>
          <OpenInApps q={WORD[k].zh} lang={lang} hint />
        </Card>
      )}
    </Plain>
  );
}
