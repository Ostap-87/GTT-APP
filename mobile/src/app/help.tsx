// «Помощь» (решение 21.10.2026): карточка на местном языке «Я из делегации, позвоните моему координатору» с номером —
// показать прохожему, полицейскому, водителю; звонок координатору и экстренные номера страны; «Отправить координатору,
// где я» — только по нажатию, без слежки: координатор получает точку на карте (в демо — у себя на «Пульте»).
// SOS (решение 27.10.2026): удержать кнопку — точка уходит координатору (коннектор data/live-geo.ts) и сразу набирается
// его номер; постоянная геопозиция для координатора — отдельно и только с согласия (экран «Геопозиция для координатора»).
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Linking, Platform, Pressable, Share, Text, View } from 'react-native';
import { useState } from 'react';

import { GEO_CONNECTED, type GeoFix } from '@/data/live-geo';
import { useGeo } from '@/state/geo';

import { countryOf } from '@/data/countries';
import { CONTACTS, ME, TRIP, hotelOf } from '@/data/trip';
import { useCoord } from '@/state/coord';
import { useToast } from '@/state/toast';
import { Icon } from '@/ui/Icon';
import { Button, Card, H3, Plain, Row, T } from '@/ui/kit';
import { C, F } from '@/ui/theme';

const call = (phone: string) => Linking.openURL(`tel:${phone.replace(/[\s-]/g, '')}`);
const EN = ['I need help', 'I am a member of a business delegation. Please help me call my coordinator:'];

/** Ссылки на точку: в Китае — Amap (координаты GPS он пересчитывает сам), везде — Google Карты. */
export function whereLinks(lat: number, lng: number, cc: string) {
  const g = `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
  return cc === 'cn' ? [`https://uri.amap.com/marker?position=${lng.toFixed(6)},${lat.toFixed(6)}&coordinate=wgs84&name=${encodeURIComponent(ME.lat)}`, g] : [g];
}

export default function Help() {
  const k = useCoord();
  const toast = useToast();
  const country = countryOf(TRIP.country);
  const coord = CONTACTS[0];
  const phone = coord.phones[0] || '';
  const h = hotelOf(TRIP.today);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const sendWhere = async () => {
    setBusy(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) { toast('Разрешите геопозицию для приложения — или позвоните координатору'); return; }
      const pos = (await Location.getLastKnownPositionAsync({ maxAge: 120000 })) || (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      const links = whereLinks(lat, lng, TRIP.country);
      const at = new Date().toTimeString().slice(0, 5);
      k.sendWhere({ who: ME.ru, at, lat, lng, acc: accuracy ?? undefined, links });
      setSent(at);
      toast('Координатор получил, где вы');
      // и тем же сообщением — в любой мессенджер (Telegram, WeChat, WhatsApp)
      await Share.share({ message: `${ME.ru}, делегация «${TRIP.title}»: я здесь — ${links.join(' · ')}` }).catch(() => {});
    } catch {
      toast('Не удалось определить место — позвоните координатору');
    } finally {
      setBusy(false);
    }
  };

  const local = country.help;
  return (
    <Plain>
      <SosCard phone={phone} />
      <Card style={{ borderWidth: 2, borderColor: C.warn }}>
        <T muted>Покажите этот экран прохожему, полицейскому или водителю</T>
        {local ? <Text style={{ fontFamily: F.bold, fontSize: 30, lineHeight: 36, color: C.ink }}>{local[0]}</Text> : null}
        <Text style={{ fontFamily: F.bold, fontSize: local ? 20 : 30, lineHeight: local ? 26 : 36, color: C.ink }}>{EN[0]}</Text>
        {local ? <Text style={{ fontFamily: F.medium, fontSize: 18, lineHeight: 26, color: C.ink }} selectable>{local[1]}</Text> : null}
        <Text style={{ fontFamily: F.medium, fontSize: local ? 15 : 18, lineHeight: local ? 21 : 26, color: C.ink }} selectable>{EN[1]}</Text>
        <Text style={{ fontFamily: F.regular, fontSize: 13.5, color: C.muted }}>Я из бизнес-делегации. Пожалуйста, помогите позвонить моему координатору:</Text>
        <Pressable onPress={() => call(phone)} accessibilityRole="button" accessibilityLabel={`Позвонить координатору: ${phone}`}>
          <Text style={{ fontFamily: F.display, fontSize: 40, lineHeight: 44, color: C.blue, fontVariant: ['tabular-nums'] }} selectable>{phone}</Text>
        </Pressable>
        <T>{`Координатор / Coordinator: ${coord.name}`}</T>
        <T>{`Я / Me: ${ME.lat}`}</T>
        {h ? <T muted>{`Отель: ${h.name}${h.addrZh ? ` · ${h.addrZh}` : ''}`}</T> : null}
      </Card>

      <Button title="Позвонить координатору" icon="phone" onPress={() => call(phone)} />
      <Card tone={sent ? 'info' : undefined}>
        <Row left={<Icon name="pin" size={24} color={C.blueInk} />} title="Отправить координатору, где я"
          sub={sent ? `Отправлено в ${sent} — координатор видит точку на карте` : 'Только по нажатию: приложение не следит, где вы'} />
        <Button title={busy ? 'Определяю место…' : sent ? 'Отправить ещё раз' : 'Отправить, где я'} kind={sent ? 'light' : 'primary'} onPress={() => { if (!busy) sendWhere(); }} />
        {Platform.OS === 'web' ? <T muted>В браузере место определяется по разрешению сайта.</T> : null}
      </Card>

      {TRIP.country === 'cn' ? (
        <Card onPress={() => router.push('/pharmacy')} label="Аптека: карточки для фармацевта">
          <Row left={<Icon name="pill" size={24} color={C.blueInk} />} title="Аптека: покажите фармацевту" sub="Симптомы и лекарства по-китайски, на русском, английском, казахском и узбекском" />
        </Card>
      ) : null}
      <Card tone="warn">
        <H3>{`Экстренные службы: ${country.ru}`}</H3>
        {country.emergency.map(([n, l]) => (
          <Row key={n} title={<Text style={{ fontFamily: F.bold, fontSize: 20, color: C.ink }}>{n}</Text>} sub={l} onPress={() => call(n)} label={`Позвонить ${n}: ${l}`}
            right={<View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }}><Icon name="phone" size={20} color={C.blueInk} /></View>} />
        ))}
        <T muted>{`Посольство России ${country.inRu} — [телефон уточнить]`}</T>
      </Card>
      <T muted>Тексты на местном языке — общие, их проверит координатор перед поездкой.</T>
    </Plain>
  );
}

/** Быстрая точка для SOS: последняя известная (до 2 минут) или новая, но не дольше 6 секунд — звонок важнее. */
async function quickFix(): Promise<GeoFix | null> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return null;
    const last = await Location.getLastKnownPositionAsync({ maxAge: 120000 });
    const pos = last || (await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((r) => setTimeout(() => r(null), 6000)),
    ]));
    return pos ? { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy ?? undefined, at: Date.now() } : null;
  } catch {
    return null;
  }
}

/** SOS: удержать 1,5 секунды (случайное касание не срабатывает) → точка координатору и звонок ему. */
export function SosCard({ phone }: { phone: string }) {
  const g = useGeo();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const last = g.sos.find((x) => x.whoId === ME.id);
  const fire = async () => {
    if (busy) return;
    setBusy(true);
    const fix = await quickFix();
    await g.sendSos(fix);
    setBusy(false);
    toast(fix ? 'SOS и точка отправлены — звоним координатору' : 'SOS отправлен без точки — звоним координатору');
    call(phone);
  };
  return (
    <Card style={{ borderWidth: 2, borderColor: C.red }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Pressable onLongPress={fire} delayLongPress={1500} onPress={() => toast('Удерживайте кнопку SOS 1,5 секунды')} accessibilityRole="button"
          accessibilityLabel="SOS: удерживайте полторы секунды — координатор получит вашу точку, и начнётся звонок ему"
          style={({ pressed }) => ({ width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? '#a3260f' : C.red, boxShadow: '0px 10px 22px rgba(197,50,27,0.35), inset -3px -4px 8px rgba(0,0,0,0.18), inset 3px 3px 6px rgba(255,255,255,0.25)' })}>
          <Text style={{ fontFamily: F.display, fontSize: 34, color: '#fff' }}>{busy ? '…' : 'SOS'}</Text>
        </Pressable>
        <View style={{ flex: 1, gap: 4 }}>
          <H3>Срочно нужна помощь</H3>
          <T muted>Удерживайте кнопку 1,5 секунды: координатор получит, где вы, и сразу начнётся звонок ему.</T>
        </View>
      </View>
      {last ? (
        <T muted>{`SOS отправлен в ${last.at}${last.fix ? ` · точка ±${Math.round(last.fix.acc || 0)} м` : ' · без точки'}${last.status === 'resolved' ? ' · координатор отметил: решено' : ''}`}</T>
      ) : null}
      {!GEO_CONNECTED ? <T muted>Демо: сервер ещё не подключён — сигнал виден на «Пульте» координатора в этой версии, звонок настоящий.</T> : null}
      <Row left={<Icon name="locate" size={22} color={g.consent.on ? C.ok : C.muted} />} title="Геопозиция для координатора"
        sub={g.consent.on ? 'Включена: координатор видит вашу последнюю точку в дни поездки' : 'Выключена: координатор видит точку только при SOS и «Отправить, где я»'}
        onPress={() => router.push('/geo-consent')} label="Настроить геопозицию для координатора" />
    </Card>
  );
}
