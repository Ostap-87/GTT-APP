// «Расшифровка экскурсии» (решение 21.10.2026): речь переводчика расшифровывает стороннее приложение, текст вставляется
// в заметки визита. Сразу видно «Коротко» — главные фразы — и темы для майндмэпа; всё считается на телефоне, бесплатно.
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { TextInput } from 'react-native';

import { VISITS } from '@/data/group';
import { keyPoints, wordCount } from '@/data/summary';
import { findThemes, themeOf } from '@/data/themes';
import { useToast } from '@/state/toast';
import { useVisits } from '@/state/visits';
import { Button, Card, H3, Plain, T, inputStyle } from '@/ui/kit';
import { C } from '@/ui/theme';

export default function Transcript() {
  const { visit = 'jd' } = useLocalSearchParams<{ visit?: string }>();
  const v = VISITS.find((x) => x.id === visit);
  const { addNote } = useVisits();
  const toast = useToast();
  const [text, setText] = useState('');
  const points = keyPoints([{ text }], 5);
  const themes = findThemes(text);

  const paste = async () => {
    try {
      const t = await Clipboard.getStringAsync();
      if (!t.trim()) return toast('В буфере обмена нет текста');
      setText((cur) => (cur.trim() ? `${cur.trim()}\n${t}` : t));
    } catch {
      toast('Не получилось прочитать буфер — вставьте текст в поле долгим нажатием');
    }
  };
  const save = () => {
    if (wordCount(text) < 5) return toast('Вставьте расшифровку');
    addNote(visit, { kind: 'guide', text: text.trim(), label: 'Расшифровка экскурсии' });
    toast(`Расшифровка — в заметках ${v?.name || ''}`);
    router.back();
  };

  return (
    <Plain>
      <Card tone="info">
        <H3>{`Расшифровка экскурсии · ${v?.name || visit}`}</H3>
        <T>Переводчик записывает экскурсию в приложении для расшифровки. Скопируйте текст оттуда и вставьте сюда — приложение выделит главное и темы и добавит их в майндмэп дня.</T>
      </Card>
      <Button title="Вставить из буфера обмена" icon="doc" kind="light" onPress={paste} />
      <TextInput value={text} onChangeText={setText} multiline placeholder="…или вставьте текст сюда долгим нажатием" placeholderTextColor={C.muted}
        accessibilityLabel="Текст расшифровки" style={[inputStyle, { minHeight: 180, maxHeight: 320, textAlignVertical: 'top' }]} />
      {text.trim() ? <T muted>{`${wordCount(text)} слов`}</T> : null}
      {points.length ? (
        <Card>
          <H3>Коротко</H3>
          {points.map((p, i) => <T key={i}>{`• ${p.text}`}</T>)}
          {themes.length ? <T muted>{`Темы: ${themes.map((k) => themeOf(k)?.ru).join(', ')}`}</T> : null}
        </Card>
      ) : null}
      <Button title="Сохранить в заметки визита" onPress={save} />
      <T muted>Считается на телефоне, без интернета и без ИИ — текст никуда не отправляется. Записывать экскурсию — только с согласия гида и принимающей компании.</T>
    </Plain>
  );
}
