// «Сегодня»: ближайшее событие крупно, «Я в автобусе», адрес для такси, связь с координатором, погода и отель, план дня.
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { GUIDE } from '@/data/extras';
import { VISITS, toMin } from '@/data/group';
import { routeText } from '@/data/route';
import { CITY, DAYS, DAY_NOTES, TRIP, WEATHER, dayEvents, hotelOf, weatherLine } from '@/data/trip';
import { useCoord } from '@/state/coord';
import { useToast } from '@/state/toast';
import { useTrip } from '@/state/trip';
import { Icon } from '@/ui/Icon';
import { Avatar, Button, Card, Chip, H3, Row, Screen, T, TitleRow } from '@/ui/kit';
import { OfflineNote } from '@/ui/OfflineNote';
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
  // ближайшее: выезд или переезд перед первым визитом дня, затем сам визит
  const ev = dayEvents(i);
  const firstCo = ev.find((e) => e.kind === 'co');
  const dep = ev.find((e) => e.kind === 'move' && (!firstCo || toMin(e.t) <= toMin(firstCo.t))) || ev[0];
  const v = firstCo ? VISITS.find((x) => x.name === firstCo.name) : undefined;
  const taxi = v ? { zh: v.zh || v.name, ru: v.addr || `${v.name}, ${CITY[i]}` } : { zh: h?.addrZh || '', ru: h?.addrRu || '' };
  return (
    <Screen eyebrow={`${d.wd}, ${d.n} ноября · ${CITY[i]}${w.max ? ` · ${w.max}` : ''}`} title="Сегодня"
      right={<Button title="Сменить поездку" kind="light" small label={`Сменить поездку. Сейчас: ${TRIP.title}`} onPress={() => router.push('/demo')} />}>
      <OfflineNote />
      <Card onPress={() => router.push('/search')} label="Поиск по поездке" style={{ paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icon name="search" size={20} color={C.muted} />
          <Text style={{ fontFamily: F.medium, fontSize: 15, color: C.muted }}>Поиск: компания, адрес, телефон, заметка</Text>
        </View>
      </Card>
      <Card onPress={() => router.push('/route')} label="Маршрут поездки на схеме">
        <Row left={<Icon name="route" size={24} color={C.blueInk} />} title={TRIP.title} sub={routeText()} right={<Chip tone="info">маршрут</Chip>} />
      </Card>
      <Card tone="dark">
        <T style={{ color: C.onDark, fontSize: 12.5 }}>Через 25 минут</T>
        <Text style={{ fontFamily: F.display, fontSize: 34, color: '#fff', textTransform: 'uppercase' }}>{dep?.name === 'Выезд из отеля' ? `Выезд в ${dep.t}` : `${dep?.t} · ${dep?.name}`}</Text>
        <T style={{ color: C.onDark, fontSize: 12.5 }}>{[dep?.place, firstCo && firstCo !== dep ? `затем ${firstCo.name} в ${firstCo.t}` : ''].filter(Boolean).join(' · ')}</T>
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
            <Button title="Адрес для такси" kind="ghost" onPress={() => router.push({ pathname: '/driver', params: taxi })} />
          </View>
        </View>
      </Card>

      {k.guideLive ? (
        <Card tone="info" onPress={() => router.push('/guide')} label="Гид в эфире — слушать">
          <Row left={<Icon name="headphones" size={24} color={C.blueInk} />} title="Гид в эфире" sub={`${GUIDE.name} · нажмите, чтобы слушать в наушниках`} />
        </Card>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {([['Переводчик', 'translate', '/translator'], ['Слушать гида', 'headphones', '/guide'], ['Город', 'map', '/city'], ['Такси', 'car', 'taxi'], ['Документы', 'passport', '/docs'], ['Расходы', 'receipt', '/expenses']] as const).map(([title, icon, to]) => (
          <View key={title} style={{ flexBasis: '47%', flexGrow: 1 }}>
            <Button title={title} icon={icon} kind="ghost" onPress={() => (to === 'taxi' ? router.push({ pathname: '/driver', params: { zh: h ? h.addrZh : '', ru: h ? h.addrRu : '' } }) : router.push(to))} />
          </View>
        ))}
      </View>

      <Card tone="warn" onPress={() => router.push('/help')} label="Помощь: карточка на местном языке, звонок координатору, где я">
        <Row left={<Icon name="help" size={26} color={C.warn} />} title="Помощь" sub="Карточка на местном языке, звонок координатору, «где я», экстренные номера" />
      </Card>
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
        <Row left={<Icon name={w.icon} size={26} />} title={`${weatherLine(w)} · ${CITY[i]}`} sub={w.text} />
        {h ? (
          <Row
            left={<Icon name="bed" size={26} />}
            title={h.name}
            sub={`${h.nights} · ${h.addrZh ? "адрес на 3 языках" : "адрес пришлёт координатор"}`}
            right={<Chip>отель</Chip>}
            onPress={() => router.push(`/hotel/${h.key}`)}
            label={`Отель: ${h.name}`}
          />
        ) : null}
      </Card>

      <Card>
        <TitleRow title={`План на ${d.wd.toLowerCase()}, ${d.n} ноября`} right={<Button title="Весь план" kind="light" small onPress={() => router.push('/trip/plan')} />} />
        {ev.map((e) => <EventRow key={e.t + e.name} e={e} />)}
        {DAY_NOTES[i] ? <T muted>{DAY_NOTES[i]}</T> : null}
      </Card>
    </Screen>
  );
}
