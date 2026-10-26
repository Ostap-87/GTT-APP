// Языки разделов «Аптеки» и «Фруктовые лавки» (решение пользователя 26.10.2026: «на русском и других языках, потому что
// много людей не знают китайского и английского»). Остальное приложение пока на русском — здесь минимальный механизм только
// для этих двух разделов: русский, английский, казахский (кириллица) и узбекский (латиница), т. е. языки делегаций из
// России, Казахстана и Узбекистана. Китайский текст для персонала показывается всегда по-китайски, пиньинь — мелко под ним.
// Перевод на казахский и узбекский перед пилотом проверит носитель языка (docs/decisions.md).

export type Lang = 'ru' | 'en' | 'kk' | 'uz';
/** Строка на всех языках раздела — TypeScript не даст забыть перевод. */
export type Tx = Record<Lang, string>;

export const LANGS: readonly (readonly [Lang, string])[] = [['ru', 'Рус'], ['en', 'Eng'], ['kk', 'Қаз'], ['uz', 'Oʻzb']];
export const isLang = (x: unknown): x is Lang => x === 'ru' || x === 'en' || x === 'kk' || x === 'uz';

/** Короткая запись: t(русский, английский, казахский, узбекский). */
export const t = (ru: string, en: string, kk: string, uz: string): Tx => ({ ru, en, kk, uz });
export const tr = (x: Tx, l: Lang) => x[l] || x.ru;
/** Подстановка {имя} в строку. */
export const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? ''));

/** Месяцы в именительном падеже — для сезонов фруктов. */
export const MONTHS: Record<Lang, string[]> = {
  ru: ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  kk: ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'],
  uz: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'],
};
