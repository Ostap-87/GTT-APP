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

// Компании сайта: id → название, иероглифы (для Китая), город и справка
const coById = new Map(companiesRaw.companies.map((c) => [c.id, c]));
const names = new Map(companiesRaw.companies.map((c) => [c.id, c.name_ru || c.name_en]));

const cleanCity = (c) => c.replace(/\s*\(.*?\)\s*/g, '').replace(/\s*—\s*(вылет|финал)/g, '').trim();
/** «Шанхай, день 1», «Гуанчжоу (финал)» → «Шанхай», «Гуанчжоу». */
const dayCity = (c) => cleanCity(c).replace(/,.*$/, '').split(/→|\//).map((x) => x.trim()).filter((x) => x && x !== 'вылет').pop() || '';
/** Справка о компании для демо — первые одно-два предложения описания с сайта. */
function short(text) {
  const parts = String(text || '').trim().split(/(?<=[.!?])\s+(?=[А-ЯЁA-Z«"(0-9])/);
  let out = '';
  for (const p of parts) { if (out && `${out} ${p}`.length > 280) break; out = out ? `${out} ${p}` : p; }
  return out.length > 400 ? `${out.slice(0, 380).replace(/\s+\S*$/, '')}…` : out;
}
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
    arrival: t.arrival_ru || '',
    departure: t.departure_ru || '',
    // маршрут по дням: город (id из companies.json → cities), как добрались (перелёт или поезд), время визитов, компании,
    // переезд и примечание дня — из этого приложение собирает демо-поездку делегата по любой программе
    route: (t.itinerary || []).filter((d) => d.city).map((d) => ({
      day: d.day, city: d.city, ru: dayCity(d.city_ru || ''), area: d.area_ru || '', time: d.time || '',
      co: (d.companies || []).filter((id) => coById.has(id)),
      ...(d.leg_mode ? { leg: d.leg_mode } : {}), ...(d.transfer_ru ? { tr: d.transfer_ru } : {}), ...(d.note_ru ? { note: d.note_ru } : {}),
    })),
  };
});

const file = join(root, 'mobile/src/data/catalog.json');
writeFileSync(file, `${JSON.stringify(out, null, 1)}\n`);
console.log(`каталог: ${out.length} программ → ${file}`);

// Компании программ для демо-поездки: название, иероглифы (только Китай — для водителя), город, короткая справка с сайта
const used = new Set(out.flatMap((t) => t.route.flatMap((r) => r.co)));
const coOut = {};
for (const id of [...used].sort()) {
  const c = coById.get(id);
  coOut[id] = { n: c.name_ru || c.name_en, ...(c.country === 'cn' && c.name_zh ? { zh: c.name_zh } : {}), c: c.city || '', d: short(c.desc_ru) };
}
const coFile = join(root, 'mobile/src/data/companies.json');
writeFileSync(coFile, `${JSON.stringify(coOut)}\n`);
console.log(`компании программ: ${used.size} → ${coFile}`);

// Карта маршрута в приложении рисует те же регионы, что карта на сайте, — для всех 9 стран; города — с координатами сайта
const GEO = { cn: 'china', jp: 'japan', kr: 'korea', th: 'thailand', vn: 'vietnam', id: 'indonesia', in: 'india', my: 'malaysia', ae: 'uae' };
const geoDir = join(root, 'mobile/src/data/geo');
mkdirSync(geoDir, { recursive: true });
for (const [cc, name] of Object.entries(GEO)) writeFileSync(join(geoDir, `${cc}.json`), readFileSync(join(sinotech, `src/data/${name}-provinces.json`)));
const cities = companiesRaw.cities.map((c) => ({ id: c.id, ru: c.name_ru, en: c.name_en, lat: c.lat, lng: c.lng, country: c.country }));
writeFileSync(join(geoDir, 'cities.json'), `${JSON.stringify(cities)}\n`);
console.log(`регионы ${Object.keys(GEO).length} стран и ${cities.length} городов → ${geoDir}`);
