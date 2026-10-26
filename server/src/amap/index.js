// Модуль «Рядом»: ближайшие аптеки, фруктовые лавки, супермаркеты по данным Amap — уже переведённые на язык делегата.
// Встраивается в любой Node-сервер без зависимостей: createNearby() + mountNearby(route) (см. README.md рядом).
// Без ключа AMAP_KEY работает в демо-режиме: вымышленные места вокруг точки (source: 'demo') — чтобы приложение
// можно было собрать, показать и проверить до получения ключа.
import { aroundSearch, normalize } from './client.js';
import { distanceM, gcjToWgs, outOfChina, wgsToGcj } from './coords.js';
import { createTranslator } from './mt.js';
import { LANGS, TYPE_WORD, hasHan, translateAddress, translateHours, translateName } from './translate.js';

/** Что искать: типы — коды категорий Amap (таблица POI分类编码, data/poi-types.json), keywords — слово поиска. */
export const KINDS = {
  pharmacy: { types: '090601' },
  fruit: { keywords: '水果', exclude: /^05/ }, // без кафе и чайных с «水果» в названии (категория 05 — 餐饮)
  supermarket: { types: '060400' },
  convenience: { types: '060200' },
};

const TYPE_BY_CODE = [[/^090601/, 'pharmacy'], [/^060704/, 'fruitMarket'], [/^0604/, 'supermarket'], [/^0602/, 'convenience'], [/^0607/, 'market']];
const typeLabel = (code, lang) => {
  const t = TYPE_BY_CODE.find(([re]) => re.test(code))?.[1];
  return t ? TYPE_WORD[t][lang === 'uz' ? 'en' : lang] : null;
};

const DEMO = {
  pharmacy: [
    ['老百姓大药房(人民路店)', '人民路88号', 0.0021, 0.0012, '08:00-22:00', 4.6],
    ['国大药房(24小时店)', '中山路16号', -0.0035, 0.0018, '24小时', 4.4],
    ['同仁堂(解放路店)', '解放路1号', 0.0042, -0.0031, '09:00-21:00', 4.8],
    ['益丰大药房(人民广场店)', '地铁1号线人民广场站2号出口附近', -0.0052, -0.0044, '周一至周日 08:30-22:30', null],
    ['幸福大药房', '建设路102号底商', 0.0071, 0.0049, '08:00-21:30', 4.2],
  ],
  fruit: [
    ['百果园(人民路店)', '人民路90号', 0.0019, 0.0014, '08:00-23:00', 4.7],
    ['鲜丰水果(中山路店)', '中山路20号', -0.0031, 0.0021, '07:30-23:30', 4.5],
    ['新鲜水果店', '解放路5号', 0.0047, -0.0028, '06:00-22:00', null],
    ['人民路果品市场', '人民路200号', -0.0066, 0.0052, '05:00-19:00', 4.1],
  ],
};
function demoPois(kind, lng, lat) {
  return (DEMO[kind] || DEMO.pharmacy).map(([name, address, dx, dy, hours, rating], i) => ({
    id: `demo-${kind}-${i}`, name, address, typecode: kind === 'fruit' ? (name.includes('市场') ? '060704' : '060100') : '090601',
    type: '', province: '', city: '', district: '', lng: lng + dx, lat: lat + dy, distance: null, tel: [],
    hoursToday: hours, hoursWeek: '', rating, cost: null, tag: '', photo: null, demo: true,
  }));
}

const amapLink = (p) => `https://uri.amap.com/marker?position=${p.lng.toFixed(6)},${p.lat.toFixed(6)}&name=${encodeURIComponent(p.name)}&coordinate=gaode&callnative=1&src=gtt`;
const routeLink = (p) => `https://uri.amap.com/navigation?to=${p.lng.toFixed(6)},${p.lat.toFixed(6)},${encodeURIComponent(p.name)}&mode=walk&coordinate=gaode&callnative=1&src=gtt`;

export function createNearby({ key = '', mt = {}, log = () => {}, fetchImpl = fetch, ttlMs = 6 * 3600e3, maxEntries = 2000, now = Date.now } = {}) {
  const cache = new Map();
  const translator = createTranslator({ ...mt, fetchImpl, log });

  async function places(kind, glng, glat, radius) {
    const ck = `${kind}|${glng.toFixed(3)}|${glat.toFixed(3)}|${radius}`;
    const hit = cache.get(ck);
    if (hit && now() - hit.at < ttlMs) return { pois: hit.pois, cached: true };
    const k = KINDS[kind];
    let pois = key
      ? (await aroundSearch({ key, location: [glng, glat], types: k.types, keywords: k.keywords, radius, fetchImpl })).map(normalize)
      : demoPois(kind, glng, glat);
    if (k.exclude) pois = pois.filter((p) => !k.exclude.test(p.typecode));
    if (cache.size >= maxEntries) cache.delete(cache.keys().next().value);
    cache.set(ck, { at: now(), pois });
    return { pois, cached: false };
  }

  /**
   * kind — pharmacy | fruit | supermarket | convenience; lat/lng — где человек; coord — wgs84 (GPS, по умолчанию) или gcj02;
   * lang — ru | en | kk | uz. Ответ — места по удалённости, всё уже на языке lang; китайский оригинал — в zh.
   */
  async function search({ kind = 'pharmacy', lat, lng, coord = 'wgs84', radius = 1500, lang = 'ru' }) {
    if (!KINDS[kind]) throw Object.assign(new Error(`kind: ${Object.keys(KINDS).join(' | ')}`), { code: 'bad_kind' });
    if (!LANGS.includes(lang)) lang = 'ru';
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      throw Object.assign(new Error('нужны lat и lng'), { code: 'bad_location' });
    }
    if (outOfChina(lng, lat)) throw Object.assign(new Error('точка за пределами Китая — Amap там не работает'), { code: 'out_of_china' });
    const [glng, glat] = coord === 'gcj02' ? [lng, lat] : wgsToGcj(lng, lat);
    const { pois, cached } = await places(kind, glng, glat, radius);

    const items = pois.map((p) => {
      const name = translateName(p.name, lang, { kind });
      const district = p.district && !p.address.startsWith(p.district) ? p.district : '';
      const addrZh = `${district}${p.address}`;
      const distance = distanceM(glng, glat, p.lng, p.lat);
      const [wlng, wlat] = gcjToWgs(p.lng, p.lat);
      const hoursZh = p.hoursToday || p.hoursWeek;
      return {
        id: p.id,
        name: name.text,
        branch: name.branch || null,
        chain: name.chain?.id || null,
        type: typeLabel(p.typecode, lang),
        address: translateAddress(addrZh, lang) || null,
        hours: translateHours(hoursZh, lang),
        open24: /24小[时時]|00:00\s*-\s*24:00/.test(hoursZh),
        tel: p.tel,
        rating: p.rating,
        cost: p.cost,
        photo: p.photo,
        tag: p.tag && !hasHan(p.tag) ? p.tag : null,
        tagZh: p.tag || null,
        distance,
        walkMin: Math.max(1, Math.round(distance / 75)), // ~4,5 км/ч
        zh: { name: p.name, address: addrZh, city: p.city },
        location: { gcj02: [p.lng, p.lat], wgs84: [+wlng.toFixed(6), +wlat.toFixed(6)] },
        links: { amap: amapLink(p), route: routeLink(p) },
        ...(p.demo ? { demo: true } : {}),
      };
    }).sort((a, b) => a.distance - b.distance);

    // Метки (например «可刷医保») — машинным переводом, если он включён; иначе метку не показываем
    if (translator.enabled) {
      const tr = await translator.translate(items.map((x) => (x.tagZh && !x.tag ? x.tagZh : '')), lang);
      items.forEach((x, i) => { if (tr[i]) x.tag = tr[i]; });
    }
    return { source: key ? 'amap' : 'demo', cached, kind, lang, center: { gcj02: [glng, glat] }, items };
  }

  return { search, demo: !key, kinds: Object.keys(KINDS) };
}

/** Простое ограничение частоты: не больше limit запросов в минуту с одного IP — чтобы чужие не съели лимит Amap. */
export function rateLimiter({ limit = 30, windowMs = 60e3, now = Date.now } = {}) {
  const hits = new Map();
  return (ip) => {
    const t = now();
    const list = (hits.get(ip) || []).filter((x) => t - x < windowMs);
    list.push(t);
    hits.set(ip, list);
    if (hits.size > 10000) hits.clear();
    return list.length <= limit;
  };
}
