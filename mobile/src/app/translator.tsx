// Переводчик: нажал — сказал — перевод текстом (и голосом). В шаге 1 фразы заготовлены; в приложении — распознавание
// речи и перевод китайский ↔ русский ↔ английский (поставщика выберем на пилоте — docs/architecture.md).
import { useState } from 'react';
import { Text, View } from 'react-native';

import { countryOf } from '@/data/countries';
import { TRIP } from '@/data/trip';
import { Button, Card, Check, Plain, T } from '@/ui/kit';
import { C, F } from '@/ui/theme';

type Bubble = { side: 'ru' | 'zh'; orig: string; tr: string };
// фразы — на языке страны поездки (data/countries.ts); side 'zh' — собеседник на местном языке
const lang = () => countryOf(TRIP.country).lang;
const PHRASES = { ru: lang().ru2local, zh: lang().local2ru };

export default function Translator() {
  const [chat, setChat] = useState<Bubble[]>([]);
  const [idx, setIdx] = useState({ ru: 0, zh: 0 });
  const [voice, setVoice] = useState(true);
  const speak = (side: 'ru' | 'zh') => {
    const [orig, tr] = PHRASES[side][idx[side] % PHRASES[side].length];
    setChat((c) => [...c, { side, orig, tr }]);
    setIdx((x) => ({ ...x, [side]: x[side] + 1 }));
  };
  return (
    <Plain>
      <T muted>{`Нажмите и говорите — перевод появится текстом${voice ? ' и прозвучит вслух' : ''}.`}</T>
      <Card style={{ minHeight: 220 }}>
        {chat.length ? chat.map((b, i) => (
          <View key={i} style={{ alignSelf: b.side === 'ru' ? 'flex-end' : 'flex-start', maxWidth: '86%', backgroundColor: b.side === 'ru' ? C.blueSoft : C.okSoft, borderRadius: 14, padding: 10, gap: 4 }}>
            <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}>{b.orig}</Text>
            <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.muted }}>{b.tr}</Text>
          </View>
        )) : <T muted>Пока пусто. Попробуйте обе кнопки: одна для вас, другая для собеседника.</T>}
      </Card>
      <T muted>Кто говорит — нажмите свою кнопку</T>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><Button title="Русский" icon="mic" label="Говорю по-русски" onPress={() => speak('ru')} /></View>
        <View style={{ flex: 1 }}><Button title={lang().self} icon="mic" kind="dark" label={`${lang().self} — собеседник говорит (${lang().ru})`} onPress={() => speak('zh')} /></View>
      </View>
      <Check on={voice} onPress={() => setVoice(!voice)}>Озвучивать перевод</Check>
      <T muted>{`Сейчас фразы заготовлены для показа. В приложении — распознавание речи и перевод: ${lang().ru} ↔ русский ↔ английский.`}</T>
    </Plain>
  );
}
