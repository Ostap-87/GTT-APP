// Распознавание текста визитки прямо на телефоне: tesseract.js (китайский + английский) в скрытом WebView.
// В первый раз скачивает распознаватель и китайский словарь (несколько МБ) — дальше они лежат в кэше WebView.
// Сообщения: ready, progress (status, p 0–1), result (text, lines с высотой букв), error.
export const OCR_HTML = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body>
<script src="https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js"></script>
<script>
var send = function (m) {
  try { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(m)); else parent.postMessage({ gttOcr: m }, '*'); } catch (e) {}
};
var workerP = null;
function worker() {
  if (!workerP) workerP = Tesseract.createWorker(['chi_sim', 'eng'], 1, { logger: function (m) { send({ type: 'progress', status: m.status, p: m.progress || 0 }); } });
  return workerP;
}
function linesOf(data) {
  if (data.lines && data.lines.length) return data.lines;
  var out = [];
  (data.blocks || []).forEach(function (b) { (b.paragraphs || []).forEach(function (p) { (p.lines || []).forEach(function (l) { out.push(l); }); }); });
  return out;
}
async function run(img) {
  try {
    var w = await worker();
    var r = await w.recognize(img, {}, { text: true, blocks: true });
    var lines = linesOf(r.data).map(function (l) { return { text: l.text, h: l.bbox ? l.bbox.y1 - l.bbox.y0 : 0 }; });
    send({ type: 'result', text: r.data.text || '', lines: lines });
  } catch (e) { workerP = null; send({ type: 'error', message: String((e && e.message) || e) }); }
}
function onMsg(e) {
  var d = e.data;
  if (typeof d === 'string') { try { d = JSON.parse(d); } catch (x) { return; } }
  if (d && d.gttOcrRun) run(d.gttOcrRun);
}
window.addEventListener('message', onMsg);
document.addEventListener('message', onMsg);
send({ type: 'ready', ok: typeof Tesseract !== 'undefined' });
</script></body></html>`;

export type OcrEvent =
  | { type: 'ready'; ok: boolean }
  | { type: 'progress'; status: string; p: number }
  | { type: 'result'; text: string; lines: { text: string; h: number }[] }
  | { type: 'error'; message: string };

/** Подпись прогресса по-русски. */
export function ocrStage(status: string, p: number) {
  const pct = Math.round(p * 100);
  if (/load|download|initializ/i.test(status)) return `Готовлю распознавание${pct ? ` · ${pct}%` : ''} (в первый раз скачивается словарь)`;
  if (/recogniz/i.test(status)) return `Читаю визитку · ${pct}%`;
  return 'Готовлю распознавание…';
}
