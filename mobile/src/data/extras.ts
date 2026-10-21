// Экраны из прототипа v9, перенесённые в приложение 17.10.2026: переводчик, радиогид, «Город», «После поездки»,
// визит компании у координатора. Места, часы и расстояния — примеры; подборку для каждого города делает координатор.

/** Переводчик: заготовленные фразы (в приложении — распознавание речи и перевод китайский ↔ русский ↔ английский). */
export const PHRASES = {
  ru: [['Сколько стоит этот чай?', '这个茶多少钱？'], ['Можно оплатить картой?', '可以刷卡吗？'], ['Отвезите нас, пожалуйста, в отель.', '请送我们去酒店。']],
  zh: [['这是今年的新茶。', 'Это чай нового урожая.'], ['可以用支付宝或者微信支付。', 'Можно оплатить через Alipay или WeChat.'], ['好的，请上车。', 'Хорошо, садитесь, пожалуйста.']],
} as const;

/** Радиогид: субтитры речи гида на русском. */
export const SUBS = ['Сейчас мы проходим зону сортировки.', 'Обратите внимание: полки сами подъезжают к сотрудникам.', 'Следующий зал — шоурум собственных марок.'];
export const GUIDE = { name: 'Ли Мэй', role: 'переводчик' };
/** Город, к которому относится подборка мест (PLACES) — у программ с сайта подборки нет, её делает координатор. */
export const PLACES_CITY = { ru: 'Пекин' };

export type PlaceCat = 'shop' | 'night' | 'store' | 'wc';
export type Place = { id: string; ru: string; zh: string; en: string; what: string; hours: string; dist: string; x: number; y: number };
export const CITY_CATS: [PlaceCat, string][] = [['shop', 'Шопинг'], ['night', 'Ночная жизнь'], ['store', '24/7'], ['wc', 'Туалеты']];
export const CAT_COLOR: Record<PlaceCat, string> = { shop: '#1a73e8', night: '#7b4fd6', store: '#1e8e5a', wc: '#d9822b' };
export const PLACES: Record<PlaceCat, Place[]> = {
  shop: [
    { id: 'p1', ru: 'Улица Ванфуцзин', zh: '王府井大街', en: 'Wangfujing Street', what: 'Пешеходная торговая улица: универмаги, сувениры, уличная еда', hours: '10:00–22:00', dist: '5 мин пешком', x: 150, y: 118 },
    { id: 'p2', ru: 'Sanlitun Taikoo Li', zh: '三里屯太古里', en: 'Sanlitun Taikoo Li', what: 'Магазины брендов, кафе и рестораны под открытым небом', hours: '10:00–22:00', dist: '20 мин на такси', x: 288, y: 62 },
    { id: 'p3', ru: 'Шёлковый рынок', zh: '秀水街', en: 'Silk Street Market', what: 'Сувениры, одежда, шёлк; торговаться здесь нормально', hours: '09:30–21:00', dist: '15 мин на такси', x: 262, y: 172 },
  ],
  night: [
    { id: 'n1', ru: 'Барная улица Саньлитунь', zh: '三里屯酒吧街', en: 'Sanlitun Bar Street', what: 'Бары и клубы, много иностранцев', hours: 'до 02:00', dist: '20 мин на такси', x: 296, y: 80 },
    { id: 'n2', ru: 'Бары у озера Хоухай', zh: '后海酒吧街', en: 'Houhai Bar Street', what: 'Бары с живой музыкой у озера, старые хутуны', hours: 'до 01:00', dist: '15 мин на такси', x: 72, y: 50 },
    { id: 'n3', ru: 'Улица Гуйцзе', zh: '簋街', en: 'Guijie Street', what: 'Ночные рестораны: острые раки, шашлычки', hours: 'до 04:00', dist: '10 мин на такси', x: 205, y: 52 },
  ],
  store: [
    { id: 's1', ru: '7-Eleven', zh: '7-Eleven 便利店', en: '7-Eleven', what: 'Вода, снеки, SIM-карты, зарядки', hours: 'круглосуточно', dist: '150 м', x: 168, y: 140 },
    { id: 's2', ru: 'FamilyMart', zh: '全家便利店', en: 'FamilyMart', what: 'Горячая еда, кофе, оплата WeChat и Alipay', hours: 'круглосуточно', dist: '300 м', x: 122, y: 102 },
    { id: 's3', ru: 'Lawson', zh: '罗森便利店', en: 'Lawson', what: 'Снеки, напитки, бытовые мелочи', hours: 'круглосуточно', dist: '450 м', x: 186, y: 96 },
  ],
  wc: [
    { id: 'w1', ru: 'Общественный туалет', zh: '公共厕所', en: 'Public toilet', what: 'Бесплатный; бумаги часто нет — возьмите салфетки', hours: 'круглосуточно', dist: '120 м', x: 136, y: 136 },
    { id: 'w2', ru: 'Туалет в универмаге', zh: '百货商场卫生间', en: 'Department store restroom', what: 'Чище и с бумагой, 3-й этаж', hours: '10:00–22:00', dist: '250 м', x: 162, y: 106 },
    { id: 'w3', ru: 'Туалет в лобби отеля', zh: '酒店大堂卫生间', en: 'Hotel lobby restroom', what: 'Для гостей отеля, открыт всегда', hours: 'круглосуточно', dist: 'в отеле', x: 152, y: 160 },
  ],
};
export const placeById = (id: string) => Object.values(PLACES).flat().find((p) => p.id === id);

/** Схема центра Пекина вокруг отеля (в приложении — карта Amap с поиском рядом). */
export function cityMapXml(cat: PlaceCat, selected?: string) {
  const pins = PLACES[cat].map((p) => {
    const on = selected === p.id;
    return `<circle cx="${p.x}" cy="${p.y}" r="${on ? 13 : 10}" fill="${CAT_COLOR[cat]}" stroke="#ffffff" stroke-width="3"/>${on ? `<circle cx="${p.x}" cy="${p.y}" r="18" fill="none" stroke="${CAT_COLOR[cat]}" stroke-width="2" opacity=".5"/>` : ''}`;
  }).join('');
  return `<svg viewBox="0 0 340 220" xmlns="http://www.w3.org/2000/svg">
    <rect width="340" height="220" fill="#eef1ea"/>
    <path d="M50 30 Q60 20 80 28 L95 40 Q90 60 70 62 Q48 58 50 30z" fill="#cfe2f3"/>
    <rect x="92" y="96" width="44" height="52" rx="4" fill="#dde9cf"/>
    <rect x="30" y="22" width="285" height="180" rx="26" fill="none" stroke="#ffffff" stroke-width="7"/>
    <path d="M10 168 H330" stroke="#ffffff" stroke-width="10"/><path d="M150 10 V210" stroke="#ffffff" stroke-width="6"/>
    <path d="M10 92 H330" stroke="#ffffff" stroke-width="5"/><path d="M230 10 V210" stroke="#ffffff" stroke-width="5"/>
    <text x="114" y="126" font-size="9" text-anchor="middle" fill="#5b6576">Гугун</text>
    <text x="72" y="74" font-size="9" text-anchor="middle" fill="#5b6576">Хоухай</text>
    <text x="300" y="181" font-size="9" text-anchor="end" fill="#5b6576">проспект Чанъань</text>
    <rect x="140" y="152" width="22" height="16" rx="4" fill="#0f1b2d"/><text x="151" y="164" font-size="10" font-weight="700" text-anchor="middle" fill="#ffffff">H</text>
    ${pins}
  </svg>`;
}

/** «Хочу продолжить»: что делегат просит у компании после визита. */
export const FOLLOW_TYPES = [
  { key: 'samples', ru: 'Образцы продукции', zh: '希望获取自有品牌产品样品。' },
  { key: 'talks', ru: 'Переговоры о поставках', zh: '希望洽谈供应合作。' },
  { key: 'meeting', ru: 'Повторная встреча', zh: '希望安排第二次会面。' },
] as const;
export const FOLLOW_COMPANIES: string[] = ['JD.com', 'Meituan', 'Hema (Freshippo)'];

/** Вопросы делегации к JD.com — компания видит их на китайском. */
export const BASE_Q = [
  { zh: '京东自营物流在三四线城市的配送时效如何？', ru: 'Как быстро работает собственная логистика JD в небольших городах?', by: 'd1' },
  { zh: '京东如何挑选自有品牌的供应商？', ru: 'Как JD выбирает поставщиков для собственных марок?', by: 'd3' },
  { zh: '仓储自动化项目的投资回收期一般是多久？', ru: 'За сколько окупается автоматизация склада?', by: 'd4' },
  { zh: '生鲜品类的损耗是如何控制的？', ru: 'Как вы контролируете потери свежих продуктов?', by: 'd2' },
  { zh: '京东的即时零售业务如何与线下门店合作？', ru: 'Как мгновенная доставка JD работает с офлайн-магазинами?', by: 'd5' },
  { zh: '你们如何利用数据预测区域需求？', ru: 'Как вы прогнозируете спрос по регионам?', by: 'd6' },
  { zh: '外国品牌入驻京东国际的流程是什么？', ru: 'Как иностранному бренду выйти на JD Worldwide?', by: 'd12' },
];

/** Узор-заглушка в виде QR-кода (настоящий код выдаёт WeChat по коду приглашения визита). */
export function qrXml() {
  let cells = '';
  let seed = 7;
  for (let y = 0; y < 25; y++) for (let x = 0; x < 25; x++) {
    seed = (seed * 9301 + 49297) % 233280;
    const finder = (x < 7 && y < 7) || (x > 17 && y < 7) || (x < 7 && y > 17);
    if (!finder && seed / 233280 > 0.55) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  const f = (x: number, y: number) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#0f1b2d"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#ffffff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#0f1b2d"/>`;
  return `<svg viewBox="-2 -2 29 29" xmlns="http://www.w3.org/2000/svg"><rect x="-2" y="-2" width="29" height="29" fill="#ffffff"/><g fill="#0f1b2d">${cells}</g>${f(0, 0)}${f(18, 0)}${f(0, 18)}</svg>`;
}
