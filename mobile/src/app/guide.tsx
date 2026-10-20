// «Слушать гида» — радиогид: гид или переводчик говорит в свой телефон, группа слушает в наушниках, по желанию с
// субтитрами на русском. Трансляцию включает координатор на «Пульте». Субтитры можно сохранить в заметки текущего визита —
// из них соберутся темы майндмэпа (решение 20.10.2026; полная расшифровка речи и саммари ИИ — шаг 2, сервер).
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

import { GUIDE, SUBS } from '@/data/extras';
import { VISITS } from '@/data/group';
import { TRIP, dayEvents } from '@/data/trip';
import { useCoord } from '@/state/coord';
import { useToast } from '@/state/toast';
import { useVisits } from '@/state/visits';
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
  const { addNote, notesOf } = useVisits();
  const toast = useToast();
  // визит, на котором идёт экскурсия: в демо — первый визит «сегодня»
  const visit = VISITS.find((v) => dayEvents(TRIP.today).some((e) => e.kind === 'co' && e.name === v.name));
  const saved = !!visit && notesOf(visit.id).some((n) => n.kind === 'guide');
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
      {listening && subs && visit ? (
        <Card>
          <H3>Конспект экскурсии</H3>
          <T>{saved ? `Рассказ гида — в заметках визита ${visit.name} и уже в майндмэпе дня.` : `Сохраните субтитры в заметки визита ${visit.name}: из них соберутся темы для майндмэпа и итогов поездки.`}</T>
          {saved
            ? <Button title="Открыть майндмэп дня" icon="mindmap" kind="light" onPress={() => router.push('/mindmap')} />
            : <Button title="Сохранить рассказ гида" icon="doc" onPress={() => { addNote(visit.id, { kind: 'guide', text: SUBS.join(' ') }); toast(`Рассказ гида — в заметках ${visit.name}`); }} />}
          <T muted>В демо — пример субтитров. В приложении речь переводчика будет расшифровываться целиком, а ИИ сделает конспект и саммари визита. Записываем только с согласия гида и принимающей компании: на многих производствах запись запрещена.</T>
        </Card>
      ) : null}
      <T muted>Вставьте наушники — проводные или Bluetooth. Звук идёт через интернет или Wi‑Fi гида, задержка около полсекунды. В шумном цеху слышен голос гида, а не шум зала.</T>
    </Plain>
  );
}
