// Редактор опроса (координатор): вопрос, пояснение, до какого времени, варианты; для «Вопросов к компании» — стартовые вопросы.
// Сохраняется сразу; «Запустить» — делегатам уходит опрос (если опросы для группы включены).
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Switch, TextInput, View } from 'react-native';

import { KIND_RU } from '@/data/polls';
import { usePolls } from '@/state/polls';
import { useToast } from '@/state/toast';
import { Icon } from '@/ui/Icon';
import { Button, Card, Field, H3, Plain, T, inputStyle } from '@/ui/kit';
import { C } from '@/ui/theme';

export default function PollEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const P = usePolls();
  const toast = useToast();
  const p = P.byId(String(id));
  if (!p) return <Plain><T>Опрос не найден.</T></Plain>;
  const set = (patch: Parameters<typeof P.update>[1]) => P.update(p.id, patch);
  const live = p.status === 'live';
  return (
    <Plain>
      <T muted>{`${KIND_RU[p.kind]}${live ? ' · идёт — правки сразу видны делегатам' : ' · черновик'}`}</T>
      <Card>
        <Field label="Вопрос" value={p.title} onChangeText={(v) => set({ title: v })} />
        <Field label="Пояснение для делегатов" value={p.note} onChangeText={(v) => set({ note: v })} multiline placeholder="Например: бронь подтверждаем в 16:00" />
        <Field label="Ответить до" value={p.until} onChangeText={(v) => set({ until: v })} placeholder="15:00" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <T style={{ flex: 1 }}>Показывать делегатам итог после ответа</T>
          <Switch value={p.showResults} onValueChange={(v) => set({ showResults: v })} accessibilityLabel="Показывать итог делегатам" trackColor={{ true: C.blue, false: C.line }} thumbColor="#ffffff" />
        </View>
      </Card>

      {p.kind === 'questions' ? (
        <Card>
          <H3>Вопросы для начала</H3>
          <T muted>Делегаты добавят свои и поддержат лучшие; компании уйдут 5 самых популярных.</T>
          {p.questions.map((q) => (
            <View key={q.id} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TextInput value={q.text} onChangeText={(v) => set({ questions: p.questions.map((x) => (x.id === q.id ? { ...x, text: v } : x)) })} style={{ ...inputStyle, flex: 1 }} accessibilityLabel="Вопрос к компании" multiline />
              <Pressable onPress={() => set({ questions: p.questions.filter((x) => x.id !== q.id) })} accessibilityRole="button" accessibilityLabel="Удалить вопрос" hitSlop={8}>
                <Icon name="trash" size={20} color={C.muted} />
              </Pressable>
            </View>
          ))}
        </Card>
      ) : (
        <Card>
          <H3>Варианты ответа</H3>
          {p.options.map((o, i) => (
            <View key={o.id} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TextInput value={o.text} onChangeText={(v) => set({ options: p.options.map((x) => (x.id === o.id ? { ...x, text: v } : x)) })} style={{ ...inputStyle, flex: 1 }} accessibilityLabel={`Вариант ${i + 1}`} />
              {p.options.length > 2 && !live ? (
                <Pressable onPress={() => set({ options: p.options.filter((x) => x.id !== o.id) })} accessibilityRole="button" accessibilityLabel={`Удалить вариант ${i + 1}`} hitSlop={8}>
                  <Icon name="trash" size={20} color={C.muted} />
                </Pressable>
              ) : null}
            </View>
          ))}
          {!live && p.options.length < 8 ? <Button title="Добавить вариант" kind="light" small onPress={() => set({ options: [...p.options, { id: `o${Date.now()}`, text: `Вариант ${p.options.length + 1}` }] })} /> : null}
        </Card>
      )}

      {p.status === 'draft' ? (
        <Button title="Запустить сейчас" icon="send" onPress={() => {
          if (!P.enabled) { toast('Сначала включите опросы для группы'); return; }
          P.launch(p.id); toast('Опрос у делегатов'); router.back();
        }} />
      ) : null}
      <Button title="Готово" kind="light" onPress={() => router.back()} />
    </Plain>
  );
}
