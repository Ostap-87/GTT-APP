// Карточка визита у делегата: когда, вопросы группы, мои заметки (текст, голос, фото) и визитки, собранные на визите.
// Всё хранится на телефоне и собирается в «Итоги поездки» (PDF).
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { BASE_Q } from '@/data/extras';
import { VISITS } from '@/data/group';
import { VISIT_DAY } from '@/data/mindmap';
import { useVisits } from '@/state/visits';
import { Icon } from '@/ui/Icon';
import { Button, Card, Chip, H3, Plain, Row, T, TitleRow } from '@/ui/kit';
import { NoteComposer, NoteList } from '@/ui/notes-ui';
import { C, F } from '@/ui/theme';

export default function CompanyVisit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const v = VISITS.find((x) => x.id === id);
  const { cardsOf, notesOf } = useVisits();
  if (!v) return <Plain><T>Визит не найден</T></Plain>;
  const cards = cardsOf(v.id);
  return (
    <Plain>
      <Card>
        <Text style={{ fontFamily: F.display, fontSize: 34, lineHeight: 36, color: C.ink, textTransform: 'uppercase' }}>{v.name}</Text>
        <Row left={<Icon name="cal" size={22} color={C.blueInk} />} title={v.when} right={<Chip tone={v.st[0]}>{v.st[1]}</Chip>} />
      </Card>

      {v.id === 'jd' ? (
        <Card>
          <H3>Вопросы группы</H3>
          {BASE_Q.slice(0, 4).map((q) => <T key={q.zh}>{`• ${q.ru}`}</T>)}
          <T muted>Компания получила их заранее на китайском.</T>
        </Card>
      ) : null}

      <Card>
        <TitleRow title={`Мои заметки · ${notesOf(v.id).length}`} />
        <NoteComposer visit={v.id} />
        <Button title="Вставить расшифровку экскурсии" icon="headphones" kind="ghost" small onPress={() => router.push({ pathname: '/transcript', params: { visit: v.id } })} />
        <NoteList visit={v.id} />
        <T muted>Видите только вы. Фото удаляются долгим нажатием.</T>
      </Card>

      <Card>
        <TitleRow title={`Визитки · ${cards.length}`} />
        {cards.map((c) => (
          <Row key={c.id} left={<Icon name="card" size={22} color={C.blueInk} />} title={c.latin || c.name || 'Без имени'}
            sub={[c.titleRu || c.title, c.companyRu || c.company, c.phones[0]].filter(Boolean).join(' · ')}
            onPress={() => router.push({ pathname: '/card-scan', params: { visit: v.id, id: c.id } })} label={`Визитка: ${c.latin || c.name}`} />
        ))}
        <Button title="Сканировать визитку" icon="camera" onPress={() => router.push({ pathname: '/card-scan', params: { visit: v.id } })} />
        <View style={{ paddingHorizontal: 2 }}>
          <Text style={{ fontFamily: F.regular, fontSize: 12.5, color: C.muted }}>Фото визитки → приложение распознаёт китайский текст, пишет имя латиницей и переводит должность и компанию.</Text>
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><Button title="Майндмэп дня" icon="mindmap" kind="light" onPress={() => router.push({ pathname: '/mindmap', params: { day: String(VISIT_DAY[v.id]) } })} /></View>
        <View style={{ flex: 1 }}><Button title="Итоги — PDF" icon="doc" kind="ghost" label="Итоги поездки — PDF" onPress={() => router.push('/report')} /></View>
      </View>
    </Plain>
  );
}
