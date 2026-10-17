// Общие куски роли агента: шапка, места в выезде, условия для агента (поля пока пустые — решение 16.10.2026).
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { AGENCY, AGENT_FEE, AGENT_NAME, AGENT_PRICE, type Dep, type Tour } from '@/data/agent';
import { COUNTRY_RU, plural } from '@/data/catalog-meta';
import { useAgent } from '@/state/agent';
import { useCoord } from '@/state/coord';
import { Button, Chip, Row, Screen } from './kit';
import { C, F } from './theme';

export function AgentScreen({ title, children }: { title: string; children: ReactNode }) {
  const { viewing } = useCoord();
  // Выход на стартовый экран — сменить роль в демо; координатор возвращается кнопкой «Пульт координатора»
  const exit = viewing ? undefined : <Button title="Выйти" kind="ghost" small label="Выйти на стартовый экран" onPress={() => router.replace('/')} />;
  return <Screen eyebrow={`${AGENT_NAME} · ${AGENCY}`} title={title} right={exit}>{children}</Screen>;
}

export const tourSub = (t: Tour) =>
  `${COUNTRY_RU[t.country]} · ${t.days} ${plural(t.days ?? 0, 'день', 'дня', 'дней')} · ${t.companiesCount} ${plural(t.companiesCount, 'компания', 'компании', 'компаний')} · ${t.cities.slice(0, 4).join(' → ')}`;

export function SeatsChip({ dep }: { dep: Dep }) {
  const free = useAgent().depFree(dep);
  return free === 0 ? <Chip tone="dark">группа набрана</Chip> : free <= 4 ? <Chip tone="warn">{`осталось ${free}`}</Chip> : <Chip tone="ok">{`${free} мест`}</Chip>;
}

export function SeatsBar({ dep }: { dep: Dep }) {
  const free = useAgent().depFree(dep);
  const taken = dep.total - free;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: C.line2, overflow: 'hidden' }}>
        <View style={{ width: `${(taken / dep.total) * 100}%`, height: '100%', backgroundColor: free ? C.blue : C.muted }} />
      </View>
      <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.muted }}>{`${taken} из ${dep.total}`}</Text>
    </View>
  );
}

/** «Стоимость для агента» и «Комиссия агента»: значения задаёт пользователь, пока — «не указана». */
export function AgentTerms() {
  const v = (x: string | null) => (x ? <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.ink }}>{x}</Text> : <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.muted, fontStyle: 'italic' }}>не указана</Text>);
  return (
    <View>
      <Row title="Стоимость для агента" right={v(AGENT_PRICE)} />
      <Row title="Комиссия агента" right={v(AGENT_FEE)} />
    </View>
  );
}

export function TourRow({ t, right }: { t: Tour; right?: ReactNode }) {
  return <Row title={t.title} sub={tourSub(t)} right={right} onPress={() => router.push(`/agent-tour/${t.id}`)} label={t.title} />;
}
