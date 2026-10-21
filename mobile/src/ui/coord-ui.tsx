// Общие куски режима координатора: тёмная шапка со «Смотреть как…», плитки цифр, полоса прогресса,
// карточка «Переезды сегодня», кнопка возврата к пульту.
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LEGS, diffTxt, dur, toMin } from '@/data/group';
import { useCoord } from '@/state/coord';
import { Icon } from './Icon';
import { Button, Card, Chip, Row, Screen, T, TitleRow } from './kit';
import { TAB_BAR_SPACE } from './TabBar3D';
import { C, F, SH } from './theme';

export function CoordScreen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Screen
      dark
      eyebrow="Координатор"
      title={title}
      right={<Button title="Смотреть как…" kind="dark" small label="Смотреть глазами делегата, компании или агента" onPress={() => router.push('/view-as')} />}
    >
      {children}
    </Screen>
  );
}

export function Bar({ value, color = C.blue }: { value: number; color?: string }) {
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: C.well, boxShadow: SH.inset, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: '100%', backgroundColor: color }} />
    </View>
  );
}

export function Stat({ label, value, sub, dark }: { label: string; value: string; sub: string; dark?: boolean }) {
  return (
    <View style={{ flexBasis: '47%', flexGrow: 1, backgroundColor: dark ? C.dark : C.card, borderRadius: 20, padding: 13, gap: 2, boxShadow: dark ? SH.dark : SH.small }}>
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
          <Button title={`Выехали${cur.id === 'l1' ? ` — ${cur.to} узнает` : ''}`} icon="bus" onPress={() => router.push({ pathname: '/leg', params: { id: cur.id, kind: 'dep' } })} />
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

/** Координатор смотрит глазами делегата или агента — кнопка возврата к пульту поверх вкладок. */
export function BackToCoord() {
  const { viewing, setViewing } = useCoord();
  const insets = useSafeAreaInsets();
  if (!viewing) return null;
  return (
    <Pressable
      onPress={() => { setViewing(false); router.replace('/coord'); }}
      accessibilityRole="button"
      accessibilityLabel="Вернуться к пульту координатора"
      style={{ position: 'absolute', right: 14, bottom: Math.max(insets.bottom, 10) + TAB_BAR_SPACE, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.dark, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, boxShadow: SH.float }}
    >
      <Icon name="grid" size={16} color="#fff" />
      <Text style={{ fontFamily: F.bold, fontSize: 13, color: '#fff' }}>Пульт координатора</Text>
    </Pressable>
  );
}
