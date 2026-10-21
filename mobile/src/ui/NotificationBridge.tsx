// Связка уведомлений с приложением: ставит напоминания поездки (при запуске, смене программы и настроек) и выполняет
// нажатия — «Я в автобусе» отмечает делегата (координатор видит сразу), «Адрес для такси» открывает адрес для водителя.
import { router } from 'expo-router';
import { useEffect } from 'react';

import { tripReminders } from '@/data/reminders';
import { cancelTrip, notifySupported, scheduleTrip, setupNotifications, useNotifyAction } from '@/state/notify';
import { useToast } from '@/state/toast';
import { useTrip } from '@/state/trip';

export function NotificationBridge() {
  const trip = useTrip();
  const toast = useToast();
  const { reminders } = trip;
  useEffect(() => { setupNotifications(); }, []);
  useEffect(() => {
    if (!notifySupported) return;
    (reminders.on ? scheduleTrip(tripReminders(reminders)) : cancelTrip()).catch(() => { /* нет разрешения — карточка подскажет */ });
  }, [reminders]);
  useNotifyAction((a) => {
    // при холодном старте навигация готова не сразу
    setTimeout(() => {
      if (a.action === 'inbus') {
        trip.setInBus(true);
        toast('Отмечено: вы в автобусе — координатор видит');
        router.push('/trip');
      } else if (a.action === 'taxi' && a.zh) router.push({ pathname: '/driver', params: { zh: a.zh, ru: a.ru || '' } });
      else if (a.url) router.push(a.url as never);
    }, 300);
  });
  return null;
}
