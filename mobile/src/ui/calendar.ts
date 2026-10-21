// «Добавить в календарь» (решение 21.10.2026): вся программа — визиты, переезды, обеды с адресами — в календарь телефона.
// В приложении из App Store / Google Play — сразу в отдельный календарь «Global Tech Tour» (expo-calendar, с напоминанием
// за 15 минут; повторное нажатие обновляет события). В Expo Go этого модуля нет, поэтому там и в браузере — файл .ics:
// на Android его открывает приложение календаря, на iPhone — через «Почту» или «Файлы» («Добавить все»).
import * as Calendar from 'expo-calendar';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { TRIP } from '@/data/trip';
import { icsOf, tripItems, tzOfDay } from '@/data/when';
import { safeName, shareFile } from './files';
import { TENANT } from '@/data/tenant';

export type CalendarResult = { how: 'calendar' | 'file'; n: number } | { how: 'denied' | 'error'; n: 0 };
// календарь называется по организатору поездки (white label)
const title = () => TENANT.name;

/** Можно ли писать в календарь напрямую (собранное приложение, не Expo Go и не браузер). */
export const directCalendar = Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

async function ourCalendar() {
  const all = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
  const mine = all.find((c) => c.title === title() && c.allowsModifications);
  if (mine) return mine;
  if (Platform.OS === 'ios') {
    const def = Calendar.getDefaultCalendarSync();
    return Calendar.createCalendar({ title: title(), color: TENANT.accent, entityType: Calendar.EntityTypes.EVENT, sourceId: def.source.id, source: def.source });
  }
  return Calendar.createCalendar({
    title: title(), name: 'gtt', color: TENANT.accent, entityType: Calendar.EntityTypes.EVENT, ownerAccount: 'gtt',
    source: { isLocalAccount: true, name: title(), type: 'LOCAL' }, accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

export async function addTripToCalendar(alarmMin = 15): Promise<CalendarResult> {
  const items = tripItems();
  if (directCalendar) {
    try {
      const { status } = await Calendar.requestCalendarPermissions();
      if (status !== 'granted') return { how: 'denied', n: 0 };
      const cal = await ourCalendar();
      // старые события этой поездки — заменяем, чтобы повторное нажатие не плодило дубли
      const from = new Date(items[0].start.getTime() - 86400000), to = new Date(items[items.length - 1].end.getTime() + 86400000);
      for (const e of await cal.listEvents(from, to)) await e.delete();
      for (const it of items) {
        await cal.createEvent({ title: it.title, startDate: it.start, endDate: it.end, location: it.location, notes: it.notes, timeZone: tzOfDay(it.day)[0], alarms: alarmMin ? [{ relativeOffset: -alarmMin }] : [] });
      }
      return { how: 'calendar', n: items.length };
    } catch {
      // не вышло напрямую — отдаём файлом
    }
  }
  try {
    await shareFile(`${safeName(TRIP.title)}.ics`, icsOf(items, alarmMin), 'ics', 'Добавить в календарь');
    return { how: 'file', n: items.length };
  } catch {
    return { how: 'error', n: 0 };
  }
}
