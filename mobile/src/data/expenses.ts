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
