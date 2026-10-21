// Маршрут поездки (решение 21.10.2026): схема городов и переездов. При первом открытии маршрут «проигрывается» —
// из Москвы по городам и обратно; нажатие на город открывает, что в нём: компании, культура, отель, погода, как едем дальше.
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { LEGS, ROUTE_STATS, ROUTE_TEXT, STOPS, dayShort, pointOf, routeSvg, stopDays, stopInfo } from '@/data/route';
import { Icon } from '@/ui/Icon';
import { Button, Card, Chip, H3, Plain, Row, T, TitleRow } from '@/ui/kit';
import { C, F } from '@/ui/theme';

const VB = { w: 360, h: 430 };
const FONT = { regular: F.regular, bold: F.bold };
const STEP_MS = 1500;
const howRu = (how: 'plane' | 'train') => (how === 'plane' ? 'перелёт' : 'поезд');

export default function RouteScreen() {
  const [shown, setShown] = useState(LEGS.length);
  const [sel, setSel] = useState(STOPS[0].key);
  const [playing, setPlaying] = useState(false);
  const [boxW, setBoxW] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const play = () => {
    clearTimeout(timer.current);
    setPlaying(true);
    setShown(0);
    let i = 0;
    const tick = () => {
      i += 1;
      setShown(i);
      const to = LEGS[i - 1].to;
      if (to !== 'moscow') setSel(to);
      if (i < LEGS.length) timer.current = setTimeout(tick, STEP_MS);
      else setPlaying(false);
    };
    timer.current = setTimeout(tick, 400);
  };

  // при открытии маршрут проигрывается сам, если не включено «Уменьшить движение»
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false).then((reduce) => { if (!reduce) play(); });
    return () => clearTimeout(timer.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (key: string) => { clearTimeout(timer.current); setPlaying(false); setShown(LEGS.length); setSel(key); };
  const scale = boxW / VB.w;
  const stopIdx = STOPS.findIndex((s) => s.key === sel);
  const stop = STOPS[stopIdx];
  const info = stopInfo(stop);

  return (
    <Plain>
      <Card>
        <Text style={{ fontFamily: F.display, fontSize: 30, lineHeight: 32, color: C.ink, textTransform: 'uppercase' }}>Как мы поедем</Text>
        <T>{ROUTE_TEXT}</T>
        <T muted>{`${ROUTE_STATS.cities} города · ${ROUTE_STATS.days} дней · ${ROUTE_STATS.visits} компаний`}</T>
      </Card>

      <Card style={{ padding: 8 }}>
        <View onLayout={(e) => setBoxW(e.nativeEvent.layout.width)} style={{ borderRadius: 12, overflow: 'hidden' }}>
          {boxW ? (
            <View style={{ width: boxW, height: VB.h * scale }}>
              <SvgXml xml={routeSvg(shown, sel, FONT)} width={boxW} height={VB.h * scale} />
              {STOPS.map((s) => (
                <Pressable key={s.key} onPress={() => pick(s.key)} accessibilityRole="button" accessibilityLabel={`${s.ru}, ${stopDays(s)}`}
                  style={{ position: 'absolute', left: s.x * scale - 26, top: s.y * scale - 26, width: 52, height: 52, borderRadius: 26 }} />
              ))}
            </View>
          ) : <View style={{ height: 300 }} />}
        </View>
        <View style={{ padding: 6, gap: 6 }}>
          <Button title={playing ? 'Едем…' : 'Проиграть маршрут'} icon="play" kind="light" onPress={() => { if (!playing) play(); }} />
          <T muted>Нажмите на город — внизу появится, что в нём. Пунктир — перелёт, сплошная линия — поезд. Схема без масштаба.</T>
        </View>
      </Card>

      <Card>
        <TitleRow title={`${stopIdx + 1}. ${stop.ru}  ${stop.zh}`} right={<Chip tone="info">{stopDays(stop)}</Chip>} />
        {info.arrive ? (
          <Row left={<Icon name={info.arrive.how} size={22} color={C.blueInk} />} title={`Приезжаем: ${howRu(info.arrive.how)} из ${pointOf(info.arrive.from).ru === 'Москва' ? 'Москвы' : pointOf(info.arrive.from).ru}`}
            sub={`${dayShort(info.arrive.day)} · ${info.arrive.time} · ${info.arrive.note}`} />
        ) : null}
        {info.visits.map((v) => (
          <Row key={v.name} left={<Icon name="building" size={22} color={C.blueInk} />} title={v.name} sub={`${dayShort(v.day)} · ${v.t} · ${v.place}`}
            onPress={v.id ? () => router.push(`/company/${v.id}`) : undefined} label={`Визит ${v.name}`} />
        ))}
        {info.culture.map((c) => (
          <Row key={c.name} left={<Icon name="culture" size={22} color={C.blueInk} />} title={c.name} sub={`${dayShort(c.day)} · ${c.t} · культурная программа`}
            onPress={c.id ? () => router.push(`/culture/${c.id}`) : undefined} label={c.name} />
        ))}
        {info.hotel ? (
          <Row left={<Icon name="bed" size={22} color={C.blueInk} />} title={info.hotel.name} sub={info.hotel.nights} onPress={() => router.push(`/hotel/${info.hotel!.key}`)} label={`Отель ${info.hotel.name}`} />
        ) : (
          <Row left={<Icon name="bed" size={22} color={C.muted} />} title="Без ночёвки" sub="Вечером в тот же день едем дальше" />
        )}
        <Row left={<Icon name={info.weather[0].icon} size={22} color={C.blueInk} />} title={`Погода: ${info.weather.map((w) => `${w.max} / ${w.min}`).join(' · ')}`} sub={info.weather[0].text} />
        {info.next ? (
          <Row left={<Icon name={info.next.how} size={22} color={C.blueInk} />} title={info.next.to === 'moscow' ? 'Домой, в Москву' : `Дальше: ${pointOf(info.next.to).ru}`}
            sub={`${dayShort(info.next.day)} · ${info.next.time} · ${info.next.note}`} onPress={info.next.to !== 'moscow' ? () => pick(info.next!.to) : undefined} />
        ) : null}
      </Card>

      <Card>
        <H3>Все переезды</H3>
        {LEGS.map((l, i) => (
          <Row key={i} left={<Icon name={l.how} size={22} color={i < shown ? C.blueInk : C.muted} />}
            title={`${pointOf(l.from).ru} → ${pointOf(l.to).ru}`} sub={`${dayShort(l.day)} ноября · ${l.time} · ${howRu(l.how)}`}
            onPress={l.to !== 'moscow' ? () => pick(l.to) : undefined} />
        ))}
      </Card>
      <T muted>Времена и отели — по программе поездки; если координатор что-то поменяет, маршрут обновится сам.</T>
    </Plain>
  );
}
