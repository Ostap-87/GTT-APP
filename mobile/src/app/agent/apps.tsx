// «Мои заявки»: заявки на места и запросы на расчёт со статусами «отправлена → в работе → подтверждена».
// Агент видит только свои заявки (правило доступа).
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';

import { APP_ST, CALC_ST, calcTitle, citLine, tourById } from '@/data/agent';
import { useAgent } from '@/state/agent';
import { AgentScreen } from '@/ui/agent-ui';
import { Stat } from '@/ui/coord-ui';
import { Button, Card, Chip, H3, Row, T, TitleRow } from '@/ui/kit';

export default function AgentApps() {
  const a = useAgent();
  const { seen } = a;
  // Отметки «новое» гаснут, когда агент уходит с вкладки — он их уже увидел
  useFocusEffect(useCallback(() => () => seen(), [seen]));
  const apps = a.myApps;
  const by = (st: string) => apps.filter((x) => x.status === st).length;
  return (
    <AgentScreen title="Мои заявки">
      <Button title="Новая заявка" icon="send" onPress={() => router.push('/agent-apply')} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Stat label="В работе" value={String(by('new') + by('work'))} sub={`${by('new')} ждут ответа`} />
        <Stat label="Подтверждено" value={String(by('confirmed'))} sub={`участников: ${apps.filter((x) => x.status === 'confirmed').reduce((n, x) => n + x.people, 0)}`} />
      </View>
      <Card>
        <H3>Заявки на места</H3>
        {apps.map((x) => (
          <Row key={x.id} title={tourById[x.tour].title}
            sub={`${x.dates} · ${x.people} чел. · отправлена ${x.time}\n${x.client}${x.note ? `\n${x.upd ? 'Новое: ' : ''}${x.note}` : ''}`}
            right={<Chip tone={APP_ST[x.status][0]}>{APP_ST[x.status][1]}</Chip>} />
        ))}
      </Card>
      <Card>
        <TitleRow title="Запросы на расчёт" right={<Button title="Новый" kind="light" small onPress={() => router.navigate('/agent/calc')} />} />
        {a.calcs.length ? a.calcs.map((r) => (
          <Row key={r.id} onPress={() => router.push(`/calc/${r.id}`)} label={`Запрос ${r.id}`} title={`${r.id} · ${calcTitle(r)}`}
            sub={`${r.people} чел. · ${citLine(r.cit)} · отправлен ${r.time}${r.upd ? ' · новое' : ''}`}
            right={<Chip tone={CALC_ST[r.status][0]}>{CALC_ST[r.status][1]}</Chip>} />
        )) : <T muted>Пока нет</T>}
      </Card>
      <Card>
        <H3>Как это работает</H3>
        <T muted>Заявка уходит координатору GTT в приложение и в Telegram. Статус меняется здесь: отправлена → в работе → подтверждена. Паспорта и телефоны участников — только после подтверждения, хранятся на сервере в России.</T>
      </Card>
    </AgentScreen>
  );
}
