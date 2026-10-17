// ТЗ на расчёт: то, что собрал агент, — одним документом. Координатор берёт в расчёт и отправляет расчёт;
// суммы появятся, когда пользователь заполнит поля «Стоимость для агента» и «Комиссия».
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { AGENCY, AGENT_NAME, CALC_ST, CIS_RU, INCL_RU, tourById } from '@/data/agent';
import { COUNTRY_RU, plural } from '@/data/catalog-meta';
import { useAgent } from '@/state/agent';
import { useToast } from '@/state/toast';
import { AgentTerms } from '@/ui/agent-ui';
import { Button, Card, Chip, H3, Plain, T, TitleRow } from '@/ui/kit';
import { C, F } from '@/ui/theme';

const KV = ({ k, v }: { k: string; v: string }) => (
  <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 5, borderTopWidth: 1, borderTopColor: C.line2 }}>
    <Text style={{ width: 110, fontFamily: F.regular, fontSize: 13, color: C.muted }}>{k}</Text>
    <Text style={{ flex: 1, fontFamily: F.regular, fontSize: 14, color: C.ink }}>{v}</Text>
  </View>
);

export default function CalcTz() {
  const { id = '', as } = useLocalSearchParams<{ id: string; as?: string }>();
  const a = useAgent();
  const toast = useToast();
  const r = a.calcs.find((x) => x.id === id);
  if (!r) return <Plain><T>Запрос не найден.</T></Plain>;
  const coord = as === 'coord';
  const t = r.tour ? tourById[r.tour] : null;
  const dest = COUNTRY_RU[t ? t.country : r.country];
  return (
    <Plain>
      <TitleRow title={`ТЗ на расчёт ${r.id}`} right={<Chip tone={CALC_ST[r.status][0]}>{CALC_ST[r.status][1]}</Chip>} />
      <T muted>{`${AGENCY} · ${AGENT_NAME} · отправлено ${r.time} · ответ нужен: ${r.due}`}</T>
      <Card>
        <H3>Программа</H3>
        <T>{r.mode === 'ready' && t ? `Готовая экспедиция: ${t.title} · ${t.days} ${plural(t.days ?? 0, 'день', 'дня', 'дней')} · ${t.cities.join(' → ')}` : `Своя программа: ${COUNTRY_RU[r.country]}${r.cities ? ` · ${r.cities}` : ''}`}</T>
        {r.changes ? <T>{`Изменения: ${r.changes}`}</T> : null}
        {r.mode === 'custom' ? (
          <>
            <KV k="Отрасли" v={r.sectors.join(', ') || '—'} />
            <KV k="Компании" v={`${r.companies.join(', ') || '—'}${r.pickCos ? ' · подобрать за нас' : ''}`} />
            <KV k="Цели" v={r.goals.join(', ') || '—'} />
          </>
        ) : null}
      </Card>
      <Card>
        <H3>Группа</H3>
        <KV k="Участников" v={String(r.people)} />
        <KV k="Кто едет" v={r.level} />
        <KV k="Язык" v={r.lang} />
      </Card>
      <Card>
        <H3>Гражданство и визы</H3>
        {r.cit.map((x) => (
          <View key={x.c} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, borderTopWidth: 1, borderTopColor: C.line2 }}>
            <T>{`${CIS_RU[x.c]} · ${x.n || '—'} чел. · виза в ${dest}`}</T>
            <Chip tone="warn">проверить</Chip>
          </View>
        ))}
        <T muted>Правила въезда (страна поездки × гражданство) ведёт координатор; отметка подставится сама.</T>
      </Card>
      <Card>
        <H3>Даты, перелёт, проживание</H3>
        <KV k="Даты" v={`${r.dates || '—'}${r.days ? ` · ${r.days} ${plural(Number(r.days), 'день', 'дня', 'дней')}` : ''}`} />
        <KV k="Вылет" v={`${r.from} · перелёт ${r.flight ? 'включить' : 'не включать'}`} />
        <KV k="Отели" v={`${r.hotel}, ${r.room.toLowerCase()}`} />
        <KV k="Включить" v={r.incl.map((k) => INCL_RU[k]).join(', ') || '—'} />
      </Card>
      <Card>
        <H3>Клиент</H3>
        <T>{`${r.client}${r.budget ? ` · бюджет: ${r.budget}` : ''}`}</T>
        {r.note ? <T>{`«${r.note}»`}</T> : null}
        {r.file ? <T muted>Вложение: tz-klienta.pdf</T> : null}
      </Card>
      {r.status === 'done' ? (
        <Card>
          <H3>Расчёт</H3>
          <AgentTerms />
          <T muted>Суммы появятся, когда координатор заполнит поля; файл расчёта — PDF.</T>
        </Card>
      ) : null}
      {coord ? (
        r.status === 'new' ? <Button title="Взять в расчёт" onPress={() => { a.takeCalc(r.id); toast('Агент видит: считаем'); }} />
          : r.status === 'calc' ? <Button title="Отправить расчёт агенту" icon="send" onPress={() => { a.doneCalc(r.id); toast('Расчёт отправлен агенту'); router.back(); }} /> : null
      ) : r.status === 'done' ? <Button title="Скачать расчёт (PDF)" icon="down" onPress={() => toast(`${r.id}: PDF скачан`)} /> : null}
      <Button title="Скачать ТЗ (PDF)" icon="down" kind="ghost" onPress={() => toast(`${r.id}: PDF скачан`)} />
    </Plain>
  );
}
