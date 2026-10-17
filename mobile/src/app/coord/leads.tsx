// «Заявки» координатора: запросы на расчёт (ТЗ агентов) и заявки на места — от агентов и с формы сайта, в одном списке.
import { router } from 'expo-router';
import { View } from 'react-native';

import { APP_ST, CALC_ST, CIS_RU, calcTitle, citLine, tourById } from '@/data/agent';
import { useAgent } from '@/state/agent';
import { useToast } from '@/state/toast';
import { CoordScreen } from '@/ui/coord-ui';
import { Button, Card, Chip, Row, T, TitleRow } from '@/ui/kit';
import { C } from '@/ui/theme';

export default function Leads() {
  const a = useAgent();
  const toast = useToast();
  const open = a.apps.filter((x) => x.status !== 'confirmed').length + a.calcs.filter((r) => r.status !== 'done').length;
  return (
    <CoordScreen title={`Заявки · ${open} в работе`}>
      <Card>
        <TitleRow title="Запросы на расчёт" right={<Chip tone="info">{String(a.calcs.length)}</Chip>} />
        {a.calcs.map((r) => (
          <Row key={r.id} onPress={() => router.push({ pathname: '/calc/[id]', params: { id: r.id, as: 'coord' } })} label={`ТЗ ${r.id}`}
            title={`${r.id} · ${calcTitle(r)}`} sub={`«Пример Тревел» · ${r.people} чел. · ${citLine(r.cit)}\n${r.dates || 'даты не указаны'} · ответ: ${r.due}`}
            right={<Chip tone={CALC_ST[r.status][0]}>{CALC_ST[r.status][1]}</Chip>} />
        ))}
        <T muted>Нажмите — откроется ТЗ, собранное из блоков агента.</T>
      </Card>
      <Card>
        <TitleRow title="Агенты и сайт" right={<Chip tone="info">{String(a.apps.length)}</Chip>} />
        {a.apps.map((x) => (
          <View key={x.id} style={{ gap: 6, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.line2 }}>
            <Row title={tourById[x.tour].title} sub={`${x.agency} · ${x.dates} · ${x.people} чел.${x.cit ? ` · ${CIS_RU[x.cit]}` : ''}\n${x.client}`}
              right={<Chip tone={APP_ST[x.status][0]}>{APP_ST[x.status][1]}</Chip>} />
            {x.status !== 'confirmed' ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {x.status === 'new' ? <Button title="Взять в работу" small onPress={() => { a.takeApp(x.id); toast(x.mine ? 'Агент видит: заявка в работе' : 'Заявка в работе'); }} /> : null}
                <Button title="Подтвердить" kind={x.status === 'new' ? 'ghost' : 'primary'} small onPress={() => { a.confirmApp(x.id); toast(x.dep ? 'Подтверждено — свободных мест в выезде стало меньше' : 'Подтверждено'); }} />
              </View>
            ) : null}
          </View>
        ))}
      </Card>
      <T muted>Заявки агентов и с формы сайта — в одном списке; о новой приходит сообщение в Telegram. Подтверждённая заявка занимает места в выезде.</T>
    </CoordScreen>
  );
}
