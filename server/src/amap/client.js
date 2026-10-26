// Запросы к Amap Web API «搜索POI 2.0» (https://lbs.amap.com/api/webservice/guide/api-advanced/newpoisearch):
// поиск вокруг точки (/v5/place/around). Ключ — тип «Web服务», только из переменной окружения AMAP_KEY.
// Ответ Amap — по-китайски (английский — платная услуга по заявке, русского нет), перевод делает translate.js.

export const AMAP_URL = 'https://restapi.amap.com/v5/place/around';

// Коды ошибок Amap (错误码说明) → понятный текст для журнала сервера
const INFOCODE = {
  10001: 'ключ Amap неверный (INVALID_USER_KEY)',
  10003: 'исчерпан дневной лимит запросов (DAILY_QUERY_OVER_LIMIT)',
  10004: 'слишком частые запросы (ACCESS_TOO_FREQUENT)',
  10005: 'IP сервера не в белом списке ключа (INVALID_USER_IP)',
  10009: 'ключ не того типа: нужен «Web服务» (USERKEY_PLAT_NOMATCH)',
  10044: 'исчерпан месячный лимит (USER_DAILY_QUERY_OVER_LIMIT)',
  20000: 'неверные параметры запроса (INVALID_PARAMS)',
};

export class AmapError extends Error {
  constructor(code, info) {
    super(INFOCODE[code] || `Amap: ${info || code}`);
    this.code = Number(code);
  }
}

/**
 * Места вокруг точки. location — [lng, lat] в GCJ-02. Возвращает массив POI Amap как есть (поля — ниже в normalize).
 * fetchImpl подменяется в тестах.
 */
export async function aroundSearch({ key, location, types, keywords, radius = 1500, pageSize = 20, fetchImpl = fetch, timeoutMs = 6000 }) {
  const qs = new URLSearchParams({
    key,
    location: `${location[0].toFixed(6)},${location[1].toFixed(6)}`,
    radius: String(Math.min(Math.max(radius, 100), 50000)),
    sortrule: 'distance',
    page_size: String(Math.min(pageSize, 25)),
    page_num: '1',
    show_fields: 'business,photos',
  });
  if (types) qs.set('types', types);
  if (keywords) qs.set('keywords', keywords);
  const res = await fetchImpl(`${AMAP_URL}?${qs}`, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new AmapError(res.status, `HTTP ${res.status}`);
  const data = await res.json();
  if (String(data.status) !== '1') throw new AmapError(data.infocode, data.info);
  return data.pois || [];
}

const num = (v) => (v === undefined || v === null || v === '' || Array.isArray(v) ? null : Number(v));
const str = (v) => (typeof v === 'string' ? v.trim() : '');

/** POI Amap → плоский объект: координаты GCJ-02 числами, бизнес-поля без пустых массивов (Amap отдаёт [] вместо пустой строки). */
export function normalize(poi) {
  const [lng, lat] = str(poi.location).split(',').map(Number);
  const b = poi.business || {};
  return {
    id: str(poi.id),
    name: str(poi.name),
    typecode: str(poi.typecode).split('|')[0],
    type: str(poi.type),
    address: str(poi.address),
    province: str(poi.pname),
    city: str(poi.cityname),
    district: str(poi.adname),
    lng,
    lat,
    distance: num(poi.distance),
    tel: str(b.tel).split(/[;；,，]/).map((x) => x.trim()).filter(Boolean),
    hoursToday: str(b.opentime_today),
    hoursWeek: str(b.opentime_week),
    rating: num(b.rating),
    cost: num(b.cost),
    tag: str(b.tag) || str(b.keytag),
    photo: (Array.isArray(poi.photos) && poi.photos[0]?.url) || null,
  };
}
