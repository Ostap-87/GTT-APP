// Машинный перевод — только запасной путь для того, что не перевели правила (метки вроде «可刷医保», описания).
// Названия и адреса им не переводим: «老百姓» он переведёт как «простой народ», а табличка на улице — Laobaixing.
// Выключен по умолчанию. MT_PROVIDER = yandex (Yandex Translate, ключ сервисного аккаунта — MT_KEY, каталог — MT_FOLDER_ID)
// или deepl (MT_KEY; ключ бесплатного тарифа заканчивается на «:fx»). Переводы кэшируются: одна строка — один запрос за всё время.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const TARGET = { ru: 'ru', en: 'en', kk: 'kk', uz: 'uz' };

export function createTranslator({ provider = '', key = '', folderId = '', cacheFile = '', fetchImpl = fetch, log = () => {} } = {}) {
  const enabled = Boolean(provider && key);
  let cache = {};
  if (cacheFile && existsSync(cacheFile)) {
    try { cache = JSON.parse(readFileSync(cacheFile, 'utf8')); } catch { cache = {}; }
  }
  let dirty = false;
  const save = () => {
    if (!dirty || !cacheFile) return;
    try { writeFileSync(cacheFile, JSON.stringify(cache)); dirty = false; } catch (err) { log('mt-cache', err.message); }
  };

  async function call(texts, lang) {
    if (provider === 'yandex') {
      const res = await fetchImpl('https://translate.api.cloud.yandex.net/translate/v2/translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Api-Key ${key}` },
        body: JSON.stringify({ ...(folderId ? { folderId } : {}), sourceLanguageCode: 'zh', targetLanguageCode: TARGET[lang], texts }),
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) throw new Error(`Yandex Translate HTTP ${res.status}`);
      return (await res.json()).translations.map((t) => t.text);
    }
    if (provider === 'deepl') {
      // У DeepL нет казахского и узбекского — для них отдаём английский
      const target = lang === 'ru' ? 'RU' : 'EN-GB';
      const host = key.endsWith(':fx') ? 'api-free.deepl.com' : 'api.deepl.com';
      const res = await fetchImpl(`https://${host}/v2/translate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `DeepL-Auth-Key ${key}` },
        body: JSON.stringify({ text: texts, source_lang: 'ZH', target_lang: target }),
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) throw new Error(`DeepL HTTP ${res.status}`);
      return (await res.json()).translations.map((t) => t.text);
    }
    throw new Error(`неизвестный MT_PROVIDER: ${provider}`);
  }

  /** Перевод списка строк; без настроек или при ошибке — null на месте строки (поле просто не показываем). */
  async function translate(texts, lang) {
    const list = [...new Set(texts.filter(Boolean))];
    const out = new Map();
    const todo = [];
    for (const t of list) {
      const hit = cache[`${lang}|${t}`];
      if (hit !== undefined) out.set(t, hit); else todo.push(t);
    }
    if (enabled && todo.length) {
      try {
        const res = await call(todo, lang);
        todo.forEach((t, i) => { cache[`${lang}|${t}`] = res[i]; out.set(t, res[i]); });
        dirty = true;
        save();
      } catch (err) {
        log('mt', err.message);
      }
    }
    return texts.map((t) => (t ? out.get(t) ?? null : null));
  }

  return { enabled, translate };
}
