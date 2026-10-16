// Общие куски режима координатора: тёмная шапка с «Смотреть как делегат», плитки цифр, полоса прогресса,
// карточка «Переезды сегодня».
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { LEGS, diffTxt, dur, toMin } from '@/data/group';
import { useCoord } from '@/state/coord';
import { Button, Card, Chip, Row, Screen, T, TitleRow } from './kit';
import { C, F } from './theme';

export function CoordScreen({ title, children }: { title: string; children: ReactNode }) {
  const { setViewing } = useCoord();
  return (
    <Screen
      dark
      eyebrow="Координатор · полный доступ"
      title={title}
      right={<Button title="Как делегат" kind="dark" small label="Смотреть как делегат" onPress={() => { setViewing(true); router.push('/trip'); }} />}
    >
      {children}
    </Screen>
  );
}

export function Bar({ value, color = C.blue }: { value: number; color?: string }) {
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: C.line2, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: '100%', backgroundColor: color }} />
    </View>
  );
}

export function Stat({ label, value, sub, dark }: { label: string; value: string; sub: string; dark?: boolean }) {
  return (
    <View style={{ flexBasis: '47%', flexGrow: 1, backgroundColor: dark ? C.dark : C.card, borderWidth: 1, borderColor: dark ? C.dark : C.line, borderRadius: 14, padding: 12, gap: 2 }}>
      <Text style={{ fontFamily: F.medium, fontSize: 12, color: dark ? C.onDark : C.muted }}>{label}</Text>
      <Text style={{ fontFamily: F.display, fontSize: 30, lineHeight: 32, color: dark ? '#fff' : C.ink }}>{value}</Text>
      <Text style={{ fontFamily: F.regular, fontSize: 12, color: dark ? C.onDark : C.muted }} numberOfLines={1}>{sub}</Text>
    </View>
  );
}

/** «Переезды сегодня»: координатор отмечает «Выехали» и «Прибыли», время в пути уходит в журнал (решение 16.10.2026). */
export function LegsCard() {
  const { legs } = useCoord();
  const done = LEGS.filter((l) => legs[l.id]?.arr).length;
  const cur = LEGS.find((l) => !legs[l.id]?.arr);
  const st = cur ? legs[cur.id] || {} : {};
  return (
    <Card>
      <TitleRow title="Переезды сегодня" right={<Chip tone={done === LEGS.length ? 'ok' : 'info'}>{`${done} из ${LEGS.length}`}</Chip>} />
      {!cur ? <T muted>Все переезды дня отмечены — они в журнале.</T> : st.dep ? (
        <Card tone="dark">
          <T style={{ color: C.onDark, fontSize: 12.5 }}>{`В пути с ${st.dep} · план ${dur(cur.min)}`}</T>
          <Text style={{ fontFamily: F.bold, fontSize: 16, color: '#fff' }}>{`${cur.from} → ${cur.to}`}</Text>
          <Button title="Прибыли" icon="check" kind="light" onPress={() => router.push({ pathname: '/leg', params: { id: cur.id, kind: 'arr' } })} />
        </Card>
      ) : (
        <Card tone="info">
          <T muted>{`Дальше: выезд в ${cur.plan} · в пути ~${dur(cur.min)}`}</T>
          <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.ink }}>{`${cur.from} → ${cur.to}`}</Text>
          <Button title={`Выехали${cur.id === 'l1' ? ' — JD.com узнает' : ''}`} icon="bus" onPress={() => router.push({ pathname: '/leg', params: { id: cur.id, kind: 'dep' } })} />
        </Card>
      )}
      {LEGS.map((l) => {
        const s = legs[l.id] || {};
        const m = s.arr && s.dep ? toMin(s.arr) - toMin(s.dep) : 0;
        return (
          <Row
            key={l.id}
            title={`${s.dep || l.plan}  ${l.from} → ${l.to}`}
            sub={s.arr ? `выехали ${s.dep} · прибыли ${s.arr} · ${diffTxt(m, l.min)}` : s.dep ? `выехали ${s.dep}` : `план выезда ${l.plan}`}
            right={s.arr ? <Chip tone={m - l.min > 5 ? 'warn' : 'ok'}>{dur(m)}</Chip> : s.dep ? <Chip tone="info">в пути</Chip> : <Chip tone="plain">{`план ${dur(l.min)}`}</Chip>}
          />
        );
      })}
      <Button title="Журнал переездов" kind="light" small onPress={() => router.push('/legs')} />
    </Card>
  );
}
