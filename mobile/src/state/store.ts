// Хранилище на телефоне (решение 20.10.2026: «при перезапуске всё сбрасывается — надо, чтобы сохранялось»).
// При запуске всё читается одним запросом, дальше useStored работает как useState и сразу записывает изменения.
// В вебе то же самое лежит в localStorage браузера. На шаге 2 сервер станет главным, а это — офлайн-копией.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

const PREFIX = 'gtt:v1:';
const cache = new Map<string, unknown>();

/** Прочитать всё сохранённое до первого экрана. Ошибка чтения — не повод не открыть приложение. */
export async function loadStore() {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
    for (const [k, v] of await AsyncStorage.multiGet(keys)) {
      if (v == null) continue;
      try { cache.set(k.slice(PREFIX.length), JSON.parse(v)); } catch { /* испорченная запись — берём значение по умолчанию */ }
    }
  } catch { /* хранилище недоступно — работаем в памяти */ }
}

/** Стереть всё сохранённое (кнопка «Начать демо заново»). */
export async function clearStore() {
  cache.clear();
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
    await AsyncStorage.multiRemove(keys);
  } catch { /* нечего стирать */ }
}

/** Как useState, но значение переживает перезапуск приложения. */
export function useStored<T>(key: string, init: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => (cache.has(key) ? (cache.get(key) as T) : init instanceof Function ? init() : init));
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    cache.set(key, value);
    AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)).catch(() => { /* нет места — останется в памяти */ });
  }, [key, value]);
  return [value, setValue];
}
