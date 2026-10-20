// «Итоги поездки»: что войдёт в PDF и кнопка «Сохранить PDF» — файл можно переслать руководству или партнёрам.
import * as Print from 'expo-print';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Platform } from 'react-native';

import { VISITS } from '@/data/group';
import { base64Of, nowLabel } from '@/data/media';
import { nextTours, reportHtml, type ReportVisit } from '@/data/report';
import { useToast } from '@/state/toast';
import { useVisits } from '@/state/visits';
import { Icon } from '@/ui/Icon';
import { Button, Card, Chip, H3, Plain, Row, T, TitleRow } from '@/ui/kit';
import { C } from '@/ui/theme';

const MAX_PHOTOS = 6;

export default function Report() {
  const { notesOf, cardsOf } = useVisits();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const withData = VISITS.filter((v) => notesOf(v.id).length || cardsOf(v.id).length);

  const make = async () => {
    setBusy(true);
    try {
      const visits: ReportVisit[] = [];
      for (const v of withData) {
        const notes = notesOf(v.id);
        const photos: string[] = [];
        for (const p of notes.filter((n) => n.kind === 'photo').slice(0, MAX_PHOTOS)) {
          const b = p.uri ? await base64Of(p.uri) : null;
          if (b) photos.push(b);
        }
        visits.push({ id: v.id, notes, cards: cardsOf(v.id), photos });
      }
      const html = reportHtml(visits, nowLabel());
      if (Platform.OS === 'web') {
        await Print.printAsync({ html }); // в браузере — окно печати, там «Сохранить как PDF»
      } else {
        const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Итоги поездки' });
        else toast('PDF готов, но поделиться на этом устройстве нельзя');
      }
    } catch {
      toast('Не получилось собрать PDF');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Plain>
      <Card tone="accent">
        <H3>Итоги поездки одним PDF</H3>
        <T>Компании, ваши заметки и фото, контакты с визиток — удобно показать руководству или партнёрам.</T>
        <Button title={busy ? 'Собираю PDF…' : 'Сохранить PDF и поделиться'} icon="doc" onPress={() => { if (!busy) make(); }} />
        <T muted>Собирается на телефоне, без интернета. Голосовые заметки остаются в приложении — в PDF их число.</T>
      </Card>
      <Card>
        <TitleRow title="Войдёт в итоги" right={<Chip>{`${withData.length} из ${VISITS.length}`}</Chip>} />
        {VISITS.map((v) => {
          const n = notesOf(v.id);
          const c = cardsOf(v.id).length;
          const parts = [n.filter((x) => x.kind === 'text').length && `заметок ${n.filter((x) => x.kind === 'text').length}`, n.filter((x) => x.kind === 'voice').length && `голос ${n.filter((x) => x.kind === 'voice').length}`, n.filter((x) => x.kind === 'photo').length && `фото ${n.filter((x) => x.kind === 'photo').length}`, c && `визиток ${c}`].filter(Boolean);
          return (
            <Row key={v.id} left={<Icon name="building" size={22} color={parts.length ? C.blueInk : C.muted} />} title={v.name} sub={parts.length ? parts.join(' · ') : 'пока пусто — добавьте заметки'} onPress={() => router.push(`/company/${v.id}`)} label={`Визит ${v.name}`} />
          );
        })}
      </Card>
      <Card>
        <H3>В конце PDF — что посмотреть дальше</H3>
        {nextTours().map((t) => <T key={t.id}>{`• ${t.title}`}</T>)}
      </Card>
    </Plain>
  );
}
