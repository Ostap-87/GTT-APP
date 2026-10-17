// Заявка агента на места: программа, выезд или свои даты, число участников, гражданство, клиент.
// Имена, паспорта и телефоны участников — только после подтверждения (152-ФЗ: хранятся на сервере в России).
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import catalog from '@/data/catalog.json';
import { CIS, depById, depsOf, tourById } from '@/data/agent';
import { COUNTRY_ORDER, COUNTRY_RU } from '@/data/catalog-meta';
import { useAgent } from '@/state/agent';
import { useToast } from '@/state/toast';
import { Button, Card, Chips, Field, H3, Label, Pick, Plain, T } from '@/ui/kit';

export default function AgentApply() {
  const params = useLocalSearchParams<{ dep?: string; tour?: string }>();
  const a = useAgent();
  const toast = useToast();
  const initTour = params.dep ? depById[params.dep]?.tour || '' : params.tour || '';
  const [tour, setTour] = useState(initTour);
  const [pickTour, setPickTour] = useState(!initTour);
  const [country, setCountry] = useState(initTour ? tourById[initTour].country : 'cn');
  const firstFree = (id: string) => depsOf(id).find((d) => a.depFree(d) > 0)?.id || 'other';
  const [dep, setDep] = useState(params.dep || (initTour ? firstFree(initTour) : 'other'));
  const [dates, setDates] = useState('');
  const [people, setPeople] = useState('6');
  const [cit, setCit] = useState('ru');
  const [client, setClient] = useState('');
  const [note, setNote] = useState('');
  const t = tour ? tourById[tour] : null;
  const deps = t ? depsOf(t.id).filter((d) => a.depFree(d) > 0) : [];
  const submit = () => {
    const err = a.submitApp({ tour, dep: dep === 'other' ? null : dep, dates, people: Number(people || 0), client, cit, note });
    if (err) return toast(err);
    toast('Заявка отправлена координатору GTT');
    router.dismissTo('/agent/apps');
  };
  return (
    <Plain>
      <Card>
        <H3>Программа</H3>
        {t && !pickTour ? (
          <>
            <T bold>{t.title}</T>
            <Button title="Другая программа" kind="ghost" small onPress={() => setPickTour(true)} />
          </>
        ) : (
          <>
            <Chips>{COUNTRY_ORDER.map((k) => <Pick key={k} title={COUNTRY_RU[k]} on={country === k} onPress={() => setCountry(k)} />)}</Chips>
            <Chips>{catalog.filter((x) => x.country === country).map((x) => <Pick key={x.id} title={x.title} on={tour === x.id} onPress={() => { setTour(x.id); setDep(firstFree(x.id)); setPickTour(false); }} />)}</Chips>
          </>
        )}
      </Card>
      {t ? (
        <Card>
          <H3>Даты</H3>
          <Chips>
            {deps.map((d) => <Pick key={d.id} title={`${d.short} · ${a.depFree(d)} мест`} on={dep === d.id} onPress={() => setDep(d.id)} />)}
            <Pick title="Свои даты" on={dep === 'other'} onPress={() => setDep('other')} />
          </Chips>
          {dep === 'other' ? <Field label="Желаемые даты" value={dates} onChangeText={setDates} placeholder="Например: вторая половина апреля" /> : null}
        </Card>
      ) : null}
      <Card>
        <H3>Группа и клиент</H3>
        <Field label="Участников" value={people} onChangeText={(v) => setPeople(v.replace(/\D/g, ''))} keyboardType="number-pad" />
        <Label>Из какой страны делегация</Label>
        <Chips>{CIS.map(([k, l]) => <Pick key={k} title={l} on={cit === k} onPress={() => setCit(k)} />)}</Chips>
        <Field label="Клиент" value={client} onChangeText={setClient} placeholder="Компания или отрасль, город" />
        <Field label="Комментарий" value={note} onChangeText={setNote} placeholder="Интересы группы, пожелания по отелям" multiline />
        <T muted>Имена, паспорта и телефоны участников — после подтверждения заявки.</T>
      </Card>
      <Button title="Отправить" icon="send" onPress={submit} />
      <Button title="Отмена" kind="ghost" onPress={() => router.back()} />
    </Plain>
  );
}
