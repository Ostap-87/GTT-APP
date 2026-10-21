// Уведомления на телефоне (expo-notifications, только локальные — работают в Expo Go и без интернета).
// В вебе — notify.web.ts: браузер такие напоминания не ставит.
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import type { Reminder } from '@/data/reminders';

export const notifySupported = true;
export type NotifyAction = { action: 'inbus' | 'taxi' | 'open'; url?: string; zh?: string; ru?: string };

let ready: Promise<void> | null = null;
/** Один раз за запуск: показывать уведомления и при открытом приложении, канал Android, кнопки «Я в автобусе». */
export function setupNotifications() {
  ready ??= (async () => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('trip', { name: 'Поездка: выезды и визиты', importance: Notifications.AndroidImportance.HIGH });
    }
    await Notifications.setNotificationCategoryAsync('bus', [
      { identifier: 'inbus', buttonTitle: 'Я в автобусе', options: { opensAppToForeground: true } },
      { identifier: 'taxi', buttonTitle: 'Адрес для такси', options: { opensAppToForeground: true } },
    ]);
  })().catch(() => { /* без кнопок напоминания всё равно придут */ });
  return ready;
}

export async function askPermission(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

const content = (r: Reminder) => ({
  title: r.title, body: r.body, sound: true,
  data: { url: r.url, zh: r.zh, ru: r.ru },
  ...(r.bus ? { categoryIdentifier: 'bus' } : {}),
});

/** Поставить напоминания поездки заново (старые снимаются). Возвращает, сколько поставлено. */
export async function scheduleTrip(list: Reminder[]): Promise<number> {
  await setupNotifications();
  await Notifications.cancelAllScheduledNotificationsAsync();
  let n = 0;
  for (const r of list) {
    try {
      await Notifications.scheduleNotificationAsync({ identifier: r.id, content: content(r), trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.at, channelId: 'trip' } });
      n += 1;
    } catch { /* одно не встало — остальные ставим */ }
  }
  return n;
}

export async function cancelTrip() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Пробное напоминание через 5 секунд — посмотреть, как оно выглядит (можно свернуть приложение). */
export async function testReminder(r: Reminder) {
  await setupNotifications();
  await Notifications.scheduleNotificationAsync({ content: content(r), trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: 'trip' } });
}

/** Нажатие на уведомление или на его кнопку. Повтор того же ответа (после пересборки экранов) не обрабатывается. */
let handled = '';
export function useNotifyAction(cb: (a: NotifyAction) => void) {
  const last = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!last) return;
    const key = `${last.notification.request.identifier}:${last.actionIdentifier}:${last.notification.date}`;
    if (key === handled) return;
    handled = key;
    const d = (last.notification.request.content.data || {}) as { url?: string; zh?: string; ru?: string };
    const action = last.actionIdentifier === 'inbus' ? 'inbus' : last.actionIdentifier === 'taxi' ? 'taxi' : 'open';
    cb({ action, url: d.url, zh: d.zh, ru: d.ru });
  }, [last]); // eslint-disable-line react-hooks/exhaustive-deps
}
