// Элементы поездки, общие для нескольких экранов: строка события и адрес на трёх языках.
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { Linking, Platform, Pressable, Text, View } from 'react-native';

import type { TripEvent } from '@/data/trip';
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
  const href = e.ref?.startsWith('m-') ? `/meal/${e.ref}` : e.ref?.startsWith('c-') ? `/culture/${e.ref}` : null;
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
  const openMaps = () => {
    const q = encodeURIComponent(zh);
    // Amap (高德) — карты, которые работают в Китае; Google Карты там заблокированы
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
      {line('中文 · для водителя', zh, true)}
      {line('Русский', ru)}
      {line('English', en)}
      {note ? <Text style={kit.muted}>{note}</Text> : null}
      <Button title="Показать водителю" full onPress={() => router.push({ pathname: '/driver', params: { zh, ru } })} />
      <Button title="Открыть в картах (Amap)" kind="ghost" full onPress={openMaps} />
    </Card>
  );
}
