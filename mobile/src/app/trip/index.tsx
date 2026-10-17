// «Сегодня»: ближайшее событие крупно, «Я в автобусе», адрес для такси, связь с координатором, погода и отель, план дня.
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { CITY, DAYS, TRIP, WEATHER, dayEvents, hotelOf } from '@/data/trip';
import { useCoord } from '@/state/coord';
import { useToast } from '@/state/toast';
import { useTrip } from '@/state/trip';
import { Icon } from '@/ui/Icon';
import { Avatar, Button, Card, Chip, H3, Row, Screen, T, TitleRow } from '@/ui/kit';
import { EventRow } from '@/ui/trip-ui';
import { C, F } from '@/ui/theme';

export default function Today() {
  const i = TRIP.today;
  const d = DAYS[i];
  const w = WEATHER[i];
  const h = hotelOf(i);
  const { inBus, setInBus } = useTrip();
  const toast = useToast();
  const k = useCoord();
  const ann = k.anns.find((a) => a.toD); // последнее объявление координатора делегатам
  return (
    <Screen eyebrow={`${d.wd}, ${d.n} ноября · ${CITY[i]} · ${w.max}`} title="Сегодня">
      <Card tone="dark">
        <T style={{ color: C.onDark, fontSize: 12.5 }}>Через 25 минут</T>
        <Text style={{ fontFamily: F.display, fontSize: 34, color: '#fff', textTransform: 'uppercase' }}>Выезд в 09:30</Text>
        <T style={{ color: C.onDark, fontSize: 12.5 }}>Лобби отеля · автобус №2 · затем JD.com в 10:30</T>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <View style={{ flex: 1 }}>
            <Button
              title={inBus ? 'В автобусе' : 'Я в автобусе'}
              icon={inBus ? 'check' : 'bus'}
              kind={inBus ? 'light' : 'primary'}
              onPress={() => { setInBus(!inBus); if (!inBus) toast(`Координатор видит: в автобусе ${k.busCount + 1} из 18`); }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Адрес для такси" kind="ghost" onPress={() => router.push({ pathname: '/driver', params: { zh: '京东集团总部', ru: 'Штаб-квартира JD.com, Пекин' } })} />
          </View>
        </View>
      </Card>

      {k.guideLive ? (
        <Card tone="info" onPress={() => router.push('/guide')} label="Гид в эфире — слушать">
          <Row left={<Icon name="headphones" size={24} color={C.blueInk} />} title="Гид в эфире" sub="Ли Мэй · нажмите, чтобы слушать в наушниках" />
        </Card>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {([['Переводчик', 'translate', '/translator'], ['Слушать гида', 'headphones', '/guide'], ['Город', 'map', '/city'], ['Такси', 'car', 'taxi']] as const).map(([title, icon, to]) => (
          <View key={title} style={{ flexBasis: '47%', flexGrow: 1 }}>
            <Button title={title} icon={icon} kind="ghost" onPress={() => (to === 'taxi' ? router.push({ pathname: '/driver', params: { zh: h ? h.addrZh : '', ru: h ? h.addrRu : '' } }) : router.push(to))} />
          </View>
        ))}
      </View>

      <Card>
        <Row
          left={<Avatar text="ОД" />}
          title="Связь с координатором"
          sub="Остап Доценко · на связи круглосуточно"
          right={<Button title="Контакты" kind="light" small onPress={() => router.push('/contacts')} />}
        />
      </Card>

      <Card tone="warn">
        <TitleRow title="Объявление координатора" right={<T muted>{ann?.time}</T>} />
        <T>{ann?.ru}</T>
      </Card>

      <Card>
        <H3>Погода и отель</H3>
        <Row left={<Icon name={w.icon} size={26} />} title={`${w.max} / ${w.min} · ${CITY[i]}`} sub={w.text} />
        {h ? (
          <Row
            left={<Icon name="bed" size={26} />}
            title={h.name}
            sub={`${h.nights} · адрес на 3 языках`}
            right={<Chip>отель</Chip>}
            onPress={() => router.push(`/hotel/${h.key}`)}
            label={`Отель: ${h.name}`}
          />
        ) : null}
      </Card>

      <Card>
        <TitleRow title={`План на ${d.wd.toLowerCase()}, ${d.n} ноября`} right={<Button title="Весь план" kind="light" small onPress={() => router.push('/trip/plan')} />} />
        {dayEvents(i).map((e) => <EventRow key={e.t + e.name} e={e} />)}
      </Card>
    </Screen>
  );
}
