#!/usr/bin/env python3
"""Офлайн-карты городов для приложения: mobile/src/data/maps/<город>.json — метро (линии, станции), крупные дороги,
реки и водоёмы (и море по береговой линии), главные вокзалы и аэропорты.

  python3 tools/offline-maps.py [beijing shanghai ...] [--refresh] [--cache папка]

Зачем: в Китае нет Google, а онлайн-карты в роуминге работают не всегда, поэтому карта лежит в самом приложении.
Данные — OpenStreetMap через зеркало Overpass (maps.mail.ru; overpass-api.de и kumi.systems из облака закрыты).
Лицензия OpenStreetMap — ODbL: на карте обязательно показывать «© OpenStreetMap» (поле source в файле).
Ответы Overpass кэшируются (gzip) в папке --cache: повторный запуск не качает заново, --refresh — скачать снова.
Русские названия — тег OSM name:ru, иначе Палладий из server/src/amap/translit.js (нужен Node 20+).
Новый город — строка в CITIES: id, названия, рамка [minLng, minLat, maxLng, maxLat] (не только Китай: Токио, Бангкок…).
Только стандартная библиотека Python.

Формат: координата x = round((lng - minLng) * q), y = round((lat - minLat) * q), q = 100000.
Каждая линия и контур — плоский массив [x0, y0, dx1, dy1, dx2, dy2, ...]: первая точка абсолютная, дальше приращения
(x_i = x_{i-1} + dx_i). Контуры водоёмов замкнуты по смыслу (последняя точка не повторяет первую), крупные — первыми;
острова внутри водоёмов и моря не вырезаны. Станции, вокзалы и аэропорты — абсолютные x, y.
Обратно: lng = minLng + x / q, lat = minLat + y / q.
"""
import argparse, datetime, gzip, json, math, os, re, subprocess, sys, time, urllib.error, urllib.parse, urllib.request
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'mobile/src/data/maps'
TRANSLIT = ROOT / 'server/src/amap/translit.js'
OVERPASS = 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
SOURCE = '© OpenStreetMap contributors (ODbL)'
Q = 100000

# Города. bbox — [minLng, minLat, maxLng, maxLat]. routes — какие маршруты OSM считать метро
# (для Токио, например, можно добавить 'train', чтобы попала JR Yamanote).
CITIES = [
    # север чуть выше 40.06 — чтобы попал аэропорт Шоуду (терминалы 2 и 3)
    dict(id='beijing', ru='Пекин', zh='北京', en='Beijing', bbox=[116.20, 39.75, 116.62, 40.09]),
    dict(id='shanghai', ru='Шанхай', zh='上海', en='Shanghai', bbox=[121.30, 31.10, 121.66, 31.35]),
    # запад чуть дальше 113.85 — чтобы попал аэропорт Баоань
    dict(id='shenzhen', ru='Шэньчжэнь', zh='深圳', en='Shenzhen', bbox=[113.78, 22.48, 114.26, 22.66]),
    dict(id='hangzhou', ru='Ханчжоу', zh='杭州', en='Hangzhou', bbox=[120.00, 30.15, 120.32, 30.36]),
    # юг ниже 23.05 — чтобы попал вокзал Гуанчжоу-Южный (скоростные поезда)
    dict(id='guangzhou', ru='Гуанчжоу', zh='广州', en='Guangzhou', bbox=[113.20, 22.97, 113.45, 23.20]),
]

# Допуски упрощения Дугласа–Пекера, м
TOL = {'metro': 12, 'road': 25, 'water': 20}
MIN_WATER_AREA = 50000  # м², 0,05 км²
PALETTE = ['#E4002B', '#0072CE', '#00A651', '#F7A800', '#7B2D8E', '#00A0B0', '#F15A22', '#8DC63F', '#EC008C',
           '#6D6E71', '#A6192E', '#003DA5', '#B5A100', '#5B3A29']
CSS = {'red': '#FF0000', 'green': '#008000', 'blue': '#0000FF', 'yellow': '#FFFF00', 'orange': '#FFA500',
       'purple': '#800080', 'brown': '#A52A2A', 'pink': '#FFC0CB', 'gray': '#808080', 'grey': '#808080',
       'black': '#000000', 'white': '#FFFFFF', 'cyan': '#00FFFF', 'magenta': '#FF00FF', 'lime': '#00FF00',
       'navy': '#000080', 'teal': '#008080', 'maroon': '#800000', 'olive': '#808000', 'gold': '#FFD700',
       'violet': '#EE82EE', 'skyblue': '#87CEEB', 'lightblue': '#ADD8E6', 'darkblue': '#00008B',
       'darkgreen': '#006400', 'lightgreen': '#90EE90', 'darkred': '#8B0000', 'silver': '#C0C0C0',
       'beige': '#F5F5DC', 'turquoise': '#40E0D0', 'indigo': '#4B0082', 'khaki': '#F0E68C'}


# ---------------------------------------------------------------- Overpass

def overpass(query, cache, refresh, retries=8):
    """Один запрос к Overpass (POST, поле data), ответ — JSON. Кэш — gzip; повторы с паузой: зеркало часто отвечает 504."""
    if cache.exists() and not refresh:
        with gzip.open(cache, 'rt', encoding='utf8') as f:
            return json.load(f)
    body = urllib.parse.urlencode({'data': query}).encode()
    last = None
    for attempt in range(retries + 1):
        if attempt:
            wait = min(90, 10 * 2 ** (attempt - 1))
            print(f'    повтор через {wait} с ({last})', file=sys.stderr)
            time.sleep(wait)
        t0 = time.time()
        try:
            req = urllib.request.Request(OVERPASS, data=body, headers={'User-Agent': 'GTT-APP offline-maps (OSM data)'})
            with urllib.request.urlopen(req, timeout=200) as r:
                raw = r.read()
            data = json.loads(raw)
            remark = data.get('remark') or ''
            if 'runtime error' in remark:
                raise RuntimeError(remark[:200])
        except (urllib.error.URLError, OSError, ValueError, RuntimeError) as e:
            last = f'{type(e).__name__}: {str(e)[:120]}'
            continue
        cache.parent.mkdir(parents=True, exist_ok=True)
        with gzip.open(cache, 'wt', encoding='utf8') as f:
            f.write(raw.decode('utf8'))
        print(f'    {len(raw) / 1e6:.1f} МБ за {time.time() - t0:.0f} с', file=sys.stderr)
        time.sleep(4)  # вежливость: следующий запрос не сразу
        return data
    raise SystemExit(f'Overpass не ответил: {last}')


def queries(city):
    w, s, e, n = city['bbox']
    b = f'{s},{w},{n},{e}'
    mx, my = (e - w) * 0.5, (n - s) * 0.5  # рамка с запасом: куски водоёмов и берега, уходящие за край
    eb = f'{s - my},{w - mx},{n + my},{e + mx}'
    routes = '|'.join(city.get('routes', ['subway', 'light_rail']))
    # Маленькие timeout и maxsize: загруженное зеркало пускает такие запросы в очередь охотнее
    # (иначе «Dispatcher_Client::request_read_and_idx::timeout»)
    h = lambda t, mb: f'[out:json][timeout:{t}][maxsize:{mb << 20}];'
    return {
        'metro': h(90, 128) + f'''
rel[route~"^({routes})$"]({b})->.r;
.r out body qt;
rel(br.r)[type=route_master];out body qt;
way(r.r);out geom qt;
node(r.r);out qt;''',
        'poi': h(60, 64) + f'''
(nwr[railway=station]({b});nwr[public_transport=station][subway=yes]({b});nwr[aeroway=aerodrome]({b}););
out tags center qt;''',
        'roads': h(120, 192) + f'''
way[highway~"^(motorway|trunk|primary)$"]({b});out geom qt;''',
        'water': h(120, 192) + f'''
way[waterway~"^(river|canal)$"]({b});out geom qt;
(way[natural=water]({b});way[waterway=riverbank]({b});way[landuse=reservoir]({b}););out geom qt;
(rel[type=multipolygon][natural=water]({b});rel[type=multipolygon][waterway=riverbank]({b});
 rel[type=multipolygon][landuse=reservoir]({b}););
out body qt;
way(r)({eb});out geom qt;
way[natural=coastline]({eb});out geom qt;''',
    }


def fetch(city, cache_dir, refresh):
    out = {}
    for name, q in queries(city).items():
        cache = cache_dir / f"{city['id']}-{name}.json.gz"
        if not cache.exists() or refresh:
            print(f"  Overpass: {city['id']} / {name}", file=sys.stderr)
        out[name] = overpass(q, cache, refresh)['elements']
    return out


# ---------------------------------------------------------------- геометрия (в метрах, локальная проекция города)

class Proj:
    """Равнопромежуточная проекция вокруг рамки: x — метры на восток от minLng, y — на север от minLat."""

    def __init__(self, bbox):
        self.w, self.s, self.e, self.n = bbox
        lat0 = math.radians((self.s + self.n) / 2)
        self.kx = 111320.0 * math.cos(lat0)
        self.ky = 110574.0
        self.W = (self.e - self.w) * self.kx
        self.H = (self.n - self.s) * self.ky

    def m(self, lng, lat):
        return ((lng - self.w) * self.kx, (lat - self.s) * self.ky)

    def q(self, p):
        """Метры → целые x, y формата (шаг 1e-5 градуса)."""
        return (round(p[0] / self.kx * Q), round(p[1] / self.ky * Q))

    def inside(self, p, pad=0.0):
        return -pad <= p[0] <= self.W + pad and -pad <= p[1] <= self.H + pad


def _seg_clip(a, b, W, H):
    """Liang–Barsky: часть отрезка a→b внутри [0,W]×[0,H] как (t0, t1) или None."""
    dx, dy = b[0] - a[0], b[1] - a[1]
    t0, t1 = 0.0, 1.0
    for p, q in ((-dx, a[0]), (dx, W - a[0]), (-dy, a[1]), (dy, H - a[1])):
        if p == 0:
            if q < 0:
                return None
        else:
            r = q / p
            if p < 0:
                if r > t1:
                    return None
                t0 = max(t0, r)
            else:
                if r < t0:
                    return None
                t1 = min(t1, r)
    return t0, t1


def clip_line(pts, W, H):
    """Ломаная → куски внутри рамки (точно по краю)."""
    runs, cur = [], []
    for a, b in zip(pts, pts[1:]):
        c = _seg_clip(a, b, W, H)
        if c is None or c[1] - c[0] <= 0 and (c[0] > 0 or c[1] < 1):
            if cur:
                runs.append(cur)
                cur = []
            continue
        t0, t1 = c
        p = a if t0 == 0 else (a[0] + t0 * (b[0] - a[0]), a[1] + t0 * (b[1] - a[1]))
        q = b if t1 == 1 else (a[0] + t1 * (b[0] - a[0]), a[1] + t1 * (b[1] - a[1]))
        if t0 > 0 or not cur:
            if cur:
                runs.append(cur)
            cur = [p]
        cur.append(q)
        if t1 < 1:
            runs.append(cur)
            cur = []
    if cur:
        runs.append(cur)
    return [r for r in runs if len(r) >= 2]


def clip_ring(ring, W, H):
    """Sutherland–Hodgman: замкнутый контур (без повтора первой точки) по рамке."""
    def cut(pts, inside, inter):
        out = []
        for i, cur in enumerate(pts):
            prev = pts[i - 1]
            if inside(cur):
                if not inside(prev):
                    out.append(inter(prev, cur))
                out.append(cur)
            elif inside(prev):
                out.append(inter(prev, cur))
        return out

    def ix(x):
        return lambda a, b: (x, a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]))

    def iy(y):
        return lambda a, b: (a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]), y)

    pts = ring
    for inside, inter in ((lambda p: p[0] >= 0, ix(0)), (lambda p: p[0] <= W, ix(W)),
                          (lambda p: p[1] >= 0, iy(0)), (lambda p: p[1] <= H, iy(H))):
        if not pts:
            break
        pts = cut(pts, inside, inter)
    return pts


def area(ring):
    return abs(sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(ring, ring[1:] + ring[:1]))) / 2


def length(pts):
    return sum(math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(pts, pts[1:]))


def dp(pts, tol):
    """Дуглас–Пекер (без рекурсии)."""
    if len(pts) < 3:
        return list(pts)
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    t2 = tol * tol
    while stack:
        i, j = stack.pop()
        ax, ay = pts[i]
        bx, by = pts[j]
        dx, dy = bx - ax, by - ay
        L2 = dx * dx + dy * dy
        best, bi = -1.0, -1
        for k in range(i + 1, j):
            px, py = pts[k]
            if L2 == 0:
                d2 = (px - ax) ** 2 + (py - ay) ** 2
            else:
                t = ((px - ax) * dx + (py - ay) * dy) / L2
                t = 0 if t < 0 else 1 if t > 1 else t
                d2 = (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2
            if d2 > best:
                best, bi = d2, k
        if best > t2:
            keep[bi] = True
            stack += [(i, bi), (bi, j)]
    return [p for p, k in zip(pts, keep) if k]


def dp_ring(ring, tol):
    if len(ring) < 4:
        return ring
    far = max(range(len(ring)), key=lambda k: (ring[k][0] - ring[0][0]) ** 2 + (ring[k][1] - ring[0][1]) ** 2)
    a = dp(ring[:far + 1], tol)
    b = dp(ring[far:] + [ring[0]], tol)
    return a[:-1] + b[:-1]


def densify(pts, step):
    out = [pts[0]]
    for a, b in zip(pts, pts[1:]):
        d = math.hypot(b[0] - a[0], b[1] - a[1])
        n = int(d // step)
        for k in range(1, n + 1):
            t = k / (n + 1)
            out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
        out.append(b)
    return out


def merge_ways(ways, directed=False):
    """Склейка путей OSM по общим концевым узлам: [(node_ids, points)] → [(node_ids, points)].
    Склеиваем только там, где сходятся ровно два конца (на перекрёстках линия рвётся)."""
    ends = defaultdict(list)
    for i, (nodes, _) in enumerate(ways):
        ends[nodes[0]].append(i)
        ends[nodes[-1]].append(i)
    used = [False] * len(ways)
    out = []
    for i in range(len(ways)):
        if used[i]:
            continue
        used[i] = True
        nodes, pts = list(ways[i][0]), list(ways[i][1])
        for _ in range(2):
            while nodes[0] != nodes[-1]:
                end = nodes[-1]
                if len(ends[end]) != 2:
                    break
                j = next((j for j in ends[end] if not used[j]), None)
                if j is None:
                    break
                n2, p2 = ways[j]
                if n2[0] == end:
                    nodes += n2[1:]
                    pts += p2[1:]
                elif directed:
                    break
                else:
                    nodes += n2[-2::-1]
                    pts += p2[-2::-1]
                used[j] = True
            if directed:
                # назад: ищем путь, который заканчивается в нашем начале
                while nodes[0] != nodes[-1]:
                    st = nodes[0]
                    j = next((j for j in ends[st] if not used[j] and ways[j][0][-1] == st), None)
                    if j is None or len(ends[st]) != 2:
                        break
                    n2, p2 = ways[j]
                    nodes = list(n2[:-1]) + nodes
                    pts = list(p2[:-1]) + pts
                    used[j] = True
                break
            nodes.reverse()
            pts.reverse()
        out.append((nodes, pts))
    return out


class Grid:
    """Сетка отрезков для «эта линия идёт рядом и параллельно уже нарисованной»."""

    def __init__(self, cell):
        self.cell = cell
        self.cells = defaultdict(list)

    def add(self, pts):
        c = self.cell
        for a, b in zip(pts, pts[1:]):
            L = math.hypot(b[0] - a[0], b[1] - a[1])
            if L == 0:
                continue
            seg = (a, b, (b[0] - a[0]) / L, (b[1] - a[1]) / L)
            for gx in range(int(min(a[0], b[0]) // c) - 1, int(max(a[0], b[0]) // c) + 2):
                for gy in range(int(min(a[1], b[1]) // c) - 1, int(max(a[1], b[1]) // c) + 2):
                    self.cells[(gx, gy)].append(seg)

    def near(self, p, ux, uy, dist, cos_min=0.9):
        lst = self.cells.get((int(p[0] // self.cell), int(p[1] // self.cell)))
        if not lst:
            return False
        d2 = dist * dist
        for a, b, vx, vy in lst:
            if abs(ux * vx + uy * vy) < cos_min:
                continue
            dx, dy = b[0] - a[0], b[1] - a[1]
            L2 = dx * dx + dy * dy
            t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2
            t = 0 if t < 0 else 1 if t > 1 else t
            if (p[0] - a[0] - t * dx) ** 2 + (p[1] - a[1] - t * dy) ** 2 <= d2:
                return True
        return False


def drop_parallel(polys, grid, dist, step, min_cover, min_keep):
    """Вторая нитка (встречная полоса, путь в обратную сторону, дублёр-«фуллер») не рисуется: участки ломаной,
    которые не короче min_cover м идут параллельно уже принятой линии ближе dist м, выкидываются.
    Возвращает оставшиеся куски (и добавляет их в grid)."""
    out = []
    for pts in sorted(polys, key=length, reverse=True):
        d = densify(pts, step)
        n = len(d)
        cov = [False] * n
        for i in range(n):
            a, b = d[max(0, i - 1)], d[min(n - 1, i + 1)]
            L = math.hypot(b[0] - a[0], b[1] - a[1])
            if L > 0:
                cov[i] = grid.near(d[i], (b[0] - a[0]) / L, (b[1] - a[1]) / L, dist)
        # короткие «совпадения» (перекрёсток, сближение) не в счёт
        i = 0
        while i < n:
            if cov[i]:
                j = i
                while j + 1 < n and cov[j + 1]:
                    j += 1
                if length(d[i:j + 1]) < min_cover:
                    for k in range(i, j + 1):
                        cov[k] = False
                i = j + 1
            else:
                i += 1
        i = 0
        while i < n:
            if not cov[i]:
                j = i
                while j + 1 < n and not cov[j + 1]:
                    j += 1
                piece = d[max(0, i - 1):min(n, j + 2)]  # с одной точкой «нахлёста», чтобы не было щели
                if length(piece) >= min_keep:
                    out.append(piece)
                    grid.add(piece)
                i = j + 1
            else:
                i += 1
    return out


def encode(proj, pts, closed=False):
    """Метры → [x0, y0, dx1, dy1, ...] (целые), без повторов соседних точек."""
    qs = []
    for p in pts:
        qp = proj.q(p)
        if not qs or qp != qs[-1]:
            qs.append(qp)
    if closed and len(qs) > 1 and qs[0] == qs[-1]:
        qs.pop()
    if len(qs) < (3 if closed else 2):
        return None
    flat = [qs[0][0], qs[0][1]]
    for a, b in zip(qs, qs[1:]):
        flat += [b[0] - a[0], b[1] - a[1]]
    return flat


# ---------------------------------------------------------------- названия

DIR_RU = {'东': 'Восточный', '西': 'Западный', '南': 'Южный', '北': 'Северный'}
DIR_EN = {'东': 'East', '西': 'West', '南': 'South', '北': 'North'}
HAN = re.compile(r'[㐀-鿿豈-﫿]')


# Чтения, которые таблица Unihan даёт неверно для топонимов (佛山 — Foshan, 番禺 — Panyu, 黄埔 — Huangpu)
PY_WORDS = {'番禺': ['pan', 'yu'], '黄埔': ['huang', 'pu'], '车陂': ['che', 'bei'], '六榕': ['liu', 'rong']}
PY_CHARS = {'佛': 'fo', '埔': 'pu'}
NODE_HELPER = r"""
import { toPinyin, syllableRu } from %s;
const W = %s, C = %s;
const cap = (w) => (w ? w[0].toUpperCase() + w.slice(1) : w);
function conv(text, latin) {
  let s = String(text), py = toPinyin(s).map((x) => x.py), out = '', word = '';
  for (const [w, r] of Object.entries(W)) for (let i = s.indexOf(w); i >= 0; i = s.indexOf(w, i + 1)) r.forEach((p, k) => { py[i + k] = p; });
  const flush = () => { if (word) { out += cap(word); word = ''; } };
  [...s].forEach((ch, i) => {
    const p = C[ch] || py[i];
    if (p) word += latin ? (word && /^[aeo]/.test(p) ? "'" : '') + p.replace('v', 'ü') : syllableRu(p);
    else { flush(); out += ch; }
  });
  flush();
  return out;
}
let s = '';
process.stdin.on('data', (d) => { s += d; }).on('end', () => {
  process.stdout.write(JSON.stringify(JSON.parse(s).map((x) => [conv(x, false), conv(x, true)])));
});
"""


class Ru:
    """Русские названия (и пиньинь) по Палладию из server/src/amap/translit.js: сначала собираем все китайские куски,
    потом переводим одним вызовом Node."""

    def __init__(self):
        self.cache = {}

    def han(self, items):
        need = sorted({s for s in items if s and s not in self.cache})
        if need:
            code = NODE_HELPER % (json.dumps(TRANSLIT.as_uri()), json.dumps(PY_WORDS, ensure_ascii=False),
                                  json.dumps(PY_CHARS, ensure_ascii=False))
            r = subprocess.run(['node', '--input-type=module', '-e', code], input=json.dumps(need, ensure_ascii=False),
                               capture_output=True, text=True, check=True)
            self.cache.update(zip(need, json.loads(r.stdout)))

    def __call__(self, s):
        return self.cache[s][0] if s in self.cache else s

    def latin(self, s):
        return self.cache[s][1] if s in self.cache else s


def clean_zh(name):
    """Без скобок; у двуязычных названий («羅湖 Lo Wu», Гонконг) — только иероглифы."""
    name = re.sub(r'\s*[（(][^）)]*[）)]\s*', '', name or '').strip()
    if HAN.search(name):
        name = re.sub(r"\s+[A-Za-z][A-Za-z0-9 '’.&\-]*$", '', name)
    return name


def place_parts(zh, city):
    """Китайское название станции → (шаблон, куски для транслитерации). Шаблон — функция tr → строка."""
    name = clean_zh(zh)
    cz = city['zh']
    m = re.fullmatch(re.escape(cz) + r'(东|西|南|北)?(火车)?站', name) if cz else None
    if m:  # 北京南站 → Пекин-Южный, 上海火车站 → Вокзал Шанхай
        return (lambda tr: city['ru'] + '-' + DIR_RU[m.group(1)]) if m.group(1) else (lambda tr: 'Вокзал ' + city['ru']), []
    m = re.fullmatch(r'火车(东|西|南|北)?站', name)
    if m:  # 杭州 火车东站 → Ханчжоу-Восточный
        return (lambda tr: city['ru'] + '-' + DIR_RU[m.group(1)]) if m.group(1) else (lambda tr: 'Вокзал ' + city['ru']), []
    m = re.fullmatch(re.escape(cz) + r'(.{1,3}?)(火车)?站', name) if cz else None
    if m:  # 上海虹桥站 → Шанхай-Хунцяо, 北京朝阳站 → Пекин-Чаоян, 深圳机场北站 → Шэньчжэнь-Аэропорт Северный
        rest = m.group(1)
        a = re.fullmatch(r'机场(东|西|南|北)?', rest)
        if a:
            return (lambda tr: city['ru'] + '-Аэропорт' + (' ' + DIR_RU[a.group(1)] if a.group(1) else '')), []
        return (lambda tr: city['ru'] + '-' + tr(rest)), [rest]
    m = re.fullmatch(r'(.*?)(?:(?:国际)?机场)?(T?\d+)号?航站楼', name)
    if m:  # 2号航站楼 → Терминал 2, 虹桥2号航站楼 → Хунцяо, терминал 2
        core, num = m.group(1), m.group(2)
        return (lambda tr: f'{tr(core)}, терминал {num}' if core else f'Терминал {num}'), [core]
    m = re.fullmatch(r'(.*?)(?:国际)?机场(东|西|南|北)?(?:站)?', name)
    if m:  # 大兴机场 → Аэропорт Дасин, 机场东 → Аэропорт Восточный
        core, d = m.groups()
        if cz and core.startswith(cz) and len(core) > len(cz):
            core = core[len(cz):]
        return (lambda tr: ' '.join(x for x in ('Аэропорт', tr(core) if core else '', DIR_RU[d] if d else '') if x)), [core]
    m = re.fullmatch(r'(.+?)火车站', name)
    if m:  # 虹桥火车站 → Вокзал Хунцяо
        core = m.group(1)
        return (lambda tr: 'Вокзал ' + tr(core)), [core]
    if name.endswith('站') and len(name) > 2:
        name = name[:-1]
    m = re.fullmatch(r'(.{2,}?)((?:东|西|南|北|中)路)', name) if len(name) >= 4 else None
    if m:  # 南京东路 → Наньцзин Дунлу
        a, b = m.groups()
        return (lambda tr: tr(a) + ' ' + tr(b)), [a, b]
    m = re.fullmatch(r'(.{2,})(东|西|南|北)', name)
    if m:  # 天安门东 → Тяньаньмэнь Дун
        a, b = m.groups()
        return (lambda tr: tr(a) + ' ' + tr(b)), [a, b]
    return (lambda tr: tr(name)), [name]


def name_en(tags):
    en = tags.get('name:en') or tags.get('name:zh_pinyin') or tags.get('name:zh-Latn-pinyin') or tags.get('name:pinyin') or ''
    if not re.search(r'(Railway|Train) Station$', en, re.I):  # «East Railway Station» оставляем как есть
        en = re.sub(r'\s+((Metro|Subway|MTR) )?Station$', '', en.strip(), flags=re.I)
    return en


def norm_color(c, i):
    c = (c or '').strip().split(';')[0].strip()
    if c.lower() in CSS:
        return CSS[c.lower()]
    h = c.lstrip('#')
    if re.fullmatch(r'[0-9a-fA-F]{3}', h):
        h = ''.join(ch * 2 for ch in h)
    if re.fullmatch(r'[0-9a-fA-F]{6}', h):
        return '#' + h.upper()
    return PALETTE[i % len(PALETTE)]


# ---------------------------------------------------------------- метро

TRACK_ROLES = {'', 'forward', 'backward', 'route', 'main'}
BAD = ('construction', 'proposed', 'disused', 'abandoned', 'razed', 'planned')


def is_bad(tags):
    return any(k in tags or tags.get('railway') == k or tags.get('state') == k for k in BAD)


def line_ref(tags, master):
    """Номер линии для подписи: из названия «…10号线…» → 10; «…房山线…» → 房山; иначе тег ref."""
    name = (tags.get('name') or '').split(':')[0].split('：')[0]
    m = re.search(r'([0-9]+[A-Za-z]?)\s*号\s*[线綫]', name)
    if m:
        return m.group(1), m.group(1) + '号线'
    for nm in (name, master.get('name') or ''):
        m = re.search(r'([㐀-鿿A-Za-z]+?)[线綫]', re.sub(r'^.*?(地铁|地鐵|轨道交通|港鐵|港铁|轻轨|輕鐵)\s*', '', nm))
        if m and m.group(1) not in ('地铁', '号'):
            return m.group(1), m.group(0)
    ref = (tags.get('ref') or master.get('ref') or '').split(';')[0].strip()
    zh = name.strip() or ref
    return ref or zh, zh


def line_ru(ref, zh, ru):
    if re.fullmatch(r'[0-9A-Za-z\- ]+', ref):
        return f'Линия {ref}'
    if '机场' in ref or '機場' in ref:
        core = re.sub(r'(国际)?[机機][场場](快)?', '', ref)
        return 'Аэроэкспресс' + (' ' + ru(core) if core else '')
    return 'Линия ' + ru(ref)


def nat_key(ref):
    m = re.match(r'(\d+)', ref)
    return (0, int(m.group(1)), ref) if m else (1, 0, ref)


def dist_to_path(p, pts):
    best = float('inf')
    for a, b in zip(pts, pts[1:]):
        dx, dy = b[0] - a[0], b[1] - a[1]
        L2 = dx * dx + dy * dy
        t = 0 if L2 == 0 else max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2))
        best = min(best, math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy))
    return best


def station_key(name):
    return re.sub(r'站$', '', clean_zh(name)) if HAN.search(name or '') else clean_zh(name).lower()


def build_metro(city, proj, els, poi, ru):
    routes = set(city.get('routes', ['subway', 'light_rail']))
    rels = [e for e in els if e['type'] == 'relation' and e.get('tags', {}).get('type') == 'route']
    masters = [e for e in els if e['type'] == 'relation' and e.get('tags', {}).get('type') == 'route_master']
    ways = {e['id']: e for e in els if e['type'] == 'way'}
    nodes = {e['id']: e for e in els if e['type'] == 'node'}
    master_of = {}
    for m in masters:
        for mem in m.get('members', []):
            master_of[mem['ref']] = m.get('tags', {})
    nets = defaultdict(int)
    for r in rels:
        if r['tags'].get('route') == 'subway' and r['tags'].get('network'):
            nets[r['tags']['network']] += 1
    main_net = max(nets, key=nets.get) if nets else ''

    single = {r['tags']['ref'] for r in rels if r['tags'].get('ref') and ';' not in r['tags']['ref']}
    lines = {}
    for r in rels:
        t = r['tags']
        if t.get('route') not in routes or is_bad(t):
            continue
        if ';' in t.get('ref', '') and all(x.strip() in single for x in t['ref'].split(';')):
            continue  # сквозной маршрут двух линий (深圳 2&8号线): у каждой линии есть своё отношение
        net = t.get('network', '')
        name = t.get('name', '')
        if t['route'] != 'subway' and (net not in nets and not re.search(r'地铁|地鐵|号线|Metro|MRT|Subway', name, re.I)
                                       or re.search(r'有轨|电车|電車|tram', name + net, re.I)):
            continue  # трамваи и пригородные — не метро
        mt = master_of.get(r['id'], {})
        ref, zh = line_ref(t, mt)
        if not ref:
            continue
        key, other = ref, ''
        if net and main_net and net != main_net and main_net not in net and net not in main_net:
            # другая сеть (Фошань рядом с Гуанчжоу): свой ref («F2») и город в названии, с линиями города не сливаем
            m = re.match(r'(.+?)(地铁|地鐵|轨道交通|軌道交通)', net)
            other = m.group(1) if m else ''
            if re.fullmatch(r'\d+', ref) and t.get('ref') and ';' not in t['ref']:
                zh, ref = other + zh, t['ref']
            key = f'{ref}@{net}'
        L = lines.setdefault(key, dict(ref=ref, zh=zh, net=net, other=other, colors=[], ways={}, stops=[]))
        c = t.get('colour') or mt.get('colour')
        if c:
            L['colors'].append(c)
        for mem in r.get('members', []):
            if mem['type'] == 'way' and mem['role'] in TRACK_ROLES and mem['ref'] in ways:
                w = ways[mem['ref']]
                wt = w.get('tags', {})
                if wt.get('public_transport') == 'platform' or wt.get('railway') == 'platform' or 'geometry' not in w:
                    continue
                L['ways'][w['id']] = w
            elif re.match(r'(stop|platform)', mem['role']) and 'inactive' not in mem['role']:
                if mem['type'] == 'node' and mem['ref'] in nodes:
                    n = nodes[mem['ref']]
                    L['stops'].append((proj.m(n['lon'], n['lat']), station_key(n.get('tags', {}).get('name', ''))))
                elif mem['type'] == 'way' and mem['ref'] in ways and ways[mem['ref']].get('geometry'):
                    g = ways[mem['ref']]['geometry']
                    lon = sum(p['lon'] for p in g) / len(g)
                    lat = sum(p['lat'] for p in g) / len(g)
                    L['stops'].append((proj.m(lon, lat), station_key(ways[mem['ref']].get('tags', {}).get('name', ''))))

    def wlen(w):
        return length([proj.m(p['lon'], p['lat']) for p in w['geometry']])

    # Линия, чьи пути почти целиком входят в другую (八通线 в 1号线/八通线, 大兴线 в 4号线/大兴线), — часть той линии
    lens = {wid: wlen(w) for L in lines.values() for wid, w in L['ways'].items()}
    tot = {k: sum(lens[w] for w in L['ways']) for k, L in lines.items()}
    for k in sorted(lines, key=lambda k: tot[k]):
        A = lines[k]
        if not A['ways'] or re.fullmatch(r'\d+', A['ref']):
            continue  # номерная линия веткой другой не бывает
        best, bf = None, 0.0
        for k2, B in lines.items():
            if k2 == k or tot[k2] <= tot[k] or not B['ways']:
                continue
            f = sum(lens[w] for w in A['ways'] if w in B['ways']) / max(1.0, tot[k])
            if f > bf:
                best, bf = k2, f
        if best and bf >= 0.9:
            lines[best]['stops'] += A['stops']
            A['ways'] = {}
            A['stops'] = []

    out_lines, paths_m = [], {}
    for i, (k, L) in enumerate(sorted(lines.items(), key=lambda kv: nat_key(kv[1]['ref']))):
        if not L['ways']:
            continue
        ws = [(w['nodes'], [proj.m(p['lon'], p['lat']) for p in w['geometry']]) for w in L['ways'].values()
              if len(w.get('nodes', [])) == len(w['geometry'])]
        pieces = [p for _, pts in merge_ways(ws) for p in clip_line(pts, proj.W, proj.H)]
        pieces = drop_parallel(pieces, Grid(130), 130, 15, 200, 150)
        pieces = [dp(p, TOL['metro']) for p in pieces]
        enc = [e for e in (encode(proj, p) for p in pieces) if e]
        if not enc:
            continue
        colors = [norm_color(c, i) for c in L['colors']]
        color = max(set(colors), key=colors.count) if colors else PALETTE[i % len(PALETTE)]
        paths_m[k] = pieces
        out_lines.append(dict(key=k, ref=L['ref'], zh=L['zh'], other=L['other'], color=color, paths=enc, stops=L['stops']))

    # ---- станции
    raw = []
    for e in poi:
        t = e.get('tags', {})
        if not t.get('name') or is_bad(t) or t.get('railway') not in (None, 'station', 'halt'):
            continue
        if not (t.get('station') in ('subway', 'light_rail') or t.get('subway') == 'yes' and
                (t.get('public_transport') == 'station' or t.get('railway') == 'station')):
            continue
        lat, lon = (e['lat'], e['lon']) if 'lat' in e else (e['center']['lat'], e['center']['lon'])
        p = proj.m(lon, lat)
        if proj.inside(p):
            raw.append((station_key(t['name']), p, t))
    parent = list(range(len(raw)))

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a

    by_name = defaultdict(list)
    for i, (k, _, _) in enumerate(raw):
        by_name[k].append(i)
    for idx in by_name.values():
        for a in idx:
            for b in idx:
                if a < b and math.dist(raw[a][1], raw[b][1]) <= 500:
                    parent[find(a)] = find(b)
    groups = defaultdict(list)
    for i in range(len(raw)):
        groups[find(i)].append(raw[i])

    stations = []
    for g in groups.values():
        p = (sum(x[1][0] for x in g) / len(g), sum(x[1][1] for x in g) / len(g))
        key = g[0][0]
        tags = [x[2] for x in g]
        refs = []
        for L in out_lines:
            if len(L['stops']) >= 3:
                if any(math.dist(p, sp) <= 150 or sk == key and math.dist(p, sp) <= 700 for sp, sk in L['stops']):
                    refs.append(L['key'])
            elif min(dist_to_path(p, pc) for pc in paths_m[L['key']]) <= 120:
                refs.append(L['key'])
        if not refs:  # у линии нет остановок в отношении — ближайшая линия в 120 м
            d, k = min(((min(dist_to_path(p, pc) for pc in paths_m[L['key']]), L['key']) for L in out_lines),
                       default=(1e9, None))
            if d <= 120:
                refs = [k]
        if not refs:
            continue  # станция строящейся линии или без линии на карте
        zh = min((t['name'] for t in tags), key=len)
        stations.append(dict(zh=zh, tags=tags, p=p, refs=refs))

    # ---- русские названия
    parts = {}
    need = []
    for L in out_lines:
        need += [L['ref'], re.sub(r'(国际)?[机機][场場](快)?', '', L['ref']), L['other']]
    for s in stations:
        if not any(t.get('name:ru') for t in s['tags']):
            fn, pc = place_parts(s['zh'], city)
            parts[id(s)] = fn
            need += pc
    ru.han(need)
    keymap = {L['key']: L['ref'] for L in out_lines}
    res_lines = []
    for L in out_lines:
        num = re.search(r'(\d+)号线', L['zh'])
        r_ru = f"{ru(L['other'])}, линия {num.group(1)}" if L['other'] and num else line_ru(L['ref'], L['zh'], ru)
        res_lines.append(dict(ref=L['ref'], zh=L['zh'], ru=r_ru, color=L['color'], paths=L['paths']))
    res_st = []
    for s in sorted(stations, key=lambda s: (-s['p'][1], s['p'][0])):
        ru_name = next((t['name:ru'] for t in s['tags'] if t.get('name:ru')), None) or parts[id(s)](ru)
        x, y = proj.q(s['p'])
        refs = sorted({keymap[k] for k in s['refs']}, key=nat_key)
        en = next((name_en(t) for t in s['tags'] if name_en(t)), '')
        res_st.append(dict(zh=clean_zh(s['zh']) or s['zh'], en=en, ru=ru_name, x=x, y=y, lines=refs))
    return {'lines': res_lines, 'stations': res_st}


# ---------------------------------------------------------------- дороги, вода

def build_roads(proj, els):
    major, minor = [], []
    for w in els:
        if w['type'] != 'way' or len(w.get('nodes', [])) != len(w.get('geometry', [])) or len(w['nodes']) < 2:
            continue
        hw = w.get('tags', {}).get('highway')
        pts = [proj.m(p['lon'], p['lat']) for p in w['geometry']]
        (major if hw in ('motorway', 'trunk') else minor if hw == 'primary' else []).append((w['nodes'], pts))
    grid = Grid(60)
    out = {}
    for name, ways in (('major', major), ('minor', minor)):
        pieces = [p for _, pts in merge_ways(ways) for p in clip_line(pts, proj.W, proj.H)]
        pieces = drop_parallel(pieces, grid, 60, 20, 200, 120)
        out[name] = [e for e in (encode(proj, dp(p, TOL['road'])) for p in pieces) if e]
    return out


def close_chains(chains):
    """Разорванные контуры (куски вне рамки не скачаны) замыкаем, соединяя ближайшие концы — они далеко за рамкой."""
    rings = []
    chains = [list(c) for c in chains]
    while chains:
        cur = chains.pop()
        while chains:
            end = cur[-1]
            j, rev, d = min(((j, rev, math.dist(end, c[-1] if rev else c[0])) for j, c in enumerate(chains)
                             for rev in (False, True)), key=lambda x: x[2])
            if math.dist(end, cur[0]) <= d:
                break
            c = chains.pop(j)
            cur += c[::-1] if rev else c
        rings.append(cur)
    return rings


def sea_polygons(proj, coast):
    """Море по береговой линии OSM (суша слева по ходу линии): куски внутри рамки + обход рамки по часовой стрелке."""
    W, H = proj.W, proj.H
    per = 2 * (W + H)
    eps = 1e-3

    def pos(p):
        x, y = p
        if abs(y - H) < eps:
            return x
        if abs(x - W) < eps:
            return W + (H - y)
        if abs(y) < eps:
            return W + H + (W - x)
        return 2 * W + H + y

    corners = [(0.0, (0, H)), (W, (W, H)), (W + H, (W, 0)), (2 * W + H, (0, 0))]
    pieces = []
    for nodes, pts in merge_ways(coast, directed=True):
        for c in clip_line(pts, W, H):
            on_edge = [min(abs(q[0]), abs(q[0] - W), abs(q[1]), abs(q[1] - H)) < 1e-3 for q in (c[0], c[-1])]
            if all(on_edge):
                pieces.append(c)
    if not pieces:
        return []
    starts = [(pos(c[0]), i) for i, c in enumerate(pieces)]
    used = [False] * len(pieces)
    polys = []
    for i0 in range(len(pieces)):
        if used[i0]:
            continue
        ring, i = [], i0
        for _ in range(len(pieces) + 1):
            used[i] = True
            ring += pieces[i]
            se = pos(pieces[i][-1])
            # следующий выход берега к морю — первый вход куска по часовой стрелке от точки выхода
            sn, i = min(starts, key=lambda s: (s[0] - se) % per or per)
            span = (sn - se) % per or per
            ring += [cpt for off, cpt in sorted(((cp - se) % per, cpt) for cp, cpt in corners) if 0 < off < span]
            if i == i0 or used[i]:
                break
        polys.append(ring)
    return polys


def build_water(proj, els):
    ways = {}
    for e in els:
        if e['type'] == 'way' and e.get('geometry') and len(e.get('nodes', [])) == len(e['geometry']):
            ways[e['id']] = e
    rels = [e for e in els if e['type'] == 'relation']
    outer_ids = set()
    for r in rels:
        for m in r.get('members', []):
            if m['type'] == 'way' and m['role'] in ('outer', ''):
                outer_ids.add(m['ref'])

    def pts_of(w):
        return [proj.m(p['lon'], p['lat']) for p in w['geometry']]

    lines, rings, coast = [], [], []
    for w in ways.values():
        t = w.get('tags', {})
        if t.get('natural') == 'coastline':
            coast.append((w['nodes'], pts_of(w)))
        elif t.get('waterway') == 'river' or t.get('waterway') == 'canal' and t.get('name'):
            lines.append((w['nodes'], pts_of(w)))
        elif (t.get('natural') == 'water' or t.get('waterway') == 'riverbank' or t.get('landuse') == 'reservoir') \
                and w['nodes'][0] == w['nodes'][-1] and w['id'] not in outer_ids:
            rings.append(pts_of(w)[:-1])
    for r in rels:
        mem = [ways[m['ref']] for m in r.get('members', []) if m['type'] == 'way' and m['role'] in ('outer', '')
               and m['ref'] in ways]
        closed, open_ = [], []
        for nodes, pts in merge_ways([(w['nodes'], pts_of(w)) for w in mem]):
            (closed if nodes[0] == nodes[-1] else open_).append(pts[:-1] if nodes[0] == nodes[-1] else pts)
        rings += closed + close_chains(open_)

    out_lines = []
    for _, pts in merge_ways(lines):
        for c in clip_line(pts, proj.W, proj.H):
            if length(c) >= 300:
                e = encode(proj, dp(c, TOL['water']))
                if e:
                    out_lines.append(e)
    areas = []
    for ring in rings + sea_polygons(proj, coast):
        c = clip_ring(ring, proj.W, proj.H)
        if len(c) < 3 or area(c) < MIN_WATER_AREA:
            continue
        e = encode(proj, dp_ring(c, TOL['water']), closed=True)
        if e:
            areas.append((area(c), e))
    areas.sort(key=lambda a: -a[0])  # крупные первыми: мелкие рисуются поверх
    return {'lines': out_lines, 'areas': [e for _, e in areas]}


# ---------------------------------------------------------------- вокзалы и аэропорты

def build_poi(city, proj, poi, metro_st, ru):
    cz = city['zh']
    cands = []
    for e in poi:
        t = e.get('tags', {})
        name = t.get('name', '')
        lat, lon = (e['lat'], e['lon']) if 'lat' in e else (e['center']['lat'], e['center']['lon'])
        p = proj.m(lon, lat)
        if not name or not proj.inside(p) or is_bad(t):
            continue
        if t.get('aeroway') == 'aerodrome':
            if t.get('military') or t.get('aerodrome') == 'military' or t.get('landuse') == 'military':
                continue
            if t.get('iata') or t.get('aerodrome') in ('international', 'public', 'regional') or \
                    t.get('aerodrome:type') in ('international', 'public'):
                cands.append(('air', 0, name, p, t))
            continue
        if t.get('railway') != 'station' or t.get('station') in ('subway', 'light_rail', 'tram', 'monorail', 'funicular'):
            continue
        if t.get('train') == 'no' or t.get('public_transport') == 'no' or t.get('usage') in ('industrial', 'military'):
            continue
        if t.get('subway') == 'yes' and t.get('train') != 'yes' or t.get('public_transport') == 'stop_area':
            continue
        if re.search(r'[0-9]', name):
            continue
        core = re.sub(r'(火车)?站$', '', clean_zh(name))
        score = 0
        if cz and core.startswith(cz):
            score += 10  # 北京南, 上海虹桥, 杭州东 — главные вокзалы города
        if t.get('usage') in ('main', 'high_speed') or t.get('highspeed') == 'yes':
            score += 4
        if any(re.fullmatch(re.escape(core) + r'(火车)?站', s['zh']) and math.dist(p, s['_p']) <= 800 for s in metro_st):
            score += 5  # станция метро названа по вокзалу («清河站», «亦庄火车站»)
        elif t.get('train') == 'yes' and any(s['zh'] == core and math.dist(p, s['_p']) <= 400 for s in metro_st):
            score += 4  # пересадка на одноимённую станцию метро (深圳 福田)
        if t.get('name:en'):
            score += 1
        if e['type'] != 'node':
            score += 1
        if score >= 5:
            cands.append(('rail', score, name, p, t))
    # одно и то же место точкой и контуром — оставляем одно
    seen = []
    for kind, score, name, p, t in sorted(cands, key=lambda c: -c[1]):
        k = re.sub(r'(火车)?站$', '', clean_zh(name))
        if any(kind == k2 and (k == n2 or math.dist(p, p2) <= 300) and math.dist(p, p2) <= 2500 for k2, n2, p2, _, _ in seen):
            for s in seen:
                if s[0] == kind and s[1] == k and not s[3].get('name:ru') and t.get('name:ru'):
                    s[3]['name:ru'] = t['name:ru']
            continue
        seen.append((kind, k, p, t, name))
    rail = [s for s in seen if s[0] == 'rail'][:10]
    air = [s for s in seen if s[0] == 'air']
    fns = {}
    need = []
    for s in rail + air:
        zh = s[4] if s[0] == 'air' else s[1] + ('站' if HAN.search(s[1]) and not s[1].endswith('站') else '')
        fn, pc = place_parts(zh, city)
        fns[id(s)] = (zh, fn)
        need += pc
    ru.han(need)

    def one(s):
        kind, k, p, t, name = s
        zh, fn = fns[id(s)]
        rn = t.get('name:ru')
        if rn and kind == 'air':
            rn = re.sub(r'^Международный аэропорт\s+', 'Аэропорт ', rn)
        if rn and kind == 'rail' and rn == city['ru']:
            rn = 'Вокзал ' + rn
        en = name_en(t)
        if kind == 'rail' and cz and k.startswith(cz) and re.fullmatch(r'[A-Za-z\-]*', en.replace(' ', '')):
            rest = k[len(cz):]
            if rest in DIR_EN:  # Beijingnan → Beijing South
                en = f"{city['en']} {DIR_EN[rest]}"
            elif not rest:  # 北京站 → Beijing Railway Station
                en = f"{city['en']} Railway Station"
            elif not en:
                en = f"{city['en']} {ru.latin(rest)}"
            elif ' ' not in en and en.lower().startswith(city['en'].lower()):  # Guangzhouchanglong → Guangzhou Changlong
                en = f"{city['en']} {en[len(city['en']):].capitalize()}"

        x, y = proj.q(p)
        return dict(zh=zh, en=en, ru=rn or fn(ru), x=x, y=y)

    return [one(s) for s in rail], [one(s) for s in air]


# ---------------------------------------------------------------- сборка

def build(city, data):
    proj = Proj(city['bbox'])
    ru = Ru()
    metro = build_metro(city, proj, data['metro'], data['poi'], ru)
    st_m = [dict(zh=s['zh'], _p=(s['x'] / Q * proj.kx, s['y'] / Q * proj.ky)) for s in metro['stations']]
    rail, air = build_poi(city, proj, data['poi'], st_m, ru)
    return {
        'id': city['id'], 'ru': city['ru'], 'zh': city['zh'], 'en': city['en'],
        'bbox': city['bbox'], 'q': Q,
        'roads': build_roads(proj, data['roads']),
        'water': build_water(proj, data['water']),
        'metro': metro,
        'rail': rail,
        'airports': air,
        'source': SOURCE,
        'date': datetime.date.today().isoformat(),
    }


def main():
    ap = argparse.ArgumentParser(description='Офлайн-карты городов из OpenStreetMap')
    ap.add_argument('cities', nargs='*', help='id городов (по умолчанию все из CITIES)')
    ap.add_argument('--refresh', action='store_true', help='скачать заново, не брать из кэша')
    ap.add_argument('--cache', default=os.environ.get('OMAP_CACHE', '/tmp/gtt-offline-maps/raw'),
                    help='папка кэша ответов Overpass')
    a = ap.parse_args()
    ids = a.cities or [c['id'] for c in CITIES]
    unknown = set(ids) - {c['id'] for c in CITIES}
    if unknown:
        raise SystemExit(f'нет в CITIES: {", ".join(sorted(unknown))}')
    OUT.mkdir(parents=True, exist_ok=True)
    for city in CITIES:
        if city['id'] not in ids:
            continue
        print(city['id'], file=sys.stderr)
        res = build(city, fetch(city, Path(a.cache), a.refresh))
        path = OUT / f"{city['id']}.json"
        path.write_text(json.dumps(res, ensure_ascii=False, separators=(',', ':')), 'utf8')
        m = res['metro']
        print(f"{path.relative_to(ROOT)}: {path.stat().st_size / 1024:.0f} КБ — метро {len(m['lines'])} линий, "
              f"{len(m['stations'])} станций; дороги {len(res['roads']['major'])}+{len(res['roads']['minor'])}; "
              f"вода {len(res['water']['lines'])} рек, {len(res['water']['areas'])} водоёмов; "
              f"вокзалов {len(res['rail'])}, аэропортов {len(res['airports'])}")


if __name__ == '__main__':
    main()
