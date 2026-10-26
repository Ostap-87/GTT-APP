#!/usr/bin/env python3
"""Данные модуля Amap (server/src/amap/data/): таблица «иероглиф → пиньинь», категории POI Amap и сети из приложения.

  python3 tools/amap-data.py [--unihan Unihan.zip] [--poicode AMap_poicode.zip]

Без аргументов файлы скачиваются:
  - Unihan.zip — Unicode Character Database, поле kMandarin (самое частое чтение знака).
    Лицензия Unicode (https://www.unicode.org/terms_of_use.html) — свободное использование с указанием источника;
  - AMap_poicode.zip — официальная таблица категорий POI Amap (高德地图API POI分类编码表), коды и английские названия.
Сети аптек и фруктовых лавок берутся из mobile/src/data/shops.ts (PHARMA, FRUIT_CHAINS) — тест сервера проверяет,
что chains.json с ними совпадает: добавили сеть в приложение — перезапустите скрипт.
"""
import argparse, io, json, re, sys, unicodedata, urllib.request, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'server/src/amap/data'
UNIHAN_URL = 'https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip'
POICODE_URL = 'https://a.amap.com/lbs/static/zip/AMap_poicode.zip'


def fetch(path_or_none, url):
    if path_or_none:
        return Path(path_or_none).read_bytes()
    print('скачиваю', url, file=sys.stderr)
    with urllib.request.urlopen(url, timeout=120) as r:
        return r.read()


def plain(p):
    """qiū → qiu, lǜ → lv (ü пишем как v)."""
    # ǜ, ǘ — это u + две точки + тон: сначала две точки → v, потом снимаем тон
    p = unicodedata.normalize('NFD', p).replace('u\u0308', 'v').replace('U\u0308', 'v')
    return ''.join(c for c in p if unicodedata.category(c) != 'Mn').lower()


def common(ch):
    """Знаки из GB2312 (упрощённые) и Big5 (традиционные — Гонконг, Макао): ~17 тыс. вместо 98 тыс."""
    for enc in ('gb2312', 'big5'):
        try:
            ch.encode(enc)
            return True
        except UnicodeEncodeError:
            pass
    return False


def build_pinyin(zip_bytes):
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
        text = z.read('Unihan_Readings.txt').decode('utf8')
    by = {}
    for line in text.splitlines():
        if '\tkMandarin\t' not in line:
            continue
        code, _, val = line.split('\t')
        ch = chr(int(code[2:], 16))
        if not common(ch):
            continue
        syl = plain(val.split()[0])
        by.setdefault(syl, []).append(ch)
    return {k: ''.join(v) for k, v in sorted(by.items())}


def build_types(zip_bytes):
    import openpyxl, warnings
    warnings.filterwarnings('ignore')
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
        name = next(n for n in z.namelist() if n.endswith('.xlsx') and '__MACOSX' not in n)
        wb = openpyxl.load_workbook(io.BytesIO(z.read(name)), read_only=True)
    ws = wb.worksheets[-1]
    out = {}
    for row in ws.iter_rows(values_only=True):
        cells = [c for c in row if c is not None]
        if len(cells) >= 8 and re.fullmatch(r'\d{6}', str(cells[1])):
            _, code, big, mid, small, big_en, mid_en, small_en = [str(c).strip() for c in cells[:8]]
            out[code] = {'zh': small, 'en': small_en, 'mid': mid, 'midEn': mid_en}
    return out


def build_chains():
    src = (ROOT / 'mobile/src/data/shops.ts').read_text('utf8')
    chains = []
    for block, kind in (('PHARMA', 'pharmacy'), ('FRUIT_CHAINS', 'fruit')):
        m = re.search(r'export const %s: Record<string, Chain> = \{(.*?)\n\};' % block, src, re.S)
        for cid, zh, lat in re.findall(r"id: '([^']+)', zh: '([^']+)', lat: '([^']+)'", m.group(1)):
            chains.append({'id': cid, 'kind': kind, 'zh': zh, 'lat': lat.replace('\\u2019', '’')})
    return chains


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--unihan')
    ap.add_argument('--poicode')
    ap.add_argument('--chains-only', action='store_true')
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    chains = build_chains()
    (OUT / 'chains.json').write_text(json.dumps(chains, ensure_ascii=False, indent=1) + '\n', 'utf8')
    print('chains.json:', len(chains), 'сетей')
    if a.chains_only:
        return
    py = build_pinyin(fetch(a.unihan, UNIHAN_URL))
    (OUT / 'pinyin.json').write_text(json.dumps(py, ensure_ascii=False, separators=(',', ':')) + '\n', 'utf8')
    print('pinyin.json:', len(py), 'слогов,', sum(len(v) for v in py.values()), 'знаков')
    types = build_types(fetch(a.poicode, POICODE_URL))
    (OUT / 'poi-types.json').write_text(json.dumps(types, ensure_ascii=False, separators=(',', ':')) + '\n', 'utf8')
    print('poi-types.json:', len(types), 'категорий')


if __name__ == '__main__':
    main()
