// Лёгкая отдача при нажатии (вкладки, кнопки, «Я в автобусе»). В веб-версии вибрации нет — вызовы просто ничего не делают.
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const on = Platform.OS === 'ios' || Platform.OS === 'android';
export const tapFeel = () => { if (on) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };
export const selectFeel = () => { if (on) Haptics.selectionAsync().catch(() => {}); };
export const okFeel = () => { if (on) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); };
