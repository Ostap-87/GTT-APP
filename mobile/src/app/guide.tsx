// «Слушать гида» — радиогид: гид или переводчик говорит в свой телефон, группа слушает в наушниках, по желанию с
// субтитрами на русском. Трансляцию включает координатор на «Пульте».
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

import { GUIDE, SUBS } from '@/data/extras';
import { useCoord } from '@/state/coord';
import { Button, Card, Check, H3, Plain, Seg, T } from '@/ui/kit';
import { C, F } from '@/ui/theme';

function Eq() {
  const bars = useRef([0, 1, 2, 3, 4, 5].map(() => new Animated.Value(0.3))).current;
  useEffect(() => {
    const loops = bars.map((v, i) => Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 300 + i * 70, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0.25, duration: 300 + i * 50, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])));
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [bars]);
  return (
    <View style={{ flexDirection: 'row', gap: 5, height: 36, alignItems: 'center' }} accessibilityElementsHidden>
      {bars.map((v, i) => <Animated.View key={i} style={{ width: 6, height: 36, borderRadius: 3, backgroundColor: C.orange, transform: [{ scaleY: v }] }} />)}
    </View>
  );
}

export default function Guide() {
  const { guideLive } = useCoord();
  const [listening, setListening] = useState(false);
  const [subs, setSubs] = useState(true);
  const [vol, setVol] = useState<'low' | 'mid' | 'high'>('mid');
  if (!guideLive) {
    return (
      <Plain>
        <Card>
          <H3>Гид пока не в эфире</H3>
          <T muted>Когда переводчик или гид начнёт трансляцию, здесь появится звук, а на «Сегодня» — плашка «Гид в эфире». Трансляцию включает координатор.</T>
        </Card>
      </Plain>
    );
  }
  return (
    <Plain>
      <Card tone="dark" style={{ alignItems: 'center', gap: 12 }}>
        <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.onDark }}>{`${listening ? 'Вы слушаете' : 'В эфире'} · ${GUIDE.name}, ${GUIDE.role}`}</Text>
        {listening ? <Eq /> : null}
        <Button title={listening ? 'Остановить' : 'Слушать'} icon={listening ? undefined : 'headphones'} kind={listening ? 'light' : 'primary'} onPress={() => setListening(!listening)} />
      </Card>
      <T muted>Громкость</T>
      <Seg options={[['low', 'Тише'], ['mid', 'Средне'], ['high', 'Громче']] as const} value={vol} onChange={setVol} />
      <Check on={subs} onPress={() => setSubs(!subs)}>Субтитры на русском</Check>
      {listening && subs ? <Card tone="info">{SUBS.map((s) => <T key={s}>{s}</T>)}</Card> : null}
      <T muted>Вставьте наушники — проводные или Bluetooth. Звук идёт через интернет или Wi‑Fi гида, задержка около полсекунды. В шумном цеху слышен голос гида, а не шум зала.</T>
    </Plain>
  );
}
