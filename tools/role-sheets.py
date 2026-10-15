"""Листы-обзоры экранов по ролям: design/previews/_<роль>.jpg (из PNG-превью)."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
PREV = ROOT / 'design/previews'
canvas = json.loads((ROOT / 'design/canvas/canvas.json').read_text())
FONT = next((p for p in ['/usr/share/fonts/truetype/inter/Inter-SemiBold.ttf',
                         '/usr/share/fonts/opentype/inter/Inter-SemiBold.otf',
                         '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'] if Path(p).exists()), None)
CJK = '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'

SHEETS = {
    'делегат': ('Делегат · приложение на телефоне', [
        ('R-D-Trip', '1 · Моя поездка'), ('R-D-Today', '2 · Сегодня'), ('R-D-Plan', '3 · План'),
        ('R-D-Library', '4 · Материалы'), ('R-D-People', '5 · Люди')]),
    'координатор': ('Координатор · компьютер и телефон, видит всё', [
        ('R-K-Center', '1 · Центр поездки (компьютер)'), ('R-K-Visits', '2 · Визиты компаний (компьютер)'),
        ('R-K-Phone', '3 · В поездке (телефон)')]),
    'компания': ('Принимающая сторона · ссылка в WeChat, китайский', [
        ('R-H-Visit', '1 · Обзор визита'), ('R-H-Delegation', '2 · Кто приедет'),
        ('R-H-Prep', '3 · Вопросы и материалы'), ('R-H-After', '4 · После визита')]),
}
H, GAP, PAD, TOP = 844, 40, 48, 150


def font(size, cjk=False):
    path = CJK if cjk else FONT
    return ImageFont.truetype(path, size) if path else ImageFont.load_default()


for key, (title, names) in SHEETS.items():
    tiles = []
    for n, label in names:
        im = Image.open(PREV / f'{n}.png').convert('RGB')
        b = canvas['boards'][f'{n}.dc.html']
        im = im.crop((0, 0, im.width, min(im.height, b['h'] * 2)))
        tiles.append((n, im.resize((round(im.width * H / im.height), H), Image.LANCZOS), label))
    width = PAD * 2 + sum(t[1].width for t in tiles) + GAP * (len(tiles) - 1)
    sheet = Image.new('RGB', (width, TOP + H + PAD), '#eef1f6')
    d = ImageDraw.Draw(sheet)
    d.text((PAD, 40), title, fill='#0f1b2d', font=font(44))
    x = PAD
    for n, im, label in tiles:
        size = 26
        while size > 14 and d.textlength(label, font=font(size)) > im.width:
            size -= 1
        d.text((x, TOP - 46), label, fill='#5b6576', font=font(size))
        sheet.paste(im, (x, TOP))
        d.rectangle((x - 1, TOP - 1, x + im.width, TOP + H), outline='#d5dbe6')
        x += im.width + GAP
    out = PREV / f'_{key}.jpg'
    sheet.save(out, quality=88)
    print(out.relative_to(ROOT), sheet.size)
