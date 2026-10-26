// Модуль «Рядом» (src/amap): транслитерация, перевод названий и адресов, координаты, ответ Amap, кэш, API.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { hanLatin, hanRu, latinPinyinRu, syllableRu } from '../src/amap/translit.js';
import { translateAddress, translateHours, translateName } from '../src/amap/translate.js';
import { distanceM, gcjToWgs, outOfChina, wgsToGcj } from '../src/amap/coords.js';
import { AmapError, aroundSearch, normalize } from '../src/amap/client.js';
import { createNearby, rateLimiter } from '../src/amap/index.js';
import { loadConfig } from '../src/config.js';
import { Store } from '../src/store.js';
import { WeChatClient } from '../src/wechat/client.js';
import { createApp } from '../src/app.js';

test('Палладий: слоги и города', () => {
  const syl = { zhi: 'чжи', zi: 'цзы', si: 'сы', ju: 'цзюй', xuan: 'сюань', jun: 'цзюнь', lv: 'люй', hui: 'хуэй', guo: 'го', you: 'ю', wei: 'вэй', er: 'эр' };
  for (const [k, v] of Object.entries(syl)) assert.equal(syllableRu(k), v, k);
  const city = { 上海: 'Шанхай', 广州: 'Гуанчжоу', 深圳: 'Шэньчжэнь', 杭州: 'Ханчжоу', 成都: 'Чэнду', 重庆: 'Чунцин', 厦门: 'Сямэнь', 天津: 'Тяньцзинь', 青岛: 'Циндао', 长沙: 'Чанша', 同仁堂: 'Тунжэньтан', 绿园: 'Люйюань', 大厦: 'Даша' };
  for (const [k, v] of Object.entries(city)) assert.equal(hanRu(k), v, k);
  assert.equal(hanLatin('西安'), "Xi'an");
  assert.equal(latinPinyinRu('Dashenlin'), 'Дашэньлинь');
  assert.equal(latinPinyinRu('Tong Ren Tang'), 'Тунжэньтан');
  assert.equal(latinPinyinRu('LBX Pharmacy'), null);
});

test('Названия: сети по словарю, тип, филиал — на четырёх языках', () => {
  const n = (zh, lang) => { const r = translateName(zh, lang, { kind: 'pharmacy' }); return r.branch ? `${r.text} · ${r.branch}` : r.text; };
  assert.equal(n('老百姓大药房(南京东路店)', 'ru'), 'Аптека «Лаобайсин (LBX)» · ул. Наньцзин Дун');
  assert.equal(n('老百姓大药房(南京东路店)', 'en'), 'LBX Pharmacy · Nanjing East Rd');
  assert.equal(n('老百姓大药房(南京东路店)', 'uz'), 'LBX dorixonasi · Nanjing Dong koʻchasi');
  assert.equal(n('同仁堂（王府井店）', 'kk'), 'Дәріхана «Тунжэньтан» · Ванфуцзин');
  assert.equal(n('国大药房（24小时店）', 'ru'), 'Аптека «Года» · круглосуточно');
  assert.equal(n('幸福大药房', 'ru'), 'Аптека «Синфу»');
  assert.equal(translateName('鲜丰水果（文三路店）', 'ru', { kind: 'fruit' }).text, 'Фрукты «Сяньфэн»');
  assert.equal(translateName('百果园(人民路店)', 'en', { kind: 'fruit' }).chain.id, 'pagoda');
});

test('Адреса и часы работы', () => {
  assert.equal(translateAddress('黄浦区南京东路99号', 'ru'), 'р-н Хуанпу, ул. Наньцзин Дун, 99');
  assert.equal(translateAddress('黄浦区南京东路99号', 'en'), 'Huangpu District, Nanjing East Rd, No. 99');
  assert.equal(translateAddress('长沙市芙蓉区五一大道389号', 'ru'), 'Чанша, р-н Фужун, просп. Уи, 389');
  assert.equal(translateAddress('朝阳区建国路93号万达广场1层', 'ru'), 'р-н Чаоян, ул. Цзяньго, 93, Ваньда Плаза, 1 эт.');
  assert.equal(translateAddress('中山北路1088弄12号', 'ru'), 'ул. Чжуншань Бэй, пер. 1088, 12');
  assert.equal(translateAddress('地铁2号线人民广场站3号出口附近', 'ru'), 'метро, линия 2, ст. Жэньминьгуанчан, выход 3, рядом');
  assert.equal(translateAddress('望京SOHO T1 B1层', 'ru'), 'Ванцзин, SOHO T1, эт. −1');
  assert.equal(translateHours('24小时营业', 'ru'), 'круглосуточно');
  assert.equal(translateHours('周一至周五 09:00-21:00；周六至周日 10:00-20:00', 'ru'), 'пн–пт 09:00–21:00; сб–вс 10:00–20:00');
  assert.equal(translateHours('每天 07:30-23:00', 'en'), 'daily 07:30–23:00');
});

test('Координаты: сдвиг GCJ-02 в Китае, обратный пересчёт, Москва без сдвига', () => {
  const [lng, lat] = [116.397428, 39.90923]; // площадь Тяньаньмэнь
  const [glng, glat] = wgsToGcj(lng, lat);
  const shift = distanceM(lng, lat, glng, glat);
  assert.ok(shift > 100 && shift < 700, `сдвиг ${shift} м`);
  const [blng, blat] = gcjToWgs(glng, glat);
  assert.ok(distanceM(lng, lat, blng, blat) < 1);
  assert.ok(outOfChina(37.6173, 55.7558));
  assert.deepEqual(wgsToGcj(37.6173, 55.7558), [37.6173, 55.7558]);
});

test('Сети в chains.json совпадают с приложением (mobile/src/data/shops.ts)', () => {
  const chains = JSON.parse(readFileSync(new URL('../src/amap/data/chains.json', import.meta.url), 'utf8'));
  const src = readFileSync(new URL('../../mobile/src/data/shops.ts', import.meta.url), 'utf8');
  const inApp = [...src.matchAll(/id: '([^']+)', zh: '([^']+)', lat: '([^']+)'/g)].map((m) => m[1]).sort();
  assert.deepEqual(chains.map((c) => c.id).sort(), inApp, 'добавили сеть в приложение — запустите python3 tools/amap-data.py --chains-only');
});

// Ответ Amap в формате «搜索POI 2.0» (вымышленные места)
const AMAP_REPLY = {
  status: '1', info: 'OK', infocode: '10000', count: '2',
  pois: [
    {
      name: '同仁堂(王府井店)', id: 'B0FFTEST02', location: '116.410000,39.913000', type: '医疗保健服务;医药保健销售店;药房', typecode: '090601',
      pname: '北京市', cityname: '北京市', adname: '东城区', address: '王府井大街1号',
      business: { opentime_today: '09:00-21:00', opentime_week: '周一至周日 09:00-21:00', tel: '010-00000000', rating: '4.8', tag: [] },
      photos: [{ title: [], url: 'http://store.is.autonavi.com/showpic/test' }],
    },
    {
      name: '老百姓大药房(东单店)', id: 'B0FFTEST01', location: '116.404000,39.910500', type: '医疗保健服务;医药保健销售店;药房', typecode: '090601',
      pname: '北京市', cityname: '北京市', adname: '东城区', address: '东单北大街8号',
      business: { opentime_today: '24小时营业', tel: [], rating: [], tag: '医保定点' }, photos: [],
    },
  ],
};

test('Запрос к Amap: параметры, разбор ответа, ошибка лимита', async () => {
  let url = '';
  const pois = await aroundSearch({ key: 'K', location: [116.4, 39.91], types: '090601', fetchImpl: async (u) => { url = u; return { ok: true, json: async () => AMAP_REPLY }; } });
  const q = new URL(url).searchParams;
  assert.equal(q.get('key'), 'K');
  assert.equal(q.get('location'), '116.400000,39.910000');
  assert.equal(q.get('types'), '090601');
  assert.equal(q.get('show_fields'), 'business,photos');
  const p = normalize(pois[1]);
  assert.deepEqual([p.tel, p.rating, p.hoursToday], [[], null, '24小时营业']);
  await assert.rejects(
    aroundSearch({ key: 'K', location: [116.4, 39.91], fetchImpl: async () => ({ ok: true, json: async () => ({ status: '0', info: 'DAILY_QUERY_OVER_LIMIT', infocode: '10003' }) }) }),
    (err) => err instanceof AmapError && err.code === 10003,
  );
});

test('Сервис: перевод, сортировка по расстоянию, кэш, демо-режим', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls += 1; return { ok: true, json: async () => AMAP_REPLY }; };
  const nb = createNearby({ key: 'K', fetchImpl });
  const r = await nb.search({ kind: 'pharmacy', lat: 39.9098, lng: 116.3974, lang: 'ru', coord: 'gcj02' });
  assert.equal(r.source, 'amap');
  assert.deepEqual(r.items.map((x) => x.id), ['B0FFTEST01', 'B0FFTEST02']);
  const [a, b] = r.items;
  assert.equal(a.name, 'Аптека «Лаобайсин (LBX)»');
  assert.equal(a.branch, 'Дундань');
  assert.equal(a.address, 'р-н Дунчэн, ул. Дундань Бэй, 8');
  assert.equal(a.open24, true);
  assert.equal(a.hours, 'круглосуточно');
  assert.equal(a.tag, null); // «医保定点» без машинного перевода не показываем
  assert.equal(a.zh.name, '老百姓大药房(东单店)');
  assert.match(a.links.amap, /^https:\/\/uri\.amap\.com\/marker\?position=116\.404000,39\.910500/);
  assert.equal(b.hours, '09:00–21:00');
  assert.deepEqual(b.tel, ['010-00000000']);
  await nb.search({ kind: 'pharmacy', lat: 39.9098, lng: 116.3974, lang: 'en', coord: 'gcj02' });
  assert.equal(calls, 1, 'второй запрос рядом — из кэша');

  const demo = createNearby({});
  const d = await demo.search({ kind: 'fruit', lat: 31.2304, lng: 121.4737, lang: 'uz' });
  assert.equal(d.source, 'demo');
  assert.ok(d.items.length >= 3 && d.items.every((x) => x.demo));
  await assert.rejects(demo.search({ kind: 'pharmacy', lat: 55.75, lng: 37.62 }), (e) => e.code === 'out_of_china');
});

test('Ограничение частоты по IP', () => {
  let t = 0;
  const ok = rateLimiter({ limit: 2, now: () => t });
  assert.deepEqual([ok('a'), ok('a'), ok('a'), ok('b')], [true, true, false, true]);
  t = 61e3;
  assert.equal(ok('a'), true);
});

test('API /api/nearby: демо, CORS, ошибки', async () => {
  const cfg = loadConfig({ WX_MOCK: '1', DATA_DIR: mkdtempSync(path.join(tmpdir(), 'gtt-nb-')) });
  const store = new Store(cfg);
  const wx = new WeChatClient({ ...cfg.wx, mock: true });
  const server = createServer(createApp({ cfg, store, wx, pay: null, bot: { send: async () => true } }));
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    let res = await fetch(`${base}/api/nearby?kind=pharmacy&lat=31.2304&lng=121.4737&lang=kk`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), '*');
    const data = await res.json();
    assert.equal(data.source, 'demo');
    assert.match(data.items[0].name, /^Дәріхана/);
    res = await fetch(`${base}/api/nearby?kind=pharmacy&lat=55.75&lng=37.62`);
    assert.equal(res.status, 400);
    res = await fetch(`${base}/api/nearby?kind=bank&lat=31.2&lng=121.4`);
    assert.equal((await res.json()).error, 'bad_kind');
    res = await fetch(`${base}/api/nearby`, { method: 'OPTIONS' });
    assert.equal(res.headers.get('access-control-allow-headers'), 'x-app-token');
  } finally {
    server.close();
  }
});
