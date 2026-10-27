// Опросы: полоски итога и список вопросов к компании — общие для координатора и делегата.
import { Text, View } from 'react-native';

import { byId } from '@/data/group';
import { questionsOf, tally, type Poll } from '@/data/polls';
import { DELEGATES } from '@/data/trip';
import { T } from './kit';
import { C, F } from './theme';

/** Полоски итога: вариант, сколько голосов, доля. */
export function Bars({ p }: { p: Poll }) {
  const t = tally(p);
  const max = Math.max(1, ...t.rows.map((r) => r.n));
  return (
    <View style={{ gap: 8 }}>
      {t.rows.map((r, i) => (
        <View key={r.id} style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <Text style={{ flex: 1, fontFamily: i === 0 && r.n ? F.semibold : F.regular, fontSize: 14, color: C.ink }}>{r.text}</Text>
            <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.ink, fontVariant: ['tabular-nums'] }}>{r.n}</Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: C.well }}>
            <View style={{ width: `${(r.n / max) * 100}%`, height: 8, borderRadius: 4, backgroundColor: i === 0 && r.n ? C.blue : '#9db8e6' }} />
          </View>
        </View>
      ))}
      <T muted>{`Ответили ${t.total} из ${DELEGATES.length}${t.left ? ` · ждём ${t.left}` : ''}`}</T>
    </View>
  );
}

export function Questions({ p, top = 5 }: { p: Poll; top?: number }) {
  const qs = questionsOf(p);
  return (
    <View style={{ gap: 6 }}>
      {qs.slice(0, top).map((q, i) => (
        <View key={q.id} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <Text style={{ width: 22, fontFamily: F.bold, fontSize: 14, color: i < 5 ? C.blue : C.muted }}>{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <T>{q.text}</T>
            <T muted>{`${byId[q.by]?.ru || 'Участник'} · поддержали ${q.likes.length}`}</T>
          </View>
        </View>
      ))}
      {qs.length > top ? <T muted>{`и ещё ${qs.length - top}`}</T> : null}
    </View>
  );
}

