// «Мои документы» (решение 21.10.2026): паспорт, виза, билеты, страховка, бронь отеля — снимком или PDF. Хранятся только на
// телефоне и открываются без интернета; нужный документ — крупно одним нажатием (паспортный контроль, стойка отеля).
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { DOC_KINDS, docKindRu, type DocKind, type TripDoc } from '@/data/docs';
import { keepFile, nowLabel } from '@/data/media';
import { useToast } from '@/state/toast';
import { useTrip } from '@/state/trip';
import { Icon } from '@/ui/Icon';
import { Button, Card, H3, Plain, T, TitleRow } from '@/ui/kit';
import { pickPhoto } from '@/ui/notes-ui';
import { C, F } from '@/ui/theme';

function Thumb({ d }: { d: TripDoc }) {
  return (
    <Pressable onPress={() => router.push(`/doc/${d.id}`)} accessibilityRole="button" accessibilityLabel={`Открыть: ${d.title}`}
      style={{ width: 104, gap: 4 }}>
      {d.type === 'image'
        ? <Image source={{ uri: d.uri }} style={{ width: 104, height: 74, borderRadius: 8, backgroundColor: C.line2 }} resizeMode="cover" />
        : <View style={{ width: 104, height: 74, borderRadius: 8, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' }}><Icon name="doc" size={26} color={C.blueInk} /><Text style={{ fontFamily: F.bold, fontSize: 11, color: C.blueInk }}>PDF</Text></View>}
      <Text numberOfLines={1} style={{ fontFamily: F.medium, fontSize: 11.5, color: C.ink }}>{d.title}</Text>
    </Pressable>
  );
}

export default function Docs() {
  const { docs, addDoc } = useTrip();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const titleOf = (k: DocKind) => { const ru = DOC_KINDS.find((d) => d.key === k)!.ru; const n = docs.filter((d) => d.kind === k).length; return n ? `${ru} · ${n + 1}` : ru; };
  const save = (k: DocKind, uri: string, type: TripDoc['type']) => {
    addDoc({ id: `doc${Date.now()}`, kind: k, title: titleOf(k), uri, type, at: nowLabel() });
    toast('Сохранено на телефоне — откроется без интернета');
  };
  const photo = async (k: DocKind) => {
    const p = await pickPhoto('camera');
    if (!p) return;
    setBusy(true);
    try { save(k, await keepFile(p.uri, 'jpg'), 'image'); } catch { toast('Не получилось сохранить снимок'); }
    setBusy(false);
  };
  /** Файл: PDF из почты или «Файлов» либо снимок из галереи. */
  const file = async (k: DocKind) => {
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (r.canceled || !r.assets?.length) return;
    const a = r.assets[0];
    const isPdf = (a.mimeType || '').includes('pdf') || /\.pdf$/i.test(a.name);
    setBusy(true);
    try { save(k, await keepFile(a.uri, isPdf ? 'pdf' : 'jpg'), isPdf ? 'pdf' : 'image'); } catch { toast('Не получилось сохранить файл'); }
    setBusy(false);
  };
  const addBtns = (k: DocKind) => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <View style={{ flex: 1 }}><Button title="Снять" icon="camera" small kind="light" label={`Снять: ${docKindRu(k)}`} onPress={() => { if (!busy) photo(k); }} /></View>
      <View style={{ flex: 1 }}><Button title="Файл или фото" icon="doc" small kind="light" label={`Файл: ${docKindRu(k)}`} onPress={() => { if (!busy) file(k); }} /></View>
    </View>
  );

  return (
    <Plain>
      <Card tone="info">
        <TitleRow title={<View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><Icon name="lock" size={18} color={C.blueInk} /><H3>Только на этом телефоне</H3></View>} />
        <T>Документы не уходят ни координатору, ни на сервер — координатор видит лишь отметку «загружено» в чек-листе. Открываются без интернета.</T>
      </Card>
      {DOC_KINDS.map((k) => {
        const list = docs.filter((d) => d.kind === k.key);
        return (
          <Card key={k.key}>
            <TitleRow title={k.ru} right={list.length ? <T muted>{String(list.length)}</T> : null} />
            {list.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{list.map((d) => <Thumb key={d.id} d={d} />)}</View>
            ) : <T muted>{k.sub}</T>}
            {addBtns(k.key)}
          </Card>
        );
      })}
      <T muted>Паспорт — разворот с фото, ровно и без бликов. Билеты и страховку удобнее добавить PDF из почты: «Файл или фото».</T>
    </Plain>
  );
}
