// Города и сети для разделов «Аптеки» и «Фруктовые лавки» (решение пользователя 26.10.2026): главные города, куда летят
// туристы и деловые делегации. Город раздел берёт из поездки (CITY[TRIP.today]); нет его в списке — ближайший в пределах
// 150 км, иначе город выбирают вручную. Адресов магазинов здесь нет и не будет: только слова для поиска на карте.
// Сети проверены по открытым источникам 26.10.2026 (docs/apteki-frukty.md): в списке — только те, о присутствии которых
// в городе или его провинции есть данные; остальное — «ищите на карте».
import { pinyin } from 'pinyin-pro';

import { CITIES } from './geo';
import { t, type Tx } from './lang';
import { CITY, TRIP } from './trip';

export type Region = 'cn' | 'hk' | 'mo';
export type Chain = { id: string; zh: string; lat: string; from: Tx; note?: Tx };
export type LocalFruit = { zh: string; fruit: string; tx?: Tx };
export type ShopCity = {
  id: string; zh: string; name: Tx; region: Region;
  /** Другие написания города в данных поездки. */
  alias?: string[];
  /** Координаты — для городов, которых нет в data/geo/cities.json. */
  lat?: number; lng?: number;
  ph: string[]; fr: string[]; local?: LocalFruit[]; note?: Tx;
};

const N = {
  beijing: t('Пекин', 'Beijing', 'Бейжің', 'Pekin'),
  shanghai: t('Шанхай', 'Shanghai', 'Шанхай', 'Shanxay'),
  guangzhou: t('Гуанчжоу', 'Guangzhou', 'Гуанчжоу', 'Guanchjou'),
  shenzhen: t('Шэньчжэнь', 'Shenzhen', 'Шэньчжэнь', 'Shenchjen'),
  hangzhou: t('Ханчжоу', 'Hangzhou', 'Ханчжоу', 'Xanchjou'),
  changsha: t('Чанша', 'Changsha', 'Чанша', 'Chansha'),
  chongqing: t('Чунцин', 'Chongqing', 'Чунцин', 'Chunsin'),
  nanjing: t('Нанкин', 'Nanjing', 'Нанкин', 'Nankin'),
  suzhou: t('Сучжоу', 'Suzhou', 'Сучжоу', 'Suchjou'),
  harbin: t('Харбин', 'Harbin', 'Харбин', 'Xarbin'),
  tianjin: t('Тяньцзинь', 'Tianjin', 'Тяньцзинь', 'Tyanszin'),
  xian: t('Сиань', "Xi'an", 'Сиань', 'Sian'),
  kunming: t('Куньмин', 'Kunming', 'Куньмин', 'Kunming'),
  jinan: t('Цзинань (Шаньдун)', 'Jinan (Shandong)', 'Цзинань (Шаньдун)', 'Szinan (Shandun)'),
  hongkong: t('Гонконг', 'Hong Kong', 'Гонконг', 'Gonkong'),
};

/** Сети аптек: from — откуда сеть (головной офис). */
export const PHARMA: Record<string, Chain> = {
  guoda: { id: 'guoda', zh: '国大药房', lat: 'Guoda (Sinopharm)', from: N.shanghai },
  laobaixing: { id: 'laobaixing', zh: '老百姓大药房', lat: 'LBX Pharmacy', from: N.changsha },
  yifeng: { id: 'yifeng', zh: '益丰大药房', lat: 'Yifeng', from: N.changsha },
  dashenlin: { id: 'dashenlin', zh: '大参林', lat: 'Dashenlin', from: N.guangzhou },
  yixintang: { id: 'yixintang', zh: '一心堂', lat: 'Yixintang', from: N.kunming },
  nepstar: { id: 'nepstar', zh: '海王星辰', lat: 'Nepstar', from: N.shenzhen },
  tongrentang: {
    id: 'tongrentang', zh: '同仁堂', lat: 'Tong Ren Tang', from: N.beijing,
    note: t('Старейшая марка китайской медицины; есть и обычные лекарства', 'Historic Chinese-medicine brand; also sells regular medicines', 'Қытай медицинасының көне бренді; кәдімгі дәрілер де бар', 'Xitoy tabobatining qadimiy brendi; oddiy dorilar ham bor'),
  },
  jinxiang: { id: 'jinxiang', zh: '金象大药房', lat: 'Jinxiang', from: N.beijing },
  diyi: { id: 'diyi', zh: '第一医药', lat: 'Shanghai No.1 Pharmacy', from: N.shanghai },
  leiyunshang: {
    id: 'leiyunshang', zh: '雷允上', lat: 'Lei Yun Shang', from: N.suzhou,
    note: t('Аптечная марка с 1734 года', 'Pharmacy brand since 1734', '1734 жылдан бергі дәріхана бренді', '1734-yildan beri dorixona brendi'),
  },
  huqingyutang: {
    id: 'huqingyutang', zh: '胡庆余堂', lat: 'Hu Qing Yu Tang', from: N.hangzhou,
    note: t('Аптека китайской медицины с 1874 года; старое здание — музей', 'Chinese-medicine pharmacy since 1874; the old building is a museum', '1874 жылдан бергі қытай медицинасы дәріханасы; ескі ғимараты — мұражай', '1874-yildan beri Xitoy tabobati dorixonasi; eski binosi — muzey'),
  },
  jiuzhou: { id: 'jiuzhou', zh: '九洲大药房', lat: 'Jiuzhou (China Jo-Jo)', from: N.hangzhou },
  heping: { id: 'heping', zh: '和平药房', lat: 'Heping', from: N.chongqing },
  tongjunge: { id: 'tongjunge', zh: '桐君阁大药房', lat: 'Tongjunge', from: N.chongqing },
  xinhu: { id: 'xinhu', zh: '鑫斛药房', lat: 'Xinhu', from: N.chongqing },
  yikang: { id: 'yikang', zh: '怡康医药', lat: 'Yikang', from: N.xian },
  baixin: { id: 'baixin', zh: '百信药房', lat: 'Baixin (Nanjing Pharmaceutical)', from: N.nanjing },
  xiansheng: { id: 'xiansheng', zh: '先声再康', lat: 'Simcere Zaikang', from: N.nanjing },
  renmintongtai: { id: 'renmintongtai', zh: '人民同泰', lat: 'Renmin Tongtai', from: N.harbin },
  shuyu: { id: 'shuyu', zh: '漱玉平民', lat: 'Shuyu Pingmin', from: N.jinan },
  jinyitang: { id: 'jinyitang', zh: '津一堂', lat: 'Jinyitang', from: N.tianjin },
  ruicheng: { id: 'ruicheng', zh: '瑞澄大药房', lat: 'Ruicheng', from: N.tianjin },
  watsons: {
    id: 'watsons', zh: '屈臣氏', lat: 'Watsons', from: N.hongkong,
    note: t('Сеть магазинов здоровья и красоты; в части магазинов — аптечный отдел с фармацевтом', 'Health & beauty chain; some stores have a pharmacy counter', 'Денсаулық және сұлулық дүкендері; кейбірінде фармацевті бар дәріхана бөлімі', 'Salomatlik va goʻzallik doʻkonlari; ayrimlarida farmatsevtli dorixona boʻlimi bor'),
  },
  mannings: {
    id: 'mannings', zh: '萬寧', lat: 'Mannings', from: N.hongkong,
    note: t('Сеть магазинов здоровья и красоты; в части магазинов — аптечный отдел', 'Health & beauty chain; some stores have a pharmacy counter', 'Денсаулық және сұлулық дүкендері; кейбірінде дәріхана бөлімі', 'Salomatlik va goʻzallik doʻkonlari; ayrimlarida dorixona boʻlimi bor'),
  },
};
/** Крупные сети страны: могут оказаться в любом городе — но это надо проверять на карте. */
export const PHARMA_NATIONAL = ['guoda', 'laobaixing', 'yifeng', 'dashenlin', 'yixintang', 'nepstar'];

export const FRUIT_CHAINS: Record<string, Chain> = {
  pagoda: {
    id: 'pagoda', zh: '百果园', lat: 'Pagoda', from: N.shenzhen,
    note: t('Самая большая фруктовая сеть Китая: около 4 700 лавок в 180+ городах', 'China’s largest fruit chain: about 4,700 shops in 180+ cities', 'Қытайдағы ең ірі жеміс желісі: 180-нен астам қалада 4 700-ге жуық дүкен', 'Xitoydagi eng yirik meva tarmogʻi: 180 dan ortiq shaharda 4 700 ga yaqin doʻkon'),
  },
  guoduomei: {
    id: 'guoduomei', zh: '果多美', lat: 'Guoduomei', from: N.beijing,
    note: t('Пекинская сеть (группа Pagoda)', 'Beijing chain (Pagoda group)', 'Бейжің желісі (Pagoda тобы)', 'Pekin tarmogʻi (Pagoda guruhi)'),
  },
  xianfeng: {
    id: 'xianfeng', zh: '鲜丰水果', lat: 'Xianfeng Fruit', from: N.hangzhou,
    note: t('Сеть из Чжэцзяна: Чжэцзян, Шанхай, Цзянсу, Аньхой, Чунцин', 'Zhejiang chain: Zhejiang, Shanghai, Jiangsu, Anhui, Chongqing', 'Чжэцзян желісі: Чжэцзян, Шанхай, Цзянсу, Аньхой, Чунцин', 'Chjeszyan tarmogʻi: Chjeszyan, Shanxay, Szyansu, Anxoy, Chunsin'),
  },
  ymt: {
    id: 'ymt', zh: '油麻地果欄', lat: 'Yau Ma Tei Fruit Market', from: N.hongkong,
    note: t('Старый оптовый фруктовый рынок; вокруг — розничные лавки', 'Historic wholesale fruit market with retail stalls around it', 'Көне көтерме жеміс базары; айналасында бөлшек дүкендер', 'Eski ulgurji meva bozori; atrofida chakana rastalar'),
  },
  parknshop: { id: 'parknshop', zh: '百佳', lat: 'PARKnSHOP', from: N.hongkong, note: t('Супермаркеты', 'Supermarkets', 'Супермаркеттер', 'Supermarketlar') },
  wellcome: { id: 'wellcome', zh: '惠康', lat: 'Wellcome', from: N.hongkong, note: t('Супермаркеты', 'Supermarkets', 'Супермаркеттер', 'Supermarketlar') },
  redmarket: {
    id: 'redmarket', zh: '紅街市', lat: 'Red Market (Mercado Vermelho)', from: t('Макао', 'Macao', 'Макао', 'Makao'),
    note: t('Городской рынок: фрукты — на верхнем этаже и на уличном базаре рядом', 'Municipal market: fruit upstairs and at the street bazaar outside', 'Қалалық базар: жемістер — жоғарғы қабатта және жанындағы көше базарында', 'Shahar bozori: mevalar — yuqori qavatda va yonidagi koʻcha bozorida'),
  },
};

export const SHOP_CITIES: ShopCity[] = [
  { id: 'beijing', zh: '北京', name: N.beijing, region: 'cn', ph: ['tongrentang', 'jinxiang', 'guoda'], fr: ['guoduomei', 'pagoda'],
    local: [{ zh: '平谷大桃', fruit: 'peach' }, { zh: '大兴西瓜', fruit: 'watermelon' }] },
  { id: 'shanghai', zh: '上海', name: N.shanghai, region: 'cn', ph: ['diyi', 'leiyunshang', 'guoda', 'yifeng'], fr: ['pagoda', 'xianfeng'],
    local: [{ zh: '南汇水蜜桃', fruit: 'peach' }, { zh: '马陆葡萄', fruit: 'grape' }] },
  { id: 'guangzhou', zh: '广州', name: N.guangzhou, region: 'cn', ph: ['dashenlin'], fr: ['pagoda'],
    local: [{ zh: '增城荔枝', fruit: 'lychee' }, { zh: '从化荔枝', fruit: 'lychee' }] },
  { id: 'shenzhen', zh: '深圳', name: N.shenzhen, region: 'cn', ph: ['nepstar', 'dashenlin'], fr: ['pagoda'],
    local: [{ zh: '南山荔枝', fruit: 'lychee' }] },
  { id: 'foshan', zh: '佛山', name: t('Фошань', 'Foshan', 'Фошань', 'Foshan'), region: 'cn', ph: ['dashenlin'], fr: ['pagoda'] },
  { id: 'hangzhou', zh: '杭州', name: N.hangzhou, region: 'cn', ph: ['huqingyutang', 'jiuzhou', 'yifeng'], fr: ['xianfeng', 'pagoda'],
    local: [{ zh: '塘栖枇杷', fruit: 'loquat' }, { zh: '仙居杨梅', fruit: 'bayberry' }] },
  { id: 'suzhou', zh: '苏州', name: N.suzhou, region: 'cn', ph: ['leiyunshang'], fr: ['xianfeng', 'pagoda'],
    local: [{ zh: '东山枇杷', fruit: 'loquat' }] },
  { id: 'nanjing', zh: '南京', name: N.nanjing, region: 'cn', ph: ['yifeng', 'baixin', 'xiansheng'], fr: ['xianfeng', 'pagoda'] },
  { id: 'chengdu', zh: '成都', name: t('Чэнду', 'Chengdu', 'Чэнду', 'Chengdu'), region: 'cn', ph: ['yixintang', 'heping'], fr: ['pagoda'],
    local: [{ zh: '蒲江猕猴桃', fruit: 'kiwi' }, { zh: '龙泉驿水蜜桃', fruit: 'peach' }] },
  { id: 'chongqing', zh: '重庆', name: N.chongqing, region: 'cn', ph: ['heping', 'tongjunge', 'xinhu', 'yixintang'], fr: ['xianfeng', 'pagoda'],
    local: [{ zh: '奉节脐橙', fruit: 'orange' }] },
  { id: 'xi-an', zh: '西安', name: N.xian, region: 'cn', ph: ['yikang', 'laobaixing'], fr: ['pagoda'],
    local: [{ zh: '周至猕猴桃', fruit: 'kiwi' }, { zh: '临潼石榴', fruit: 'pomegranate' }] },
  { id: 'wuhan', zh: '武汉', name: t('Ухань', 'Wuhan', 'Ухань', 'Uxan'), region: 'cn', ph: ['yifeng'], fr: ['pagoda'] },
  { id: 'changsha', zh: '长沙', name: N.changsha, region: 'cn', ph: ['laobaixing', 'yifeng'], fr: ['pagoda'],
    local: [{ zh: '炎陵黄桃', fruit: 'peach', tx: t('жёлтый персик', 'yellow peach', 'сары шабдалы', 'sariq shaftoli') }, { zh: '麻阳冰糖橙', fruit: 'orange' }] },
  { id: 'xiamen', zh: '厦门', name: t('Сямэнь', 'Xiamen', 'Сямэнь', 'Syamen'), region: 'cn', alias: ['Сямынь'], ph: [], fr: ['pagoda'],
    local: [{ zh: '琯溪蜜柚', fruit: 'pomelo' }] },
  { id: 'sanya', zh: '三亚', name: t('Санья', 'Sanya', 'Санья', 'Sanya'), region: 'cn', lat: 18.25, lng: 109.51, ph: ['yixintang'], fr: ['pagoda'],
    local: [{ zh: '三亚芒果', fruit: 'mango' }, { zh: '椰子', fruit: 'coconut' }],
    note: t(
      'Санья — курорт: в аптеках спрашивают средства от солнечных ожогов и укачивания. На рынках для туристов фрукты дороже — смотрите цену за 斤 и сравнивайте с сетевыми лавками.',
      'Sanya is a resort: pharmacies are used to requests for sunburn and motion-sickness remedies. Fruit at tourist markets costs more — check the price per 斤 and compare with chain shops.',
      'Санья — курорт: дәріханаларда күнге күюге және көлікте жүрек айнуына қарсы дәрілерді жиі сұрайды. Туристерге арналған базарда жеміс қымбатырақ — 斤 бағасын қарап, желілік дүкендермен салыстырыңыз.',
      'Sanya — kurort: dorixonalarda quyoshda kuyish va yoʻlda koʻngil aynishiga qarshi vositalarni koʻp soʻrashadi. Turistlar bozorida mevalar qimmatroq — 斤 narxini koʻrib, tarmoq doʻkonlari bilan solishtiring.',
    ) },
  { id: 'harbin', zh: '哈尔滨', name: N.harbin, region: 'cn', ph: ['renmintongtai', 'dashenlin'], fr: ['pagoda'],
    local: [{ zh: '冻梨', fruit: 'pear', tx: t('мороженая груша — зимнее лакомство', 'frozen pear — a winter treat', 'мұздатылған алмұрт — қысқы тағам', 'muzlatilgan nok — qishki taom') }],
    note: t(
      'Харбин: зимой бывает −30 °C. В аптеках и магазинах есть грелки-наклейки 暖宝宝 (nuǎnbǎobǎo) и мазь от обморожения 冻疮膏 (dòngchuānggāo).',
      'Harbin: winter can reach −30 °C. Pharmacies and shops sell stick-on heat packs 暖宝宝 (nuǎnbǎobǎo) and frostbite ointment 冻疮膏 (dòngchuānggāo).',
      'Харбин: қыста −30 °C болады. Дәріханалар мен дүкендерде жапсырмалы жылытқыш 暖宝宝 (nuǎnbǎobǎo) және үсікке қарсы жақпамай 冻疮膏 (dòngchuānggāo) бар.',
      'Xarbin: qishda −30 °C boʻladi. Dorixona va doʻkonlarda yopishtiriladigan isitgich 暖宝宝 (nuǎnbǎobǎo) va sovuq urishiga qarshi malham 冻疮膏 (dòngchuānggāo) bor.',
    ) },
  { id: 'qingdao', zh: '青岛', name: t('Циндао', 'Qingdao', 'Циндао', 'Sindao'), region: 'cn', ph: ['shuyu'], fr: ['pagoda'],
    local: [{ zh: '大泽山葡萄', fruit: 'grape' }, { zh: '烟台大樱桃', fruit: 'cherry' }] },
  { id: 'tianjin', zh: '天津', name: N.tianjin, region: 'cn', ph: ['jinyitang', 'ruicheng', 'laobaixing'], fr: ['pagoda'],
    local: [{ zh: '茶淀玫瑰香葡萄', fruit: 'grape' }, { zh: '沙窝萝卜', fruit: 'radish', tx: t('редька, которую едят сырой, как фрукт', 'radish eaten raw like a fruit', 'жеміс сияқты шикі жейтін шалғам', 'meva kabi xom yeyiladigan turp') }] },
  { id: 'hongkong', zh: '香港', name: N.hongkong, region: 'hk', ph: ['watsons', 'mannings'], fr: ['ymt', 'parknshop', 'wellcome'],
    note: t(
      'Гонконг — свои правила. Говорят на кантонском и английском, иероглифы традиционные, пиньинь не поможет — показывайте карточку с английской строкой. Деньги — гонконгские доллары (HKD): карта Octopus, наличные; материковые Alipay и WeChat Pay принимают во многих магазинах.',
      'Hong Kong has its own rules. People speak Cantonese and English and use traditional characters, so pinyin will not help — show the card with its English line. Money: Hong Kong dollars (HKD) — Octopus card, cash; mainland Alipay and WeChat Pay are accepted in many shops.',
      'Гонконгтың өз ережелері бар. Кантон және ағылшын тілдерінде сөйлейді, иероглифтер дәстүрлі, пиньинь көмектеспейді — ағылшынша жолы бар карточканы көрсетіңіз. Ақша — гонконг доллары (HKD): Octopus картасы, қолма-қол; материктік Alipay мен WeChat Pay көп дүкенде қабылданады.',
      'Gonkongning oʻz qoidalari bor. Kanton va ingliz tillarida gaplashishadi, ierogliflar anʼanaviy, pinyin yordam bermaydi — inglizcha qatori bor kartochkani koʻrsating. Pul — Gonkong dollari (HKD): Octopus kartasi, naqd pul; materik Alipay va WeChat Pay koʻp doʻkonlarda qabul qilinadi.',
    ) },
  { id: 'macau', zh: '澳门', name: t('Макао', 'Macao', 'Макао', 'Makao'), region: 'mo', lat: 22.19, lng: 113.54, alias: ['Аомынь'], ph: ['watsons'], fr: ['redmarket'],
    note: t(
      'Макао: говорят на кантонском и португальском, путунхуа понимают многие. Деньги — патаки (MOP), гонконгские доллары берут почти везде; материковые Alipay и WeChat Pay — во многих магазинах. Номер 999 (110 и 112 тоже соединяют).',
      'Macao: people speak Cantonese and Portuguese, many understand Mandarin. Money: patacas (MOP); Hong Kong dollars are accepted almost everywhere, mainland Alipay and WeChat Pay in many shops. Emergency 999 (110 and 112 also connect).',
      'Макао: кантон және португал тілдерінде сөйлейді, путунхуаны көбі түсінеді. Ақша — патака (MOP), гонконг долларын барлық жерде дерлік алады; материктік Alipay мен WeChat Pay — көп дүкенде. Нөмір 999 (110 және 112 де қосады).',
      'Makao: kanton va portugal tillarida gaplashishadi, putunxuani koʻpchilik tushunadi. Pul — pataka (MOP), Gonkong dollarini deyarli hamma joyda olishadi; materik Alipay va WeChat Pay — koʻp doʻkonlarda. Raqam 999 (110 va 112 ham ulaydi).',
    ) },
];

export const shopCity = (id: string) => SHOP_CITIES.find((c) => c.id === id);

/** Экстренный номер скорой: на материке 120, в Гонконге и Макао 999. */
export const ambulanceOf = (c: ShopCity) => (c.region === 'cn' ? '120' : '999');

const coords = (c: ShopCity) => {
  const g = CITIES.find((x) => x.id === c.id);
  return g ? { lat: g.lat, lng: g.lng } : c.lat != null && c.lng != null ? { lat: c.lat, lng: c.lng } : null;
};
const km = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const r = Math.PI / 180;
  const x = (b.lng - a.lng) * r * Math.cos(((a.lat + b.lat) / 2) * r);
  const y = (b.lat - a.lat) * r;
  return Math.sqrt(x * x + y * y) * 6371;
};

/** Город раздела по поездке: точное совпадение, иначе ближайший из списка в пределах 150 км. */
export function cityFromTrip(): { city: ShopCity; tripRu: string; near: boolean } | null {
  if (TRIP.country !== 'cn') return null;
  const ru = CITY[TRIP.today] || CITY[0] || '';
  const exact = SHOP_CITIES.find((c) => c.name.ru === ru || c.alias?.includes(ru));
  if (exact) return { city: exact, tripRu: ru, near: false };
  const g = CITIES.find((x) => x.ru === ru && x.country === 'cn');
  if (!g) return null;
  let best: ShopCity | null = null;
  let bestKm = 150;
  for (const c of SHOP_CITIES) {
    const p = coords(c);
    if (!p) continue;
    const d = km(g, p);
    if (d < bestKm) { best = c; bestKm = d; }
  }
  return best ? { city: best, tripRu: ru, near: true } : null;
}

/** Слова для поиска на карте: [слово, что значит]. */
export type SearchWord = [string, Tx];
export const PHARMA_WORDS: Record<Region, SearchWord[]> = {
  cn: [
    ['药店', t('аптека', 'pharmacy', 'дәріхана', 'dorixona')],
    ['24小时药店', t('круглосуточная аптека', '24-hour pharmacy', 'тәулік бойы жұмыс істейтін дәріхана', 'kecha-kunduz ishlaydigan dorixona')],
    ['药房', t('аптека (другое слово)', 'pharmacy (another word)', 'дәріхана (басқа сөз)', 'dorixona (boshqa soʻz)')],
  ],
  hk: [
    ['藥房', t('аптека с фармацевтом', 'pharmacy with a pharmacist', 'фармацевті бар дәріхана', 'farmatsevtli dorixona')],
    ['Pharmacy', t('аптека', 'pharmacy', 'дәріхана', 'dorixona')],
  ],
  mo: [
    ['藥房', t('аптека', 'pharmacy', 'дәріхана', 'dorixona')],
    ['Farmácia', t('аптека (по-португальски)', 'pharmacy (Portuguese)', 'дәріхана (португалша)', 'dorixona (portugalcha)')],
  ],
};
export const FRUIT_WORDS: Record<Region, SearchWord[]> = {
  cn: [
    ['水果店', t('фруктовая лавка', 'fruit shop', 'жеміс дүкені', 'meva doʻkoni')],
    ['百果园', t('сеть Pagoda', 'Pagoda chain', 'Pagoda желісі', 'Pagoda tarmogʻi')],
    ['果切', t('нарезанные фрукты', 'cut fruit', 'туралған жемістер', 'toʻgʻralgan mevalar')],
  ],
  hk: [
    ['生果', t('фрукты (по-кантонски)', 'fruit (Cantonese)', 'жемістер (кантонша)', 'mevalar (kantoncha)')],
    ['Fruit shop', t('фруктовая лавка', 'fruit shop', 'жеміс дүкені', 'meva doʻkoni')],
  ],
  mo: [
    ['生果', t('фрукты (по-кантонски)', 'fruit (Cantonese)', 'жемістер (кантонша)', 'mevalar (kantoncha)')],
    ['街市', t('городской рынок', 'municipal market', 'қалалық базар', 'shahar bozori')],
  ],
};

/** Ссылка на поиск рядом: на материке — Amap (откроет приложение, если оно стоит), в Гонконге и Макао — Google Карты. */
export function mapSearchUrl(word: string, c: ShopCity) {
  if (c.region === 'cn') return `https://uri.amap.com/search?keyword=${encodeURIComponent(word)}&city=${encodeURIComponent(c.zh)}&callnative=1&src=gtt`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${word} ${c.name.en}`)}`;
}

// ——— пиньинь ———
// pinyin-pro ошибается в редких многозначных иероглифах и не ставит лёгкий тон — такие слова задаём вручную
// (весь список фраз проверен глазами 26.10.2026). Суффикс 子 после слога — лёгкий тон (嗓子 sǎngzi, 椰子 yēzi).
const PY_WORDS: [string, string][] = [
  ['大参林', 'dà shēn lín'], ['想吐', 'xiǎng tù'], ['睡不着', 'shuì bu zháo'], ['恶心', 'ě xin'], ['眼睛', 'yǎn jing'],
  ['舒服', 'shū fu'], ['石榴', 'shí liu'], ['葡萄', 'pú tao'],
];
const pyRaw = (s: string) => pinyin(s, { toneType: 'symbol', nonZh: 'consecutive' });
/** Пиньинь со знаками тонов: слоги через пробел, знаки препинания латиницей. Для латиницы — пусто. */
export function py(zh: string): string {
  if (!/[\u4e00-\u9fff]/.test(zh)) return '';
  const parts: string[] = [];
  let rest = zh;
  while (rest) {
    let at = -1;
    let hit: [string, string] | null = null;
    for (const w of PY_WORDS) {
      const i = rest.indexOf(w[0]);
      if (i >= 0 && (at < 0 || i < at)) { at = i; hit = w; }
    }
    if (!hit) { parts.push(pyRaw(rest)); break; }
    if (at > 0) parts.push(pyRaw(rest.slice(0, at)));
    parts.push(hit[1]);
    rest = rest.slice(at + hit[0].length);
  }
  return parts.join(' ')
    .replace(/\s*，\s*/g, ', ').replace(/\s*。\s*/g, '. ').replace(/\s*？\s*/g, '? ').replace(/\s*！\s*/g, '! ')
    .replace(/\s*、\s*/g, ', ').replace(/\s*：\s*/g, ': ').replace(/\s*（\s*/g, ' (').replace(/\s*）\s*/g, ') ')
    .replace(/(\S) zǐ(?=[\s,.?!:)]|$)/g, '$1 zi')
    .replace(/\s+/g, ' ').trim();
}

// ——— общие надписи двух разделов ———
export const UI = {
  city: t('Город', 'City', 'Қала', 'Shahar'),
  change: t('Сменить', 'Change', 'Өзгерту', 'Oʻzgartirish'),
  done: t('Готово', 'Done', 'Дайын', 'Tayyor'),
  fromTrip: t('по поездке', 'from your trip', 'сапар бойынша', 'safar boʻyicha'),
  near: t('ближайший к городу {city}', 'nearest to {city}', '{city} қаласына ең жақын', '{city} shahriga eng yaqin'),
  backToTrip: t('Вернуть город поездки', 'Back to the trip city', 'Сапар қаласын қайтару', 'Safar shahrini qaytarish'),
  notInList: t('Города поездки нет в списке — выберите ближайший.', 'Your trip city is not on the list — pick the nearest one.', 'Сапар қаласы тізімде жоқ — ең жақынын таңдаңыз.', 'Safar shahri roʻyxatda yoʻq — eng yaqinini tanlang.'),
  lang: t('Язык', 'Language', 'Тіл', 'Til'),
  call: t('Позвонить', 'Call', 'Қоңырау шалу', 'Qoʻngʻiroq qilish'),
  showScreen: t('Покажите этот экран', 'Show this screen', 'Осы экранды көрсетіңіз', 'Ushbu ekranni koʻrsating'),
  meaning: t('Что здесь написано', 'What it says', 'Мұнда не жазылған', 'Bu yerda nima yozilgan'),
  hkCard: t(
    'В Гонконге и Макао говорят на кантонском: пиньинь не поможет — покажите текст и английскую строку.',
    'Hong Kong and Macao speak Cantonese: pinyin won’t help — show the text and the English line.',
    'Гонконг пен Макаода кантонша сөйлейді: пиньинь көмектеспейді — мәтін мен ағылшынша жолды көрсетіңіз.',
    'Gonkong va Makaoda kantoncha gaplashishadi: pinyin yordam bermaydi — matn va inglizcha qatorni koʻrsating.',
  ),
  fruitLink: t('Фруктовые лавки', 'Fruit shops', 'Жеміс дүкендері', 'Meva doʻkonlari'),
  pharmaLink: t('Аптеки', 'Pharmacies', 'Дәріханалар', 'Dorixonalar'),
  pharmaLinkSub: t('Карточки для фармацевта, лекарства по-китайски', 'Cards for the pharmacist, medicine names in Chinese', 'Фармацевтке карточкалар, дәрілердің қытайша атауы', 'Farmatsevt uchun kartochkalar, dorilarning xitoycha nomi'),
  fruitLinkSub: t('Цена за 斤, фразы продавцу, сезоны', 'Price per 斤, phrases for the seller, seasons', '斤 бағасы, сатушыға сөздер, маусымдар', '斤 narxi, sotuvchiga iboralar, mavsumlar'),
};
