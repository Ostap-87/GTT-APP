// «Напоминания и календарь» (решение 21.10.2026): напоминания на телефоне за 15 или 30 минут — выезды (с кнопкой
// «Я в автобусе»), визиты, переезды, по желанию обеды; накануне перелёта — вечером. И вся программа — в календарь.
import { useMemo, useState } from 'react';
import { Platform, Switch, Text, View } from 'react-native';

import { reminderWhen, sampleReminder, tripReminders } from '@/data/reminders';
import { TRIP } from '@/data/trip';
import { askPermission, notifySupported, testReminder } from '@/state/notify';
import { useToast } from '@/state/toast';
import { useTrip } from '@/state/trip';
import { addTripToCalendar, directCalendar } from './calendar';
import { Icon } from './Icon';
import { Button, Card, Chips, H3, Pick, Row, Seg, T } from './kit';
import { C, F } from './theme';
import { TENANT } from '@/data/tenant';

export function RemindersCard() {
  const { reminders: s, setReminders } = useTrip();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const list = useMemo(() => tripReminders({ ...s, on: true }), [s]);
  const toggle = async (on: boolean) => {
    if (on && notifySupported && !(await askPermission())) return toast('Разрешите уведомления для приложения в настройках телефона');
    setReminders({ on });
    if (on) toast(notifySupported ? `Напоминания включены: ${list.length}` : 'Включено — напоминания придут в приложении на телефоне');
  };
  const calendar = async () => {
    setBusy(true);
    const r = await addTripToCalendar(s.lead);
    setBusy(false);
    if (r.how === 'calendar') toast(`В календаре «${TENANT.name}»: ${r.n} событий с напоминанием за ${s.lead} мин`);
    else if (r.how === 'file') toast(Platform.OS === 'web' ? 'Файл календаря скачан — откройте его' : 'Выберите календарь, почту или «Файлы»');
    else if (r.how === 'denied') toast('Разрешите доступ к календарю в настройках телефона');
    else toast('Не получилось — попробуйте ещё раз');
  };
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon name="bell" size={22} color={C.blueInk} />
        <H3 style={{ flex: 1 }}>Напоминания и календарь</H3>
        <Switch value={s.on} onValueChange={toggle} accessibilityLabel="Напоминать на телефоне" trackColor={{ true: C.blue, false: C.line }} thumbColor="#fff" />
      </View>
      <T muted>{s.on
        ? `Телефон напомнит за ${s.lead} минут — даже без интернета. У выезда кнопка «Я в автобусе» прямо в уведомлении.`
        : 'Включите — и держать программу в голове не нужно: телефон сам напомнит о выезде, визите и переезде.'}</T>
      <Seg options={[['15', 'За 15 минут'], ['30', 'За 30 минут']] as const} value={String(s.lead) as '15' | '30'} onChange={(v) => setReminders({ lead: Number(v) })} />
      <Chips>
        <Pick title="Выезды и переезды" on={s.move} onPress={() => setReminders({ move: !s.move })} />
        <Pick title="Визиты" on={s.co} onPress={() => setReminders({ co: !s.co })} />
        <Pick title="Обеды и ужины" on={s.meal} onPress={() => setReminders({ meal: !s.meal })} />
      </Chips>
      {list.slice(0, 3).map((r) => (
        <Row key={r.id} left={<Icon name={r.bus ? 'bus' : 'bell'} size={20} color={s.on ? C.blueInk : C.muted} />} title={r.title} sub={`${reminderWhen(r)} по местному времени${r.bus ? ' · кнопка «Я в автобусе»' : ''}`} />
      ))}
      <Text style={{ fontFamily: F.regular, fontSize: 12.5, color: C.muted }}>{`Всего напоминаний: ${list.length} · время — по часовому поясу поездки, телефон пересчитает сам.`}</Text>
      {notifySupported ? (
        <Button title="Прислать пробное через 5 секунд" icon="bell" kind="ghost" small onPress={async () => {
          if (!(await askPermission())) return toast('Разрешите уведомления в настройках телефона');
          await testReminder(sampleReminder(TRIP.today));
          toast('Через 5 секунд — можно свернуть приложение');
        }} />
      ) : <T muted>В браузере напоминания не приходят — включите их в приложении на телефоне.</T>}
      <Button title={busy ? 'Добавляю…' : 'Добавить всю программу в календарь'} icon="cal" kind="light" onPress={() => { if (!busy) calendar(); }} />
      <T muted>{directCalendar
        ? `События появятся в отдельном календаре «${TENANT.name}» с напоминанием; повторное нажатие обновит их.`
        : Platform.OS === 'web'
          ? 'Скачается файл .ics — его открывают Календарь, Google Календарь и Outlook.'
          : 'В тестовой версии (Expo Go) программа уходит файлом: на Android откройте его календарём; на iPhone отправьте себе на почту или сохраните в «Файлы» и нажмите «Добавить все». В приложении из App Store — сразу в Календарь.'}</T>
    </Card>
  );
}
