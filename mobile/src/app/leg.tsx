// «Выехали» / «Прибыли»: время ставится само (план или факт), координатор может поправить его на ±1–5 минут.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { LEGS, diffTxt, dur, fromMin, toMin } from '@/data/group';
import { TRIP } from '@/data/trip';
import { useCoord } from '@/state/coord';
import { useToast } from '@/state/toast';
import { Button, Card, H3, Plain, T } from '@/ui/kit';
import { C, F } from '@/ui/theme';

export default function LegTime() {
  const { id = 'l1', kind = 'dep' } = useLocalSearchParams<{ id: string; kind: 'dep' | 'arr' }>();
  const k = useCoord();
  const toast = useToast();
  const L = LEGS.find((x) => x.id === id) || LEGS[0];
  const dep = k.legs[L.id]?.dep || L.plan;
  const isDep = kind === 'dep';
  const [t, setT] = useState(() => fromMin(isDep ? toMin(L.plan) + 4 : toMin(dep) + L.min - 8));
  const m = isDep ? 0 : toMin(t) - toMin(dep);
  const save = () => {
    const err = k.markLeg(L.id, isDep ? 'dep' : 'arr', t);
    if (err) return toast(err);
    toast(isDep ? (L.id === 'l1' ? `Выехали в ${t} — ${L.to} и делегаты видят «в пути»` : `Выезд в ${t} записан`) : `В пути ${dur(m)} — записано в журнал`);
    router.back();
  };
  return (
    <Plain>
      <Card>
        <H3>{`${isDep ? 'Выехали' : 'Прибыли'} · ${L.from} → ${L.to}`}</H3>
        <T muted>{isDep ? `План выезда ${L.plan}, в пути ~${dur(L.min)}` : `Выехали в ${dep}, план в пути ${dur(L.min)}`}. Время можно поправить.</T>
        <Text style={{ fontFamily: F.display, fontSize: 64, lineHeight: 68, color: C.ink, textAlign: 'center' }} accessibilityLabel={`Время ${t}`}>{t}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[-5, -1, 1, 5].map((x) => <View key={x} style={{ flex: 1 }}><Button title={`${x > 0 ? '+' : '−'}${Math.abs(x)} мин`} kind="ghost" small onPress={() => setT(fromMin(toMin(t) + x))} /></View>)}
        </View>
        {isDep && L.id === 'l1' && k.missing.length ? <Card tone="warn"><T>{`В автобусе ${k.busCount} из 18 — отсутствующих можно отметить и после выезда.`}</T></Card> : null}
        {isDep ? (L.id === 'l1' ? <T muted>{`${L.to} увидит «${TRIP.country === 'cn' ? '代表团已出发' : 'Delegation is on the way'}», делегаты — «в пути».`}</T> : null) : <Card tone="info"><T>{`В пути ${dur(m)} · ${diffTxt(m, L.min)}`}</T></Card>}
      </Card>
      <Button title={isDep ? 'Отметить выезд' : 'Отметить прибытие'} onPress={save} />
      <Button title="Отмена" kind="ghost" onPress={() => router.back()} />
    </Plain>
  );
}
