// Поездка в «Центре поездки»: даты (сдвиг всей программы), дни и события, люди (добавить, заменить, убрать), команда,
// публикация изменений делегатам. Все правки — в черновик; ограниченный доступ отправляет их администратору.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ACCESS, PROGRAMS, dayTitle, datesText, type AEvent } from '@/data/admin';
import { COUNTRY_RU } from '@/data/catalog-meta';
import { programRoute } from '@/data/map-route';
import type { EventKind } from '@/data/trip';
import { useAdmin } from '@/state/admin';
import { useToast } from '@/state/toast';
import { Columns, LevelSwitch, Wide, useWide } from '@/ui/admin-ui';
import { Icon } from '@/ui/Icon';
import { RouteMap } from '@/ui/RouteMap';
import { Button, Card, Chip, Chips, Field, H3, Pick, Plain, Row, T, TitleRow } from '@/ui/kit';
import { C, F } from '@/ui/theme';

const KINDS: [EventKind, string][] = [['co', 'Визит'], ['meal', 'Еда'], ['move', 'Переезд'], ['culture', 'Культура'], ['info', 'Инфо']];
const kindRu = (k: EventKind) => KINDS.find((x) => x[0] === k)?.[1] || k;

export default function AdminTrip() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const a = useAdmin();
  const toast = useToast();
  const t = a.trip(id);
  const wide = useWide();
  const [addTo, setAddTo] = useState<number | null>(null);
  const [ev, setEv] = useState<Omit<AEvent, 'id'>>({ t: '10:00', name: '', kind: 'co' });
  const [person, setPerson] = useState({ name: '', role: '' });
  const [replace, setReplace] = useState<{ id: string; name: string } | null>(null);
  const [mapW, setMapW] = useState(0);
  if (!t || !a.myTrips.some((x) => x.id === t.id)) return <Plain><Wide><Card tone="warn"><T>Эта поездка вам не назначена.</T></Card></Wide></Plain>;
  const edit = a.can('trip.edit');
  const people = a.can('people.edit');
  const cities = [...new Set(t.days.map((d) => d.city))];
  const program = PROGRAMS.find((p) => p.id === t.programId);
  const route = programRoute(program?.route || []);

  const left = (
    <>
      {program && route.stops.length ? (
        <Card style={{ padding: 8 }}>
          <View onLayout={(e) => setMapW(e.nativeEvent.layout.width)} style={{ borderRadius: 12, overflow: 'hidden' }}>
            {mapW ? <RouteMap cc={program.country} stops={route.stops} legs={route.legs} shown={99} width={mapW} height={Math.round(Math.min(mapW * 0.7, 420))} /> : <View style={{ height: 200 }} />}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, paddingTop: 6 }}>
            <View style={{ flex: 1 }}><Button title={`Памятка: ${COUNTRY_RU[program.country]}`} small kind="light" onPress={() => router.push({ pathname: '/country/[code]', params: { code: program.country } })} /></View>
          </View>
        </Card>
      ) : null}
      <Card>
        <TitleRow title="Даты" right={<Chip tone="info">{`${t.days.length} дн.`}</Chip>} />
        <Text style={{ fontFamily: F.display, fontSize: 28, lineHeight: 30, color: C.ink, textTransform: 'uppercase' }}>{datesText(t)}</Text>
        {edit ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Button title="− 1 день" kind="light" small onPress={() => a.shiftStart(t.id, -1)} /></View>
            <View style={{ flex: 1 }}><Button title="+ 1 день" kind="light" small onPress={() => a.shiftStart(t.id, 1)} /></View>
            <View style={{ flex: 1 }}><Button title="+ неделя" kind="light" small onPress={() => a.shiftStart(t.id, 7)} /></View>
          </View>
        ) : null}
        <T muted>Сдвигается вся программа: дни, визиты, отели, переезды.</T>
      </Card>

      {t.days.map((d, i) => (
        <Card key={i}>
          <TitleRow title={`День ${i + 1} · ${dayTitle(t.start, i)}`} right={<Chip tone="info">{d.city}</Chip>} />
          {edit && cities.length > 1 ? <Chips>{cities.map((c) => <Pick key={c} title={c} on={d.city === c} onPress={() => a.setCity(t.id, i, c)} />)}</Chips> : null}
          {d.events.map((e) => (
            <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderTopWidth: 1, borderTopColor: C.line2 }}>
              <Text style={{ width: 48, fontFamily: F.bold, fontSize: 14, color: C.ink }}>{e.t}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.ink }}>{e.name}</Text>
                <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.muted }}>{kindRu(e.kind)}</Text>
              </View>
              {edit ? (
                <Pressable onPress={() => a.removeEvent(t.id, i, e.id)} accessibilityRole="button" accessibilityLabel={`Убрать ${e.name}`} hitSlop={8} style={{ padding: 4 }}>
                  <Icon name="trash" size={18} color={C.muted} />
                </Pressable>
              ) : null}
            </View>
          ))}
          {!d.events.length ? <T muted>Событий пока нет — расписание дня заполняет координатор.</T> : null}
          {edit && addTo === i ? (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ width: 90 }}><Field value={ev.t} onChangeText={(v) => setEv({ ...ev, t: v })} placeholder="10:00" /></View>
                <View style={{ flex: 1 }}><Field value={ev.name} onChangeText={(v) => setEv({ ...ev, name: v })} placeholder="Что: компания, обед, переезд" /></View>
              </View>
              <Chips>{KINDS.map(([k, ru]) => <Pick key={k} title={ru} on={ev.kind === k} onPress={() => setEv({ ...ev, kind: k })} />)}</Chips>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}><Button title="Добавить" small onPress={() => {
                  if (!/^\d{1,2}:\d{2}$/.test(ev.t.trim()) || !ev.name.trim()) return toast('Укажите время (10:00) и что за событие');
                  a.addEvent(t.id, i, { ...ev, t: ev.t.trim().padStart(5, '0'), name: ev.name.trim() });
                  setEv({ t: '10:00', name: '', kind: 'co' }); setAddTo(null);
                }} /></View>
                <View style={{ flex: 1 }}><Button title="Отмена" small kind="ghost" onPress={() => setAddTo(null)} /></View>
              </View>
            </View>
          ) : edit ? <Button title="+ Событие" small kind="ghost" onPress={() => setAddTo(i)} /> : null}
        </Card>
      ))}
    </>
  );

  const pub = (
      <Card tone={t.pending ? 'warn' : undefined}>
        <TitleRow title="Публикация" right={<Chip tone={t.pending ? 'warn' : 'ok'}>{t.status === 'draft' ? 'черновик' : t.pending ? `правок ${t.pending}` : 'всё опубликовано'}</Chip>} />
        <T>{t.pending
          ? a.can('trip.publish') ? 'Делегаты увидят изменения после публикации и получат уведомление, что поменялось.' : 'У вас ограниченный доступ — изменения уйдут администратору, он опубликует.'
          : 'Делегаты видят актуальную программу.'}</T>
        {t.pending ? (
          <Button title={a.can('trip.publish') ? 'Опубликовать' : 'Отправить на публикацию'} icon="send" onPress={() => { a.publish(t.id); toast(a.can('trip.publish') ? 'Опубликовано — делегаты получили уведомление' : 'Отправлено администратору'); }} />
        ) : null}
      </Card>
  );

  const right = (
    <>
      <Card>
        <TitleRow title={`Участники · ${t.people.length}`} />
        {t.people.map((p) => (
          <View key={p.id} style={{ borderTopWidth: 1, borderTopColor: C.line2 }}>
            <Row title={p.name} sub={`${p.role || 'участник'} · ${p.invite === 'joined' ? 'в приложении' : 'приглашение отправлено'}`}
              right={people ? <Button title="Заменить" small kind="light" onPress={() => setReplace(replace?.id === p.id ? null : { id: p.id, name: '' })} /> : undefined} />
            {replace?.id === p.id ? (
              <View style={{ gap: 8, paddingBottom: 8 }}>
                <Field value={replace.name} onChangeText={(v) => setReplace({ id: p.id, name: v })} placeholder="Кто едет вместо" />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}><Button title="Заменить" small onPress={() => { if (!replace.name.trim()) return toast('Укажите имя'); a.replacePerson(t.id, p.id, replace.name.trim()); setReplace(null); toast('Старое приглашение отключено, новое отправлено'); }} /></View>
                  <View style={{ flex: 1 }}><Button title="Убрать из поездки" small kind="ghost" onPress={() => { a.removePerson(t.id, p.id); setReplace(null); }} /></View>
                </View>
              </View>
            ) : null}
          </View>
        ))}
        {people ? (
          <View style={{ gap: 8, paddingTop: 6 }}>
            <Field value={person.name} onChangeText={(v) => setPerson({ ...person, name: v })} placeholder="Имя нового участника" />
            <Field value={person.role} onChangeText={(v) => setPerson({ ...person, role: v })} placeholder="Должность и компания" />
            <Button title="+ Участник — отправить приглашение" small kind="light" onPress={() => { if (!person.name.trim()) return toast('Укажите имя'); a.addPerson(t.id, { name: person.name.trim(), role: person.role.trim() }); setPerson({ name: '', role: '' }); toast('Приглашение отправлено'); }} />
            <T muted>Загрузка списка из Excel — на шаге 2, вместе с сервером.</T>
          </View>
        ) : null}
      </Card>

      <Card>
        <H3>Команда поездки</H3>
        {a.team.filter((m) => m.level === 'full' || m.trips.includes(t.id)).map((m) => (
          <Row key={m.id} title={m.name} sub={`${m.role} · доступ ${ACCESS[m.level].ru.toLowerCase()}`} />
        ))}
      </Card>

      {t.id === 't-retail' ? (
        <Card>
          <H3>Как это видят</H3>
          <Row left={<Icon name="route" size={22} color={C.blueInk} />} title="Маршрут у делегатов" onPress={() => router.push('/route')} />
          <Row left={<Icon name="grid" size={22} color={C.blueInk} />} title="Пульт координатора" onPress={() => router.push('/coord')} />
        </Card>
      ) : null}
    </>
  );

  return (
    <Plain>
      <Wide>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.blue, letterSpacing: 1 }}>ПОЕЗДКА</Text>
            <LevelSwitch />
          </View>
          <Text style={{ fontFamily: F.display, fontSize: 32, lineHeight: 34, color: C.ink, textTransform: 'uppercase' }}>{t.title}</Text>
          <T muted>{`${cities.join(' → ')} · из программы сайта`}</T>
        </Card>
        {wide ? <Columns left={left} right={<>{pub}{right}</>} /> : <>{pub}{left}{right}</>}
      </Wide>
    </Plain>
  );
}
