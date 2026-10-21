// «Итоги поездки» одним PDF: майндмэп поездки (главные темы и вехи), затем по дням — майндмэп дня, визиты, мои заметки
// и фото, контакты с визиток; в конце — мягкая ссылка на следующие экспедиции (программы — из каталога сайта).
// Фото вшиваются в PDF (base64): локальные файлы iOS не подхватывает.
import catalog from './catalog.json';
import type { BizCard } from './card';
import { VISITS } from './group';
import { DAYS_WITH_VISITS, PRINT_FONTS, VISIT_DAY, dayLabel, dayTree, mindSvg, noteDeal, tripSummary, tripTree, visitName, type MindSource, type MindTree } from './mindmap';
import { isLong, keyPoints, wordCount } from './summary';
import { CITY, DAYS, ME, TRIP } from './trip';
import type { VNote } from '@/state/visits';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

export type ReportVisit = { id: string; notes: VNote[]; cards: BizCard[]; photos: string[] };

/** Похожие программы для следующей поездки: другие ритейл-экспедиции GTT. */
export const nextTours = () => catalog.filter((t) => /ритейл|ретейл/i.test(t.title) && t.id !== 'china-retail-showrooms-expedition').slice(0, 3);

const CSS = `
  body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; color: #0f1b2d; font-size: 11.5pt; line-height: 1.45; }
  .top { border-bottom: 3px solid #1a73e8; padding-bottom: 10px; margin-bottom: 14px; }
  .brand { color: #1a73e8; font-weight: 700; letter-spacing: 1.5px; font-size: 9pt; }
  h1 { font-size: 24pt; margin: 4px 0 2px; text-transform: uppercase; letter-spacing: .5px; }
  .meta { color: #5b6576; }
  .sum { display: flex; gap: 10px; margin: 12px 0 4px; }
  .sum div { flex: 1; background: #eef4ff; border-radius: 8px; padding: 8px 10px; }
  .sum b { display: block; font-size: 18pt; color: #1a73e8; }
  .map { margin: 10px 0; border: 1px solid #e3e7ef; border-radius: 10px; overflow: hidden; page-break-inside: avoid; }
  .map svg { display: block; width: 100%; height: auto; max-height: 235mm; }
  .msum { display: flex; gap: 16px; page-break-inside: avoid; }
  .brief { background: #f3f6fb; border-radius: 8px; padding: 4px 12px 8px; margin: 8px 0; page-break-inside: avoid; }
  .brief h4 { margin: 6px 0 4px; font-size: 11pt; } .brief ul { padding-left: 16px; margin: 0; } .brief li { margin: 3px 0; font-size: 10pt; }
  .msum > div { flex: 1; }
  .msum h4 { margin: 6px 0 4px; font-size: 11pt; }
  .msum ul { list-style: none; padding: 0; margin: 0; }
  .msum li { margin: 4px 0; font-size: 10pt; }
  .msum i { display: inline-block; width: 8px; height: 8px; border-radius: 4px; margin-right: 6px; }
  .day { page-break-before: always; }
  .dh { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #1a73e8; padding-bottom: 4px; }
  .dh h2 { font-size: 17pt; text-transform: uppercase; } .dh span { color: #5b6576; }
  .visit { page-break-inside: avoid; border-top: 1px solid #dde3ee; padding-top: 10px; margin-top: 14px; }
  .vh { display: flex; justify-content: space-between; align-items: baseline; }
  h2 { font-size: 15pt; margin: 0; }
  .vh span, .muted, small { color: #5b6576; }
  .notes { padding-left: 18px; margin: 6px 0; }
  .notes li { margin: 4px 0; } .notes small { display: block; font-size: 8.5pt; }
  .deal { display: inline-block; background: #fff1e6; color: #a2470a; border-radius: 4px; padding: 0 5px; font-size: 8.5pt; font-weight: 700; margin-right: 4px; }
  .photos { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; }
  .photos img { width: 31%; height: 120px; object-fit: cover; border-radius: 6px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10pt; }
  th { text-align: left; background: #f3f6fb; color: #5b6576; font-weight: 600; padding: 6px; }
  td { border-top: 1px solid #e6ebf3; padding: 6px; vertical-align: top; }
  .zh { color: #5b6576; }
  .next { margin-top: 22px; background: #0f1b2d; color: #fff; border-radius: 10px; padding: 14px 16px; page-break-inside: avoid; }
  .next h3 { margin: 0 0 6px; font-size: 13pt; } .next li { margin: 3px 0; } .next a { color: #8ab8ff; }`;

const mapBlock = (tree: MindTree) => `<div class="map">${mindSvg(tree, PRINT_FONTS).xml}</div>`;

/** Главные темы и вехи рядом с картой. */
function summaryHtml(sum: ReturnType<typeof tripSummary>) {
  if (!sum.themes.length && !sum.deals.length) return '';
  const brief = sum.brief.length ? `<div class="brief"><h4>Коротко</h4><ul>${sum.brief.map((p) => `<li><b>${esc(visitName(p.from || ''))}:</b> ${esc(p.text)}</li>`).join('')}</ul></div>` : '';
  return `${brief}<div class="msum">
    ${sum.themes.length ? `<div><h4>Главные темы</h4><ul>${sum.themes.slice(0, 6).map((t) => `<li><i style="background:${t.color}"></i><b>${esc(t.ru)}</b> — ${t.visits.map((v) => esc(visitName(v.visit))).join(', ')}</li>`).join('')}</ul></div>` : ''}
    ${sum.deals.length ? `<div><h4>Вехи и договорённости</h4><ul>${sum.deals.map((d) => `<li><b>${esc(`${DAYS[d.day]?.wd} ${DAYS[d.day]?.n}`)} · ${esc(visitName(d.visit))}</b> — ${esc(d.text)}</li>`).join('')}</ul></div>` : ''}
  </div>`;
}

/** Заметка в PDF; длинная расшифровка — только «Коротко», полный текст остаётся в приложении. */
function noteBody(n: VNote) {
  const head = n.kind === 'guide' ? `<b>${esc(n.label || 'Рассказ гида')}:</b> ` : '';
  if (!isLong(n.text)) return head + esc(n.text || '');
  return `${head}коротко — <ul>${keyPoints([{ text: n.text || '' }], 5).map((p) => `<li>${esc(p.text)}</li>`).join('')}</ul><span class="muted">Полная расшифровка (${wordCount(n.text)} слов) — в приложении.</span>`;
}

function visitHtml({ id, notes, cards, photos }: ReportVisit) {
  const v = VISITS.find((x) => x.id === id);
  const texts = notes.filter((n) => n.kind === 'text' || n.kind === 'guide');
  const voices = notes.filter((n) => n.kind === 'voice').length;
  return `<section class="visit">
    <div class="vh"><h2>${esc(v?.name || id)}</h2><span>${esc(v?.when || '')}</span></div>
    ${texts.length ? `<ul class="notes">${[...texts].reverse().map((n) => `<li>${noteDeal(n) ? '<span class="deal">Договорённость</span>' : ''}${noteBody(n)}<small>${esc(n.at)}</small></li>`).join('')}</ul>` : ''}
    ${voices ? `<p class="muted">Голосовых заметок: ${voices} — слушать в приложении.</p>` : ''}
    ${photos.length ? `<div class="photos">${photos.map((p) => `<img src="data:image/jpeg;base64,${p}"/>`).join('')}</div>` : ''}
    ${cards.length ? `<table><tr><th>Контакт</th><th>Должность и компания</th><th>Связь</th></tr>${cards.map((c) => `<tr>
      <td><b>${esc(c.latin || c.name)}</b>${c.name && c.latin ? `<br/><span class="zh">${esc(c.name)}</span>` : ''}</td>
      <td>${esc(c.titleRu || c.title)}<br/><span class="muted">${esc(c.companyRu || c.company)}</span></td>
      <td>${[...c.phones, c.email, c.wechat ? `WeChat: ${c.wechat}` : '', c.site].filter(Boolean).map(esc).join('<br/>')}</td></tr>`).join('')}</table>` : ''}
  </section>`;
}

const dayBrief = (src: MindSource[], d: number) => {
  const b = tripSummary(src, d).brief;
  return b.length ? `<div class="brief"><h4>Коротко за день</h4><ul>${b.map((p) => `<li><b>${esc(visitName(p.from || ''))}:</b> ${esc(p.text)}</li>`).join('')}</ul></div>` : '';
};

export function reportHtml(visits: ReportVisit[], when: string) {
  const src: MindSource[] = visits.map(({ id, notes, cards }) => ({ visit: id, notes, cards }));
  const sum = tripSummary(src);
  const days = DAYS_WITH_VISITS.filter((d) => visits.some((v) => VISIT_DAY[v.id] === d));
  const dayBlocks = days.map((d) => `<section class="day">
    <div class="dh"><h2>${esc(dayLabel(d))}</h2><span>${esc(CITY[d])}</span></div>
    ${mapBlock(dayTree(d, src))}
    ${dayBrief(src, d)}
    ${visits.filter((v) => VISIT_DAY[v.id] === d).map(visitHtml).join('')}
  </section>`).join('');
  const tours = nextTours();
  return `<!doctype html><html><head><meta charset="utf-8"><style>@page { margin: 18mm 14mm; } ${CSS}</style></head><body>
  <div class="top"><div class="brand">GLOBAL TECH TOUR · ИТОГИ ПОЕЗДКИ</div><h1>${esc(TRIP.title)}</h1>
  <div class="meta">${esc(TRIP.dates)} · ${esc(TRIP.route)}<br/>${esc(ME.ru)}, ${esc(ME.roleRu)}, ${esc(ME.coRu)} · собрано ${esc(when)}</div>
  <div class="sum"><div><b>${sum.visits}</b>компаний с заметками</div><div><b>${sum.notes}</b>заметок</div><div><b>${sum.deals.length}</b>договорённостей</div><div><b>${sum.contacts}</b>контактов с визиток</div></div></div>
  ${visits.length ? `${summaryHtml(sum)}<section class="day"><div class="dh"><h2>Карта поездки</h2><span>${esc(TRIP.dates)}</span></div>${mapBlock(tripTree(src))}</section>` : '<p class="muted">Заметок и визиток пока нет — добавьте их в карточках визитов.</p>'}
  ${dayBlocks}
  <div class="next"><h3>Что посмотреть дальше</h3>
  <p>Если эта поездка была полезной — похожие экспедиции Global Tech Tour:</p>
  <ul>${tours.map((t) => `<li>${esc(t.title)}</li>`).join('')}</ul>
  <p>Все программы — <a href="https://globaltechtour.ru">globaltechtour.ru</a>. Координатор подберёт даты под вашу команду.</p></div>
  </body></html>`;
}

/** Отдельный PDF с майндмэпом дня или поездки — альбомный лист, карта и главное. */
export function mindPdfHtml(tree: MindTree, sum: ReturnType<typeof tripSummary>, heading: string, when: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>@page { size: A4 landscape; margin: 10mm 12mm; } ${CSS}
  .map svg { max-height: 150mm; } h1 { font-size: 18pt; }</style></head><body>
  <div class="brand">GLOBAL TECH TOUR · МАЙНДМЭП</div><h1>${esc(heading)}</h1>
  <div class="meta">${esc(TRIP.title)}, ${esc(TRIP.dates)} · ${esc(ME.ru)} · собрано ${esc(when)}</div>
  ${mapBlock(tree)}${summaryHtml(sum)}
  </body></html>`;
}
