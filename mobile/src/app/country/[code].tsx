// «Памятка по стране» (решение 21.10.2026): всё, что зависит от страны, — для любой из 9 стран программ GTT:
// валюта и курс, оплата, связь, розетки, приложения со ссылками, язык и фразы, как работаем с принимающей компанией,
// карта регионов с городами программ. Открывается из каталога, карточки программы и подготовки к поездке.
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import catalog from '@/data/catalog.json';
import { COUNTRY_ORDER, COUNTRY_RU } from '@/data/catalog-meta';
import { countryOf } from '@/data/countries';
import { programRoute } from '@/data/map-route';
import { CountryApps } from '@/ui/ChinaApps';
import { Converter } from '@/ui/Converter';
import { Icon } from '@/ui/Icon';
import { Card, Chips, H3, Pick, Plain, Row, T, TitleRow } from '@/ui/kit';
import { RouteMap } from '@/ui/RouteMap';
import { C, F } from '@/ui/theme';

export default function CountryMemo() {
  const { code = 'cn' } = useLocalSearchParams<{ code: string }>();
  const c = countryOf(code);
  const [open, setOpen] = useState<string | null>(null);
  const [boxW, setBoxW] = useState(0);
  const programs = catalog.filter((t) => t.country === c.code);
  // все города программ страны — точками на карте, без переездов
  const seen = new Set<string>();
  const stops = programs.flatMap((p) => programRoute(p.route).stops).filter((s) => !seen.has(s.key) && seen.add(s.key)).map((s) => ({ ...s, sub: '' }));

  return (
    <Plain>
      <Stack.Screen options={{ title: `Памятка: ${c.ru}` }} />
      <Chips>{COUNTRY_ORDER.map((cc) => <Pick key={cc} title={COUNTRY_RU[cc]} on={cc === c.code} onPress={() => router.setParams({ code: cc })} />)}</Chips>

      <Card style={{ padding: 8 }}>
        <View onLayout={(e) => setBoxW(e.nativeEvent.layout.width)} style={{ borderRadius: 12, overflow: 'hidden' }}>
          {boxW ? <RouteMap key={c.code} cc={c.code} stops={stops} legs={[]} shown={0} numbersOnly width={boxW} height={Math.round(boxW * 0.8)} /> : <View style={{ height: 240 }} />}
        </View>
        <Text style={{ fontFamily: F.medium, fontSize: 13, lineHeight: 19, color: C.ink, paddingHorizontal: 6, paddingTop: 6 }}>{stops.map((s, i) => `${i + 1} ${s.ru}`).join(' · ')}</Text>
        <T muted>{`Регионы — как на карте сайта; точки — города программ ${COUNTRY_RU[c.code] === 'ОАЭ' ? 'в ОАЭ' : c.inRu}.`}</T>
      </Card>

      <Converter key={c.currency.code} currency={c.currency} />

      <Card>
        <TitleRow title={`${c.ru}: оплата, связь, розетки`} />
        {c.prep.map((p) => {
          const isOpen = open === p.key;
          return (
            <Pressable key={p.key} onPress={() => setOpen(isOpen ? null : p.key)} accessibilityRole="button" accessibilityState={{ expanded: isOpen }}
              style={{ borderTopWidth: 1, borderTopColor: C.line2, paddingVertical: 10, gap: 6 }}>
              <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.ink }}>{p.title}</Text>
              <Text style={{ fontFamily: F.regular, fontSize: 12.5, color: C.muted }}>{isOpen ? p.sub : `${p.sub} · подробнее`}</Text>
              {isOpen ? p.how.map((h) => <T key={h}>{`• ${h}`}</T>) : null}
            </Pressable>
          );
        })}
        <Row left={<Icon name="sun" size={22} color={C.blueInk} />} title="Розетки" sub={c.power} />
      </Card>

      <CountryApps code={c.code} />

      <Card>
        <H3>Язык и фразы</H3>
        <T>{`Язык: ${c.lang.ru}. Переводчик и «адрес для такси» в поездке — на нём.`}</T>
        {c.lang.ru2local.map(([ru, local]) => (
          <View key={ru} style={{ borderTopWidth: 1, borderTopColor: C.line2, paddingTop: 6, gap: 2 }}>
            <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.muted }}>{ru}</Text>
            <Text selectable style={{ fontFamily: F.semibold, fontSize: 16, color: C.ink }}>{local}</Text>
          </View>
        ))}
        <T muted>{`Для такси: «${c.lang.driver}» — и адрес на ${c.lang.ru.split(' ')[0].replace(/ий$/, 'ом')}.`}</T>
      </Card>

      <Card>
        <H3>Принимающая компания</H3>
        <T>{c.host}</T>
        <T muted>Компания видит только свой визит; телефонов делегатов не видит.</T>
      </Card>

      <Card>
        <TitleRow title={`Программы · ${programs.length}`} />
        {programs.map((p) => (
          <Row key={p.id} title={p.title} sub={`${p.days} дн. · ${p.cities.join(' → ')}`} onPress={() => router.push(`/catalog/${p.id}`)} label={p.title} />
        ))}
      </Card>
      <T muted>Советы — общие, не условия программ; перед поездкой координатор пришлёт точные.</T>
    </Plain>
  );
}
