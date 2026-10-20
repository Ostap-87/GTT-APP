// «Итоги поездки» одним PDF: компании и визиты, мои заметки и фото, контакты с визиток; в конце — мягкая ссылка на
// следующие экспедиции (программы — из каталога сайта). Фото вшиваются в PDF (base64): локальные файлы iOS не подхватывает.
import catalog from './catalog.json';
import type { BizCard } from './card';
import { VISITS } from './group';
import { ME, TRIP } from './trip';
import type { VNote } from '@/state/visits';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

export type ReportVisit = { id: string; notes: VNote[]; cards: BizCard[]; photos: string[] };

/** Похожие программы для следующей поездки: другие ритейл-экспедиции GTT. */
export const nextTours = () => catalog.filter((t) => /ритейл|ретейл/i.test(t.title) && t.id !== 'china-retail-showrooms-expedition').slice(0, 3);

export function reportHtml(visits: ReportVisit[], when: string) {
  const blocks = visits.map(({ id, notes, cards, photos }) => {
    const v = VISITS.find((x) => x.id === id);
    const texts = notes.filter((n) => n.kind === 'text');
    const voices = notes.filter((n) => n.kind === 'voice').length;
    return `<section class="visit">
      <div class="vh"><h2>${esc(v?.name || id)}</h2><span>${esc(v?.when || '')}</span></div>
      ${texts.length ? `<ul class="notes">${texts.map((n) => `<li>${esc(n.text || '')}<small>${esc(n.at)}</small></li>`).join('')}</ul>` : ''}
      ${voices ? `<p class="muted">Голосовых заметок: ${voices} — слушать в приложении.</p>` : ''}
      ${photos.length ? `<div class="photos">${photos.map((p) => `<img src="data:image/jpeg;base64,${p}"/>`).join('')}</div>` : ''}
      ${cards.length ? `<table><tr><th>Контакт</th><th>Должность и компания</th><th>Связь</th></tr>${cards.map((c) => `<tr>
        <td><b>${esc(c.latin || c.name)}</b>${c.name && c.latin ? `<br/><span class="zh">${esc(c.name)}</span>` : ''}</td>
        <td>${esc(c.titleRu || c.title)}<br/><span class="muted">${esc(c.companyRu || c.company)}</span></td>
        <td>${[...c.phones, c.email, c.wechat ? `WeChat: ${c.wechat}` : '', c.site].filter(Boolean).map(esc).join('<br/>')}</td></tr>`).join('')}</table>` : ''}
    </section>`;
  }).join('');
  const total = visits.reduce((a, v) => ({ notes: a.notes + v.notes.length, cards: a.cards + v.cards.length }), { notes: 0, cards: 0 });
  const tours = nextTours();
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { margin: 18mm 14mm; }
  body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; color: #0f1b2d; font-size: 11.5pt; line-height: 1.45; }
  .top { border-bottom: 3px solid #1a73e8; padding-bottom: 10px; margin-bottom: 14px; }
  .brand { color: #1a73e8; font-weight: 700; letter-spacing: 1.5px; font-size: 9pt; }
  h1 { font-size: 24pt; margin: 4px 0 2px; text-transform: uppercase; letter-spacing: .5px; }
  .meta { color: #5b6576; }
  .sum { display: flex; gap: 10px; margin: 12px 0 4px; }
  .sum div { flex: 1; background: #eef4ff; border-radius: 8px; padding: 8px 10px; }
  .sum b { display: block; font-size: 18pt; color: #1a73e8; }
  .visit { page-break-inside: avoid; border-top: 1px solid #dde3ee; padding-top: 10px; margin-top: 14px; }
  .vh { display: flex; justify-content: space-between; align-items: baseline; }
  h2 { font-size: 15pt; margin: 0; }
  .vh span, .muted, small { color: #5b6576; }
  .notes { padding-left: 18px; margin: 6px 0; }
  .notes li { margin: 4px 0; } .notes small { display: block; font-size: 8.5pt; }
  .photos { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; }
  .photos img { width: 31%; height: 120px; object-fit: cover; border-radius: 6px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10pt; }
  th { text-align: left; background: #f3f6fb; color: #5b6576; font-weight: 600; padding: 6px; }
  td { border-top: 1px solid #e6ebf3; padding: 6px; vertical-align: top; }
  .zh { color: #5b6576; }
  .next { margin-top: 22px; background: #0f1b2d; color: #fff; border-radius: 10px; padding: 14px 16px; page-break-inside: avoid; }
  .next h3 { margin: 0 0 6px; font-size: 13pt; } .next li { margin: 3px 0; } .next a { color: #8ab8ff; }
  </style></head><body>
  <div class="top"><div class="brand">GLOBAL TECH TOUR · ИТОГИ ПОЕЗДКИ</div><h1>${esc(TRIP.title)}</h1>
  <div class="meta">${esc(TRIP.dates)} · ${esc(TRIP.route)}<br/>${esc(ME.ru)}, ${esc(ME.roleRu)}, ${esc(ME.coRu)} · собрано ${esc(when)}</div>
  <div class="sum"><div><b>${visits.length}</b>компаний с заметками</div><div><b>${total.notes}</b>заметок</div><div><b>${total.cards}</b>контактов с визиток</div></div></div>
  ${blocks || '<p class="muted">Заметок и визиток пока нет — добавьте их в карточках визитов.</p>'}
  <div class="next"><h3>Что посмотреть дальше</h3>
  <p>Если эта поездка была полезной — похожие экспедиции Global Tech Tour:</p>
  <ul>${tours.map((t) => `<li>${esc(t.title)}</li>`).join('')}</ul>
  <p>Все программы — <a href="https://globaltechtour.ru">globaltechtour.ru</a>. Координатор подберёт даты под вашу команду.</p></div>
  </body></html>`;
}
