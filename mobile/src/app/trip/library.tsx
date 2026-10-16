// «Материалы»: закреплённые презентации, материалы поездки (скачиваются для работы без интернета), личные заметки.
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { MATERIALS, PINNED } from '@/data/trip';
import { useToast } from '@/state/toast';
import { useTrip } from '@/state/trip';
import { Icon } from '@/ui/Icon';
import { Button, Card, H3, Row, Screen, T, TitleRow } from '@/ui/kit';
import { C, F } from '@/ui/theme';

export default function Library() {
  const { downloaded, download, notes, addNote } = useTrip();
  const toast = useToast();
  const [draft, setDraft] = useState('');
  const file = (m: { key: string; title: string; sub: string }) => {
    const got = downloaded[m.key];
    return (
      <Row
        key={m.key}
        left={<View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' }}><Icon name="doc" size={20} color={C.blueInk} /></View>}
        title={m.title}
        sub={m.sub}
        right={
          <Pressable
            onPress={() => { if (!got) { download(m.key); toast('Скачано — откроется без интернета'); } }}
            accessibilityRole="button"
            accessibilityLabel={`${got ? 'Скачано' : 'Скачать'}: ${m.title}`}
            style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: got ? C.okSoft : C.blueSoft }}
          >
            <Icon name={got ? 'check' : 'down'} size={18} color={got ? C.ok : C.blueInk} />
          </Pressable>
        }
      />
    );
  };
  return (
    <Screen eyebrow="Скачанное открывается без интернета" title="Материалы">
      <Card tone="accent">
        <TitleRow title={<View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><Icon name="pinned" size={18} /><H3>Закреплено · презентации</H3></View>} right={<T muted>{PINNED.length}</T>} />
        {PINNED.map(file)}
        <T muted>Координатор закрепляет главное наверх: презентацию поездки и презентации компаний после проверки.</T>
      </Card>
      <Card>
        <TitleRow title="Материалы поездки" right={<T muted>{MATERIALS.filter((m) => downloaded[m.key]).length} скачано</T>} />
        {MATERIALS.map(file)}
      </Card>
      <Card>
        <TitleRow title={`Мои заметки · ${notes.length}`} />
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Что важно запомнить с визита"
          placeholderTextColor={C.muted}
          multiline
          accessibilityLabel="Новая заметка"
          style={{ borderWidth: 1, borderColor: '#d5dbe6', borderRadius: 10, padding: 10, minHeight: 44, fontFamily: F.regular, fontSize: 14, color: C.ink }}
        />
        <Button title="+ Заметка" kind="light" small onPress={() => { const t = draft.trim(); if (!t) return; addNote(t); setDraft(''); toast('Заметка сохранена'); }} />
        {notes.map((n, i) => <Row key={i} title={<T>{n.text}</T>} sub={n.time} />)}
        <T muted>Заметки видите только вы.</T>
      </Card>
    </Screen>
  );
}
