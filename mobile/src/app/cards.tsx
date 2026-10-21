// «Визитница»: все визитки поездки, по компаниям визитов — снимок визитки, имя, должность и компания по-русски.
// Нажатие — открыть визитку (поля, снимок, «В контакты телефона»); «Сканировать» — новая визитка к компании.
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { VISITS } from '@/data/group';
import { useVisits } from '@/state/visits';
import { CardThumb } from '@/ui/card-ui';
import { Button, Card, Chip, Field, Plain, Row, Seg, T, TitleRow } from '@/ui/kit';
import { C, F } from '@/ui/theme';

export default function Cards() {
  const { cards } = useVisits();
  const [q, setQ] = useState('');
  const [view, setView] = useState<'list' | 'photos'>('list');
  const s = q.trim().toLowerCase();
  const found = cards.filter((c) => !s || [c.latin, c.name, c.titleRu, c.title, c.companyRu, c.company, c.phones.join(' '), c.wechat].join(' ').toLowerCase().includes(s));
  const groups = VISITS.map((v) => ({ v, list: found.filter((c) => c.visit === v.id) })).filter((g) => g.list.length);

  return (
    <Plain>
      <Card tone="info">
        <TitleRow title={`Визитница · ${cards.length}`} right={<Chip tone="info">{`компаний ${new Set(cards.map((c) => c.visit)).size}`}</Chip>} />
        <T>Снимки визиток хранятся вместе с контактами и прикреплены к компаниям визитов. Всё есть в итогах поездки PDF.</T>
      </Card>
      {cards.length ? (
        <>
          <Field value={q} onChangeText={setQ} placeholder="Поиск: имя, компания, телефон, WeChat" />
          <Seg options={[['list', 'Списком'], ['photos', 'Снимки']] as const} value={view} onChange={setView} />
        </>
      ) : null}
      {groups.map(({ v, list }) => (
        <Card key={v.id}>
          <TitleRow title={v.name} right={<Button title="Сканировать" small kind="light" icon="camera" onPress={() => router.push({ pathname: '/card-scan', params: { visit: v.id } })} />} />
          {view === 'list' ? list.map((c) => (
            <Row key={c.id} left={<CardThumb uri={c.photo} />} title={c.latin || c.name || 'Без имени'}
              sub={[c.name && c.latin ? c.name : '', c.titleRu || c.title, c.companyRu || c.company].filter(Boolean).join(' · ')}
              onPress={() => router.push({ pathname: '/card-scan', params: { visit: v.id, id: c.id } })} label={`Визитка: ${c.latin || c.name}`} />
          )) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {list.map((c) => (
                <Pressable key={c.id} onPress={() => router.push({ pathname: '/card-scan', params: { visit: v.id, id: c.id } })} accessibilityLabel={`Визитка: ${c.latin || c.name}`} style={{ width: '48%', gap: 4 }}>
                  {c.photo ? <Image source={{ uri: c.photo }} style={{ width: '100%', aspectRatio: 1.75, borderRadius: 8, backgroundColor: C.line2 }} /> : <CardThumb w={150} />}
                  <Text numberOfLines={1} style={{ fontFamily: F.semibold, fontSize: 12.5, color: C.ink }}>{c.latin || c.name || 'Без имени'}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </Card>
      ))}
      {!cards.length ? (
        <Card>
          <T>Визиток пока нет. На визите откройте карточку компании в «Плане» → «Сканировать визитку».</T>
          <Button title="Сканировать визитку" icon="camera" onPress={() => router.push({ pathname: '/card-scan', params: { visit: VISITS[0].id } })} />
        </Card>
      ) : null}
      {cards.length && !groups.length ? <T muted>Ничего не нашлось.</T> : null}
    </Plain>
  );
}
