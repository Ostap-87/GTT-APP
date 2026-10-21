// «Туристическая eSIM» в подготовке к поездке: предложения партнёров GTT со ссылками. Пока ссылок нет — заглушка.
import { Linking, Text, View } from 'react-native';

import { ESIM_OFFERS } from '@/data/esim';
import { Button, Card, H3, T } from './kit';
import { C, F } from './theme';
import { TENANT } from '@/data/tenant';

export function EsimOffers() {
  return (
    <Card>
      <H3>Туристическая eSIM</H3>
      <T muted>Интернет с первой минуты в Китае: такси, карты, WeChat. Ставится дома, пока есть Wi‑Fi.</T>
      {ESIM_OFFERS.length ? ESIM_OFFERS.map((o) => (
        <View key={o.key} style={{ gap: 6, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.line2 }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 14.5, color: C.ink }}>{o.name}</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: C.muted }}>{o.what}</Text>
          {o.note ? <Text style={{ fontFamily: F.regular, fontSize: 12.5, color: C.muted }}>{o.note}</Text> : null}
          <Button title="Купить eSIM" small onPress={() => Linking.openURL(o.url)} label={`Купить eSIM: ${o.name}`} />
        </View>
      )) : (
        <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.warn, paddingVertical: 6 }}>[уточнить: партнёры eSIM и ссылки — скоро здесь]</Text>
      )}
      {ESIM_OFFERS.length ? <T muted>{`Партнёрские предложения ${TENANT.name}.`}</T> : null}
    </Card>
  );
}
