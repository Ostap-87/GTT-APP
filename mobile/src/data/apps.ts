// «Открыть в Dianping / Meituan» (решение пользователя 26.10.2026: «начать нужно с в, так как это проще»): своего API
// для чужих приложений у Dianping и Meituan нет, поэтому открываем их приложения поиском по китайскому названию места.
// Название заранее кладём в буфер обмена: если поиск по ссылке не сработает, человек вставит его сам.
// Ссылки поиска — из открытых списков схем (dianping://searchshoplist, imeituan://www.meituan.com/search), официально
// не описаны: не открылся поиск — открываем приложение, не установлено — App Store (iOS) или сайт.
import { Linking, Platform } from 'react-native';

export type CnApp = 'dianping' | 'meituan';

export const CN_APPS: Record<CnApp, { name: string; zh: string; search: (q: string) => string; home: string; appStore: string; web: string }> = {
  dianping: {
    name: 'Dianping', zh: '大众点评',
    search: (q) => `dianping://searchshoplist?keyword=${encodeURIComponent(q)}`,
    home: 'dianping://',
    appStore: 'https://apps.apple.com/app/id351091731',
    web: 'https://www.dianping.com/',
  },
  meituan: {
    name: 'Meituan', zh: '美团',
    search: (q) => `imeituan://www.meituan.com/search?q=${encodeURIComponent(q)}`,
    home: 'imeituan://',
    appStore: 'https://apps.apple.com/app/id423084029',
    web: 'https://www.meituan.com/',
  },
};

/** Что открылось: поиск в приложении, само приложение, магазин приложений или сайт (в браузере схемы не работают). */
export type Opened = 'search' | 'home' | 'store' | 'web';

export async function openInApp(app: CnApp, q: string): Promise<Opened> {
  const a = CN_APPS[app];
  if (Platform.OS === 'web') {
    await Linking.openURL(a.web).catch(() => {});
    return 'web';
  }
  try { await Linking.openURL(a.search(q)); return 'search'; } catch { /* схема поиска не сработала */ }
  try { await Linking.openURL(a.home); return 'home'; } catch { /* приложение не установлено */ }
  await Linking.openURL(Platform.OS === 'ios' ? a.appStore : a.web).catch(() => {});
  return 'store';
}

/** Есть ли в строке иероглифы — искать в Dianping и Meituan имеет смысл только по-китайски. */
export const hasHan = (s?: string) => !!s && /\p{Script=Han}/u.test(s);
