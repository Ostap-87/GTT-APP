// Запрос на расчёт — конструктор из блоков: готовая экспедиция (можно с правками) или своя программа; группа и
// гражданство (виза), даты, перелёт и отели, что включить, клиент и срок ответа. Координатор получает готовое ТЗ.
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import catalog from '@/data/catalog.json';
import { CIS, DUE, FROM_CITY, GOALS, INCL, LEVELS, SECTORS, depsOf, tourById } from '@/data/agent';
import { COUNTRY_ORDER, COUNTRY_RU, plural } from '@/data/catalog-meta';
import { useAgent } from '@/state/agent';
import { useToast } from '@/state/toast';
import { AgentScreen } from '@/ui/agent-ui';
import { Button, Card, Check, Chips, Field, Label, Pick, Seg, T } from '@/ui/kit';
import { C, F } from '@/ui/theme';

const toggle = (list: string[], x: string) => (list.includes(x) ? list.filter((y) => y !== x) : list.concat(x));

function Block({ n, title, sub, children }: { n: number; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: F.bold, fontSize: 13, color: '#fff' }}>{n}</Text>
        </View>
        <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.ink, flex: 1 }}>{title}</Text>
      </View>
      {sub ? <T muted>{sub}</T> : null}
      {children}
    </Card>
  );
}

export default function AgentCalc() {
  const a = useAgent();
  const toast = useToast();
  const c = a.draft;
  const e = a.editDraft;
  const [co, setCo] = useState('');
  const [tourCountry, setTourCountry] = useState(c.tour ? tourById[c.tour].country : 'cn');
  const [pickTour, setPickTour] = useState(false);
  const t = c.tour ? tourById[c.tour] : null;
  const deps = t ? depsOf(t.id).filter((d) => a.depFree(d) > 0) : [];
  const nB = c.mode === 'ready' ? 2 : 3;
  const submit = () => {
    const [err, id] = a.submitCalc();
    if (err) return toast(err);
    toast(`Запрос ${id} отправлен на расчёт`);
    router.navigate('/agent/apps');
  };
  return (
    <AgentScreen title="Запрос на расчёт">
      <Seg options={[['ready', 'Готовая экспедиция'], ['custom', 'Своя программа (ТЗ)']] as const} value={c.mode} onChange={(v) => e({ mode: v, dep: '' })} />
      {c.mode === 'ready' ? (
        <Block n={1} title="Готовая экспедиция">
          {t && !pickTour ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <T bold style={{ flex: 1 }}>{t.title}</T>
              <Button title="Другая" kind="ghost" small onPress={() => setPickTour(true)} />
            </View>
          ) : (
            <>
              <Label>Страна</Label>
              <Chips>{COUNTRY_ORDER.map((k) => <Pick key={k} title={COUNTRY_RU[k]} on={tourCountry === k} onPress={() => setTourCountry(k)} />)}</Chips>
              <Label>Программа из каталога</Label>
              <Chips>{catalog.filter((x) => x.country === tourCountry).map((x) => <Pick key={x.id} title={x.title} on={c.tour === x.id} onPress={() => { const d = depsOf(x.id).find((y) => a.depFree(y) > 0); e({ tour: x.id, dep: d ? d.id : '' }); setPickTour(false); }} />)}</Chips>
            </>
          )}
          {t ? <T muted>{`${COUNTRY_RU[t.country]} · ${t.days} ${plural(t.days ?? 0, 'день', 'дня', 'дней')} · ${t.cities.join(' → ')} · ${t.companiesCount} ${plural(t.companiesCount, 'компания', 'компании', 'компаний')}`}</T> : null}
          <Field label="Что поменять в программе (необязательно)" value={c.changes} onChangeText={(v) => e({ changes: v })} placeholder="Например: добавить завод BYD, убрать Шанхай" />
        </Block>
      ) : (
        <>
          <Block n={1} title="Своя программа: направление">
            <Label>Страна поездки</Label>
            <Chips>{COUNTRY_ORDER.map((k) => <Pick key={k} title={COUNTRY_RU[k]} on={c.country === k} onPress={() => e({ country: k })} />)}</Chips>
            <Field label="Города (необязательно)" value={c.cities} onChangeText={(v) => e({ cities: v })} placeholder="Например: Шанхай, Шэньчжэнь" />
          </Block>
          <Block n={2} title="Отрасли и компании">
            <Label>Отрасли</Label>
            <Chips>{SECTORS.map((x) => <Pick key={x} title={x} on={c.sectors.includes(x)} onPress={() => e({ sectors: toggle(c.sectors, x) })} />)}</Chips>
            <Label>Компании, которые хотят посетить</Label>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
              <View style={{ flex: 1 }}><Field value={co} onChangeText={setCo} placeholder="Название компании" /></View>
              <Button title="Добавить" kind="light" small onPress={() => { if (!co.trim()) return toast('Впишите название компании'); e({ companies: c.companies.concat(co.trim()) }); setCo(''); }} />
            </View>
            {c.companies.length ? <Chips>{c.companies.map((n, i) => <Pick key={`${n}${i}`} title={`${n} ×`} on onPress={() => e({ companies: c.companies.filter((_, j) => j !== i) })} />)}</Chips> : null}
            <Check on={c.pickCos} onPress={() => e({ pickCos: !c.pickCos })}>Подберите компании за нас — по отраслям и целям</Check>
            <Label>Цели поездки</Label>
            <Chips>{GOALS.map((x) => <Pick key={x} title={x} on={c.goals.includes(x)} onPress={() => e({ goals: toggle(c.goals, x) })} />)}</Chips>
          </Block>
        </>
      )}
      <Block n={nB} title="Группа" sub="По гражданству видно, кому нужна виза в страну поездки. Смешанная группа — несколько строк.">
        <Field label="Участников" value={c.people} onChangeText={(v) => e({ people: v.replace(/\D/g, '') })} placeholder="Например: 12" keyboardType="number-pad" />
        <Label>Из какой страны делегация (гражданство)</Label>
        {c.cit.map((r, i) => (
          <View key={i} style={{ gap: 6, paddingVertical: 6, borderTopWidth: 1, borderTopColor: C.line2 }}>
            <Chips>{CIS.map(([k, l]) => <Pick key={k} title={l} on={r.c === k} onPress={() => e({ cit: c.cit.map((x, j) => (j === i ? { ...x, c: k } : x)) })} />)}</Chips>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
              <View style={{ flex: 1 }}><Field value={r.n} onChangeText={(v) => e({ cit: c.cit.map((x, j) => (j === i ? { ...x, n: v.replace(/\D/g, '') } : x)) })} placeholder="Сколько человек" keyboardType="number-pad" /></View>
              {c.cit.length > 1 ? <Button title="Убрать" kind="ghost" small onPress={() => e({ cit: c.cit.filter((_, j) => j !== i) })} /> : null}
            </View>
          </View>
        ))}
        <Button title="+ Ещё страна" kind="ghost" small onPress={() => e({ cit: c.cit.concat({ c: 'kz', n: '' }) })} />
        <Label>Кто едет</Label>
        <Chips>{LEVELS.map((x) => <Pick key={x} title={x} on={c.level === x} onPress={() => e({ level: x })} />)}</Chips>
        <Label>Язык группы</Label>
        <Chips>{['Русский', 'Английский'].map((x) => <Pick key={x} title={x} on={c.lang === x} onPress={() => e({ lang: x })} />)}</Chips>
      </Block>
      <Block n={nB + 1} title="Даты">
        {deps.length ? (
          <Chips>
            {deps.map((d) => <Pick key={d.id} title={`${d.short} · ${a.depFree(d)} мест`} on={c.dep === d.id} onPress={() => e({ dep: d.id })} />)}
            <Pick title="Свои даты" on={!c.dep} onPress={() => e({ dep: '' })} />
          </Chips>
        ) : null}
        {!c.dep ? <Field label="Даты или месяц" value={c.dates} onChangeText={(v) => e({ dates: v })} placeholder="Например: 12–17 апреля или «апрель 2027»" /> : null}
        {c.mode === 'custom' ? <Field label="Сколько дней" value={c.days} onChangeText={(v) => e({ days: v.replace(/\D/g, '') })} placeholder="5–7" keyboardType="number-pad" /> : null}
      </Block>
      <Block n={nB + 2} title="Перелёт и проживание">
        <Label>Город вылета</Label>
        <Chips>{FROM_CITY.map((x) => <Pick key={x} title={x} on={c.from === x} onPress={() => e({ from: x })} />)}</Chips>
        <Check on={c.flight} onPress={() => e({ flight: !c.flight })}>Включить перелёт в расчёт</Check>
        <Label>Отели</Label>
        <Chips>
          {['4★', '5★'].map((x) => <Pick key={x} title={x} on={c.hotel === x} onPress={() => e({ hotel: x })} />)}
          {['Одноместное', 'Двухместное'].map((x) => <Pick key={x} title={x} on={c.room === x} onPress={() => e({ room: x })} />)}
        </Chips>
      </Block>
      <Block n={nB + 3} title="Что включить">
        <Chips>{INCL.map(([k, l]) => <Pick key={k} title={l} on={c.incl.includes(k)} onPress={() => e({ incl: toggle(c.incl, k) })} />)}</Chips>
      </Block>
      <Block n={nB + 4} title="Клиент и сроки">
        <Field label="Клиент" value={c.client} onChangeText={(v) => e({ client: v })} placeholder="Компания или отрасль, город" />
        <Field label="Бюджет на человека (необязательно)" value={c.budget} onChangeText={(v) => e({ budget: v })} placeholder="Если клиент назвал" />
        <Label>Когда нужен расчёт</Label>
        <Chips>{DUE.map((x) => <Pick key={x} title={x} on={c.due === x} onPress={() => e({ due: x })} />)}</Chips>
        <Field label="Комментарий" value={c.note} onChangeText={(v) => e({ note: v })} placeholder="Интересы группы, особые пожелания" multiline />
        {c.file ? <T muted>ТЗ клиента прикреплено · tz-klienta.pdf</T> : <Button title="Прикрепить ТЗ клиента" icon="doc" kind="ghost" small onPress={() => { e({ file: true }); toast('Файл прикреплён: tz-klienta.pdf'); }} />}
      </Block>
      <Button title="Отправить на расчёт" icon="send" onPress={submit} />
      <T muted>Координатор получит запрос как готовое ТЗ — в приложении и в Telegram.</T>
    </AgentScreen>
  );
}
