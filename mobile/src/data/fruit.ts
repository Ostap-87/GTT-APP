// «Фруктовые лавки» (решение пользователя 26.10.2026): цена за 斤 (500 г — не килограмм!), как попросить помыть, почистить
// и порезать, фрукты с китайскими названиями и сезонами, фразы-карточки для продавца. Сезоны — основные в Китае, примерно
// (бывают сдвиги на пару недель по провинциям; импортные фрукты — круглый год). Источники — docs/apteki-frukty.md.
// Вкладки «На вес» (称重, цена за 斤) и «Нарезка» (果切, обычно за коробку) — решение пользователя 26.10.2026: «надо сделать
// разделение — фрукты весом и фрукты нарезанные». У каждого фрукта и каждой нарезки — фото (assets/fruit/<id>.jpg,
// авторы — data/fruit-photos.ts).
import { t, type Tx } from './lang';
import type { ShowCard } from './pharmacy';

/** Карточка продавцу с фото: photo — id файла assets/fruit/<photo>.jpg, показывается крупно на /show-card. */
export type FruitShowCard = ShowCard & { photo?: string };

export type Fruit = { id: string; zh: string; name: Tx; months: number[]; emoji?: string; note?: Tx; hidden?: boolean };
const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const f = (id: string, zh: string, name: Tx, months: number[], extra: Partial<Fruit> = {}): Fruit => ({ id, zh, name, months, ...extra });

export const FRUITS: Fruit[] = [
  f('lychee', '荔枝', t('Личи', 'Lychee', 'Личи', 'Lichi'), [5, 6, 7]),
  f('longan', '龙眼', t('Лонган', 'Longan', 'Лонган', 'Longan'), [7, 8, 9]),
  f('mango', '芒果', t('Манго', 'Mango', 'Манго', 'Mango'), [4, 5, 6, 7, 8, 9], { emoji: '🥭' }),
  f('durian', '榴莲', t('Дуриан', 'Durian', 'Дуриан', 'Durian'), [5, 6, 7, 8], {
    note: t('Сильный запах: во многих отелях дуриан в номер нельзя — спросите на ресепшен. Импортный продают круглый год.', 'Strong smell: many hotels do not allow durian in rooms — ask at reception. Imported durian is sold all year.', 'Иісі қатты: көп қонақүйде дурианды бөлмеге кіргізуге болмайды — ресепшеннен сұраңыз. Импорттығы жыл бойы сатылады.', 'Hidi kuchli: koʻp mehmonxonalarda durianni xonaga olib kirish mumkin emas — resepshndan soʻrang. Importi yil boʻyi sotiladi.'),
  }),
  f('mangosteen', '山竹', t('Мангостин', 'Mangosteen', 'Мангостин', 'Mangustin'), [5, 6, 7, 8, 9], {
    note: t('Сок кожуры оставляет пятна на одежде.', 'The rind juice stains clothes.', 'Қабығының шырыны киімге дақ түсіреді.', 'Poʻstining sharbati kiyimda dogʻ qoldiradi.'),
  }),
  f('pitaya', '火龙果', t('Питахайя (драконий фрукт)', 'Dragon fruit', 'Питахайя (айдаһар жемісі)', 'Pitaxaya (ajdar mevasi)'), ALL, {
    note: t('С белой и красной мякотью; красная (红心) обычно слаще.', 'White or red flesh; red (红心) is usually sweeter.', 'Ақ және қызыл етті болады; қызылы (红心) әдетте тәттірек.', 'Oq va qizil etli boʻladi; qizili (红心) odatda shirinroq.'),
  }),
  f('bayberry', '杨梅', t('Китайская восковница (ян-мэй)', 'Chinese bayberry', 'Қытай мирикасы (янмэй)', 'Xitoy mirikasi (yanmey)'), [6], {
    note: t('Сезон — несколько недель в июне. Местные перед едой замачивают ягоды в подсолённой воде.', 'The season is a few weeks in June. Locals soak the berries in lightly salted water before eating.', 'Маусымы — маусым айындағы бірнеше апта. Жергілікті тұрғындар жемес бұрын жидекті тұзды суға салып қояды.', 'Mavsumi — iyundagi bir necha hafta. Mahalliy aholi yeyishdan oldin rezavorni tuzli suvga solib qoʻyadi.'),
  }),
  f('loquat', '枇杷', t('Мушмула японская (локва)', 'Loquat', 'Жапон мұшмұласы', 'Yapon mushmulasi'), [4, 5, 6]),
  f('kiwi', '猕猴桃', t('Киви', 'Kiwi', 'Киви', 'Kivi'), [9, 10, 11, 12], { emoji: '🥝' }),
  f('pomelo', '柚子', t('Помело', 'Pomelo', 'Помело', 'Pomelo'), [9, 10, 11, 12, 1], {
    note: t('Попросите очистить — продавцы делают это быстро (карточка «Очистите»).', 'Ask them to peel it — sellers do it quickly (card “Please peel it”).', 'Аршуды сұраңыз — сатушылар тез тазалайды («Тазалап беріңіз» карточкасы).', 'Tozalab berishni soʻrang — sotuvchilar tez tozalaydi («Tozalab bering» kartochkasi).'),
  }),
  f('orange', '橙子', t('Апельсин', 'Orange', 'Апельсин', 'Apelsin'), [11, 12, 1, 2], { emoji: '🍊' }),
  f('mandarin', '砂糖橘', t('Мандарин «шатанцзюй»', 'Shatangju mandarin', 'Мандарин (шатанцзюй)', 'Mandarin (shatanszyuy)'), [11, 12, 1, 2], { emoji: '🍊' }),
  f('strawberry', '草莓', t('Клубника', 'Strawberries', 'Құлпынай', 'Qulupnay'), [12, 1, 2, 3, 4], { emoji: '🍓' }),
  f('watermelon', '西瓜', t('Арбуз', 'Watermelon', 'Қарбыз', 'Tarvuz'), [6, 7, 8], { emoji: '🍉' }),
  f('hami', '哈密瓜', t('Хамийская дыня', 'Hami melon', 'Хами қауыны', 'Hami qovuni'), [7, 8, 9], { emoji: '🍈' }),
  f('cherry', '樱桃', t('Черешня (местная)', 'Cherries (local)', 'Шие (жергілікті)', 'Gilos (mahalliy)'), [5, 6], { emoji: '🍒' }),
  f('chelizi', '车厘子', t('Черешня (импортная)', 'Cherries (imported)', 'Шие (импорттық)', 'Gilos (import)'), [12, 1, 2], {
    emoji: '🍒',
    note: t('车厘子 — крупная импортная черешня (чаще из Чили), 樱桃 — местная.', '车厘子 are large imported cherries (mostly from Chile); 樱桃 are local.', '车厘子 — ірі импорттық шие (көбіне Чилиден), 樱桃 — жергілікті.', '车厘子 — yirik import gilos (koʻpincha Chilidan), 樱桃 — mahalliy.'),
  }),
  f('grape', '葡萄', t('Виноград', 'Grapes', 'Жүзім', 'Uzum'), [7, 8, 9, 10], { emoji: '🍇' }),
  f('peach', '桃子', t('Персик', 'Peach', 'Шабдалы', 'Shaftoli'), [6, 7, 8, 9], { emoji: '🍑' }),
  f('persimmon', '柿子', t('Хурма', 'Persimmon', 'Хурма', 'Xurmo'), [10, 11]),
  f('pomegranate', '石榴', t('Гранат', 'Pomegranate', 'Анар', 'Anor'), [9, 10]),
  f('pineapple', '菠萝', t('Ананас', 'Pineapple', 'Ананас', 'Ananas'), [3, 4, 5], { emoji: '🍍' }),
  f('coconut', '椰子', t('Кокос', 'Coconut', 'Кокос', 'Kokos'), ALL, {
    emoji: '🥥',
    note: t('Продавец пробьёт кокос и даст трубочку (карточка «Откройте кокос»).', 'The seller will open it and give you a straw (card “Open the coconut”).', 'Сатушы кокосты тесіп, түтікше береді («Кокосты ашыңыз» карточкасы).', 'Sotuvchi kokosni teshib, naycha beradi («Kokosni oching» kartochkasi).'),
  }),
  f('pear', '梨', t('Груша', 'Pear', 'Алмұрт', 'Nok'), [8, 9, 10], { emoji: '🍐' }),
  f('apple', '苹果', t('Яблоко', 'Apple', 'Алма', 'Olma'), [9, 10, 11], { emoji: '🍎' }),
  f('radish', '萝卜', t('Редька', 'Radish', 'Шалғам', 'Turp'), [10, 11, 12, 1, 2], { hidden: true }),
];
export const fruitOf = (id: string) => FRUITS.find((x) => x.id === id);
export const inSeason = (fr: Fruit, month: number) => fr.months.includes(month);
export const allYear = (fr: Fruit) => fr.months.length === 12;

/** Вопрос продавцу о фрукте (фото — у всех фруктов, id фото = id фрукта). */
export function fruitCard(fr: Fruit): FruitShowCard {
  const tx = t(`У вас есть: ${fr.name.ru}? Сколько стоит цзинь (500 г)?`, `Do you have ${fr.name.en.toLowerCase()}? How much per jin (500 g)?`, `Сізде бар ма: ${fr.name.kk}? Бір цзинь (500 г) қанша тұрады?`, `Sizda bormi: ${fr.name.uz}? Bir szin (500 g) qancha turadi?`);
  return { id: `fruit-${fr.id}`, zh: `请问有${fr.zh}吗？一斤多少钱？`, en: tx.en, tx, label: fr.name, emoji: fr.emoji, photo: fr.id };
}

// id с приставкой fr-: у аптечных карточек есть свои 'cut' и 'cash'
const card = (id: string, emoji: string, zh: string, tx: Tx, label?: Tx, photo?: string): FruitShowCard => ({ id: `fr-${id}`, emoji, zh, en: tx.en, tx, label, photo });

export const FRUIT_PHRASES: FruitShowCard[] = [
  card('price', '💰', '一斤多少钱？', t('Сколько стоит один цзинь (500 г)?', 'How much is one jin (500 g)?', 'Бір цзинь (500 г) қанша тұрады?', 'Bir szin (500 g) qancha turadi?')),
  card('taste', '😋', '可以尝一下吗？', t('Можно попробовать?', 'Can I try one?', 'Татып көруге бола ма?', 'Tatib koʻrsam boʻladimi?')),
  card('sweet', '🍬', '甜吗？', t('Сладкие?', 'Are they sweet?', 'Тәтті ме?', 'Shirinmi?')),
  card('ripe', '✅', '请帮我挑熟的，今天吃。', t('Выберите, пожалуйста, спелые — съем сегодня.', 'Please pick ripe ones — I will eat them today.', 'Піскенін таңдап беріңізші — бүгін жеймін.', 'Iltimos, pishganini tanlab bering — bugun yeyman.')),
  card('this', '👉', '我要这个。', t('Мне вот это.', 'I’ll take this one.', 'Маған мынау.', 'Menga mana bu.')),
  card('halfjin', '⚖️', '我要半斤。', t('Мне полцзиня (250 г).', 'Half a jin (250 g), please.', 'Маған жарты цзинь (250 г).', 'Menga yarim szin (250 g).')),
  card('onejin', '⚖️', '我要一斤。', t('Мне один цзинь (500 г).', 'One jin (500 g), please.', 'Маған бір цзинь (500 г).', 'Menga bir szin (500 g).')),
  card('half', '🍉', '我要半个。', t('Мне половинку (арбуза, дыни).', 'Just half (of a watermelon or melon), please.', 'Маған жартысы (қарбыз, қауын).', 'Menga yarmi (tarvuz, qovun).')),
  card('wash', '🚿', '请帮我洗一下。', t('Помойте, пожалуйста.', 'Please wash them.', 'Жуып беріңізші.', 'Iltimos, yuvib bering.')),
  card('cut', '🔪', '请帮我切好，装在盒子里。', t('Порежьте, пожалуйста, и положите в коробку.', 'Please cut it up and put it in a box.', 'Турап, қорапқа салып беріңізші.', 'Iltimos, toʻgʻrab, qutiga solib bering.')),
  card('peel', '🍎', '请帮我削皮。', t('Срежьте, пожалуйста, кожуру (яблоко, манго, ананас).', 'Please peel it (apple, mango, pineapple).', 'Қабығын аршып беріңізші (алма, манго, ананас).', 'Iltimos, poʻstini archib bering (olma, mango, ananas).')),
  card('bao', '🤲', '请帮我剥好。', t('Очистите, пожалуйста (помело, гранат).', 'Please peel it for me (pomelo, pomegranate).', 'Тазалап беріңізші (помело, анар).', 'Iltimos, tozalab bering (pomelo, anor).')),
  card('durian', '🥡', '请帮我开榴莲，只要果肉。', t('Вскройте дуриан, мне только мякоть.', 'Please open the durian — I only want the flesh.', 'Дурианды ашып беріңізші, маған тек еті керек.', 'Durianni ochib bering, menga faqat eti kerak.'), undefined, 'durian'),
  card('coconut', '🥥', '请帮我开椰子，要吸管。', t('Откройте кокос и дайте трубочку, пожалуйста.', 'Please open the coconut and give me a straw.', 'Кокосты ашып, түтікше беріңізші.', 'Iltimos, kokosni ochib, naycha bering.'), undefined, 'cut-coconut'),
  card('cheaper', '🤝', '便宜一点可以吗？', t('Можно чуть дешевле?', 'Could you make it a bit cheaper?', 'Сәл арзанырақ бола ма?', 'Biroz arzonroq boʻladimi?')),
  card('hotel', '🏨', '可以送到酒店吗？', t('Можете доставить в отель?', 'Can you deliver to my hotel?', 'Қонақүйге жеткізіп бере аласыз ба?', 'Mehmonxonaga yetkazib bera olasizmi?')),
  card('cash', '💴', '可以付现金吗？', t('Можно наличными?', 'Can I pay in cash?', 'Қолма-қол төлеуге бола ма?', 'Naqd toʻlasa boʻladimi?')),
  card('bag', '🛍️', '请给我一个袋子。', t('Дайте, пожалуйста, пакет.', 'A bag, please.', 'Пакет беріңізші.', 'Iltimos, paket bering.')),
];

// ——— нарезка 果切 ———
// Что продают нарезанным — набор с фото (id фото = id нарезки). Как продают (обычно коробками, бывает на вес, время
// нарезки на коробке, 2 часа) — только по источникам из docs/apteki-frukty.md, раздел «Нарезка».
export type CutFruit = { id: string; zh: string; name: Tx; ask: string; askTx: Tx; note?: Tx };
const cut = (id: string, zh: string, name: Tx, ask: string, askTx: Tx, note?: Tx): CutFruit => ({ id, zh, name, ask, askTx, note });
const BOX = { ru: 'Сколько стоит коробка?', en: 'How much is a box?', kk: 'Бір қорабы қанша тұрады?', uz: 'Bir qutisi qancha turadi?' };
const q = (ru: string, en: string, kk: string, uz: string): Tx => t(`${ru} ${BOX.ru}`, `${en} ${BOX.en}`, `${kk} ${BOX.kk}`, `${uz} ${BOX.uz}`);

export const CUTS: CutFruit[] = [
  cut('cut-watermelon', '西瓜', t('Арбуз', 'Watermelon', 'Қарбыз', 'Tarvuz'), '请问有切好的西瓜吗？多少钱一盒？',
    q('У вас есть нарезанный арбуз?', 'Do you have cut watermelon?', 'Сізде туралған қарбыз бар ма?', 'Sizda toʻgʻralgan tarvuz bormi?')),
  cut('cut-pineapple', '菠萝', t('Ананас', 'Pineapple', 'Ананас', 'Ananas'), '请问有切好的菠萝吗？多少钱一盒？',
    q('У вас есть нарезанный ананас?', 'Do you have cut pineapple?', 'Сізде туралған ананас бар ма?', 'Sizda toʻgʻralgan ananas bormi?')),
  cut('cut-hami', '哈密瓜', t('Дыня Хами', 'Hami melon', 'Хами қауыны', 'Hami qovuni'), '请问有切好的哈密瓜吗？多少钱一盒？',
    q('У вас есть нарезанная дыня Хами?', 'Do you have cut Hami melon?', 'Сізде туралған Хами қауыны бар ма?', 'Sizda toʻgʻralgan Hami qovuni bormi?')),
  cut('cut-mango', '芒果', t('Манго', 'Mango', 'Манго', 'Mango'), '请问有切好的芒果吗？多少钱一盒？',
    q('У вас есть нарезанное манго?', 'Do you have cut mango?', 'Сізде туралған манго бар ма?', 'Sizda toʻgʻralgan mango bormi?')),
  cut('cut-pitaya', '火龙果', t('Питахайя', 'Dragon fruit', 'Питахайя', 'Pitaxaya'), '请问有切好的火龙果吗？多少钱一盒？',
    q('У вас есть нарезанная питахайя?', 'Do you have cut dragon fruit?', 'Сізде туралған питахайя бар ма?', 'Sizda toʻgʻralgan pitaxaya bormi?')),
  cut('cut-durian', '榴莲肉', t('Мякоть дуриана', 'Durian flesh', 'Дуриан еті', 'Durian eti'), '请问有榴莲肉吗？多少钱一盒？',
    q('У вас есть мякоть дуриана?', 'Do you have durian flesh?', 'Сізде дуриан еті бар ма?', 'Sizda durian eti bormi?'),
    t('Пахнет так же сильно, как целый дуриан: в номер отеля его часто нельзя.', 'It smells as strong as a whole durian: many hotels do not allow it in rooms.', 'Иісі бүтін дуриандай қатты: көп қонақүйде бөлмеге кіргізуге болмайды.', 'Hidi butun duriandek kuchli: koʻp mehmonxonalarda xonaga olib kirish mumkin emas.')),
  cut('cut-jackfruit', '菠萝蜜', t('Джекфрут', 'Jackfruit', 'Джекфрут', 'Jekfrut'), '请问有菠萝蜜肉吗？多少钱一盒？',
    q('У вас есть мякоть джекфрута?', 'Do you have jackfruit flesh?', 'Сізде джекфрут еті бар ма?', 'Sizda jekfrut eti bormi?'),
    t('菠萝蜜 — это джекфрут, а не ананас (菠萝).', '菠萝蜜 is jackfruit, not pineapple (菠萝).', '菠萝蜜 — джекфрут, ананас (菠萝) емес.', '菠萝蜜 — jekfrut, ananas (菠萝) emas.')),
  cut('cut-pomelo', '柚子肉', t('Очищенное помело', 'Peeled pomelo', 'Аршылған помело', 'Tozalangan pomelo'), '请问有剥好的柚子肉吗？多少钱一盒？',
    q('У вас есть очищенное помело?', 'Do you have peeled pomelo?', 'Сізде аршылған помело бар ма?', 'Sizda tozalangan pomelo bormi?')),
  cut('cut-coconut', '椰子', t('Кокос с трубочкой', 'Coconut with a straw', 'Түтікшесі бар кокос', 'Naychali kokos'), '请问有开好的椰子吗？多少钱一个？',
    t('У вас есть вскрытый кокос? Сколько стоит один?', 'Do you have an opened coconut? How much is one?', 'Сізде ашылған кокос бар ма? Біреуі қанша тұрады?', 'Sizda ochilgan kokos bormi? Bittasi qancha turadi?'),
    t('Можно и целый: продавец вскроет его при вас (карточка «Откройте кокос»).', 'Or buy a whole one: the seller will open it for you (card “Open the coconut”).', 'Бүтінін де алуға болады: сатушы көзіңізше ашады («Кокосты ашыңыз» карточкасы).', 'Butunini ham olish mumkin: sotuvchi koʻz oldingizda ochib beradi («Kokosni oching» kartochkasi).')),
  cut('cut-mixed', '什锦果切', t('Ассорти', 'Mixed fruit', 'Ассорти', 'Assorti'), '请问有什锦果切吗？多少钱一盒？',
    q('У вас есть ассорти из нарезанных фруктов?', 'Do you have a mixed cut-fruit box?', 'Сізде туралған жемістер ассортиі бар ма?', 'Sizda toʻgʻralgan mevalar assortisi bormi?')),
];
export const cutOf = (id: string) => CUTS.find((x) => x.id === id);

/** Вопрос продавцу о нарезке — с фото нарезки. */
export const cutCard = (c: CutFruit): FruitShowCard => ({ id: c.id, zh: c.ask, en: c.askTx.en, tx: c.askTx, label: c.name, photo: c.id });

/** Вопросы про нарезку (порезать целый фрукт — FRUIT_PHRASES: fr-cut, fr-bao, fr-durian, fr-coconut). */
export const CUT_PHRASES: FruitShowCard[] = [
  card('boxjin', '⚖️', '这是一盒的价格，还是一斤的价格？', t('Это цена за коробку или за 斤 (500 г)?', 'Is this the price per box or per jin (500 g)?', 'Бұл бір қораптың бағасы ма, әлде бір цзиньнің (500 г) бағасы ма?', 'Bu bir quti narximi yoki bir szin (500 g) narximi?')),
  card('pricefirst', '💬', '切之前，请先告诉我多少钱。', t('Скажите, пожалуйста, цену до того, как резать.', 'Please tell me the price before you cut it.', 'Тураудан бұрын бағасын айтыңызшы.', 'Iltimos, toʻgʻrashdan oldin narxini ayting.')),
  card('when', '🕒', '这是什么时候切的？', t('Когда это нарезали?', 'When was this cut?', 'Бұл қашан туралды?', 'Bu qachon toʻgʻralgan?')),
  card('fresh', '🔪', '我要现切的。', t('Нарежьте мне, пожалуйста, при мне.', 'I’d like it freshly cut, please.', 'Маған көзімше турап беріңізші.', 'Iltimos, koʻz oldimda toʻgʻrab bering.')),
  card('small', '📦', '有小盒的吗？', t('Есть коробка поменьше?', 'Do you have a smaller box?', 'Кішірек қорап бар ма?', 'Kichikroq quti bormi?')),
  card('fork', '🍴', '请给我一个叉子。', t('Дайте, пожалуйста, вилочку.', 'A fork, please.', 'Шанышқы беріңізші.', 'Iltimos, sanchqi bering.')),
];
/** Карточки «порежьте / очистите / вскройте» из общих фраз — во вкладке «Нарезка» без повторов. */
export const CUT_WHOLE_IDS = ['fr-cut', 'fr-bao', 'fr-durian', 'fr-coconut'];

// ——— тексты экрана ———
export const FR = {
  tabWeight: t('На вес', 'By weight', 'Салмақпен', 'Vazn boʻyicha'),
  tabCut: t('Нарезка', 'Cut fruit', 'Туралған', 'Toʻgʻralgan'),
  weightNote: t(
    'Целые фрукты продают на вес: цена за 斤 (500 г), продавец взвешивает при вас.',
    'Whole fruit is sold by weight: the price is per 斤 (500 g), and the seller weighs it in front of you.',
    'Бүтін жемістер салмақпен сатылады: баға — 斤 (500 г) үшін, сатушы көзіңізше өлшейді.',
    'Butun mevalar tortib sotiladi: narx — 斤 (500 g) uchun, sotuvchi koʻz oldingizda tortadi.',
  ),
  cutTitle: t('Нарезка — 果切', 'Cut fruit — 果切', 'Туралған жемістер — 果切', 'Toʻgʻralgan mevalar — 果切'),
  cutLines: [
    t('Уже нарезанные фрукты в коробочках продают в лавках, супермаркетах и с доставкой. Обычно цена за коробку, но бывает и за вес — спросите цену до того, как начнут резать и взвешивать.', 'Ready-cut fruit in boxes is sold in fruit shops, supermarkets and by delivery. The price is usually per box, but some shops charge by weight — ask the price before they cut and weigh it.', 'Қорапқа салынған дайын туралған жемістер дүкендерде, супермаркеттерде және жеткізу қызметтерінде сатылады. Әдетте баға қорап үшін, бірақ салмақпен де сатады — тураудан және өлшеуден бұрын бағасын сұраңыз.', 'Qutiga solingan tayyor toʻgʻralgan mevalar doʻkonlarda, supermarketlarda va yetkazib berish xizmatlarida sotiladi. Odatda narx quti uchun, lekin tortib ham sotishadi — toʻgʻrash va tortishdan oldin narxini soʻrang.'),
    t('Нарезка в разы дороже целых фруктов: платите за удобство.', 'Cut fruit costs several times more than whole fruit: you pay for convenience.', 'Туралған жеміс бүтінінен бірнеше есе қымбат: ыңғайлылық үшін төлейсіз.', 'Toʻgʻralgan meva butunidan bir necha baravar qimmat: qulaylik uchun toʻlaysiz.'),
    t('Съешьте в течение 2 часов. Не успеваете — в холодильник, не дольше 12 часов.', 'Eat it within 2 hours. If you can’t, keep it in the fridge for no more than 12 hours.', '2 сағат ішінде жеңіз. Үлгермесеңіз — тоңазытқышқа, 12 сағаттан аспасын.', '2 soat ichida yeng. Ulgurmasangiz — muzlatgichga, 12 soatdan oshmasin.'),
    t('Не берите, если кусочки заветренные, текут, потемнели или пахнут брожением.', 'Skip it if the pieces look limp, watery or brown, or smell fermented.', 'Кесектері солып, су ағып, қарайып кетсе немесе ашыған иіс шықса — алмаңыз.', 'Boʻlaklar soʻlgan, suv oqqan, qoraygan yoki achigan hid kelsa — olmang.'),
    t('Надёжнее всего — целый фрукт, который порежут при вас (карточки ниже).', 'The safest option is a whole fruit cut in front of you (cards below).', 'Ең сенімдісі — көзіңізше туралған бүтін жеміс (төмендегі карточкалар).', 'Eng ishonchlisi — koʻz oldingizda toʻgʻralgan butun meva (pastdagi kartochkalar).'),
  ],
  /** Только для материка: правило о времени нарезки на упаковке — китайское. */
  cutLabel: t('На коробке должно быть время нарезки (制作时间) — берите свежую и из холодильника.', 'The box should show when it was cut (制作时间) — pick a fresh one from the fridge.', 'Қорапта турау уақыты (制作时间) жазылуы керек — жаңасын және тоңазытқыштан алыңыз.', 'Qutida toʻgʻralgan vaqti (制作时间) yozilgan boʻlishi kerak — yangisini va muzlatgichdan oling.'),
  cutList: t('Что бывает нарезанным', 'What you can find cut', 'Туралған күйінде не болады', 'Toʻgʻralgan holda nimalar boʻladi'),
  cutListSub: t('Нажмите — откроется вопрос продавцу с фото.', 'Tap to open a question for the seller with a photo.', 'Басыңыз — сатушыға фотосы бар сұрақ ашылады.', 'Bosing — sotuvchiga rasmli savol ochiladi.'),
  cutPhrases: t('Вопросы про нарезку', 'Questions about cut fruit', 'Туралған жеміс туралы сұрақтар', 'Toʻgʻralgan meva haqida savollar'),
  cutWhole: t('Порезать целый фрукт', 'Have a whole fruit cut', 'Бүтін жемісті турату', 'Butun mevani toʻgʻratish'),
  photos: t('Фото: Wikimedia Commons', 'Photos: Wikimedia Commons', 'Фото: Wikimedia Commons', 'Rasmlar: Wikimedia Commons'),
  photosSub: t('авторы и лицензии', 'authors and licences', 'авторлары мен лицензиялары', 'mualliflar va litsenziyalar'),
  photosTitle: t('Авторы фото', 'Photo credits', 'Фото авторлары', 'Rasm mualliflari'),
  photosNote: t(
    'Фото — с Wikimedia Commons по свободным лицензиям (CC0, CC BY, CC BY-SA, общественное достояние); в приложении обрезаны до квадрата и уменьшены. Нажмите на строку — откроется страница файла, на название лицензии — её текст.',
    'Photos are from Wikimedia Commons under free licences (CC0, CC BY, CC BY-SA, public domain); in the app they are cropped to a square and resized. Tap a row to open the file page, or the licence name to read it.',
    'Фотолар Wikimedia Commons-тан еркін лицензиямен алынған (CC0, CC BY, CC BY-SA, қоғамдық игілік); қосымшада шаршыға дейін қиылып, кішірейтілген. Жолды басыңыз — файл беті ашылады, лицензия атауын — оның мәтіні.',
    'Rasmlar Wikimedia Commons-dan erkin litsenziyalar asosida olingan (CC0, CC BY, CC BY-SA, jamoat mulki); ilovada kvadratga qirqilgan va kichraytirilgan. Qatorni bosing — fayl sahifasi ochiladi, litsenziya nomini — uning matni.',
  ),
  author: t('Автор', 'Author', 'Авторы', 'Muallif'),
  pd: t('общественное достояние', 'public domain', 'қоғамдық игілік', 'jamoat mulki'),
  title: t('Фруктовые лавки', 'Fruit shops', 'Жеміс дүкендері', 'Meva doʻkonlari'),
  jin: t('Цена — за 斤, это 500 г', 'Prices are per 斤 = 500 g', 'Баға — 斤 үшін, бұл 500 г', 'Narx — 斤 uchun, bu 500 g'),
  jinCn: t(
    'На ценниках почти всегда цена за 斤 (jīn) — это 500 граммов, а не килограмм: ¥15/斤 — это ¥30 за кг. 公斤 (gōngjīn) — килограмм, 两 (liǎng) — 50 г.',
    'Price tags almost always show the price per 斤 (jīn) — 500 grams, not a kilo: ¥15/斤 is ¥30 per kg. 公斤 (gōngjīn) is a kilogram, 两 (liǎng) is 50 g.',
    'Баға белгілерінде әрдайым дерлік 斤 (jīn) бағасы — бұл килограмм емес, 500 грамм: ¥15/斤 — килосы ¥30. 公斤 (gōngjīn) — килограмм, 两 (liǎng) — 50 г.',
    'Narx yorliqlarida deyarli doim 斤 (jīn) narxi — bu kilogramm emas, 500 gramm: ¥15/斤 — kilosi ¥30. 公斤 (gōngjīn) — kilogramm, 两 (liǎng) — 50 g.',
  ),
  jinHk: t(
    'В Гонконге и Макао 斤 — около 605 г (старая мера «кэтти»), а часто цену пишут за 磅 (фунт, 454 г) или за штуку.',
    'In Hong Kong and Macao a 斤 is about 605 g (the old catty), and prices are often per 磅 (pound, 454 g) or per piece.',
    'Гонконг пен Макаода 斤 — шамамен 605 г (ескі «кэтти» өлшемі), бағаны жиі 磅 (фунт, 454 г) не дана үшін жазады.',
    'Gonkong va Makaoda 斤 — taxminan 605 g (eski «ketti» oʻlchovi), narxni koʻpincha 磅 (funt, 454 g) yoki dona uchun yozishadi.',
  ),
  calcLabel: t('Цена на ценнике за 斤', 'Price per 斤 on the tag', 'Белгідегі 斤 бағасы', 'Yorliqdagi 斤 narxi'),
  perKg: t('за килограмм', 'per kilogram', '1 кг бағасы', '1 kg narxi'),
  inRub: t('в рублях', 'in roubles', 'рубльмен', 'rublda'),
  names: t('Как называются', 'What they are called', 'Қалай аталады', 'Qanday ataladi'),
  namesCn: [
    ['水果店', t('фруктовая лавка', 'fruit shop', 'жеміс дүкені', 'meva doʻkoni')],
    ['水果摊', t('фруктовый лоток на улице или рынке', 'fruit stall on the street or at a market', 'көшедегі не базардағы жеміс дүңгіршегі', 'koʻcha yoki bozordagi meva rastasi')],
    ['果切', t('нарезанные фрукты в коробке', 'cut fruit in a box', 'қораптағы туралған жемістер', 'qutidagi toʻgʻralgan mevalar')],
    ['生鲜超市', t('супермаркет свежих продуктов (например, 盒马)', 'fresh-food supermarket (e.g. 盒马 Hema)', 'жаңа өнімдер супермаркеті (мысалы, 盒马)', 'yangi mahsulotlar supermarketi (masalan, 盒马)')],
  ] as [string, Tx][],
  namesHk: [
    ['生果店', t('фруктовая лавка (по-кантонски)', 'fruit shop (Cantonese)', 'жеміс дүкені (кантонша)', 'meva doʻkoni (kantoncha)')],
    ['生果檔', t('фруктовый лоток', 'fruit stall', 'жеміс дүңгіршегі', 'meva rastasi')],
    ['街市', t('городской рынок', 'municipal market', 'қалалық базар', 'shahar bozori')],
  ] as [string, Tx][],
  where: t('Где купить', 'Where to buy', 'Қайдан сатып алуға болады', 'Qayerdan sotib olish mumkin'),
  whereNote: t('Фрукты есть почти на каждой улице: лавки, лотки, супермаркеты. Сети — самые надёжные по качеству и ценам.', 'Fruit is on almost every street: shops, stalls, supermarkets. Chains are the most reliable for quality and prices.', 'Жеміс әр көшеде дерлік бар: дүкендер, дүңгіршектер, супермаркеттер. Сапасы мен бағасы жағынан желілер сенімдірек.', 'Meva deyarli har bir koʻchada bor: doʻkonlar, rastalar, supermarketlar. Sifat va narx boʻyicha tarmoqlar ishonchliroq.'),
  find: t('Найти рядом', 'Find nearby', 'Жақын маңнан табу', 'Yaqin atrofdan topish'),
  delivery: t(
    'Доставка в отель: Meituan (美团) и Ele.me (饿了么), раздел 水果 — нужен адрес отеля по-китайски.',
    'Delivery to your hotel: Meituan (美团) and Ele.me (饿了么), section 水果 — you need the hotel address in Chinese.',
    'Қонақүйге жеткізу: Meituan (美团) және Ele.me (饿了么), 水果 бөлімі — қонақүйдің мекенжайы қытайша керек.',
    'Mehmonxonaga yetkazish: Meituan (美团) va Ele.me (饿了么), 水果 boʻlimi — mehmonxona manzili xitoycha kerak.',
  ),
  how: t('Как покупать', 'How to buy', 'Қалай сатып алу керек', 'Qanday sotib olish kerak'),
  howLines: [
    t('Набираете фрукты в пакет — продавец взвешивает и называет цену. В сетях цена фиксированная, на рынке можно поторговаться.', 'Put the fruit in a bag — the seller weighs it and tells you the price. Chains have fixed prices; at markets you can bargain.', 'Жемісті пакетке саласыз — сатушы өлшеп, бағасын айтады. Желілерде баға тұрақты, базарда саудаласуға болады.', 'Mevani paketga solasiz — sotuvchi tortib, narxini aytadi. Tarmoqlarda narx qatʼiy, bozorda savdolashish mumkin.'),
    t('Помыть, почистить или порезать — покажите карточку, обычно помогают прямо в лавке.', 'To have fruit washed, peeled or cut, show a card — shops usually help on the spot.', 'Жуып, аршып не турап беру үшін карточканы көрсетіңіз — әдетте дүкеннің өзінде көмектеседі.', 'Yuvib, archib yoki toʻgʻrab berish uchun kartochkani koʻrsating — odatda doʻkonning oʻzida yordam berishadi.'),
    t('Мойте фрукты перед едой или берите уже очищенные — 果切.', 'Wash fruit before eating or buy it ready-peeled — 果切.', 'Жемісті жемес бұрын жуыңыз не дайын тазаланғанын алыңыз — 果切.', 'Mevani yeyishdan oldin yuving yoki tayyor tozalanganini oling — 果切.'),
    t('Платят Alipay и WeChat Pay по QR-коду на прилавке; наличные тоже берут.', 'People pay with Alipay or WeChat Pay via the QR code on the counter; cash is fine too.', 'Сатушы үстеліндегі QR-код арқылы Alipay не WeChat Pay-мен төлейді; қолма-қол да алады.', 'Peshtaxtadagi QR-kod orqali Alipay yoki WeChat Pay bilan toʻlashadi; naqd pul ham olishadi.'),
  ],
  phrases: t('Покажите продавцу', 'Show the seller', 'Сатушыға көрсетіңіз', 'Sotuvchiga koʻrsating'),
  fruits: t('Фрукты и сезоны', 'Fruit and seasons', 'Жемістер мен маусымдар', 'Mevalar va mavsumlar'),
  fruitsSub: t('Основной сезон в Китае — примерно; импортные фрукты продают круглый год. Нажмите — откроется вопрос продавцу.', 'Main season in China, roughly; imported fruit is sold all year. Tap to open a question for the seller.', 'Қытайдағы негізгі маусымы — шамамен; импорттық жемістер жыл бойы сатылады. Басыңыз — сатушыға сұрақ ашылады.', 'Xitoydagi asosiy mavsumi — taxminan; import mevalar yil boʻyi sotiladi. Bosing — sotuvchiga savol ochiladi.'),
  inTrip: t('сезон в вашу поездку', 'in season on your trip', 'сапарыңызда маусымы', 'safaringizda mavsumi'),
  allYear: t('круглый год', 'all year', 'жыл бойы', 'yil boʻyi'),
  seasonNow: t('сезон: {month}', 'season: {month}', 'маусымы: {month}', 'mavsumi: {month}'),
  local: t('Местные знаменитые', 'Famous local fruit', 'Жергілікті атақты жемістер', 'Mahalliy mashhur mevalar'),
  localSub: t('Сорта, которыми славится город и его провинция.', 'Varieties the city and its province are known for.', 'Қала мен провинция атағы шыққан сорттар.', 'Shahar va viloyat mashhur boʻlgan navlar.'),
  footer: t(
    'Сети и сезоны проверены по открытым источникам 26.10.2026; адресов в приложении нет — лавку рядом ищите на карте.',
    'Chains and seasons were checked against public sources on 26.10.2026; there are no addresses in the app — find a shop nearby on the map.',
    'Желілер мен маусымдар 26.10.2026 ашық дереккөздер бойынша тексерілді; қосымшада мекенжай жоқ — жақын дүкенді картадан іздеңіз.',
    'Tarmoqlar va mavsumlar 26.10.2026 da ochiq manbalar boʻyicha tekshirildi; ilovada manzillar yoʻq — yaqin doʻkonni xaritadan qidiring.',
  ),
};
