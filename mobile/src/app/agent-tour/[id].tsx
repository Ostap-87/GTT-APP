// Карточка программы для агента: описание и компании с сайта, ближайшие выезды и места, условия для агента.
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { depsOf, tourById } from '@/data/agent';
import { useAgent } from '@/state/agent';
import { useToast } from '@/state/toast';
import { AgentTerms, SeatsBar, SeatsChip, tourSub } from '@/ui/agent-ui';
import { Button, Card, Chip, H3, Plain, T } from '@/ui/kit';
import { C, F } from '@/ui/theme';

export default function AgentTour() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const a = useAgent();
  const toast = useToast();
  const t = tourById[id];
  if (!t) return <Plain><T>Программа не найдена.</T></Plain>;
  const deps = depsOf(t.id);
  return (
    <Plain>
      <T muted>{tourSub(t)}</T>
      <Text style={{ fontFamily: F.display, fontSize: 34, lineHeight: 36, color: C.ink, textTransform: 'uppercase' }}>{t.title}</Text>
      <T>{t.positioning}</T>
      <Card>
        <H3>Маршрут</H3>
        <T>{t.cities.join(' → ')}</T>
        <H3>Компании (с сайта)</H3>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {t.companies.map((n) => <Chip key={n} tone="plain">{n}</Chip>)}
        </View>
      </Card>
      <Card>
        <H3>Ближайшие выезды</H3>
        {deps.length ? deps.map((d) => (
          <View key={d.id} style={{ gap: 6, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.line2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T bold>{d.dates}</T>
              <SeatsChip dep={d} />
            </View>
            <SeatsBar dep={d} />
            {a.depFree(d) ? <Button title="Заявка на этот выезд" small onPress={() => router.push({ pathname: '/agent-apply', params: { dep: d.id } })} /> : null}
          </View>
        )) : <T>Дат пока нет — соберём под вашу группу по заявке.</T>}
      </Card>
      <Card>
        <H3>Для агента</H3>
        <AgentTerms />
      </Card>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><Button title="Презентация" icon="down" kind="ghost" onPress={() => toast('Презентация скачана · PDF без цен')} /></View>
        <View style={{ flex: 1 }}><Button title="Расчёт" icon="calc" kind="ghost" onPress={() => { a.resetDraft(t.id); router.dismissTo('/agent/calc'); }} /></View>
      </View>
      <Button title="Отправить заявку на места" onPress={() => router.push({ pathname: '/agent-apply', params: { tour: t.id } })} />
    </Plain>
  );
}
