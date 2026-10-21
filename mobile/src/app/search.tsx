// «Поиск по поездке»: одна строка — по программе, компаниям, адресам, контактам, заметкам, визиткам, документам и расходам.
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';

import { search, searchIndex, type Hit } from '@/data/search';
import { useTrip } from '@/state/trip';
import { useVisits } from '@/state/visits';
import { Icon } from '@/ui/Icon';
import { Card, Chips, H3, Pick, Plain, Row, T, inputStyle } from '@/ui/kit';
import { C, F } from '@/ui/theme';

const EXAMPLES = ['отель', 'обед', 'телефон', 'паспорт', 'перелёт', 'такси'];

export default function Search() {
  const { notesOf, cards } = useVisits();
  const { docs, expenses, notes } = useTrip();
  const [q, setQ] = useState('');
  const index = useMemo(() => searchIndex({ notesOf, cards, docs, expenses, myNotes: notes }), [notesOf, cards, docs, expenses, notes]);
  const hits = useMemo(() => search(index, q), [index, q]);
  const groups = hits.reduce<Record<string, Hit[]>>((m, h) => { (m[h.group] ||= []).push(h); return m; }, {});

  return (
    <Plain>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="search" size={22} color={C.muted} />
        <TextInput value={q} onChangeText={setQ} autoFocus placeholder="Компания, адрес, телефон, заметка…" placeholderTextColor={C.muted} returnKeyType="search"
          accessibilityLabel="Поиск по поездке" style={[inputStyle, { flex: 1, minWidth: 0, fontSize: 16, fontFamily: F.medium }]} />
      </View>
      {!q.trim() ? (
        <Card>
          <H3>Например</H3>
          <Chips>{EXAMPLES.map((x) => <Pick key={x} title={x} on={false} onPress={() => setQ(x)} />)}</Chips>
          <T muted>Ищет по расписанию, компаниям, отелям и ресторанам, контактам и экстренным номерам, маршруту и памятке, а ещё по вашим заметкам, визиткам, документам и расходам. Работает без интернета.</T>
        </Card>
      ) : hits.length ? Object.entries(groups).map(([g, list]) => (
        <Card key={g}>
          <H3>{`${g} · ${list.length}`}</H3>
          {list.slice(0, 12).map((h, i) => (
            <Row key={`${g}${i}`} title={h.title} sub={h.sub.length > 140 ? `${h.sub.slice(0, 140)}…` : h.sub} onPress={() => router.push(h.href as never)} label={h.title} />
          ))}
          {list.length > 12 ? <T muted>{`И ещё ${list.length - 12} — уточните запрос`}</T> : null}
        </Card>
      )) : <T muted>Ничего не нашлось — попробуйте другое слово или часть названия.</T>}
    </Plain>
  );
}
