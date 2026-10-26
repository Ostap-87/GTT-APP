// Перевод ответа Amap на язык делегата без машинного перевода: названия сетей — по словарю приложения (data/chains.json),
// типовые слова (аптека, улица, район, этаж, круглосуточно) — по таблицам ниже, имена собственные — русскими буквами по
// Палладию или латиницей (пиньинь, как на табличках улиц). Китайский оригинал всегда остаётся рядом — его показывают
// таксисту и прохожим. Языки — как у разделов «Аптеки» и «Фруктовые лавки»: ru, en, kk (кириллица), uz (латиница).
import { readFileSync } from 'node:fs';
import { hanLatin, hanRu, isHan, latinPinyinRu } from './translit.js';

export const LANGS = ['ru', 'en', 'kk', 'uz'];
const CYR = { ru: true, kk: true, en: false, uz: false };
const cap = (w) => (w ? w[0].toUpperCase() + w.slice(1) : w);
/** Имя собственное: кириллица для ru/kk, пиньинь для en/uz. */
export const proper = (zh, lang) => (CYR[lang] ? hanRu(zh) : hanLatin(zh));

const CHAINS = JSON.parse(readFileSync(new URL('./data/chains.json', import.meta.url), 'utf8'))
  .sort((a, b) => b.zh.length - a.zh.length);
const BRAND_NOISE = /\b(pharmacy|fruit|market|supermarkets?|mercado|vermelho)\b|[()]/gi;

// Типовые слова в конце названия → тип заведения. Длинные раньше коротких.
const NAME_TYPES = [
  ['24小时药房', 'pharmacy24'], ['24小时药店', 'pharmacy24'], ['24小時藥房', 'pharmacy24'],
  ['大药房', 'pharmacy'], ['大藥房', 'pharmacy'], ['大药店', 'pharmacy'], ['药房', 'pharmacy'], ['藥房', 'pharmacy'],
  ['药店', 'pharmacy'], ['藥店', 'pharmacy'], ['医药', 'pharmacy'], ['醫藥', 'pharmacy'], ['药业', 'pharmacy'], ['药行', 'pharmacy'],
  ['诊所', 'clinic'], ['診所', 'clinic'],
  ['果品市场', 'fruitMarket'], ['水果超市', 'fruit'], ['水果店', 'fruit'], ['水果摊', 'fruit'], ['水果', 'fruit'], ['鲜果', 'fruit'],
  ['果业', 'fruit'], ['果蔬', 'fruit'], ['生鲜超市', 'supermarket'], ['超市', 'supermarket'], ['便利店', 'convenience'],
  ['菜市场', 'market'], ['市场', 'market'], ['街市', 'market'],
];
export const TYPE_WORD = {
  pharmacy: { ru: 'Аптека', en: 'Pharmacy', kk: 'Дәріхана', uz: 'dorixonasi' },
  pharmacy24: { ru: 'Круглосуточная аптека', en: '24h Pharmacy', kk: 'Тәулік бойы дәріхана', uz: 'kecha-kunduz dorixonasi' },
  clinic: { ru: 'Клиника', en: 'Clinic', kk: 'Клиника', uz: 'klinikasi' },
  fruit: { ru: 'Фрукты', en: 'Fruit', kk: 'Жемістер', uz: 'mevalari' },
  fruitMarket: { ru: 'Фруктовый рынок', en: 'Fruit Market', kk: 'Жеміс базары', uz: 'meva bozori' },
  supermarket: { ru: 'Супермаркет', en: 'Supermarket', kk: 'Супермаркет', uz: 'supermarketi' },
  convenience: { ru: 'Магазин у дома', en: 'Convenience Store', kk: 'Шағын дүкен', uz: 'mini-doʻkoni' },
  market: { ru: 'Рынок', en: 'Market', kk: 'Базар', uz: 'bozori' },
};
/** «Аптека «Лаобайсин»», «Laobaixing Pharmacy», «Laobaixing dorixonasi». */
function withType(core, type, lang) {
  const w = type && TYPE_WORD[type][lang];
  if (!w) return core;
  if (!core) return cap(w);
  if (lang === 'en') return `${core} ${w}`;
  if (lang === 'uz') return `${core} ${w}`;
  return `${w} «${core}»`;
}

// Города, где принятое название отличается от Палладия/пиньиня
const CITY = {
  北京: { ru: 'Пекин', kk: 'Бейжің', uz: 'Pekin' }, 南京: { ru: 'Нанкин', kk: 'Нанкин', uz: 'Nankin' },
  哈尔滨: { ru: 'Харбин', kk: 'Харбин', en: 'Harbin', uz: 'Xarbin' }, 香港: { ru: 'Гонконг', kk: 'Гонконг', en: 'Hong Kong', uz: 'Gonkong' },
  澳门: { ru: 'Макао', kk: 'Макао', en: 'Macao', uz: 'Makao' }, 澳門: { ru: 'Макао', kk: 'Макао', en: 'Macao', uz: 'Makao' },
  西藏: { ru: 'Тибет', kk: 'Тибет', en: 'Tibet', uz: 'Tibet' }, 内蒙古: { ru: 'Внутренняя Монголия', kk: 'Ішкі Моңғолия', en: 'Inner Mongolia', uz: 'Ichki Moʻgʻuliston' },
};
export function cityName(zh, lang) {
  const base = String(zh || '').replace(/(特别行政区|自治区|省|市)$/, '');
  return CITY[base]?.[lang] || proper(base, lang);
}

const DIR = { 东: ['Дун', 'East'], 西: ['Си', 'West'], 南: ['Нань', 'South'], 北: ['Бэй', 'North'], 中: ['Чжун', 'Middle'] };
// Слово-указатель после названия (… + 路) → как писать на языке делегата. pre — ставится перед названием (ru, kk).
const PLACE = [
  ['省', { ru: 'пров.', en: 'Province', kk: 'провинциясы', uz: 'provinsiyasi', pre: { ru: true } }],
  ['市', { ru: '', en: '', kk: '', uz: '' }],
  ['超市', { ru: 'супермаркет', en: 'Supermarket', kk: 'супермаркеті', uz: 'supermarketi', pre: { ru: true } }],
  ['自治区', { ru: 'авт. р-н', en: 'Autonomous Region', kk: 'авт. аудан', uz: 'avtonom tumani' }],
  ['新区', { ru: 'новый р-н', en: 'New District', kk: 'жаңа аудан', uz: 'yangi tumani' }],
  ['街道', { ru: 'квартал', en: 'Subdistrict', kk: 'мөлтек аудан', uz: 'mahallasi' }],
  ['区', { ru: 'р-н', en: 'District', kk: 'ауданы', uz: 'tumani', pre: { ru: true } }],
  ['區', { ru: 'р-н', en: 'District', kk: 'ауданы', uz: 'tumani', pre: { ru: true } }],
  ['县', { ru: 'уезд', en: 'County', kk: 'уезі', uz: 'okrugi', pre: { ru: true } }],
  ['镇', { ru: 'пос.', en: 'Town', kk: 'кенті', uz: 'shaharchasi', pre: { ru: true } }],
  ['大道', { ru: 'просп.', en: 'Ave', kk: 'даңғылы', uz: 'shoh koʻchasi', pre: { ru: true }, road: true }],
  ['大街', { ru: 'ул.', en: 'St', kk: 'көшесі', uz: 'koʻchasi', pre: { ru: true }, road: true }],
  ['路', { ru: 'ул.', en: 'Rd', kk: 'көшесі', uz: 'koʻchasi', pre: { ru: true }, road: true }],
  ['道', { ru: 'ул.', en: 'Rd', kk: 'көшесі', uz: 'koʻchasi', pre: { ru: true }, road: true }],
  ['街', { ru: 'ул.', en: 'St', kk: 'көшесі', uz: 'koʻchasi', pre: { ru: true }, road: true }],
  ['胡同', { ru: 'хутун', en: 'Hutong', kk: 'хутуны', uz: 'xutuni', pre: { ru: true }, road: true }],
  ['巷', { ru: 'пер.', en: 'Lane', kk: 'тұйық көшесі', uz: 'tor koʻchasi', pre: { ru: true }, road: true }],
  ['购物中心', { ru: 'ТЦ', en: 'Mall', kk: 'СО', uz: 'savdo markazi', pre: { ru: true, kk: true } }],
  ['商场', { ru: 'ТЦ', en: 'Mall', kk: 'СО', uz: 'savdo markazi', pre: { ru: true, kk: true } }],
  ['广场', { ru: 'Плаза', en: 'Plaza', kk: 'Плаза', uz: 'Plaza' }],
  ['廣場', { ru: 'Плаза', en: 'Plaza', kk: 'Плаза', uz: 'Plaza' }],
  ['大厦', { ru: 'здание', en: 'Building', kk: 'ғимараты', uz: 'binosi', pre: { ru: true } }],
  ['大楼', { ru: 'здание', en: 'Building', kk: 'ғимараты', uz: 'binosi', pre: { ru: true } }],
  ['中心', { ru: 'центр', en: 'Center', kk: 'орталығы', uz: 'markazi' }],
  ['酒店', { ru: 'отель', en: 'Hotel', kk: 'қонақүйі', uz: 'mehmonxonasi', pre: { ru: true } }],
  ['宾馆', { ru: 'гостиница', en: 'Hotel', kk: 'қонақүйі', uz: 'mehmonxonasi', pre: { ru: true } }],
  ['医院', { ru: 'больница', en: 'Hospital', kk: 'ауруханасы', uz: 'kasalxonasi', pre: { ru: true } }],
  ['大学', { ru: 'университет', en: 'University', kk: 'университеті', uz: 'universiteti', pre: { ru: true } }],
  ['公园', { ru: 'парк', en: 'Park', kk: 'саябағы', uz: 'bogʻi', pre: { ru: true } }],
  ['小区', { ru: 'ЖК', en: 'Residential', kk: 'ТК', uz: 'turar joy majmuasi', pre: { ru: true, kk: true } }],
  ['花园', { ru: 'ЖК', en: 'Garden', kk: 'ТК', uz: 'bogʻi', pre: { ru: true, kk: true } }],
  ['菜市场', { ru: 'рынок', en: 'Market', kk: 'базары', uz: 'bozori', pre: { ru: true } }],
  ['市场', { ru: 'рынок', en: 'Market', kk: 'базары', uz: 'bozori', pre: { ru: true } }],
  ['地铁站', { ru: 'ст. метро', en: 'Metro Station', kk: 'метро бекеті', uz: 'metro bekati', pre: { ru: true } }],
  ['站', { ru: 'ст.', en: 'Station', kk: 'бекеті', uz: 'bekati', pre: { ru: true } }],
];
const PLACE_WORDS = PLACE.map(([w]) => w).sort((a, b) => b.length - a.length);
const PLACE_MAP = Object.fromEntries(PLACE);
// Слова без названия перед ними
const BARE = {
  附近: { ru: 'рядом', en: 'nearby', kk: 'жанында', uz: 'yaqinida' },
  旁边: { ru: 'рядом', en: 'next to it', kk: 'қасында', uz: 'yonida' },
  旁: { ru: 'рядом', en: 'next to it', kk: 'қасында', uz: 'yonida' },
  对面: { ru: 'напротив', en: 'opposite', kk: 'қарсысында', uz: 'qarshisida' },
  东侧: { ru: 'с восточной стороны', en: 'east side', kk: 'шығыс жағы', uz: 'sharqiy tomoni' },
  西侧: { ru: 'с западной стороны', en: 'west side', kk: 'батыс жағы', uz: 'gʻarbiy tomoni' },
  南侧: { ru: 'с южной стороны', en: 'south side', kk: 'оңтүстік жағы', uz: 'janubiy tomoni' },
  北侧: { ru: 'с северной стороны', en: 'north side', kk: 'солтүстік жағы', uz: 'shimoliy tomoni' },
  入口: { ru: 'вход', en: 'entrance', kk: 'кіреберіс', uz: 'kirish' },
  出口: { ru: 'выход', en: 'exit', kk: 'шығу', uz: 'chiqish' },
  地铁: { ru: 'метро', en: 'Metro', kk: 'метро', uz: 'metro' },
  一层: { ru: '1 эт.', en: '1F', kk: '1-қабат', uz: '1-qavat' },
  一楼: { ru: '1 эт.', en: '1F', kk: '1-қабат', uz: '1-qavat' },
  二层: { ru: '2 эт.', en: '2F', kk: '2-қабат', uz: '2-qavat' },
  二楼: { ru: '2 эт.', en: '2F', kk: '2-қабат', uz: '2-qavat' },
  负一层: { ru: 'эт. −1', en: 'B1', kk: '−1 қабат', uz: '−1 qavat' },
  地下一层: { ru: 'эт. −1', en: 'B1', kk: '−1 қабат', uz: '−1 qavat' },
  底商: { ru: 'на первом этаже', en: 'ground floor', kk: 'бірінші қабатта', uz: 'birinchi qavatda' },
  内: { ru: 'внутри', en: 'inside', kk: 'ішінде', uz: 'ichida' },
};
const BARE_WORDS = Object.keys(BARE).sort((a, b) => b.length - a.length);
// Число + единица (99号, 3号楼, 2层, 301室, 123弄)
const UNIT = {
  号楼: (n) => ({ ru: `корп. ${n}`, en: `Bldg ${n}`, kk: `${n}-ғимарат`, uz: `${n}-bino` }),
  号院: (n) => ({ ru: `двор ${n}`, en: `Courtyard ${n}`, kk: `${n}-аула`, uz: `${n}-hovli` }),
  号铺: (n) => ({ ru: `пав. ${n}`, en: `Shop ${n}`, kk: `${n}-дүкен`, uz: `${n}-doʻkon` }),
  号线: (n) => ({ ru: `линия ${n}`, en: `Line ${n}`, kk: `${n}-желі`, uz: `${n}-liniya` }),
  号: (n) => ({ ru: n, en: `No. ${n}`, kk: n, uz: n, glue: true }),
  弄: (n) => ({ ru: `пер. ${n}`, en: `Lane ${n}`, kk: `${n}-тұйық көше`, uz: `${n}-tor koʻcha` }),
  栋: (n) => ({ ru: `корп. ${n}`, en: `Bldg ${n}`, kk: `${n}-ғимарат`, uz: `${n}-bino` }),
  幢: (n) => ({ ru: `корп. ${n}`, en: `Bldg ${n}`, kk: `${n}-ғимарат`, uz: `${n}-bino` }),
  座: (n) => ({ ru: `корп. ${n}`, en: `Tower ${n}`, kk: `${n}-ғимарат`, uz: `${n}-bino` }),
  层: (n) => ({ ru: `${n} эт.`, en: `${n}F`, kk: `${n}-қабат`, uz: `${n}-qavat` }),
  楼: (n) => ({ ru: `${n} эт.`, en: `${n}F`, kk: `${n}-қабат`, uz: `${n}-qavat` }),
  F: (n) => ({ ru: `${n} эт.`, en: `${n}F`, kk: `${n}-қабат`, uz: `${n}-qavat` }),
  室: (n) => ({ ru: `оф. ${n}`, en: `Room ${n}`, kk: `${n}-бөлме`, uz: `${n}-xona` }),
  单元: (n) => ({ ru: `подъезд ${n}`, en: `Unit ${n}`, kk: `${n}-кіреберіс`, uz: `${n}-yoʻlak` }),
  号出口: (n) => ({ ru: `выход ${n}`, en: `Exit ${n}`, kk: `${n}-шығу`, uz: `${n}-chiqish` }),
  出口: (n) => ({ ru: `выход ${n}`, en: `Exit ${n}`, kk: `${n}-шығу`, uz: `${n}-chiqish` }),
};
const UNITS = Object.keys(UNIT).sort((a, b) => b.length - a.length);
// Города, которые пишут в начале филиала или адреса перед улицей
const CITY_PREFIX = ['哈尔滨', '北京', '上海', '广州', '深圳', '佛山', '杭州', '苏州', '南京', '成都', '重庆', '西安', '武汉', '长沙',
  '厦门', '三亚', '青岛', '天津', '香港', '澳门', '宁波', '郑州', '济南', '昆明', '大连', '沈阳', '合肥', '福州', '南宁', '贵阳', '东莞',
  '无锡', '珠海', '海口', '温州', '义乌', '长春', '石家庄', '太原', '南昌', '兰州', '乌鲁木齐'];
const ZH_NUM = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };

/** Название с указателем: 南京东 + 路 → «ул. Наньцзин Дун» / «Nanjing East Rd» / «Наньцзин Дун көшесі». */
function placeText(nameZh, word, lang) {
  const w = PLACE_MAP[word][lang];
  if (!nameZh) return w;
  let base = nameZh;
  let dir = null;
  if (PLACE_MAP[word].road && base.length > 1 && DIR[base.at(-1)]) { dir = DIR[base.at(-1)]; base = base.slice(0, -1); }
  let name = PLACE_MAP[word].road ? proper(base, lang) : CITY[base]?.[lang] || proper(base, lang);
  if (dir) name += ` ${CYR[lang] ? dir[0] : lang === 'en' ? dir[1] : hanLatin(nameZh.at(-1))}`;
  return PLACE_MAP[word].pre?.[lang] ? `${w} ${name}` : `${name} ${w}`;
}

/** Адрес по-китайски → строка на языке делегата: «黄浦区南京东路99号» → «р-н Хуанпу, ул. Наньцзин Дун, 99». */
export function translateAddress(zh, lang) {
  const s = String(zh || '').replace(/[（(].*?[)）]/g, (m) => `,${m.slice(1, -1)},`);
  const parts = [];
  let i = 0;
  const push = (text, glue = false) => { if (text) parts.push({ text, glue }); };
  while (i < s.length) {
    const rest = s.slice(i);
    let m = /^(\d+(?:[-－]\d+)?)([A-Za-z]?)/.exec(rest);
    if (m) {
      const after = rest.slice(m[0].length);
      const unit = UNITS.find((u) => after.startsWith(u));
      const n = m[1].replace('－', '-') + m[2];
      if (unit) { const t = UNIT[unit](n); push(t[lang], t.glue); i += m[0].length + unit.length; } else { push(n); i += m[0].length; }
      continue;
    }
    m = /^([BFL])(\d+)(层|楼)?/.exec(rest);
    if (m && !/^[A-Za-z]/.test(rest.slice(m[0].length))) {
      const n = m[2];
      push(m[1] === 'B' ? { ru: `эт. −${n}`, en: `B${n}`, kk: `−${n} қабат`, uz: `−${n} qavat` }[lang] : UNIT.层(n)[lang]);
      i += m[0].length;
      continue;
    }
    m = /^[A-Za-z][A-Za-z0-9.\-·&']*/.exec(rest);
    if (m) {
      const prev = parts.at(-1);
      if (prev?.latin && /^\s/.test(s.slice(i - 1, i))) prev.text += ` ${m[0]}`;
      else parts.push({ text: m[0], latin: true });
      i += m[0].length;
      continue;
    }
    m = /^[\p{Script=Han}]+/u.exec(rest);
    if (m) {
      const run = m[0];
      let k = 0;
      while (k < run.length) {
        const bare = BARE_WORDS.find((w) => run.startsWith(w, k));
        if (bare) { push(BARE[bare][lang]); k += bare.length; continue; }
        const city = CITY_PREFIX.find((c) => run.startsWith(c, k));
        if (city) {
          let after = k + city.length;
          const roadAt = (pos) => PLACE_WORDS.some((w) => PLACE_MAP[w].road && run.startsWith(w, pos));
          // 北京路, 南京东路 — это улицы, а не город
          if (after < run.length && !roadAt(after) && !(DIR[run[after]] && roadAt(after + 1))) {
            if (run[after] === '市') after += 1;
            push(cityName(city, lang));
            k = after;
            continue;
          }
        }
        const st = run.indexOf('站', k);
        if (st > k && !/[路街道区号]/.test(run.slice(k, st))) {
          const name = run.slice(k, st).replace(/地铁$/, '');
          push(`${PLACE_MAP.站.pre?.[lang] ? `${PLACE_MAP.站[lang]} ` : ''}${proper(name, lang)}${PLACE_MAP.站.pre?.[lang] ? '' : ` ${PLACE_MAP.站[lang]}`}`);
          k = st + 1;
          continue;
        }
        // Ближайший указатель (路, 区, 号…) после названия
        let hit = null;
        for (let j = k; j < run.length && !hit; j += 1) {
          const w = PLACE_WORDS.find((x) => run.startsWith(x, j));
          if (w && (j > k || !PLACE_MAP[w].road)) hit = [j, w];
          if (!hit && j > k && BARE_WORDS.some((x) => run.startsWith(x, j))) hit = [j, null];
          if (!hit && j > k && ZH_NUM[run[j]] && UNITS.some((u) => run.startsWith(u, j + 1))) hit = [j, null];
        }
        if (ZH_NUM[run[k]] && UNITS.some((u) => run.startsWith(u, k + 1))) {
          const unit = UNITS.find((u) => run.startsWith(u, k + 1));
          const t = UNIT[unit](String(ZH_NUM[run[k]]));
          push(t[lang], t.glue);
          k += 1 + unit.length;
          continue;
        }
        if (!hit) { push(CITY[run.slice(k)]?.[lang] || proper(run.slice(k), lang)); break; }
        const [j, w] = hit;
        const name = run.slice(k, j);
        if (w) {
          const cityLike = w === '市';
          push(cityLike ? cityName(name, lang) : placeText(name, w, lang));
          k = j + w.length;
        } else {
          push(CITY[name]?.[lang] || proper(name, lang));
          k = j;
        }
      }
      i += run.length;
      continue;
    }
    i += 1; // запятые, пробелы, точки — разделители
  }
  return parts.reduce((acc, p, idx) => (idx === 0 ? p.text : `${acc}${p.glue ? ', ' : ', '}${p.text}`), '');
}

/** Название заведения: сеть по словарю, тип по последнему слову, филиал из скобок. */
export function translateName(zh, lang, { kind } = {}) {
  const full = String(zh || '').trim();
  const bm = /^(.*?)[（(]([^)）]*)[)）]\s*$/.exec(full);
  const main = (bm ? bm[1] : full).trim();
  const branchZh = bm ? bm[2].trim() : '';
  const chain = CHAINS.find((c) => main.includes(c.zh));
  let rest = chain ? main.replace(chain.zh, '') : main;
  rest = rest.replace(/(连锁|連鎖|平价|平價|便民|惠民|健康|医疗|醫療|有限公司|股份)/g, '');
  let type = null;
  for (const [w, t] of NAME_TYPES) {
    if (rest.endsWith(w)) { type = t; rest = rest.slice(0, -w.length); break; }
  }
  if (!type && chain) type = NAME_TYPES.find(([w]) => chain.zh.endsWith(w))?.[1] || (chain.kind === 'pharmacy' ? 'pharmacy' : null);
  if (!type && kind === 'pharmacy' && /药|藥/.test(main)) type = 'pharmacy';
  let core = '';
  if (chain) {
    const head = chain.lat.replace(/\s*\(.*\)\s*$/, '').trim();
    const cyr = latinPinyinRu(head.replace(BRAND_NOISE, '').trim()) || latinPinyinRu(head);
    const brand = head.replace(BRAND_NOISE, '').replace(/\s+/g, ' ').trim();
    if (CYR[lang]) {
      let zhCore = chain.zh;
      const tw = NAME_TYPES.find(([w]) => zhCore.endsWith(w) && zhCore.length - w.length >= 2);
      if (tw) zhCore = zhCore.slice(0, -tw[0].length);
      const ru = hanRu(zhCore);
      core = cyr || (!brand ? ru : /\s/.test(brand) || brand.length <= 4 ? `${ru} (${brand})` : `${brand} (${ru})`);
    } else core = brand || head || hanLatin(chain.zh);
    if (rest) core = `${core} ${proper(rest, lang)}`;
  } else if (rest) {
    core = /^[\x00-\x7f]+$/.test(rest) ? rest : proper(rest, lang);
  }
  const branchCore = branchZh.replace(/(分店|门店|店)$/, '');
  const branch = branchZh
    ? (/^24小[时時]$/.test(branchCore) ? { ru: 'круглосуточно', en: '24 hours', kk: 'тәулік бойы', uz: 'kecha-kunduz' }[lang]
      : /^旗舰$/.test(branchCore) ? { ru: 'флагманский', en: 'flagship', kk: 'флагман', uz: 'flagman' }[lang]
        : translateAddress(branchCore, lang))
    : '';
  return { text: withType(core, type, lang), branch, chain: chain ? { id: chain.id, kind: chain.kind, lat: chain.lat } : null, type };
}

const WEEK = { 一: 0, 二: 1, 三: 2, 四: 3, 五: 4, 六: 5, 日: 6, 天: 6, 末: 7 };
const DAYS = {
  ru: ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс', 'выходные'], en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'weekends'],
  kk: ['дс', 'сс', 'ср', 'бс', 'жм', 'сн', 'жс', 'демалыс'], uz: ['du', 'se', 'cho', 'pa', 'ju', 'sha', 'ya', 'dam olish'],
};
const ALLDAY = { ru: 'круглосуточно', en: '24 hours', kk: 'тәулік бойы', uz: 'kecha-kunduz' };
const DAILY = { ru: 'ежедневно', en: 'daily', kk: 'күн сайын', uz: 'har kuni' };

/** «周一至周日 08:00-22:00» → «пн–вс 08:00–22:00»; «24小时» и «00:00-24:00» → «круглосуточно». */
export function translateHours(zh, lang) {
  let s = String(zh || '').trim();
  if (!s) return null;
  if (/24小[时時]|全天|00:00\s*[-~至]\s*(24:00|23:59)/.test(s) && !/[周星]/.test(s)) return ALLDAY[lang];
  s = s.replace(/(00:00\s*[-~至]\s*(24:00|23:59))/g, ALLDAY[lang]);
  s = s.replace(/(?:周|星期|礼拜)([一二三四五六日天末])/g, (_, d) => DAYS[lang][WEEK[d]]);
  s = s.replace(/每天|每日|天天/g, DAILY[lang]).replace(/(营业|營業|时间|時間)/g, '');
  s = s.replace(/\s*(至|到|~|－)\s*/g, '–').replace(/(\d)\s*-\s*(\d)/g, '$1–$2').replace(/[;；]/g, '; ').replace(/[,，、]/g, ', ');
  s = s.replace(/[\p{Script=Han}]+/gu, '').replace(/\s{2,}/g, ' ').trim();
  return s || null;
}

/** Есть ли в строке иероглифы — значит, правила не справились (такое поле можно отдать машинному переводу). */
export const hasHan = (s) => [...String(s || '')].some(isHan);
