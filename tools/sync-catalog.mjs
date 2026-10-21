#!/usr/bin/env node
// Каталог программ для приложения — из данных сайта globaltechtour.ru (репозиторий Ostap-87/SINOTECH).
// Запуск: node tools/sync-catalog.mjs [путь к клону SINOTECH]  (по умолчанию ../sinotech рядом с GTT-APP)
// Результат: mobile/src/data/catalog.json — только то, что показывает приложение. Цен в нём нет (правило репозитория).
// Заодно — регионы 9 стран и города с координатами для карты маршрута, те же, что на сайте (mobile/src/data/geo/).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sinotech = resolve(process.argv[2] || process.env.SINOTECH_DIR || join(root, '..', 'sinotech'));
const tours = JSON.parse(readFileSync(join(sinotech, 'src/data/tours.json'), 'utf8')).tours;
const companiesRaw = JSON.parse(readFileSync(join(sinotech, 'src/data/companies.json'), 'utf8'));

// Компании лежат вложенно (страны → регионы → …): собираем id → название
const names = new Map();
(function walk(o) {
  if (Array.isArray(o)) { o.forEach(walk); return; }
  if (o && typeof o === 'object') {
    if (o.id && o.name_en) names.set(o.id, o.name_ru || o.name_en);
    Object.values(o).forEach(walk);
  }
})(companiesRaw);

const cleanCity = (c) => c.replace(/\s*\(.*?\)\s*/g, '').replace(/\s*—\s*(вылет|финал)/g, '').trim();
const out = tours.map((t) => {
  const cities = [];
  const companies = [];
  for (const day of t.itinerary || []) {
    for (const part of String(day.city_ru || '').replace(/,.*$/, '').split(/→|\//)) {
      const c = cleanCity(part);
      if (c && c !== 'вылет' && !cities.includes(c)) cities.push(c);
    }
    for (const id of day.companies || []) {
      const n = names.get(id);
      if (n && !companies.includes(n)) companies.push(n);
    }
  }
  return {
    id: t.tour_id,
    country: t.country,
    sector: t.sector,
    title: t.title_ru,
    eyebrow: t.eyebrow_ru || '',
    positioning: (t.positioning_ru || '').trim(),
    days: t.stats?.days ?? null,
    nights: t.stats?.nights ?? null,
    companiesCount: t.stats?.companies ?? companies.length,
    cities,
    companies,
    startDate: t.start_date || null,
    // маршрут по дням для карты: город (id из companies.json → cities) и как добрались (перелёт или поезд)
    route: (t.itinerary || []).filter((d) => d.city).map((d) => ({ day: d.day, city: d.city, ...(d.leg_mode ? { leg: d.leg_mode } : {}) })),
  };
});

const file = join(root, 'mobile/src/data/catalog.json');
writeFileSync(file, `${JSON.stringify(out, null, 1)}\n`);
console.log(`каталог: ${out.length} программ → ${file}`);

// Карта маршрута в приложении рисует те же регионы, что карта на сайте, — для всех 9 стран; города — с координатами сайта
const GEO = { cn: 'china', jp: 'japan', kr: 'korea', th: 'thailand', vn: 'vietnam', id: 'indonesia', in: 'india', my: 'malaysia', ae: 'uae' };
const geoDir = join(root, 'mobile/src/data/geo');
mkdirSync(geoDir, { recursive: true });
for (const [cc, name] of Object.entries(GEO)) writeFileSync(join(geoDir, `${cc}.json`), readFileSync(join(sinotech, `src/data/${name}-provinces.json`)));
const cities = companiesRaw.cities.map((c) => ({ id: c.id, ru: c.name_ru, en: c.name_en, lat: c.lat, lng: c.lng, country: c.country }));
writeFileSync(join(geoDir, 'cities.json'), `${JSON.stringify(cities)}\n`);
console.log(`регионы ${Object.keys(GEO).length} стран и ${cities.length} городов → ${geoDir}`);
