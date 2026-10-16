// «План»: дни поездки, у каждого — погода, отель, визиты, рестораны и культурная программа.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { CITY, DAYS, TRIP, WEATHER, dayEvents, hotelOf } from '@/data/trip';
import { Icon } from '@/ui/Icon';
import { Card, Chip, Row, Screen, TitleRow } from '@/ui/kit';
import { EventRow } from '@/ui/trip-ui';
import { C, F } from '@/ui/theme';

export default function Plan() {
  const [day, setDay] = useState(TRIP.today);
  const d = DAYS[day];
  const w = WEATHER[day];
  const h = hotelOf(day);
  return (
    <Screen eyebrow={TRIP.route} title="План">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {DAYS.map((x, i) => {
          const on = i === day;
          return (
            <Pressable key={x.n} onPress={() => setDay(i)} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`${x.wd}, ${x.n} ноября`}
              style={{ width: 54, paddingVertical: 8, borderRadius: 12, alignItems: 'center', backgroundColor: on ? C.blue : C.card, borderWidth: 1, borderColor: on ? C.blue : C.line }}>
              <Text style={{ fontFamily: F.medium, fontSize: 11, color: on ? '#fff' : C.muted }}>{x.wd}</Text>
              <Text style={{ fontFamily: F.bold, fontSize: 18, color: on ? '#fff' : C.ink }}>{x.n}</Text>
              <Text style={{ fontFamily: F.medium, fontSize: 10.5, color: on ? '#fff' : C.muted }}>{WEATHER[i].max}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Card>
        <TitleRow title={`${d.wd}, ${d.n} ноября · ${CITY[day]}`} right={day === TRIP.today ? <Chip tone="warn">сегодня</Chip> : null} />
        <Row left={<Icon name={w.icon} size={26} />} title={`${w.max} / ${w.min}`} sub={w.text} />
        {h ? (
          <Row left={<Icon name="bed" size={26} />} title={h.name} sub={`${h.nights} · адрес на 3 языках`} right={<Chip>отель</Chip>} onPress={() => router.push(`/hotel/${h.key}`)} label={`Отель: ${h.name}`} />
        ) : (
          <Row left={<Icon name="bed" size={26} />} title="Выезд из отеля до 12:00" sub="Багаж у стойки отеля, вылет вечером" />
        )}
      </Card>
      <Card>
        <TitleRow title="Расписание" />
        {dayEvents(day).map((e) => <EventRow key={e.t + e.name} e={e} />)}
      </Card>
      <View style={{ paddingHorizontal: 4 }}>
        <Text style={{ fontFamily: F.regular, fontSize: 12.5, color: C.muted }}>Нажмите на обед, ужин или культурную программу — откроется описание и адрес.</Text>
      </View>
    </Screen>
  );
}
