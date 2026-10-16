// «Пульт» координатора: цифры дня, сбор группы, переезды, «Требует внимания» — только то, что ждёт действия.
import { router } from 'expo-router';
import { View } from 'react-native';

import { VISITS, byId, fem, plural } from '@/data/group';
import { DELEGATES } from '@/data/trip';
import { useCoord } from '@/state/coord';
import { useToast } from '@/state/toast';
import { Avatar, Button, Card, Chip, Row, T, TitleRow, initials } from '@/ui/kit';
import { Bar, CoordScreen, LegsCard, Stat } from '@/ui/coord-ui';
import { C } from '@/ui/theme';

type Item = { key: string; title: string; sub?: string; btns: [string, 'primary' | 'ghost', () => void][] };

export default function Center() {
  const k = useCoord();
  const toast = useToast();
  const ready = DELEGATES.filter((d) => k.ready(d.id)).length;
  const conf = VISITS.filter((v) => v.st[0] === 'ok').length;
  const todo = k.notReady.filter((d) => !k.reminded[d.id]);

  const items: Item[] = [];
  if (k.foodDirty) items.push({ key: 'food', title: 'Питание изменилось после отправки ресторанам', sub: `Сводка ушла ${k.foodSent.at}; с тех пор: ${k.foodChanges().join('; ')}`, btns: [['Отправить обновление', 'primary', () => router.push('/food-summary')]] });
  DELEGATES.filter((d) => k.pStage(d.id)[0] === 'ready').forEach((d) => items.push({
    key: `p-${d.id}`, title: `${d.ru} ${fem(d.id) ? 'заполнила' : 'заполнил'} профиль — проверьте`, sub: k.foodLineOf(d.id),
    btns: [['Открыть профиль', 'primary', () => router.push(`/person/${d.id}`)]],
  }));
  if (todo.length) items.push({
    key: 'todo', title: `${todo.length} ${plural(todo.length, 'профиль не заполнен', 'профиля не заполнены', 'профилей не заполнены')}`, sub: todo.map((d) => d.ru).join(', '),
    btns: [['Напомнить всем', 'ghost', () => { k.remindAll(); toast('Напоминания отправлены: push и мессенджер'); }]],
  });
  if (!k.pddReminded) items.push({ key: 'pdd', title: 'Pinduoduo не открыла ссылку визита · 3 дня', btns: [['Напомнить', 'ghost', () => { k.remindPdd(); toast('Pinduoduo получит напоминание в WeChat'); }]] });
  if (!k.igorReminded) items.push({ key: 'igor', title: 'Игорь Белов · нет билета', btns: [['Напомнить', 'ghost', () => { k.remindIgor(); toast('Игорь получит напоминание в Telegram'); }]] });

  const dep = k.legs.l1?.dep;
  return (
    <CoordScreen title="Новый ритейл · день 2">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <Stat dark label="В автобусе" value={`${k.busCount} / 18`} sub={dep ? `выехали в ${dep}` : 'выезд в 09:30'} />
        <Stat label="Визиты подтверждены" value={`${conf} / ${VISITS.length}`} sub={VISITS.filter((v) => v.st[0] !== 'ok').map((v) => v.name.split(' ')[0]).join(', ')} />
        <Stat label="Профили готовы" value={`${ready} / 18`} sub={k.notReady.length ? `${k.notReady.length} ждём` : 'все заполнены'} />
        <Stat label="Документы" value={`${18 - k.docsMissing.length} / 18`} sub={`${k.docsMissing.length} ждём`} />
      </View>

      <Card>
        <TitleRow title="Сбор группы · автобус №2" right={<Chip tone={k.missing.length ? 'warn' : 'ok'}>{`${k.busCount}/18`}</Chip>} />
        <Bar value={k.busCount / 18} />
        {k.missing.length ? k.missing.map((id) => (
          <Row
            key={id}
            left={<Avatar text={initials(byId[id].lat)} />}
            title={byId[id].ru}
            right={<View style={{ flexDirection: 'row', gap: 6 }}>
              <Button title="" icon="phone" kind="ghost" small label={`Позвонить: ${byId[id].ru}`} onPress={() => toast(`Звонок: ${byId[id].ru} (в демо без звонка)`)} />
              <Button title="В автобусе" kind="ghost" small onPress={() => k.markBus(id)} />
            </View>}
          />
        )) : <T muted>Все в автобусе.</T>}
        {dep ? <Chip tone="ok">{`Выехали в ${dep} · JD.com знает: прибытие ~10:25`}</Chip> : null}
      </Card>

      <LegsCard />

      <Card>
        <TitleRow title="Требует внимания" right={<Chip tone={items.length ? 'warn' : 'ok'}>{items.length ? String(items.length) : 'всё решено'}</Chip>} />
        {items.length ? items.map((a) => (
          <View key={a.key} style={{ gap: 6, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.line2 }}>
            <T bold>{a.title}</T>
            {a.sub ? <T muted>{a.sub}</T> : null}
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {a.btns.map(([l, kind, fn]) => <Button key={l} title={l} kind={kind} small onPress={fn} />)}
            </View>
          </View>
        )) : <T muted>Новых дел нет.</T>}
      </Card>
    </CoordScreen>
  );
}
