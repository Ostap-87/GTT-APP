// Координаты: телефон и браузер дают WGS-84 (GPS), а карты Китая (Amap) работают в GCJ-02 — государственной системе
// со сдвигом 100–700 м. Без пересчёта аптека «уезжает» на соседнюю улицу. Формула — открытая общеизвестная аппроксимация
// (точность ~1 м); за пределами материкового Китая сдвига нет.
const A = 6378245.0;
const EE = 0.00669342162296594323;

export function outOfChina(lng, lat) {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

function tLat(x, y) {
  let r = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  r += ((20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2) / 3;
  r += ((20 * Math.sin(y * Math.PI) + 40 * Math.sin((y / 3) * Math.PI)) * 2) / 3;
  r += ((160 * Math.sin((y / 12) * Math.PI) + 320 * Math.sin((y * Math.PI) / 30)) * 2) / 3;
  return r;
}

function tLng(x, y) {
  let r = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  r += ((20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2) / 3;
  r += ((20 * Math.sin(x * Math.PI) + 40 * Math.sin((x / 3) * Math.PI)) * 2) / 3;
  r += ((150 * Math.sin((x / 12) * Math.PI) + 300 * Math.sin((x / 30) * Math.PI)) * 2) / 3;
  return r;
}

/** WGS-84 (GPS телефона) → GCJ-02 (Amap). */
export function wgsToGcj(lng, lat) {
  if (outOfChina(lng, lat)) return [lng, lat];
  let dLat = tLat(lng - 105, lat - 35);
  let dLng = tLng(lng - 105, lat - 35);
  const rad = (lat / 180) * Math.PI;
  let magic = Math.sin(rad);
  magic = 1 - EE * magic * magic;
  const sq = Math.sqrt(magic);
  dLat = (dLat * 180) / (((A * (1 - EE)) / (magic * sq)) * Math.PI);
  dLng = (dLng * 180) / ((A / sq) * Math.cos(rad) * Math.PI);
  return [lng + dLng, lat + dLat];
}

/** GCJ-02 → WGS-84 (обратный пересчёт итерациями, точность < 0,5 м) — для Apple/Google Карт за пределами Китая. */
export function gcjToWgs(lng, lat) {
  if (outOfChina(lng, lat)) return [lng, lat];
  let [x, y] = [lng, lat];
  for (let i = 0; i < 5; i += 1) {
    const [gx, gy] = wgsToGcj(x, y);
    x -= gx - lng;
    y -= gy - lat;
  }
  return [x, y];
}

/** Расстояние по прямой, метры. */
export function distanceM(lng1, lat1, lng2, lat2) {
  const R = 6371000;
  const r = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2
    + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lng2 - lng1) * r) / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}
