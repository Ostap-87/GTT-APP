// Какая поездка открыта в демо делегата (решение 21.10.2026): подробное демо «Новый ритейл Китая» или любая из программ
// сайта, собранная data/demo-trip.ts. Данные поездки лежат в модулях trip / group / route / extras — здесь они
// заменяются на месте, после чего приложение пересобирает экраны (_layout.tsx, ключ gen).
import { buildTrip, programById, type TripData } from './demo-trip';
import { FOLLOW_COMPANIES, GUIDE, PLACES, PLACES_CITY } from './extras';
import { LEGS as COORD_LEGS, PAST_LEGS, VISITS } from './group';
import { refreshMind } from './mindmap';
import { LEGS, STOPS, refreshRoute } from './route';
import {
  CHECKLIST, CITY, CONTACTS, CULTURE, DAYS, DAY_NOTES, EVENTS, HOTELS, HOTEL_BY_DAY, MATERIALS, MEALS, MEAL_ADDR, PINNED, TRIP, WEATHER,
} from './trip';

const fill = <T,>(a: T[], b: T[]) => { a.splice(0, a.length, ...b); };
const put = <T,>(o: Record<string, T>, b: Record<string, T>) => { for (const k of Object.keys(o)) delete o[k]; Object.assign(o, b); };
const copy = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

/** Подробное демо в том виде, в каком оно в коде, — чтобы к нему можно было вернуться. */
const DETAILED = copy({
  trip: TRIP, days: DAYS, city: CITY, weather: WEATHER, hotels: HOTELS, hotelByDay: HOTEL_BY_DAY, dayNotes: DAY_NOTES, meals: MEALS,
  mealAddr: MEAL_ADDR, culture: CULTURE, events: EVENTS, contacts: CONTACTS, pinned: PINNED, materials: MATERIALS, checklist: CHECKLIST,
  visits: VISITS, coordLegs: COORD_LEGS, pastLegs: PAST_LEGS, stops: STOPS, legs: LEGS, guide: GUIDE, placesCity: PLACES_CITY.ru,
  follow: FOLLOW_COMPANIES, places: PLACES,
});
type Data = TripData & { places?: typeof PLACES };

/** Открыть в демо программу сайта по id; пусто или неизвестный id — подробное демо. Возвращает, что открыто. */
export function applyTrip(programId?: string | null): string {
  const p = programId ? programById(programId) : undefined;
  const d: Data = p ? buildTrip(p) : copy(DETAILED);
  Object.assign(TRIP, d.trip);
  fill(DAYS, d.days); fill(CITY, d.city); fill(WEATHER, d.weather); fill(HOTEL_BY_DAY, d.hotelByDay); fill(DAY_NOTES, d.dayNotes);
  put(HOTELS, d.hotels); put(MEALS, d.meals); put(MEAL_ADDR, d.mealAddr); put(CULTURE, d.culture);
  fill(EVENTS, d.events); fill(CONTACTS, d.contacts); fill(PINNED, d.pinned); fill(MATERIALS, d.materials); fill(CHECKLIST, d.checklist);
  fill(VISITS, d.visits); fill(COORD_LEGS, d.coordLegs); fill(PAST_LEGS, d.pastLegs);
  fill(STOPS, d.stops); fill(LEGS, d.legs);
  Object.assign(GUIDE, d.guide); PLACES_CITY.ru = d.placesCity; fill(FOLLOW_COMPANIES, d.follow);
  const places = d.places || { shop: [], night: [], store: [], wc: [] };
  for (const k of Object.keys(PLACES) as (keyof typeof PLACES)[]) fill(PLACES[k], places[k]);
  refreshRoute();
  refreshMind();
  return p ? p.id : '';
}

/** Открыто подробное демо (с отелями, ресторанами, культурной программой и примером заметок). */
export const isDetailed = () => !TRIP.programId;
