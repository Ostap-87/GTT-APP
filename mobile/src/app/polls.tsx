// «Опросы в группе» для координатора (решение пользователя 27.10.2026): выключены, пока координатор их не включит; черновики
// готовятся заранее, делегатам уходит только запущенный опрос; итог виден сразу, вопросы к компании — по поддержке.
import { router } from 'expo-router';
import { Switch, View } from 'react-native';

import { KIND_ICON, KIND_RU, pollLeft, questionsOf, tally, type Poll, type PollKind } from '@/data/polls';
import { usePolls } from '@/state/polls';
import { useToast } from '@/state/toast';
import { Icon } from '@/ui/Icon';
import { Button, Card, Chip, Chips, H3, Pick, Plain, T, TitleRow } from '@/ui/kit';
import { Bars, Questions } from '@/ui/poll-ui';
import { C } from '@/ui/theme';

const NEW: PollKind[] = ['restaurant', 'excursion', 'questions', 'custom'];

export default function Polls() {
  const P = usePolls();
  const toast = useToast();
  const live = P.list.filter((p) => p.status === 'live');
  const drafts = P.list.filter((p) => p.status === 'draft');
  const closed = P.list.filter((p) => p.status === 'closed');
  const launch = (p: Poll) => {
    if (!P.enabled) { toast('Сначала включите опросы для группы'); return; }
    P.launch(p.id);
    toast('Опрос у делегатов: push и карточка на «Сегодня»');
  };
  return (
    <Plain>
      <Card tone={P.enabled ? 'info' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon name="poll" size={26} color={P.enabled ? C.blueInk : C.muted} />
          <View style={{ flex: 1 }}>
            <H3>Опросы для группы</H3>
            <T muted>{P.enabled ? 'Включено: делегаты видят только запущенные опросы' : 'Выключено: делегаты опросов не видят'}</T>
          </View>
          <Switch value={P.enabled} onValueChange={(v) => { P.setEnabled(v); toast(v ? 'Опросы включены' : 'Опросы выключены — у делегатов они скрыты'); }}
            accessibilityLabel="Опросы для группы" trackColor={{ true: C.blue, false: C.line }} thumbColor="#ffffff" />
        </View>
        <T muted>Готовьте опросы заранее черновиками и запускайте в нужный момент — тогда в группе не будет неразберихи.</T>
      </Card>

      <Card>
        <H3>Новый опрос</H3>
        <Chips>{NEW.map((k) => <Pick key={k} title={KIND_RU[k]} on={false} onPress={() => { const id = P.create(k); router.push({ pathname: '/poll-edit', params: { id } }); }} />)}</Chips>
      </Card>

      {live.map((p) => (
        <Card key={p.id}>
          <TitleRow title={<H3>{p.title}</H3>} right={<Chip tone="new">идёт</Chip>} />
          <T muted>{[KIND_RU[p.kind], pollLeft(p)].filter(Boolean).join(' · ')}</T>
          {p.kind === 'questions' ? <Questions p={p} /> : <Bars p={p} />}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {p.kind === 'questions' ? (
              <Button title={p.sentAt ? `Отправлено в ${p.sentAt}` : 'Отправить компании топ-5'} small kind={p.sentAt ? 'ghost' : 'primary'}
                onPress={() => { P.sendToCompany(p.id); toast('Компания получит 5 вопросов по-китайски — перевод сделает переводчик'); }} />
            ) : null}
            <Button title="Напомнить не ответившим" small kind="ghost" onPress={() => toast('Напоминание ушло тем, кто ещё не ответил')} />
            <Button title="Завершить" small kind="ghost" onPress={() => { P.close(p.id); toast('Опрос завершён — итог виден делегатам'); }} />
          </View>
        </Card>
      ))}

      {drafts.length ? (
        <Card>
          <H3>Черновики</H3>
          {drafts.map((p) => (
            <View key={p.id} style={{ gap: 6, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.line2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name={KIND_ICON[p.kind]} size={18} color={C.muted} />
                <T bold style={{ flex: 1 }}>{p.title}</T>
              </View>
              <T muted>{`${KIND_RU[p.kind]} · ${p.kind === 'questions' ? `${p.questions.length} вопросов для начала` : `${p.options.length} варианта`}${p.until ? ` · до ${p.until}` : ''}`}</T>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Button title="Запустить" small icon="send" onPress={() => launch(p)} />
                <Button title="Изменить" small kind="ghost" onPress={() => router.push({ pathname: '/poll-edit', params: { id: p.id } })} />
                <Button title="Удалить" small kind="ghost" onPress={() => P.remove(p.id)} />
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      {closed.length ? (
        <Card>
          <H3>Завершённые</H3>
          {closed.map((p) => {
            const top = p.kind === 'questions' ? questionsOf(p)[0]?.text : tally(p).rows[0]?.text;
            return <T key={p.id}>{`${p.title} — ${p.kind === 'questions' ? `главный вопрос: «${top || '—'}»` : `итог: ${top || '—'} (${tally(p).total} ответов)`}`}</T>;
          })}
        </Card>
      ) : null}
    </Plain>
  );
}
