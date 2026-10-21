// Время поездки «по-настоящему»: событие «вторник, 09:15» → момент по местному времени города (часовой пояс страны,
// Бали — свой). От этого считаются напоминания на телефоне и события календаря — они сработают вовремя, где бы ни был
// телефон в момент настройки (решение 21.10.2026).
import { countryOf } from './countries';
import { CITY, EVENTS, TRIP, type TripEvent } from './trip';

/** Города со своим часовым поясом внутри страны. */
const CITY_TZ: Record<string, [string, number]> = { 'Бали': ['Asia/Makassar', 480] };
export const tzOfDay = (i: number): [string, number] => CITY_TZ[CITY[i]] || countryOf(TRIP.country).tz;

/** Момент события: день поездки i и «ЧЧ:ММ» по местному времени. */
export function instant(i: number, t: string): Date {
  const [y, m, d] = TRIP.start.split('-').map(Number);
  const [hh, mm] = t.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d + i, hh, mm) - tzOfDay(i)[1] * 60000);
}

export type TripItem = { id: string; day: number; e: TripEvent; start: Date; end: Date; title: string; location: string; notes: string };

/** Все события поездки с началом и концом: конец — начало следующего события дня, но не дольше 3 часов. */
export function tripItems(): TripItem[] {
  const out: TripItem[] = [];
  EVENTS.forEach((day, i) => day.forEach((e, k) => {
    const start = instant(i, e.t);
    const next = day[k + 1] ? instant(i, day[k + 1].t) : null;
    const gap = next ? next.getTime() - start.getTime() : 0;
    const end = new Date(start.getTime() + (gap > 0 && gap <= 3 * 3600000 ? gap : (e.kind === 'move' ? 45 : 60) * 60000));
    out.push({
      id: `${TRIP.programId || 'demo'}-${i}-${k}`, day: i, e, start, end,
      title: e.kind === 'co' ? `Визит: ${e.name}` : e.name,
      location: [e.place, CITY[i]].filter(Boolean).join(', '),
      notes: `${TRIP.title} · Global Tech Tour`,
    });
  }));
  return out;
}

// ——— календарь в формате iCalendar (.ics): открывается в Календаре iPhone, Google Календаре, Outlook ———
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
/** Строки iCalendar не длиннее 75 байт: длинные переносятся с пробелом в начале следующей. */
function fold(line: string) {
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = ch.charCodeAt(0) < 0x80 ? 1 : ch.length > 1 ? 4 : ch.charCodeAt(0) < 0x800 ? 2 : 3;
    if (bytes + b > (out.length ? 74 : 75)) { out.push(cur); cur = ''; bytes = 0; }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join('\r\n ');
}

export function icsOf(items: TripItem[], alarmMin = 15) {
  const now = stamp(new Date());
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Global Tech Tour//GTT App//RU', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${esc(`GTT · ${TRIP.title}`)}`];
  for (const it of items) {
    lines.push('BEGIN:VEVENT', `UID:${it.id}@globaltechtour.ru`, `DTSTAMP:${now}`, `DTSTART:${stamp(it.start)}`, `DTEND:${stamp(it.end)}`,
      `SUMMARY:${esc(it.title)}`, `LOCATION:${esc(it.location)}`, `DESCRIPTION:${esc(it.notes)}`);
    if (alarmMin) lines.push('BEGIN:VALARM', `TRIGGER:-PT${alarmMin}M`, 'ACTION:DISPLAY', `DESCRIPTION:${esc(it.title)}`, 'END:VALARM');
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(fold).join('\r\n')}\r\n`;
}
