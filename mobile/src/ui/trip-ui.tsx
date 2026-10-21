// Элементы поездки, общие для нескольких экранов: строка события и адрес на трёх языках.
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { Linking, Platform, Pressable, Text, View } from 'react-native';

import { countryOf } from '@/data/countries';
import { TRIP, type TripEvent } from '@/data/trip';
import { VISITS } from '@/data/group';
import { useToast } from '@/state/toast';
import { Icon } from './Icon';
import { Button, Card, Chip, Row, s as kit } from './kit';
import { C, F } from './theme';

export function EventRow({ e }: { e: TripEvent }) {
  const chip = e.moved ? <Chip tone="warn">перенесено</Chip>
    : e.kind === 'co' ? <Chip>визит</Chip>
      : e.kind === 'meal' ? <Chip tone="ok">{/обед/i.test(e.name) ? 'обед' : 'ужин'}</Chip>
        : e.kind === 'culture' ? <Chip tone="dark">культура</Chip>
          : e.kind === 'move' ? <Chip tone="plain">переезд</Chip> : null;
  const visit = e.kind === 'co' ? VISITS.find((v) => v.name === e.name) : undefined;
  const href = e.ref?.startsWith('m-') ? `/meal/${e.ref}` : e.ref?.startsWith('c-') ? `/culture/${e.ref}` : visit ? `/company/${visit.id}` : null;
  return (
    <Row
      title={<Text style={kit.rowTitle}><Text style={{ fontVariant: ['tabular-nums'], color: e.moved ? C.warn : C.ink }}>{e.t}</Text>  {e.name}</Text>}
      sub={e.place}
      right={chip}
      onPress={href ? () => router.push(href as never) : undefined}
      label={href ? `${e.t} ${e.name}` : undefined}
    />
  );
}

export function Address3({ zh, ru, en, note }: { zh: string; ru: string; en: string; note?: string }) {
  const toast = useToast();
  const copy = async (text: string) => {
    try { await Clipboard.setStringAsync(text); } catch { /* буфер недоступен — достаточно сообщения */ }
    toast('Адрес скопирован');
  };
  const cn = TRIP.country === 'cn';
  const openMaps = () => {
    const q = encodeURIComponent(zh || en || ru);
    // Amap (高德) — карты, которые работают в Китае; Google Карты там заблокированы. В остальных странах — Google Карты
    if (!cn) { Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`); return; }
    Linking.openURL(Platform.OS === 'ios' ? `iosamap://poi?sourceApplication=gtt&name=${q}` : `https://uri.amap.com/search?keyword=${q}`)
      .catch(() => Linking.openURL(`https://uri.amap.com/search?keyword=${q}`));
  };
  const line = (label: string, text: string, cjk?: boolean) => (
    <Row
      key={label}
      title={<View><Text style={[kit.rowSub, { fontFamily: F.bold, marginTop: 0 }]}>{label}</Text><Text style={cjk ? { fontSize: 20, fontFamily: F.bold, color: C.ink } : { fontSize: 14, fontFamily: F.regular, color: C.ink }} selectable>{text}</Text></View>}
      right={<Pressable onPress={() => copy(text)} accessibilityRole="button" accessibilityLabel={`Скопировать адрес: ${label}`} hitSlop={8}><Icon name="copy" size={20} color={C.blueInk} /></Pressable>}
    />
  );
  return (
    <Card style={{ backgroundColor: C.bg }}>
      {zh ? line(`${countryOf(TRIP.country).lang.self} · для водителя`, zh, true) : null}
      {ru ? line('Русский', ru) : null}
      {en ? line('English', en) : null}
      {note ? <Text style={kit.muted}>{note}</Text> : null}
      {zh ? <Button title="Показать водителю" full onPress={() => router.push({ pathname: '/driver', params: { zh, ru } })} /> : null}
      {zh || en ? <Button title={`Открыть в картах (${cn ? 'Amap' : 'Google'})`} kind="ghost" full onPress={openMaps} /> : null}
    </Card>
  );
}
