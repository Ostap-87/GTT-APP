// Даты и размеры для интерфейса. Даты приходят как YYYY-MM-DD (время Китая).
const WD_ZH = '日一二三四五六';
const WD_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parts(date) {
  const [y, m, d] = String(date).split('-').map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { y, m, d, wd };
}

// «11月10日（周二）» / «Tue, Nov 10»
function dateLabel(date, lang) {
  if (!date) return '';
  const p = parts(date);
  return lang === 'en' ? `${WD_EN[p.wd]}, ${MON_EN[p.m - 1]} ${p.d}` : `${p.m}月${p.d}日（周${WD_ZH[p.wd]}）`;
}

// «11月10日» / «Nov 10»
function shortDate(date, lang) {
  if (!date) return '';
  const p = parts(date);
  return lang === 'en' ? `${MON_EN[p.m - 1]} ${p.d}` : `${p.m}月${p.d}日`;
}

function today() {
  const d = new Date(Date.now() + 8 * 3600 * 1000); // время Пекина
  return d.toISOString().slice(0, 10);
}

function sizeLabel(mb) {
  return mb >= 1 ? `${Math.round(mb)} MB` : `${Math.max(1, Math.round(mb * 1024))} KB`;
}

function fileExt(name) {
  const ext = String(name || '').split('.').pop().toUpperCase();
  return ext.length <= 4 ? ext : 'FILE';
}

function yuan(fen) {
  return (Number(fen || 0) / 100).toFixed(2);
}

module.exports = { dateLabel, shortDate, today, sizeLabel, fileExt, yuan };
