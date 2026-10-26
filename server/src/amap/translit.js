// Иероглифы → пиньинь → русские буквы (система Палладия, как в атласах и путеводителях: 上海 → Шанхай, 同仁堂 → Тунжэньтан).
// Таблица знаков — data/pinyin.json из Unihan (самое частое чтение знака, ~15 тыс. упрощённых и традиционных знаков),
// собирается скриптом tools/amap-data.py. Многозначные знаки, которые в названиях и адресах читаются иначе, — ниже.
import { readFileSync } from 'node:fs';

const TABLE = JSON.parse(readFileSync(new URL('./data/pinyin.json', import.meta.url), 'utf8'));
const READING = new Map();
for (const [syl, chars] of Object.entries(TABLE)) for (const ch of chars) READING.set(ch, syl);

// Чтение по умолчанию для адресов и вывесок (Unihan даёт самое частое в языке вообще: 地 → de, 长 → zhang, 都 → dou).
const CHAR_READING = { 地: 'di', 长: 'chang', 都: 'du', 薄: 'bo', 曾: 'zeng', 缪: 'miao', 翟: 'zhai', 弄: 'long' };
// Слова, где знак читается иначе, чем по умолчанию (大厦 — «здание», dasha; но 厦门 — Xiamen).
const WORD_READING = {
  重庆: ['chong', 'qing'], 厦门: ['xia', 'men'], 銀行: ['yin', 'hang'], 银行: ['yin', 'hang'], 大参林: ['da', 'shen', 'lin'],
  人参: ['ren', 'shen'], 西藏: ['xi', 'zang'], 音乐: ['yin', 'yue'], 重阳: ['chong', 'yang'], 长春: ['chang', 'chun'],
};
const WORDS = Object.keys(WORD_READING).sort((a, b) => b.length - a.length);

export const isHan = (ch) => READING.has(ch) || /\p{Script=Han}/u.test(ch);

/** Пиньинь без тонов по знакам: [{ch, py}] — py null, если это не иероглиф или знака нет в таблице. */
export function toPinyin(text) {
  const out = [];
  const s = String(text || '');
  for (let i = 0; i < s.length;) {
    const w = WORDS.find((x) => s.startsWith(x, i));
    if (w) {
      [...w].forEach((ch, k) => out.push({ ch, py: WORD_READING[w][k] }));
      i += w.length;
      continue;
    }
    const ch = s[i];
    out.push({ ch, py: CHAR_READING[ch] || READING.get(ch) || null });
    i += 1;
  }
  return out;
}

const INITIALS = [['zh', 'чж'], ['ch', 'ч'], ['sh', 'ш'], ['b', 'б'], ['p', 'п'], ['m', 'м'], ['f', 'ф'], ['d', 'д'], ['t', 'т'],
  ['n', 'н'], ['l', 'л'], ['g', 'г'], ['k', 'к'], ['h', 'х'], ['j', 'цз'], ['q', 'ц'], ['x', 'с'], ['r', 'ж'], ['z', 'цз'],
  ['c', 'ц'], ['s', 'с']];
const FINALS = {
  a: 'а', o: 'о', e: 'э', ai: 'ай', ei: 'эй', ao: 'ао', ou: 'оу', an: 'ань', en: 'энь', ang: 'ан', eng: 'эн', ong: 'ун', er: 'эр',
  i: 'и', ia: 'я', ie: 'е', iao: 'яо', iu: 'ю', ian: 'янь', in: 'инь', iang: 'ян', ing: 'ин', iong: 'юн',
  u: 'у', ua: 'уа', uo: 'о', uai: 'уай', ui: 'уй', uan: 'уань', un: 'унь', uang: 'уан', ueng: 'вэн',
  v: 'юй', ve: 'юэ', ue: 'юэ', van: 'юань', vn: 'юнь',
};
const ZERO = {
  a: 'а', ai: 'ай', an: 'ань', ang: 'ан', ao: 'ао', e: 'э', ei: 'эй', en: 'энь', eng: 'эн', er: 'эр', o: 'о', ou: 'оу',
  yi: 'и', ya: 'я', yao: 'яо', ye: 'е', yo: 'ё', you: 'ю', yan: 'янь', yin: 'инь', yang: 'ян', ying: 'ин', yong: 'юн',
  yu: 'юй', yue: 'юэ', yuan: 'юань', yun: 'юнь',
  wu: 'у', wa: 'ва', wo: 'во', wai: 'вай', wei: 'вэй', wan: 'вань', wen: 'вэнь', wang: 'ван', weng: 'вэн',
  m: 'м', n: 'нь', ng: 'н', hm: 'хм', hng: 'хн',
};

/** Один слог пиньиня без тона (ü — v) → русские буквы по Палладию. */
export function syllableRu(syl) {
  const s = String(syl).toLowerCase().replace('ü', 'v');
  if (ZERO[s]) return ZERO[s];
  if (s === 'hui') return 'хуэй';
  const ini = INITIALS.find(([p]) => s.startsWith(p));
  if (!ini) return s;
  let fin = s.slice(ini[0].length);
  // После j, q, x буква u — это ü: ju → цзюй, xuan → сюань
  if (/^[jqx]$/.test(ini[0]) && fin.startsWith('u')) fin = `v${fin.slice(1)}`.replace(/^ve$/, 've');
  if (fin === 'i' && ['zh', 'ch', 'sh', 'r'].includes(ini[0])) return ini[1] + 'и';
  if (fin === 'i' && ['z', 'c', 's'].includes(ini[0])) return ini[1] + 'ы';
  const f = FINALS[fin];
  return f ? ini[1] + f : s;
}

const cap = (w) => (w ? w[0].toUpperCase() + w.slice(1) : w);

/** Иероглифы → одно слово по-русски («同仁堂» → «Тунжэньтан»). Не-иероглифы (цифры, латиница) остаются как есть. */
export function hanRu(text, { capital = true } = {}) {
  let out = '';
  let word = '';
  const flush = () => { if (word) { out += capital ? cap(word) : word; word = ''; } };
  for (const { ch, py } of toPinyin(text)) {
    if (py) word += syllableRu(py);
    else { flush(); out += ch; }
  }
  flush();
  return out;
}

/** Иероглифы → пиньинь латиницей одним словом («同仁堂» → «Tongrentang»): для английского и узбекского. */
export function hanLatin(text, { capital = true } = {}) {
  let out = '';
  let word = '';
  const flush = () => { if (word) { out += capital ? cap(word) : word; word = ''; } };
  for (const { ch, py } of toPinyin(text)) {
    // Xi'an: слог на a/e/o внутри слова отделяется апострофом, как в официальной латинице
    if (py) word += (word && /^[aeo]/.test(py) ? "'" : '') + py.replace('v', 'ü');
    else { flush(); out += ch; }
  }
  flush();
  return out;
}

// Разбор латинского пиньиня на слоги (для названий сетей: «Dashenlin» → da-shen-lin → «Дашэньлинь»).
const SYLLABLES = new Set([...Object.keys(TABLE), 'r']);
const MAX = 6;
export function splitPinyin(word) {
  const w = word.toLowerCase().replace('ü', 'v');
  const best = [null];
  // Перебор с конца: предпочитаем длинные слоги (xian, а не xi-an), но разбор должен покрыть слово целиком
  const memo = new Map();
  const go = (i) => {
    if (i === w.length) return [];
    if (memo.has(i)) return memo.get(i);
    let res = null;
    for (let L = Math.min(MAX, w.length - i); L >= 1 && !res; L -= 1) {
      const syl = w.slice(i, i + L);
      if (!SYLLABLES.has(syl)) continue;
      const rest = go(i + L);
      if (rest) res = [syl, ...rest];
    }
    memo.set(i, res);
    return res;
  };
  best[0] = go(0);
  return best[0];
}

/** «Tong Ren Tang» → «Тунжэньтан», «Guoduomei» → «Годомэй»; null, если это не пиньинь («LBX Pharmacy», «Watsons»). */
export function latinPinyinRu(latin) {
  const words = String(latin).trim().split(/[\s-]+/).filter(Boolean);
  if (!words.length || words.some((w) => !/^[a-züv]+$/i.test(w))) return null;
  const parts = words.map(splitPinyin);
  if (parts.some((p) => !p)) return null;
  // Однослоговые слова — части одного названия (Tong Ren Tang), многослоговые остаются отдельными словами
  const single = words.every((w, i) => parts[i].length === 1);
  const ru = parts.map((p) => p.map(syllableRu).join(''));
  return single ? cap(ru.join('')) : ru.map(cap).join(' ');
}
