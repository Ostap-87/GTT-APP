// Напоминания на телефоне (решение 21.10.2026): за 15 минут до выезда — «Выезд в 09:15, лобби, автобус группы» с кнопкой
// «Я в автобусе» прямо в уведомлении; то же перед визитом и переездом; накануне перелёта или поезда — вечером в 21:00.
// Здесь — что и когда напомнить; ставит их на телефон state/notify.ts (без сервера и без интернета).
import { VISITS } from './group';
import { instant, tzOfDay } from './when';
import { CITY, DAYS, EVENTS, hotelOf } from './trip';

export type ReminderSettings = { on: boolean; lead: number; move: boolean; co: boolean; meal: boolean };
export const REMINDERS0: ReminderSettings = { on: false, lead: 15, move: true, co: true, meal: false };

export type Reminder = {
  id: string; at: Date; title: string; body: string;
  /** Кнопки «Я в автобусе» и «Адрес для такси» в уведомлении. */
  bus: boolean;
  /** Куда открыть приложение по нажатию; для такси — адрес. */
  url: string; zh?: string; ru?: string;
};

/** iOS держит не больше 64 запланированных уведомлений — берём ближайшие. */
const MAX = 60;
const isTransfer = (name: string) => /^(Перелёт|Поезд)/.test(name);

export function tripReminders(s: ReminderSettings, now = new Date()): Reminder[] {
  const out: Reminder[] = [];
  EVENTS.forEach((day, i) => day.forEach((e, k) => {
    const at = instant(i, e.t);
    const lead = s.lead * 60000;
    const id = `r-${i}-${k}`;
    if (e.kind === 'move' && s.move) {
      const nextCo = day.slice(k + 1).find((x) => x.kind === 'co');
      if (e.name === 'Выезд из отеля') {
        const v = nextCo && VISITS.find((x) => x.name === nextCo.name);
        out.push({ id, at: new Date(at.getTime() - lead), title: `Выезд в ${e.t} — через ${s.lead} мин`, body: [e.place, nextCo ? `затем ${nextCo.name} в ${nextCo.t}` : ''].filter(Boolean).join(' · '),
          bus: true, url: '/trip', zh: v?.zh || v?.name, ru: v?.addr || (nextCo ? `${nextCo.name}, ${CITY[i]}` : undefined) });
      } else {
        out.push({ id, at: new Date(at.getTime() - lead), title: `${e.name} в ${e.t}`, body: e.place, bus: false, url: '/trip/plan' });
        // накануне перелёта или поезда — вечером, чтобы собрать вещи
        if (isTransfer(e.name) && Number(e.t.slice(0, 2)) < 12 && i > 0) {
          const h = hotelOf(i - 1);
          out.push({ id: `${id}-eve`, at: instant(i - 1, '21:00'), title: `Завтра в ${e.t}: ${e.name[0].toLowerCase()}${e.name.slice(1)}`,
            body: `Соберите вещи с вечера${h ? ` · выезд из отеля «${h.name}»` : ''}. Подробности — в «Плане».`, bus: false, url: '/trip/plan' });
        }
      }
    }
    if (e.kind === 'co' && s.co) {
      const v = VISITS.find((x) => x.name === e.name);
      out.push({ id, at: new Date(at.getTime() - lead), title: `${e.name} в ${e.t} — через ${s.lead} мин`, body: e.place, bus: false, url: v ? `/company/${v.id}` : '/trip/plan' });
    }
    if (e.kind === 'meal' && s.meal) {
      out.push({ id, at: new Date(at.getTime() - lead), title: `${e.name} в ${e.t}`, body: e.place, bus: false, url: e.ref ? `/meal/${e.ref}` : '/trip/plan' });
    }
  }));
  return out.filter((r) => r.at > now).sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, MAX);
}

/** Пример для проверки «Прислать пробное»: первое напоминание «сегодня» по демо (выезд с кнопками). */
export function sampleReminder(today: number): Reminder {
  const all = tripReminders({ ...REMINDERS0, on: true, meal: true }, new Date(0));
  return all.find((r) => r.id.startsWith(`r-${today}-`) && r.bus) || all.find((r) => r.id.startsWith(`r-${today}-`)) || all[0];
}

/** Местное время напоминания одной строкой: «Вт 10 · 09:00». */
export function reminderWhen(r: Reminder) {
  const day = Number(r.id.split('-')[1]);
  const off = tzOfDay(day)[1];
  const local = new Date(r.at.getTime() + off * 60000);
  const start = instant(0, '00:00').getTime() + tzOfDay(0)[1] * 60000;
  const dIdx = Math.floor((local.getTime() - start) / 86400000);
  const d = DAYS[dIdx];
  return `${d ? `${d.wd} ${d.n}` : ''} · ${String(local.getUTCHours()).padStart(2, '0')}:${String(local.getUTCMinutes()).padStart(2, '0')}`;
}
