// Расходы для командировочного отчёта (решение 21.10.2026): фото чека → сумма (распознаётся с чека, можно поправить) →
// пересчёт в рубли по курсу ЦБ РФ на день расхода → в конце поездки Excel или PDF с чеками для бухгалтерии.
import type { Cell } from './xlsx';

export type ExpenseCat = 'taxi' | 'food' | 'shop' | 'net' | 'hotel' | 'other';
export const EXPENSE_CATS: [ExpenseCat, string][] = [
  ['taxi', 'Такси и транспорт'], ['food', 'Еда'], ['shop', 'Покупки и образцы'], ['net', 'Связь и интернет'], ['hotel', 'Проживание'], ['other', 'Другое'],
];
export const catRu = (c: ExpenseCat) => EXPENSE_CATS.find((x) => x[0] === c)?.[1] || 'Другое';

export type Expense = {
  id: string; at: string; trip: string;
  amount: number; cur: string; sym: string;
  /** Рублей за 1 единицу валюты (курс ЦБ РФ или курс обменника, если ЦБ его не публикует); 0 — курса нет. */
  rate: number; rateNote: string;
  cat: ExpenseCat; note: string; photo?: string;
};

export const rub = (e: Expense) => (e.rate ? Math.round(e.amount * e.rate * 100) / 100 : 0);
export const money = (n: number, d = 2) => n.toLocaleString('ru-RU', { minimumFractionDigits: n % 1 ? d : 0, maximumFractionDigits: d });
export const dateRu = (iso: string) => { const d = new Date(iso); return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`; };

// ——— категория сама (решение 21.10.2026, по примеру Navan) ———
// По словам на чеке или в описании: такси и транспорт, еда, проживание, связь, покупки. Языки — те же, что у распознавания
// чеков (русский, английский, китайский, японский, корейский, тайский, вьетнамский, индонезийский/малайский).
const CAT_WORDS: [ExpenseCat, RegExp][] = [
  ['hotel', /отел|гостиниц|хостел|прожив|hotel|hostel|resort|airbnb|accommodation|\binn\b|\bnights?\b|酒店|宾馆|住宿|旅馆|ホテル|旅館|호텔|숙박|โรงแรม|khách sạn|penginapan/i],
  ['net', /сим-?карт|\bsim\b|esim|интернет|роуминг|связь|wi-?fi|internet|roaming|china mobile|china unicom|china telecom|中国移动|联通|电信|流量|话费|docomo|softbank|\bais\b|dtac|viettel|telkomsel|celcom|maxis|du telecom|etisalat/i],
  ['taxi', /такси|трансфер|метро|автобус|поезд|электричк|парковк|бензин|taxi|cab\b|uber|grab|gojek|bolt|didi|careem|metro|subway|train|railway|bus\b|parking|toll|fuel|滴滴|出租|打车|地铁|高铁|火车|公交|停车|加油|タクシー|電車|地下鉄|택시|지하철|แท็กซี่|รถไฟ|xe ôm|tàu/i],
  ['food', /ресторан|кафе|кофе|обед|ужин|завтрак|ланч|бар\b|еда|restaurant|cafe|café|coffee|lunch|dinner|breakfast|meal|food|bar\b|starbucks|luckin|mixue|kfc|mcdonald|family ?mart|7-?eleven|lawson|tea\b|sandwich|onigiri|noodle|burger|pizza|餐|饭|面馆|食|咖啡|茶|饮|瑞幸|蜜雪|全家|罗森|レストラン|食堂|カフェ|居酒屋|식당|카페|커피|ร้านอาหาร|อาหาร|กาแฟ|nhà hàng|cà phê|phở|makan|kopi|restoran/i],
  ['shop', /магазин|покупк|образ[еця]|сувенир|аптек|shop|store|mall|market|outlet|souvenir|pharmacy|超市|商场|商店|购物|淘宝|京东|拼多多|名创|药店|ドラッグ|マート|마트|편의점|ร้านค้า|siêu thị|toko/i],
];

/** Категория по тексту чека или описанию: побеждает та, чьих слов больше (на чеке FamilyMart слово «Store» — одно, а
 *  онигири, чай и сэндвич — три); при равенстве — по порядку списка. null — непонятно, человек выберет сам. */
export function guessCategory(text: string): ExpenseCat | null {
  let best: ExpenseCat | null = null;
  let max = 0;
  for (const [cat, re] of CAT_WORDS) {
    const n = text.match(new RegExp(re.source, 'gi'))?.length || 0;
    if (n > max) { max = n; best = cat; }
  }
  return best;
}

// ——— сумма с чека ———
const TOTAL = /(итого|всего|к оплате|total|amount|grand|balance due|合计|总计|合計|总额|总价|实付|实收|应付|お会計|お支払|총액|합계|결제금액|รวม|ยอดสุทธิ|tổng|thành tiền|jumlah|bayar|المجموع)/i;
const SKIP = /(subtotal|小计|小計|税|tax|vat|change|找零|お釣り|거스름|ทอน|tiền thối|kembali)/i;

/** «1,280.50» / «1 280,50» / «1280» → число; телефоны, даты и номера чеков отбрасываются. */
function numbers(line: string): number[] {
  const out: number[] = [];
  // время «12:31» и даты «10.11.2026» — не суммы
  const clean = line.replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, ' ').replace(/\b\d{1,4}[./-]\d{1,2}[./-]\d{1,4}\b/g, ' ');
  for (const m of clean.matchAll(/\d[\d .,\u00a0']*\d|\d/g)) {
    let s = m[0].replace(/[ \u00a0']/g, '');
    const lastSep = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','));
    if (lastSep >= 0 && s.length - lastSep - 1 <= 2) s = `${s.slice(0, lastSep).replace(/[.,]/g, '')}.${s.slice(lastSep + 1)}`;
    else s = s.replace(/[.,]/g, '');
    const n = Number(s);
    if (Number.isFinite(n) && n > 0 && s.replace('.', '').length <= 9) out.push(n);
  }
  return out;
}

export function receiptAmount(text: string): number | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const keyed = lines.filter((l) => TOTAL.test(l) && !SKIP.test(l)).flatMap((l, i, a) => {
    const own = numbers(l);
    // сумма бывает на следующей строке после «ИТОГО»
    if (own.length) return own;
    const idx = lines.indexOf(a[i]);
    return lines[idx + 1] ? numbers(lines[idx + 1]) : [];
  });
  const pool = keyed.length ? keyed : lines.flatMap(numbers).filter((n) => n < 10_000_000);
  return pool.length ? Math.max(...pool) : null;
}

// ——— отчёт ———
export function expenseRows(list: Expense[]): Cell[][] {
  const rows: Cell[][] = [['Дата', 'Категория', 'Описание', 'Сумма', 'Валюта', 'Курс, ₽ за 1', 'Курс', 'Сумма, ₽', 'Чек']];
  for (const e of [...list].sort((a, b) => a.at.localeCompare(b.at))) {
    rows.push([dateRu(e.at), catRu(e.cat), e.note, e.amount, e.cur, e.rate || null, e.rateNote, rub(e) || null, e.photo ? 'фото в приложении' : 'нет']);
  }
  const total = list.reduce((a, e) => a + rub(e), 0);
  rows.push([], ['Итого', '', '', null, '', null, '', Math.round(total * 100) / 100, '']);
  return rows;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** PDF для бухгалтерии: шапка, таблица с итогом, затем снимки чеков. photos — data:-строки по id расхода. */
export function expenseHtml(list: Expense[], meta: { who: string; trip: string; dates: string; made: string }, photos: Record<string, string>) {
  const sorted = [...list].sort((a, b) => a.at.localeCompare(b.at));
  const total = sorted.reduce((a, e) => a + rub(e), 0);
  const byCur = new Map<string, number>();
  sorted.forEach((e) => byCur.set(`${e.cur}`, (byCur.get(e.cur) || 0) + e.amount));
  const rows = sorted.map((e, i) => `<tr><td>${i + 1}</td><td>${dateRu(e.at)}</td><td>${esc(catRu(e.cat))}</td><td>${esc(e.note)}</td><td class="n">${money(e.amount)} ${esc(e.cur)}</td><td class="n">${e.rate ? money(e.rate, 4) : '—'}</td><td class="n">${e.rate ? money(rub(e)) : '—'}</td></tr>`).join('');
  const shots = sorted.filter((e) => photos[e.id]).map((e) => `<figure><img src="${photos[e.id]}"/><figcaption>№${sorted.indexOf(e) + 1} · ${dateRu(e.at)} · ${money(e.amount)} ${esc(e.cur)} · ${esc(catRu(e.cat))}</figcaption></figure>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4;margin:14mm}body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#0f1b2d;font-size:11pt}
    .brand{color:#1a73e8;font-weight:700;letter-spacing:.08em;font-size:9pt}h1{font-size:20pt;margin:4px 0}
    .meta{color:#5b6576;margin-bottom:12px}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #e3e8f0;padding:6px 5px;text-align:left;vertical-align:top}
    th{background:#f1f6ff;font-size:9.5pt}.n{text-align:right;white-space:nowrap}.tot td{font-weight:700;border-top:2px solid #0f1b2d}
    .note{color:#5b6576;font-size:9pt;margin-top:10px}figure{display:inline-block;width:48%;margin:8px 1% 0;page-break-inside:avoid}
    figure img{width:100%;border:1px solid #e3e8f0;border-radius:6px}figcaption{font-size:9pt;color:#5b6576}h2{font-size:13pt;margin-top:18px;page-break-before:always}
  </style></head><body>
    <div class="brand">GLOBAL TECH TOUR · ОТЧЁТ О РАСХОДАХ</div><h1>${esc(meta.trip)}</h1>
    <div class="meta">${esc(meta.dates)} · ${esc(meta.who)} · составлен ${esc(meta.made)}</div>
    <table><tr><th>№</th><th>Дата</th><th>Категория</th><th>Описание</th><th class="n">Сумма</th><th class="n">Курс, ₽</th><th class="n">В рублях</th></tr>${rows}
    <tr class="tot"><td colspan="4">Итого${[...byCur].map(([c, n]) => ` · ${money(n)} ${esc(c)}`).join('')}</td><td></td><td></td><td class="n">${money(total)} ₽</td></tr></table>
    <div class="note">Курс — ЦБ РФ на день расхода (для валют, курс которых ЦБ не публикует, — курс обменника, указан вручную). Снимки чеков — ниже.</div>
    ${shots ? `<h2>Чеки</h2>${shots}` : ''}
  </body></html>`;
}
