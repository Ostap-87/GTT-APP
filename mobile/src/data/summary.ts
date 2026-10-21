// «Коротко» — бесплатное саммари на телефоне (решение 21.10.2026): из расшифровки экскурсии или заметок выбираются
// главные фразы — с темами встреч, договорённостями и цифрами. Без интернета и без ИИ; текст никуда не отправляется.
// Расшифровку делает стороннее приложение переводчика — её вставляют в заметки визита.
import { findDeal, findThemes } from './themes';

/** Фразы текста (короче 15 знаков не берём — это «Да.», «Спасибо.»). */
export const sentences = (text = '') =>
  (text.replace(/\s+/g, ' ').match(/[^.!?…]+[.!?…]*/g) || []).map((s) => s.trim()).filter((s) => s.length >= 15);

/** Служебные фразы гида — приветствия и просьбы к группе — в «Коротко» не берём. */
const SERVICE = /добрый (день|вечер)|здравствуйте|добро пожаловать|начинаем экскурси|пожалуйста|спасибо|не фотографир|держитесь вместе|время для вопросов|проходите|пройдём|пройдем/;

function score(s: string, i: number) {
  const words = s.split(' ').length;
  let v = findThemes(s).length * 2 + (findDeal(s) ? 3 : 0) + (/\d/.test(s) ? 1.5 : 0) + (i < 2 ? 0.5 : 0);
  if (SERVICE.test(s.toLowerCase())) v -= 4;
  if (words < 6) v -= 1;
  if (words > 40) v -= 1.5;
  return v;
}

export type Point = { text: string; from?: string };

/** Главные фразы: лучшие по смыслу, в порядке, как прозвучали; повторы отбрасываем. perFrom — не больше фраз
 *  от одной компании, чтобы в «Коротко» за поездку попали разные визиты. */
export function keyPoints(items: { text: string; from?: string }[], max = 5, perFrom = Infinity): Point[] {
  const all = items.flatMap((it, k) => sentences(it.text).map((s, i) => ({ text: s, from: it.from, order: k * 10000 + i, v: score(s, i) })));
  const seen = new Set<string>();
  const per = new Map<string, number>();
  return all
    .filter((x) => x.v > 0)
    .sort((a, b) => b.v - a.v || a.order - b.order)
    .filter((x) => { const k = x.text.toLowerCase().slice(0, 40); if (seen.has(k)) return false; seen.add(k); return true; })
    .filter((x) => { const n = per.get(x.from || '') || 0; per.set(x.from || '', n + 1); return n < perFrom; })
    .slice(0, max)
    .sort((a, b) => a.order - b.order)
    .map(({ text, from }) => ({ text, from }));
}

export const isLong = (text = '') => text.length > 300;
export const wordCount = (text = '') => (text.trim() ? text.trim().split(/\s+/).length : 0);
