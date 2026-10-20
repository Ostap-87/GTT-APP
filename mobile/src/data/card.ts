// Визитка: разбор распознанного текста на поля и перевод без интернета. Имя — латиницей (пиньинь), должность и
// название компании — по встроенному словарю деловых слов, незнакомые части — пиньинем (так пишут бренды:
// 优必选 → Youbixuan). Полный перевод любого текста появится с сервером (шаг 2); все поля делегат может поправить.
import { pinyin } from 'pinyin-pro';

export type BizCard = {
  id: string; at: string; visit: string; photo?: string; raw: string;
  name: string; latin: string; title: string; titleRu: string; company: string; companyRu: string;
  phones: string[]; email: string; wechat: string; site: string; address: string;
};

export const emptyCard = (visit: string): BizCard => ({
  id: '', at: '', visit, raw: '', name: '', latin: '', title: '', titleRu: '', company: '', companyRu: '', phones: [], email: '', wechat: '', site: '', address: '',
});

/** Деловые слова визиток → русский. Длинные сочетания раньше коротких: перевод идёт жадно, слева направо. */
const DICT: [string, string][] = [
  // должности
  ['首席执行官', 'генеральный директор (CEO)'], ['首席技术官', 'технический директор (CTO)'], ['首席运营官', 'операционный директор (COO)'],
  ['副总经理', 'заместитель генерального директора'], ['总经理', 'генеральный директор'], ['董事长', 'председатель совета директоров'],
  ['副总裁', 'вице-президент'], ['总裁', 'президент'], ['董事', 'член совета директоров'], ['创始人', 'основатель'], ['联合创始人', 'сооснователь'],
  ['合伙人', 'партнёр'], ['总监', 'директор'], ['经理', 'менеджер'], ['主管', 'руководитель'], ['部长', 'начальник отдела'], ['主任', 'руководитель'],
  ['工程师', 'инженер'], ['助理', 'ассистент'], ['秘书', 'секретарь'], ['代表', 'представитель'], ['顾问', 'консультант'], ['专员', 'специалист'],
  ['销售', 'продажи'], ['市场', 'маркетинг'], ['采购', 'закупки'], ['研发', 'НИОКР'], ['技术', 'технологии'], ['商务', 'развитие бизнеса'],
  ['业务', 'бизнес'], ['国际', 'международные'], ['海外', 'зарубежные'], ['外贸', 'внешняя торговля'], ['区域', 'региональные'], ['大客户', 'ключевые клиенты'],
  ['客户', 'клиенты'], ['运营', 'операции'], ['产品', 'продукты'], ['品牌', 'бренды'], ['项目', 'проекты'], ['财务', 'финансы'], ['人力资源', 'персонал'],
  ['部', 'отдел'], ['中心', 'центр'],
  // компании
  ['股份有限公司', 'АО'], ['有限责任公司', 'ООО'], ['有限公司', 'ООО'], ['集团', 'группа'], ['控股', 'холдинг'], ['公司', 'компания'], ['分公司', 'филиал'],
  ['科技', 'технологии'], ['智能', 'интеллектуальные'], ['机器人', 'роботы'], ['人工智能', 'ИИ'], ['电子', 'электроника'], ['汽车', 'автомобили'],
  ['新能源', 'новая энергетика'], ['能源', 'энергетика'], ['贸易', 'торговля'], ['进出口', 'импорт-экспорт'], ['实业', 'промышленная'], ['工业', 'промышленность'],
  ['制造', 'производство'], ['网络', 'сетевые'], ['信息', 'информационные'], ['软件', 'ПО'], ['数据', 'данные'], ['电子商务', 'e-commerce'], ['电商', 'e-commerce'],
  ['物流', 'логистика'], ['供应链', 'цепочки поставок'], ['食品', 'продукты питания'], ['医疗', 'медицина'], ['生物', 'биотех'], ['医药', 'фармацевтика'],
  ['零售', 'ритейл'], ['超市', 'супермаркет'], ['电器', 'бытовая техника'], ['设备', 'оборудование'], ['材料', 'материалы'], ['化工', 'химия'], ['机械', 'машиностроение'],
  ['自动化', 'автоматизация'], ['文化', 'культура'], ['传媒', 'медиа'], ['教育', 'образование'], ['投资', 'инвестиции'], ['金融', 'финансы'], ['发展', 'развитие'],
  ['中国', 'Китай'], ['国际化', 'международные'], ['数字', 'цифровые'], ['视频', 'видео'], ['安防', 'безопасность'], ['云', 'облачные'],
  // города и места
  ['北京', 'Пекин'], ['上海', 'Шанхай'], ['深圳', 'Шэньчжэнь'], ['广州', 'Гуанчжоу'], ['杭州', 'Ханчжоу'], ['苏州', 'Сучжоу'], ['东莞', 'Дунгуань'], ['天津', 'Тяньцзинь'],
  ['重庆', 'Чунцин'], ['成都', 'Чэнду'], ['武汉', 'Ухань'], ['南京', 'Нанкин'], ['宁波', 'Нинбо'], ['青岛', 'Циндао'], ['厦门', 'Сямынь'], ['西安', 'Сиань'],
  ['合肥', 'Хэфэй'], ['长沙', 'Чанша'], ['佛山', 'Фошань'], ['香港', 'Гонконг'], ['义乌', 'Иу'], ['省', 'провинция'], ['市', ''], ['区', 'район'],
];
const DICT_SORTED = [...DICT].sort((a, b) => b[0].length - a[0].length);

const isHan = (ch: string) => /\p{Script=Han}/u.test(ch);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const py = (s: string) => pinyin(s, { toneType: 'none', type: 'array' }).join('');

/** Перевод по словарю: известные слова — по-русски, остальные иероглифы — пиньинем одним словом. */
export function translateZh(text: string): string {
  const out: string[] = [];
  let i = 0;
  let unknown = '';
  const flush = () => { if (unknown) { out.push(cap(py(unknown))); unknown = ''; } };
  while (i < text.length) {
    const hit = DICT_SORTED.find(([zh]) => text.startsWith(zh, i));
    if (hit) { flush(); if (hit[1]) out.push(hit[1]); i += hit[0].length; continue; }
    const ch = text[i];
    if (isHan(ch)) unknown += ch;
    else { flush(); if (ch.trim()) out.push(ch); }
    i += 1;
  }
  flush();
  return out.join(' ').replace(/\s+([,.)])/g, '$1').replace(/\s{2,}/g, ' ').trim();
}

/** Главное слово должности (стоит в конце) и «по чему»: 海外销售总监 → директор по зарубежным продажам. */
const HEADS: [string, string][] = [
  ['副总经理', 'заместитель генерального директора'], ['总经理', 'генеральный директор'], ['董事长', 'председатель совета директоров'],
  ['副总裁', 'вице-президент'], ['总裁', 'президент'], ['联合创始人', 'сооснователь'], ['创始人', 'основатель'], ['合伙人', 'партнёр'],
  ['总监', 'директор'], ['经理', 'менеджер'], ['主管', 'руководитель'], ['部长', 'начальник отдела'], ['主任', 'руководитель'],
  ['工程师', 'инженер'], ['助理', 'ассистент'], ['代表', 'представитель'], ['顾问', 'консультант'], ['专员', 'специалист'], ['秘书', 'секретарь'],
];
const PO: [string, string][] = [
  ['人力资源', 'персоналу'], ['大客户', 'ключевым клиентам'], ['海外', 'зарубежным'], ['国际', 'международным'], ['外贸', 'внешней торговле'],
  ['区域', 'региональным'], ['销售', 'продажам'], ['市场', 'маркетингу'], ['采购', 'закупкам'], ['研发', 'НИОКР'], ['技术', 'технологиям'],
  ['商务', 'развитию бизнеса'], ['业务', 'бизнесу'], ['客户', 'работе с клиентами'], ['运营', 'операциям'], ['产品', 'продукту'],
  ['品牌', 'бренду'], ['项目', 'проектам'], ['财务', 'финансам'], ['部', ''],
];
export function translateTitle(title: string): string {
  const t = title.replace(/\s/g, '');
  const head = HEADS.find(([zh]) => t.endsWith(zh));
  if (!head) return translateZh(t);
  let rest = t.slice(0, t.length - head[0].length);
  const mods: string[] = [];
  while (rest) {
    const m = PO.find(([zh]) => rest.startsWith(zh));
    if (!m) return `${head[1]} · ${translateZh(rest)}`;
    if (m[1]) mods.push(m[1]);
    rest = rest.slice(m[0].length);
  }
  return mods.length ? `${head[1]} по ${mods.join(' ')}` : head[1];
}

/** Название компании: правовая форма вперёд, остальное в кавычках — АО «Шэньчжэнь Youbixuan Технологии». */
const FORMS: [string, string][] = [['股份有限公司', 'АО'], ['有限责任公司', 'ООО'], ['有限公司', 'ООО']];
export function translateCompany(company: string): string {
  const c = company.replace(/\s/g, '');
  const form = FORMS.find(([zh]) => c.endsWith(zh));
  const body = translateZh(form ? c.slice(0, c.length - form[0].length) : c).split(' ').map(cap).join(' ');
  return form ? `${form[1]} «${body}»` : body;
}

const COMPOUND = ['欧阳', '司马', '诸葛', '上官', '东方', '慕容', '令狐', '皇甫', '尉迟', '长孙', '夏侯', '公孙'];
/** Имя латиницей, как в паспорте: фамилия отдельно, имя слитно — 王小明 → Wang Xiaoming. */
export function nameLatin(name: string): string {
  const han = [...name].filter(isHan).join('');
  if (!han) return '';
  const sur = COMPOUND.includes(han.slice(0, 2)) ? 2 : 1;
  return [cap(py(han.slice(0, sur))), cap(py(han.slice(sur)))].filter(Boolean).join(' ');
}

const TITLE_RE = /(首席|总经理|董事|总裁|创始人|合伙人|总监|经理|主管|部长|主任|工程师|助理|秘书|代表|顾问|专员|销售|CEO|CTO|COO|Manager|Director|President|Founder|Engineer|Sales|Officer|Head of)/i;
const COMPANY_RE = /(有限公司|集团|公司|科技|控股|Co\.|Ltd|Inc|Group|Corporation|Technology|Technologies)/i;
const ADDR_RE = /(地址|路\d|号|街|大道|大厦|园区|Road|Street|Avenue|District|Building|Room)/i;
const LABEL_RE = /^(电话|手机|传真|邮箱|邮件|地址|网址|微信|Tel|Mob|Mobile|Phone|Fax|E-?mail|Add|Address|Web|WeChat)\s*[:：]?\s*/i;

/** Разбор распознанного текста. lines — строки с высотой букв (самая крупная строка без цифр — обычно имя). */
export function parseCard(text: string, lines: { text: string; h?: number }[] = []): Omit<BizCard, 'id' | 'at' | 'visit' | 'photo'> {
  // распознавание ставит пробелы между иероглифами — убираем
  const clean = (s: string) => s.replace(/(\p{Script=Han})\s+(?=\p{Script=Han})/gu, '$1').replace(/[|]+/g, ' ').trim();
  const src: { text: string; h?: number }[] = lines.length ? lines : text.split('\n').map((t) => ({ text: t }));
  const rows = src.map((l) => ({ ...l, text: clean(l.text) })).filter((l) => l.text.length > 1);
  const all = rows.map((r) => r.text).join('\n');

  const phones = [...new Set((all.match(/(?:\+?86[\s-]?)?(?:1[3-9]\d[\s-]?\d{4}[\s-]?\d{4}|0\d{2,3}[\s-]?\d{3,4}[\s-]?\d{4})/g) || []).map((p) => p.replace(/\s+/g, ' ').trim()))];
  const email = (all.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/) || [''])[0];
  const site = (all.match(/(?:https?:\/\/)?www\.[\w-]+(?:\.[\w-]+)+/i) || [''])[0];
  const wechatLine = rows.find((r) => /微信|WeChat/i.test(r.text));
  const wechat = wechatLine ? wechatLine.text.replace(/.*(微信|WeChat)\s*(号)?\s*[:：]?\s*/i, '').split(/\s/)[0] : '';

  const used = new Set<string>();
  const pick = (pred: (t: string) => boolean) => {
    const r = rows.find((x) => !used.has(x.text) && pred(x.text));
    if (r) used.add(r.text);
    return r ? r.text.replace(LABEL_RE, '') : '';
  };
  const company = pick((t) => COMPANY_RE.test(t) && !/@/.test(t));
  const title = pick((t) => TITLE_RE.test(t) && t.length <= 40);
  const address = pick((t) => ADDR_RE.test(t) && !TITLE_RE.test(t));
  // имя: короткая строка из 2–4 иероглифов (или 2–3 латинских слов) без цифр; среди таких — самая крупная
  const nameRows = rows.filter((r) => !used.has(r.text) && !/\d|@/.test(r.text) && (/^\p{Script=Han}{2,4}$/u.test(r.text.replace(/\s/g, '')) || /^[A-Z][a-z]+(?:\s[A-Z][a-z]+){1,2}$/.test(r.text)));
  const nameRow = nameRows.sort((a, b) => (b.h || 0) - (a.h || 0))[0];
  const name = nameRow ? nameRow.text.replace(/\s/g, /^\p{Script=Han}/u.test(nameRow.text) ? '' : ' ') : '';

  return {
    raw: all, name, latin: /\p{Script=Han}/u.test(name) ? nameLatin(name) : name,
    title, titleRu: /\p{Script=Han}/u.test(title) ? translateTitle(title) : '',
    company, companyRu: /\p{Script=Han}/u.test(company) ? translateCompany(company) : '',
    phones, email, wechat, site, address,
  };
}
