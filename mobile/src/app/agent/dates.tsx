// «Даты»: ближайшие выезды по месяцам, свободные места и заявка в один шаг.
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { DEPS, MONTHS, MONTH_FULL, tourById } from '@/data/agent';
import { COUNTRY_RU, plural } from '@/data/catalog-meta';
import { useAgent } from '@/state/agent';
import { AgentScreen, SeatsBar, SeatsChip } from '@/ui/agent-ui';
import { Button, Card, Chips, H3, Pick, T } from '@/ui/kit';
import { C, F } from '@/ui/theme';

export default function AgentDates() {
  const { depFree } = useAgent();
  const [m, setM] = useState<string>('all');
  const months = Object.keys(MONTH_FULL).filter((k) => m === 'all' || m === k);
  return (
    <AgentScreen title="Выезды и места">
      <Card><Chips>{MONTHS.map(([k, l]) => <Pick key={k} title={l} on={m === k} onPress={() => setM(k)} />)}</Chips></Card>
      {months.map((k) => {
        const deps = DEPS.filter((d) => d.month === k);
        if (!deps.length) return null;
        return (
          <Card key={k}>
            <H3>{MONTH_FULL[k]}</H3>
            {deps.map((d) => {
              const t = tourById[d.tour];
              return (
                <View key={d.id} style={{ gap: 6, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.line2 }}>
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text onPress={() => router.push(`/agent-tour/${t.id}`)} style={{ fontFamily: F.semibold, fontSize: 14, color: C.ink }}>{t.title}</Text>
                      <Text style={{ fontFamily: F.regular, fontSize: 12.5, color: C.muted }}>{`${d.dates} · ${COUNTRY_RU[t.country]} · ${t.days} ${plural(t.days ?? 0, 'день', 'дня', 'дней')}`}</Text>
                    </View>
                    <SeatsChip dep={d} />
                  </View>
                  <SeatsBar dep={d} />
                  {depFree(d) ? <Button title="Заявка" small onPress={() => router.push({ pathname: '/agent-apply', params: { dep: d.id } })} /> : null}
                </View>
              );
            })}
          </Card>
        );
      })}
      <Card tone="info">
        <T bold>Нужны другие даты?</T>
        <T>Отправьте заявку с желаемыми датами и числом участников — координатор проверит, можно ли собрать программу под вашу группу.</T>
        <Button title="Заявка на свои даты" onPress={() => router.push('/agent-apply')} />
      </Card>
      <T muted>Даты и места здесь — пример; в приложении их ведёт координатор.</T>
    </AgentScreen>
  );
}
