// «Где группа» для координатора (решение пользователя 27.10.2026): точка сбора (визит или отель), последние точки участников,
// давших согласие; кто отстал больше чем на 300 м, у кого точка давно не обновлялась, кто согласия не давал. SOS — сверху.
// Пока сервер не подключён (data/live-geo.ts), точки вымышленные, кроме SOS и точки Анны с этого телефона.
import { useMemo, useState } from 'react';
import { Linking, View } from 'react-native';

import { byId } from '@/data/group';
import { GEO_CONNECTED, LAG_M, STALE_MIN, distText } from '@/data/live-geo';
import { cityMap } from '@/data/offline-map';
import { todayCity } from '@/data/places-geo';
import { CONTACTS } from '@/data/trip';
import { useGeo, type MemberView } from '@/state/geo';
import { useToast } from '@/state/toast';
import { CityMap, POINT_STYLE, focusOn, type Marker } from '@/ui/CityMap';
import { Avatar, Button, Card, Chip, H3, Plain, Row, T, TitleRow, initials } from '@/ui/kit';
import { C } from '@/ui/theme';

const ago = (m: number | null) => (m == null ? '' : m < 1 ? 'только что' : `${m} мин назад`);

export default function GroupMap() {
  const g = useGeo();
  const toast = useToast();
  const [sel, setSel] = useState<string | undefined>();
  const people = useMemo(() => g.group(), [g]);
  const mp = g.meeting();
  const m = cityMap(todayCity());
  const lag = people.filter((p) => p.consent && p.lag && !p.stale);
  const stale = people.filter((p) => p.consent && p.stale);
  const none = people.filter((p) => !p.consent);
  const okN = people.filter((p) => p.consent && !p.lag && !p.stale).length;
  const sos = g.openSos;

  const markers: Marker[] = [];
  if (mp) markers.push({ key: 'meet', lat: mp.lat, lng: mp.lng, icon: POINT_STYLE[mp.kind].icon, color: POINT_STYLE[mp.kind].color, label: `Точка сбора: ${mp.ru}` });
  // кто рядом с точкой сбора — одной меткой с числом, отдельно — только отставшие и устаревшие (их и надо искать)
  if (mp && okN) markers.push({ key: 'near', lat: mp.lat - 0.0019, lng: mp.lng + 0.0011, text: String(okN), color: '#1e8e5a', label: `Рядом с точкой сбора: ${okN}` });
  people.forEach((p) => {
    if (!p.fix || !(p.lag || p.stale)) return;
    markers.push({ key: p.id, lat: p.fix.lat, lng: p.fix.lng, text: initials(byId[p.id]?.lat || p.name), label: p.name, color: p.stale ? '#8a94a6' : '#e07a1f' });
  });
  sos.forEach((s) => { if (s.fix) markers.push({ key: `sos-${s.id}`, lat: s.fix.lat, lng: s.fix.lng, icon: 'sos', color: C.red, ring: '#ffd2c8', label: `SOS: ${s.who}` }); });
  const selP = people.find((p) => p.id === sel);
  const callTo = (name: string) => toast(`Звонок: ${name} (в демо без звонка)`);
  const focusP = selP?.fix ? focusOn(selP.fix.lat, selP.fix.lng, 2500) : mp ? focusOn(mp.lat, mp.lng, 3200) : undefined;

  const PersonRow = ({ p, sub, first }: { p: MemberView; sub: string; first?: boolean }) => (
    <Row first={first} left={<Avatar text={initials(byId[p.id]?.lat || p.name)} />} title={p.name} sub={sub} onPress={p.fix ? () => setSel(p.id) : undefined}
      right={<Button title="" icon="phone" kind="ghost" small label={`Позвонить: ${p.name}`} onPress={() => callTo(p.name)} />} />
  );

  return (
    <Plain>
      {sos.map((s) => (
        <Card key={s.id} style={{ borderWidth: 2, borderColor: C.red }}>
          <TitleRow title={<H3>{`SOS · ${s.who}`}</H3>} right={<Chip tone="warn">{s.at}</Chip>} />
          <T muted>{s.fix ? `Точка ±${Math.round(s.fix.acc || 0)} м · ${s.fix.lat.toFixed(5)}, ${s.fix.lng.toFixed(5)}` : 'Место определить не удалось — звоните'}</T>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Button title="Позвонить" icon="phone" small onPress={() => callTo(s.who)} />
            {s.fix ? <Button title="Открыть в картах" kind="ghost" small onPress={() => Linking.openURL(`https://uri.amap.com/marker?position=${s.fix!.lng},${s.fix!.lat}&coordinate=wgs84`)} /> : null}
            <Button title="Решено" kind="ghost" small onPress={() => { g.resolveSos(s.id); toast('SOS закрыт'); }} />
          </View>
        </Card>
      ))}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip tone="ok">{`рядом с группой · ${okN}`}</Chip>
        <Chip tone={lag.length ? 'warn' : 'ok'}>{`отстали · ${lag.length}`}</Chip>
        <Chip tone="info">{`точка устарела · ${stale.length}`}</Chip>
        <Chip tone="info">{`без согласия · ${none.length}`}</Chip>
      </View>

      {m && mp ? (
        <CityMap map={m} markers={markers} selected={sel} onSelect={(k) => setSel(k === 'meet' || k === 'near' ? undefined : k)} height={400} focus={focusP} focusKey={sel || 'meet'} />
      ) : (
        <Card tone="info"><T>Карта города появится, когда будет точка сбора (визит или отель с адресом).</T></Card>
      )}
      {mp ? <T muted>{`Точка сбора: ${mp.ru} · ${mp.sub}`}</T> : null}

      {lag.length ? (
        <Card tone="warn">
          <H3>{`Дальше ${distText(LAG_M)} от группы`}</H3>
          {lag.map((p, i) => <PersonRow key={p.id} p={p} first={i === 0} sub={`${distText(p.dist || 0)} от точки сбора · ${ago(p.minsAgo)}`} />)}
        </Card>
      ) : null}
      {stale.length ? (
        <Card>
          <H3>{`Точка старше ${STALE_MIN} минут`}</H3>
          {stale.map((p, i) => <PersonRow key={p.id} p={p} first={i === 0} sub={`обновлялась ${ago(p.minsAgo)} · телефон без связи или приложение закрыто`} />)}
        </Card>
      ) : null}
      <Card>
        <H3>Без согласия на геопозицию</H3>
        {none.map((p, i) => <PersonRow key={p.id} p={p} first={i === 0} sub="точку не видно — только звонок или SOS" />)}
      </Card>
      <T muted>{GEO_CONNECTED ? 'Точки — с сервера поездки, последние, без истории.' : `Демо: сервер не подключён, точки участников вымышленные. Настоящие придут, когда появится сервер (координатор поездки: ${CONTACTS[0]?.name || '—'}).`}</T>
    </Plain>
  );
}
