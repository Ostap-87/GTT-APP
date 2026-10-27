// Опрос координатора глазами делегата: один ответ (можно передумать, пока идёт), итог — если координатор его показывает.
// «Вопросы к компании»: свой вопрос и поддержка чужих; 5 самых популярных координатор отправит компании по-китайски.
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { pollLeft, questionsOf } from '@/data/polls';
import { byId } from '@/data/group';
import { ME } from '@/data/trip';
import { usePolls } from '@/state/polls';
import { useToast } from '@/state/toast';
import { Icon } from '@/ui/Icon';
import { Button, Card, Chip, H3, Plain, T, TitleRow, inputStyle } from '@/ui/kit';
import { Bars } from '@/ui/poll-ui';
import { C, F, SH } from '@/ui/theme';

export default function PollScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const P = usePolls();
  const toast = useToast();
  const [q, setQ] = useState('');
  const p = P.byId(String(id));
  if (!p || !P.enabled || p.status === 'draft') return <Plain><T>Этот опрос сейчас недоступен.</T></Plain>;
  const live = p.status === 'live';
  const mine = p.votes[ME.id];

  return (
    <Plain>
      <Card>
        <TitleRow title={<H3>{p.title}</H3>} right={<Chip tone={live ? 'new' : 'ok'}>{live ? pollLeft(p) || 'идёт' : 'завершён'}</Chip>} />
        {p.note ? <T muted>{p.note}</T> : null}
      </Card>

      {p.kind === 'questions' ? (
        <>
          {live ? (
            <Card>
              <H3>Ваш вопрос компании</H3>
              <TextInput value={q} onChangeText={setQ} multiline placeholder="Что хотите узнать на визите?" style={{ ...inputStyle, minHeight: 64 }} accessibilityLabel="Ваш вопрос компании" />
              <Button title="Отправить вопрос" icon="send" onPress={() => { if (!q.trim()) return; P.ask(p.id, q.trim()); setQ(''); toast('Вопрос добавлен — его увидят все'); }} />
            </Card>
          ) : null}
          <Card>
            <H3>{live ? 'Поддержите лучшие' : 'Вопросы группы'}</H3>
            {questionsOf(p).map((x, i) => {
              const on = x.likes.includes(ME.id);
              return (
                <View key={x.id} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: C.line2 }}>
                  <View style={{ flex: 1 }}>
                    <T>{x.text}</T>
                    <T muted>{x.by === ME.id ? 'ваш вопрос' : byId[x.by]?.ru || 'участник'}</T>
                  </View>
                  <Pressable disabled={!live} onPress={() => P.like(p.id, x.id)} accessibilityRole="button" accessibilityLabel={on ? 'Убрать поддержку' : 'Поддержать вопрос'} accessibilityState={{ selected: on }}
                    style={{ minWidth: 54, height: 36, borderRadius: 18, flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? C.blueSoft : C.card, boxShadow: on ? SH.inset : SH.small }}>
                    <Icon name="star" size={16} color={on ? C.blueInk : C.muted} />
                    <Text style={{ fontFamily: F.semibold, fontSize: 14, color: on ? C.blueInk : C.ink }}>{x.likes.length}</Text>
                  </Pressable>
                </View>
              );
            })}
            {p.sentAt ? <T muted>{`Координатор отправил компании 5 главных вопросов в ${p.sentAt}`}</T> : null}
          </Card>
        </>
      ) : (
        <Card>
          {p.options.map((o) => {
            const on = mine === o.id;
            return (
              <Pressable key={o.id} disabled={!live} onPress={() => { P.vote(p.id, o.id); if (!mine) toast('Ответ учтён'); }} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={o.text}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: on ? C.blueSoft : C.card, boxShadow: on ? SH.inset : SH.small }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: on ? C.blue : C.line, alignItems: 'center', justifyContent: 'center' }}>
                  {on ? <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: C.blue }} /> : null}
                </View>
                <Text style={{ flex: 1, fontFamily: on ? F.semibold : F.medium, fontSize: 15, color: C.ink }}>{o.text}</Text>
              </Pressable>
            );
          })}
          {mine && live ? <T muted>Можно передумать, пока опрос идёт.</T> : null}
        </Card>
      )}

      {p.kind !== 'questions' && p.showResults && (mine || !live) ? (
        <Card>
          <H3>{live ? 'Сейчас' : 'Итог'}</H3>
          <Bars p={p} />
        </Card>
      ) : null}
    </Plain>
  );
}
