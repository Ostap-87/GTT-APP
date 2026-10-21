// В браузере напоминания поездки не ставятся — они работают в приложении на телефоне (notify.ts).
import type { Reminder } from '@/data/reminders';

export const notifySupported = false;
export type NotifyAction = { action: 'inbus' | 'taxi' | 'open'; url?: string; zh?: string; ru?: string };
export const setupNotifications = async () => {};
export const askPermission = async () => false;
export const scheduleTrip = async (_list: Reminder[]) => 0;
export const cancelTrip = async () => {};
export const testReminder = async (_r: Reminder) => {};
export function useNotifyAction(_cb: (a: NotifyAction) => void) { /* в браузере уведомлений нет */ }
