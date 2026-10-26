// «Аптеки» (решение пользователя 26.10.2026): карточки «покажите фармацевту» — китайский текст крупно, пиньинь и перевод;
// действующие вещества — только международные непатентованные названия (МНН) и их официальные китайские названия, без
// дозировок. Это не медицинская консультация: дозировку и совместимость уточняет фармацевт или врач, при угрозе жизни — 120
// (в Гонконге и Макао — 999). Источники и что проверено — docs/apteki-frukty.md.
import { t, type Tx } from './lang';

/** Карточка, которую показывают персоналу: zh — по-китайски, en — английская строка, tx — смысл на языке пользователя. */
export type ShowCard = { id: string; zh: string; en: string; tx: Tx; label?: Tx; emoji?: string };

const card = (id: string, emoji: string, label: Tx, zh: string, tx: Tx): ShowCard => ({ id, emoji, label, zh, en: tx.en, tx });

export const SYMPTOMS: ShowCard[] = [
  card('headache', '🤕', t('Головная боль', 'Headache', 'Бас ауруы', 'Bosh ogʻrigʻi'), '我头疼，需要止痛药。',
    t('У меня болит голова, нужно обезболивающее.', 'I have a headache and need a painkiller.', 'Басым ауырады, ауырсынуды басатын дәрі керек.', 'Boshim ogʻriyapti, ogʻriq qoldiruvchi dori kerak.')),
  card('fever', '🤒', t('Температура', 'Fever', 'Қызу', 'Isitma'), '我发烧了，需要退烧药。',
    t('У меня температура, нужно жаропонижающее.', 'I have a fever and need something to bring it down.', 'Қызуым көтерілді, қызу түсіретін дәрі керек.', 'Isitmam chiqdi, isitma tushiruvchi dori kerak.')),
  card('cold', '🤧', t('Простуда, насморк', 'Cold, runny nose', 'Тұмау, мұрын бітелуі', 'Shamollash, tumov'), '我感冒了，流鼻涕、鼻塞，需要感冒药。',
    t('Я простудился: насморк, заложен нос. Нужно средство от простуды.', 'I have a cold: runny and stuffy nose. I need cold medicine.', 'Тұмау тидім: мұрным ағады, бітелді. Тұмауға қарсы дәрі керек.', 'Shamolladim: tumov, burnim bitib qolgan. Shamollashga qarshi dori kerak.')),
  card('cough', '😷', t('Кашель', 'Cough', 'Жөтел', 'Yoʻtal'), '我咳嗽，需要止咳药。',
    t('У меня кашель, нужно средство от кашля.', 'I have a cough and need cough medicine.', 'Жөтелім бар, жөтелге қарсы дәрі керек.', 'Yoʻtalim bor, yoʻtalga qarshi dori kerak.')),
  card('throat', '😣', t('Болит горло', 'Sore throat', 'Тамақ ауруы', 'Tomoq ogʻrigʻi'), '我嗓子疼，需要含片。',
    t('У меня болит горло, нужны пастилки для рассасывания.', 'I have a sore throat and need throat lozenges.', 'Тамағым ауырады, сорып жейтін таблетка керек.', 'Tomogʻim ogʻriyapti, soʻrib yeyiladigan tabletka kerak.')),
  card('allergy', '🌼', t('Аллергия', 'Allergy', 'Аллергия', 'Allergiya'), '我过敏了：打喷嚏、眼睛痒、起疹子。需要抗过敏药。',
    t('У меня аллергия: чихаю, чешутся глаза, сыпь. Нужно противоаллергическое.', 'I have an allergy: sneezing, itchy eyes, a rash. I need an antiallergic medicine.', 'Аллергиям бар: түшкіремін, көзім қышиды, бөртпе шықты. Аллергияға қарсы дәрі керек.', 'Allergiyam bor: aksa uraman, koʻzim qichiydi, toshma chiqdi. Allergiyaga qarshi dori kerak.')),
  card('stomach', '🍽️', t('Тяжесть в желудке', 'Upset stomach', 'Асқазан ауыруы', 'Oshqozon bezovtaligi'), '我胃不舒服、消化不良，需要胃药。',
    t('Мне нехорошо: тяжесть в желудке, несварение. Нужно средство для желудка.', 'My stomach is upset, I have indigestion. I need stomach medicine.', 'Асқазаным ауырады, ас қорытылмай жатыр. Асқазанға дәрі керек.', 'Oshqozonim bezovta, ovqat hazm boʻlmayapti. Oshqozon uchun dori kerak.')),
  card('diarrhea', '🚽', t('Диарея', 'Diarrhoea', 'Іш өту', 'Ich ketishi'), '我拉肚子，需要止泻药和口服补液盐。',
    t('У меня диарея, нужно средство от диареи и солевой раствор для питья.', 'I have diarrhoea and need an antidiarrhoeal and oral rehydration salts.', 'Ішім өтіп жатыр, іш өтуге қарсы дәрі мен ішетін тұзды ерітінді керек.', 'Ichim ketyapti, ich ketishiga qarshi dori va ichiladigan tuzli eritma kerak.')),
  card('nausea', '🤢', t('Тошнота, укачивание', 'Nausea, motion sickness', 'Жүрек айнуы, көлікте шайқалу', 'Koʻngil aynishi, yoʻlda chayqalish'), '我晕车，恶心想吐，需要晕车药。',
    t('Меня укачало, тошнит. Нужно средство от укачивания.', 'I feel travel sick and nauseous. I need motion-sickness medicine.', 'Көлікте жүрегім айнып, лоқсып тұр. Шайқалуға қарсы дәрі керек.', 'Yoʻlda koʻnglim aynib, qayt qilgim kelyapti. Chayqalishga qarshi dori kerak.')),
  card('heartburn', '🔥', t('Изжога', 'Heartburn', 'Қыжыл', 'Jigʻildon qaynashi'), '我烧心、反酸，需要胃药。',
    t('У меня изжога, отрыжка кислым. Нужно средство для желудка.', 'I have heartburn and acid reflux. I need stomach medicine.', 'Қыжылым бар, қышқыл кекіремін. Асқазанға дәрі керек.', 'Jigʻildonim qaynayapti, nordon kekiryapman. Oshqozon uchun dori kerak.')),
  card('constipation', '🧻', t('Запор', 'Constipation', 'Іш қату', 'Ich qotishi'), '我便秘，需要通便的药。',
    t('У меня запор, нужно слабительное.', 'I am constipated and need a laxative.', 'Ішім қатып қалды, іш жүргізетін дәрі керек.', 'Ichim qotib qoldi, surgi dori kerak.')),
  card('burn', '♨️', t('Ожог', 'Burn', 'Күйік', 'Kuyish'), '我烫伤了，需要烫伤药膏。',
    t('Я обжёгся, нужна мазь от ожогов.', 'I have a burn and need burn ointment.', 'Күйіп қалдым, күйікке жағатын май керек.', 'Kuyib qoldim, kuyishga qarshi malham kerak.')),
  card('cut', '🩹', t('Порез, ссадина', 'Cut, graze', 'Кесік, сызат', 'Kesilish, tirnalish'), '我划伤了，需要创可贴和碘伏。',
    t('Я порезался, нужны пластырь и антисептик (повидон-йод).', 'I have a cut and need plasters and antiseptic (povidone-iodine).', 'Кесіп алдым, лейкопластырь мен антисептик (повидон-йод) керек.', 'Kesib oldim, plastir va antiseptik (povidon-yod) kerak.')),
  card('bites', '🦟', t('Укусы насекомых', 'Insect bites', 'Жәндік шағуы', 'Hasharot chaqishi'), '我被蚊虫叮咬了，很痒，需要止痒的药。',
    t('Меня покусали насекомые, сильно чешется. Нужно средство от зуда.', 'I have insect bites that itch badly. I need something for the itching.', 'Жәндіктер шағып алды, қатты қышиды. Қышуды басатын дәрі керек.', 'Hasharotlar chaqib oldi, qattiq qichiyapti. Qichishishga qarshi dori kerak.')),
  card('muscle', '💪', t('Боль в мышцах', 'Muscle pain', 'Бұлшықет ауруы', 'Mushak ogʻrigʻi'), '我肌肉酸痛，需要外用止痛药。',
    t('Болят мышцы, нужно обезболивающее для наружного применения.', 'My muscles ache. I need a topical pain reliever.', 'Бұлшықетім ауырады, сыртқа жағатын ауырсынуды басатын дәрі керек.', 'Mushaklarim ogʻriyapti, tashqi qoʻllaniladigan ogʻriq qoldiruvchi kerak.')),
  card('tooth', '🦷', t('Зубная боль', 'Toothache', 'Тіс ауруы', 'Tish ogʻrigʻi'), '我牙疼，需要止痛药。',
    t('У меня болит зуб, нужно обезболивающее.', 'I have a toothache and need a painkiller.', 'Тісім ауырады, ауырсынуды басатын дәрі керек.', 'Tishim ogʻriyapti, ogʻriq qoldiruvchi dori kerak.')),
  card('period', '🌸', t('Боль при месячных', 'Period pain', 'Етеккір ауруы', 'Hayz ogʻrigʻi'), '我痛经，需要止痛药。',
    t('У меня болезненные месячные, нужно обезболивающее.', 'I have period pain and need a painkiller.', 'Етеккір кезінде ішім ауырады, ауырсынуды басатын дәрі керек.', 'Hayz paytida ogʻriq bor, ogʻriq qoldiruvchi dori kerak.')),
  card('sleep', '😴', t('Не могу уснуть', 'Can’t sleep', 'Ұйқы келмейді', 'Uxlay olmayapman'), '我倒时差，睡不着。有褪黑素吗？',
    t('Из-за смены часовых поясов не могу уснуть. Есть мелатонин?', 'I have jet lag and can’t sleep. Do you have melatonin?', 'Уақыт айырмасынан ұйықтай алмаймын. Мелатонин бар ма?', 'Vaqt farqi tufayli uxlay olmayapman. Melatonin bormi?')),
  card('eyes', '👁️', t('Сухость, покраснение глаз', 'Dry, red eyes', 'Көздің құрғауы, қызаруы', 'Koʻz qurishi, qizarishi'), '我眼睛干、发红，需要眼药水。',
    t('Глаза сухие и красные, нужны глазные капли.', 'My eyes are dry and red. I need eye drops.', 'Көзім құрғап, қызарды. Көз тамшысы керек.', 'Koʻzlarim qurib, qizardi. Koʻz tomchisi kerak.')),
  card('sunburn', '☀️', t('Солнечный ожог', 'Sunburn', 'Күнге күю', 'Quyoshda kuyish'), '我晒伤了，需要晒伤药膏。',
    t('Я обгорел на солнце, нужна мазь от солнечных ожогов.', 'I am sunburnt and need a sunburn cream.', 'Күнге күйіп қалдым, күйікке жағатын крем керек.', 'Quyoshda kuyib qoldim, kuyishga qarshi krem kerak.')),
  card('pressure', '🩺', t('Давление', 'Blood pressure', 'Қан қысымы', 'Qon bosimi'), '我觉得血压不正常，可以帮我量一下血压吗？',
    t('Кажется, у меня не в порядке давление. Можете измерить?', 'I think my blood pressure is off. Could you measure it?', 'Қан қысымым дұрыс емес сияқты. Өлшеп бере аласыз ба?', 'Qon bosimim joyida emasga oʻxshaydi. Oʻlchab bera olasizmi?')),
];

/** Общие фразы в аптеке. */
export const PHARMA_PHRASES: ShowCard[] = [
  card('western', '💊', t('Мне нужно обычное лекарство', 'I want Western medicine', 'Маған кәдімгі дәрі керек', 'Menga oddiy dori kerak'), '我想要西药，不要中药。',
    t('Мне нужно обычное (западное) лекарство, не китайская традиционная медицина.', 'I would like Western medicine, not traditional Chinese medicine.', 'Маған кәдімгі (батыс) дәрі керек, қытайдың дәстүрлі дәрісі емес.', 'Menga oddiy (gʻarb) dori kerak, Xitoy anʼanaviy tabobati emas.')),
  card('have', '📦', t('Есть такое лекарство?', 'Do you have this one?', 'Осындай дәрі бар ма?', 'Shunday dori bormi?'), '您好，请问有这种药吗？',
    t('Здравствуйте, у вас есть такое лекарство? (покажите упаковку или фото)', 'Hello, do you have this medicine? (show the box or a photo)', 'Сәлеметсіз бе, осындай дәрі бар ма? (қорапты не суретті көрсетіңіз)', 'Assalomu alaykum, shunday dori bormi? (qutisini yoki rasmini koʻrsating)')),
  card('howto', '📝', t('Как принимать?', 'How do I take it?', 'Қалай ішу керек?', 'Qanday ichish kerak?'), '这个药怎么吃？一天几次，一次几片？请写在纸上。',
    t('Как принимать это лекарство? Сколько раз в день и по сколько таблеток? Напишите, пожалуйста, на бумаге.', 'How should I take this? How many times a day and how many tablets? Please write it down.', 'Бұл дәріні қалай ішу керек? Күніне неше рет, неше таблеткадан? Қағазға жазып беріңізші.', 'Bu dorini qanday ichish kerak? Kuniga necha marta, nechta tabletkadan? Iltimos, qogʻozga yozib bering.')),
  card('meal', '🍚', t('До еды или после?', 'Before or after meals?', 'Тамаққа дейін бе, кейін бе?', 'Ovqatdan oldinmi, keyinmi?'), '饭前吃还是饭后吃？',
    t('Принимать до еды или после еды?', 'Should I take it before or after meals?', 'Тамаққа дейін ішу керек пе, кейін бе?', 'Ovqatdan oldin ichish kerakmi yoki keyin?')),
  card('drowsy', '🚗', t('Не вызывает сонливость?', 'Will it make me drowsy?', 'Ұйқы келтірмей ме?', 'Uyquni keltirmaydimi?'), '吃了会犯困吗？',
    t('От него не будет клонить в сон?', 'Will it make me drowsy?', 'Одан ұйқы келмей ме?', 'Undan uyqu bosmaydimi?')),
  card('together', '🔁', t('Можно с моим лекарством?', 'OK with my medicine?', 'Менің дәріммен бірге бола ма?', 'Mening dorim bilan mumkinmi?'), '我一直在吃这个药，能和您推荐的药一起吃吗？',
    t('Я постоянно принимаю вот это лекарство. Можно ли его сочетать с тем, что вы советуете?', 'I take this medicine regularly. Can I take it together with the one you recommend?', 'Мен мына дәріні үнемі ішемін. Оны сіз ұсынған дәрімен бірге ішуге бола ма?', 'Men mana bu dorini doim ichaman. Uni siz tavsiya qilgan dori bilan birga ichsa boʻladimi?')),
  card('penicillin', '⚠️', t('Аллергия на пенициллин', 'Penicillin allergy', 'Пенициллинге аллергия', 'Penitsillinga allergiya'), '我对青霉素过敏。',
    t('У меня аллергия на пенициллин.', 'I am allergic to penicillin.', 'Менде пенициллинге аллергия бар.', 'Menda penitsillinga allergiya bor.')),
  card('aspirin', '⚠️', t('Аллергия на аспирин', 'Aspirin allergy', 'Аспиринге аллергия', 'Aspiringa allergiya'), '我对阿司匹林过敏。',
    t('У меня аллергия на аспирин.', 'I am allergic to aspirin.', 'Менде аспиринге аллергия бар.', 'Menda aspiringa allergiya bor.')),
  card('pregnant', '🤰', t('Я беременна', 'I am pregnant', 'Мен жүктімін', 'Men homiladorman'), '我怀孕了。',
    t('Я беременна.', 'I am pregnant.', 'Мен жүктімін.', 'Men homiladorman.')),
  card('nursing', '🍼', t('Кормлю грудью', 'I am breastfeeding', 'Емізіп жүрмін', 'Emizyapman'), '我在哺乳期。',
    t('Я кормлю грудью.', 'I am breastfeeding.', 'Мен бала емізіп жүрмін.', 'Men bola emizyapman.')),
  card('child', '🧒', t('Лекарство для ребёнка', 'For a child', 'Балаға арналған дәрі', 'Bola uchun dori'), '药是给孩子用的。',
    t('Лекарство нужно для ребёнка.', 'The medicine is for a child.', 'Дәрі балаға керек.', 'Dori bola uchun kerak.')),
  card('24h', '🌙', t('Где круглосуточная аптека?', 'Where is a 24-hour pharmacy?', 'Тәулік бойы ашық дәріхана қайда?', 'Kecha-kunduz ochiq dorixona qayerda?'), '附近有24小时药店吗？',
    t('Есть поблизости круглосуточная аптека?', 'Is there a 24-hour pharmacy nearby?', 'Жақын маңда тәулік бойы ашық дәріхана бар ма?', 'Yaqin atrofda kecha-kunduz ochiq dorixona bormi?')),
  card('doctor', '🏥', t('Мне нужен врач', 'I need a doctor', 'Маған дәрігер керек', 'Menga shifokor kerak'), '我需要看医生。最近的医院在哪里？',
    t('Мне нужен врач. Где ближайшая больница?', 'I need to see a doctor. Where is the nearest hospital?', 'Маған дәрігер керек. Ең жақын аурухана қайда?', 'Menga shifokor kerak. Eng yaqin kasalxona qayerda?')),
  card('ambulance', '🚑', t('Вызовите скорую!', 'Call an ambulance!', 'Жедел жәрдем шақырыңыз!', 'Tez yordam chaqiring!'), '请帮我叫救护车！',
    t('Пожалуйста, вызовите скорую помощь!', 'Please call an ambulance for me!', 'Өтінемін, жедел жәрдем шақырыңыз!', 'Iltimos, tez yordam chaqiring!')),
  card('receipt', '🧾', t('Чек для страховки', 'Receipt for insurance', 'Сақтандыруға чек', 'Sugʻurta uchun chek'), '请给我发票，保险报销用。',
    t('Дайте, пожалуйста, официальный чек (фапяо) — для страховки.', 'Please give me an official receipt (fapiao) for my insurance.', 'Ресми чек (фапяо) беріңізші — сақтандыруға керек.', 'Iltimos, rasmiy chek (fapiao) bering — sugʻurta uchun.')),
  card('cash', '💴', t('Можно наличными?', 'Can I pay cash?', 'Қолма-қол төлеуге бола ма?', 'Naqd toʻlasa boʻladimi?'), '可以付现金吗？',
    t('Можно заплатить наличными?', 'Can I pay in cash?', 'Қолма-қол ақшамен төлеуге бола ма?', 'Naqd pul bilan toʻlasa boʻladimi?')),
];

/** Действующее вещество: МНН (латиница), официальное китайское название, для чего. ask — вопрос фармацевту. */
export type Med = { id: string; inn: string; zh: string; name: Tx; use: Tx; note?: Tx; ask?: 'have' | 'contains' };

const med = (id: string, inn: string, zh: string, name: Tx, use: Tx, extra: Partial<Med> = {}): Med => ({ id, inn, zh, name, use, ask: 'contains', ...extra });
const same = (ru: string, en: string, uz: string) => t(ru, en, ru, uz);

export const MEDS: Med[] = [
  med('ibuprofen', 'Ibuprofen', '布洛芬', same('Ибупрофен', 'Ibuprofen', 'Ibuprofen'), t('боль, температура', 'pain, fever', 'ауырсыну, қызу', 'ogʻriq, isitma')),
  med('paracetamol', 'Paracetamol (acetaminophen)', '对乙酰氨基酚', same('Парацетамол', 'Paracetamol', 'Paratsetamol'), t('боль, температура', 'pain, fever', 'ауырсыну, қызу', 'ogʻriq, isitma'), {
    note: t('Входит во многие порошки от простуды — не принимайте два таких средства сразу.', 'It is in many cold remedies — do not take two of them at once.', 'Тұмауға қарсы көп ұнтақтың құрамында бар — екеуін бірден ішпеңіз.', 'Koʻp shamollash kukunlari tarkibida bor — ikkitasini birdaniga ichmang.'),
  }),
  med('loratadine', 'Loratadine', '氯雷他定', same('Лоратадин', 'Loratadine', 'Loratadin'), t('аллергия', 'allergy', 'аллергия', 'allergiya')),
  med('cetirizine', 'Cetirizine', '西替利嗪', same('Цетиризин', 'Cetirizine', 'Setirizin'), t('аллергия', 'allergy', 'аллергия', 'allergiya')),
  med('smectite', 'Diosmectite', '蒙脱石散', same('Диосмектит (смекта)', 'Diosmectite (smectite)', 'Diosmektit (smekta)'), t('диарея', 'diarrhoea', 'іш өту', 'ich ketishi'), { ask: 'have' }),
  med('ors', 'Oral rehydration salts', '口服补液盐', t('Соли для пероральной регидратации', 'Oral rehydration salts', 'Ауызша регидратацияға арналған тұздар', 'Ogʻiz orqali regidratatsiya tuzlari'), t('потеря жидкости при диарее, жаре', 'fluid loss from diarrhoea or heat', 'іш өткенде, ыстықта сұйықтық жоғалту', 'ich ketishi, issiqda suyuqlik yoʻqotish'), { ask: 'have' }),
  med('loperamide', 'Loperamide', '洛哌丁胺', same('Лоперамид', 'Loperamide', 'Loperamid'), t('диарея', 'diarrhoea', 'іш өту', 'ich ketishi')),
  med('dimenhydrinate', 'Dimenhydrinate', '茶苯海明', same('Дименгидринат', 'Dimenhydrinate', 'Dimengidrinat'), t('укачивание', 'motion sickness', 'көлікте шайқалу', 'yoʻlda chayqalish')),
  med('hydrotalcite', 'Hydrotalcite', '铝碳酸镁', same('Гидроталцит', 'Hydrotalcite', 'Gidrotalsit'), t('изжога', 'heartburn', 'қыжыл', 'jigʻildon qaynashi')),
  med('famotidine', 'Famotidine', '法莫替丁', same('Фамотидин', 'Famotidine', 'Famotidin'), t('изжога', 'heartburn', 'қыжыл', 'jigʻildon qaynashi')),
  med('ambroxol', 'Ambroxol', '氨溴索', same('Амброксол', 'Ambroxol', 'Ambroksol'), t('кашель с мокротой', 'chesty cough', 'қақырықты жөтел', 'balgʻamli yoʻtal')),
  med('diclofenac', 'Diclofenac gel', '双氯芬酸二乙胺乳胶剂', t('Диклофенак, гель', 'Diclofenac gel', 'Диклофенак, гель', 'Diklofenak, gel'), t('боль в мышцах и суставах (наружно)', 'muscle and joint pain (on the skin)', 'бұлшықет пен буын ауруы (сыртқа)', 'mushak va boʻgʻim ogʻrigʻi (tashqi)'), { ask: 'have' }),
  med('calamine', 'Calamine lotion', '炉甘石洗剂', t('Каламин, лосьон', 'Calamine lotion', 'Каламин, лосьон', 'Kalamin, loson'), t('зуд, укусы насекомых', 'itching, insect bites', 'қышу, жәндік шағуы', 'qichishish, hasharot chaqishi'), { ask: 'have' }),
  med('povidone', 'Povidone-iodine', '碘伏', t('Повидон-йод', 'Povidone-iodine', 'Повидон-йод', 'Povidon-yod'), t('обработка ран', 'cleaning wounds', 'жараны өңдеу', 'yarani tozalash'), { ask: 'have' }),
  med('plaster', 'Adhesive bandages', '创可贴', t('Пластырь', 'Plasters', 'Лейкопластырь', 'Plastir'), t('порезы, мозоли', 'cuts, blisters', 'кесік, күлдіреу', 'kesik, qavariq'), { ask: 'have' }),
  med('lactulose', 'Lactulose', '乳果糖', same('Лактулоза', 'Lactulose', 'Laktuloza'), t('запор', 'constipation', 'іш қату', 'ich qotishi')),
  med('tears', 'Artificial tears', '人工泪液', t('Искусственная слеза', 'Artificial tears', 'Жасанды көз жасы', 'Sunʼiy koʻz yoshi'), t('сухость глаз', 'dry eyes', 'көздің құрғауы', 'koʻz qurishi'), { ask: 'have' }),
  med('melatonin', 'Melatonin', '褪黑素', same('Мелатонин', 'Melatonin', 'Melatonin'), t('сон при смене часовых поясов', 'sleep with jet lag', 'уақыт белдеуі ауысқанда ұйқы', 'vaqt mintaqasi oʻzgarganda uyqu'), {
    ask: 'have',
    note: t('В Китае продаётся как БАД (保健食品), не как лекарство.', 'Sold in China as a dietary supplement (保健食品), not a medicine.', 'Қытайда дәрі емес, ББҚ (保健食品) ретінде сатылады.', 'Xitoyda dori emas, BFQ (保健食品) sifatida sotiladi.'),
  }),
  med('thermometer', 'Thermometer', '体温计', t('Градусник', 'Thermometer', 'Термометр', 'Termometr'), t('измерить температуру', 'checking temperature', 'қызуды өлшеу', 'haroratni oʻlchash'), { ask: 'have' }),
];

/** Вопрос по действующему веществу: по-китайски и смысл на языках раздела. */
export function medCard(m: Med): ShowCard {
  const zh = m.ask === 'have' ? `请问有${m.zh}吗？` : `请问有含${m.zh}的药吗？`;
  const tx = m.ask === 'have'
    ? t(`У вас есть: ${m.name.ru}?`, `Do you have ${m.name.en.toLowerCase()}?`, `Сізде бар ма: ${m.name.kk}?`, `Sizda bormi: ${m.name.uz}?`)
    : t(`У вас есть лекарство с действующим веществом «${m.name.ru}»?`, `Do you have a medicine containing ${m.inn.toLowerCase()}?`, `Құрамында «${m.name.kk}» бар дәрі бар ма?`, `Tarkibida «${m.name.uz}» bor dori bormi?`);
  return { id: `med-${m.id}`, zh, en: tx.en, tx, label: m.name, emoji: '💊' };
}

// ——— тексты экрана ———
export const PH = {
  title: t('Аптеки', 'Pharmacies', 'Дәріханалар', 'Dorixonalar'),
  disclaimer: t(
    'Это не медицинская консультация. Карточки помогают объяснить, что нужно; дозировку и совместимость уточните у фармацевта или врача.',
    'This is not medical advice. The cards help you explain what you need; check the dose and interactions with the pharmacist or a doctor.',
    'Бұл медициналық кеңес емес. Карточкалар не керегін түсіндіруге көмектеседі; мөлшері мен үйлесімін фармацевттен не дәрігерден сұраңыз.',
    'Bu tibbiy maslahat emas. Kartochkalar nima kerakligini tushuntirishga yordam beradi; miqdori va mosligini farmatsevt yoki shifokordan soʻrang.',
  ),
  danger: t('При угрозе жизни — звоните', 'If life is at risk, call', 'Өмірге қауіп төнсе — қоңырау шалыңыз', 'Hayotga xavf boʻlsa — qoʻngʻiroq qiling'),
  ambulance: t('скорая помощь', 'ambulance', 'жедел жәрдем', 'tez yordam'),
  howLook: t('Как узнать аптеку', 'How to spot a pharmacy', 'Дәріхананы қалай тануға болады', 'Dorixonani qanday tanish mumkin'),
  lookCn: [
    t('На вывеске — 药店 (yàodiàn), 药房 (yàofáng) или 大药房 (dà yàofáng, «большая аптека»). Часто рядом зелёный крест.', 'The sign says 药店 (yàodiàn), 药房 (yàofáng) or 大药房 (dà yàofáng, “big pharmacy”), often with a green cross.', 'Маңдайшада — 药店 (yàodiàn), 药房 (yàofáng) не 大药房 (dà yàofáng, «үлкен дәріхана»). Жиі жанында жасыл крест.', 'Peshlavhada — 药店 (yàodiàn), 药房 (yàofáng) yoki 大药房 (dà yàofáng, «katta dorixona»). Koʻpincha yonida yashil xoch.'),
    t('Обычно открыты с утра до позднего вечера. Круглосуточные — 24小时药店; ночью часто продают через окошко.', 'Most open from morning till late evening. 24-hour ones say 24小时药店; at night they often sell through a window.', 'Әдетте таңнан кеш батқанша ашық. Тәулік бойғысы — 24小时药店; түнде жиі терезе арқылы сатады.', 'Odatda ertalabdan kech kechgacha ochiq. Kecha-kunduzgisi — 24小时药店; kechasi koʻpincha darcha orqali sotishadi.'),
    t('Во многих аптеках есть фармацевт (药师) и можно измерить давление.', 'Many have a pharmacist (药师) on duty and can measure blood pressure.', 'Көп дәріханада фармацевт (药师) бар, қан қысымын өлшеуге болады.', 'Koʻp dorixonalarda farmatsevt (药师) bor, qon bosimini oʻlchash mumkin.'),
  ],
  lookHk: [
    t('藥房 — аптека с дипломированным фармацевтом, обычно со знаком Rx; 藥行 — лавка простых средств без фармацевта.', '藥房 is a pharmacy with a registered pharmacist, usually with an Rx sign; 藥行 is a shop for simple remedies without a pharmacist.', '藥房 — дипломды фармацевті бар дәріхана, әдетте Rx белгісі бар; 藥行 — фармацевтсіз қарапайым дәрі дүкені.', '藥房 — diplomli farmatsevti bor dorixona, odatda Rx belgisi bilan; 藥行 — farmatsevtsiz oddiy dori doʻkoni.'),
    t('Рецептурные лекарства продают только по рецепту местного врача. Фармацевты понимают английские названия лекарств.', 'Prescription medicines are sold only with a local doctor’s prescription. Pharmacists understand English drug names.', 'Рецептпен берілетін дәрілер тек жергілікті дәрігердің рецептімен сатылады. Фармацевттер дәрілердің ағылшынша атауын түсінеді.', 'Retseptli dorilar faqat mahalliy shifokor retsepti bilan sotiladi. Farmatsevtlar dorilarning inglizcha nomini tushunadi.'),
  ],
  chains: t('Сети в городе и провинции', 'Chains in the city and province', 'Қаладағы және провинциядағы желілер', 'Shahar va viloyatdagi tarmoqlar'),
  chainsNone: t('Местные сети здесь мы не проверили — ищите аптеку на карте по словам ниже.', 'We have not checked local chains here — search the map with the words below.', 'Мұндағы жергілікті желілерді тексермедік — дәріхананы төмендегі сөздермен картадан іздеңіз.', 'Bu yerdagi mahalliy tarmoqlarni tekshirmadik — dorixonani quyidagi soʻzlar bilan xaritadan qidiring.'),
  national: t('Крупные сети страны — могут быть и здесь, проверьте на карте:', 'Big national chains — may be here too, check the map:', 'Елдің ірі желілері — мұнда да болуы мүмкін, картадан тексеріңіз:', 'Mamlakatning yirik tarmoqlari — bu yerda ham boʻlishi mumkin, xaritadan tekshiring:'),
  from: t('из города {city}', 'from {city}', '{city} қаласынан', '{city} shahridan'),
  find: t('Найти ближайшую', 'Find the nearest', 'Ең жақынын табу', 'Eng yaqinini topish'),
  findCn: t(
    'Скопируйте слово и вставьте в поиск Amap (高德地图) или Dianping (大众点评): покажут аптеки рядом, часы работы и маршрут.',
    'Copy a word and paste it into Amap (高德地图) or Dianping (大众点评): you will see nearby pharmacies, opening hours and directions.',
    'Сөзді көшіріп, Amap (高德地图) не Dianping (大众点评) іздеуіне қойыңыз: жақын дәріханалар, жұмыс уақыты және жол көрсетіледі.',
    'Soʻzni nusxalab, Amap (高德地图) yoki Dianping (大众点评) qidiruviga qoʻying: yaqin dorixonalar, ish vaqti va yoʻl koʻrsatiladi.',
  ),
  findHk: t('Здесь работают Google Карты — ищите по словам ниже.', 'Google Maps works here — search with the words below.', 'Мұнда Google Карталар жұмыс істейді — төмендегі сөздермен іздеңіз.', 'Bu yerda Google Xaritalar ishlaydi — quyidagi soʻzlar bilan qidiring.'),
  delivery: t(
    'Лекарства на дом: в Meituan (美团) раздел 买药 — привезут в отель примерно за 30 минут, нужен адрес отеля по-китайски.',
    'Medicine delivery: Meituan (美团) → 买药 brings it to your hotel in about 30 minutes; you need the hotel address in Chinese.',
    'Дәріні жеткізу: Meituan (美团) → 买药 бөлімі қонақүйге шамамен 30 минутта әкеледі; қонақүйдің мекенжайы қытайша керек.',
    'Dorini yetkazish: Meituan (美团) → 买药 boʻlimi mehmonxonaga taxminan 30 daqiqada olib keladi; mehmonxona manzili xitoycha kerak.',
  ),
  copy: t('Копировать', 'Copy', 'Көшіру', 'Nusxalash'),
  copied: t('Скопировано', 'Copied', 'Көшірілді', 'Nusxalandi'),
  openMap: t('Открыть карту', 'Open map', 'Картаны ашу', 'Xaritani ochish'),
  show: t('Покажите фармацевту', 'Show the pharmacist', 'Фармацевтке көрсетіңіз', 'Farmatsevtga koʻrsating'),
  showSub: t('Нажмите на карточку — она откроется крупно.', 'Tap a card to open it full screen.', 'Карточканы басыңыз — үлкен болып ашылады.', 'Kartochkani bosing — kattalashib ochiladi.'),
  phrases: t('Полезные фразы', 'Useful phrases', 'Пайдалы сөз тіркестері', 'Foydali iboralar'),
  meds: t('Действующие вещества', 'Active ingredients', 'Әсер етуші заттар', 'Taʼsir etuvchi moddalar'),
  medsSub: t(
    'Международное название и официальное китайское. Нажмите — откроется вопрос «У вас есть…?». Большинство из списка продаётся без рецепта, но фармацевт скажет, если нужен рецепт.',
    'International and official Chinese names. Tap to open the question “Do you have…?”. Most are sold without a prescription, but the pharmacist will tell you if one is needed.',
    'Халықаралық және ресми қытайша атауы. Басыңыз — «Сізде … бар ма?» сұрағы ашылады. Тізімдегілердің көбі рецептсіз сатылады, бірақ рецепт керек болса, фармацевт айтады.',
    'Xalqaro va rasmiy xitoycha nomi. Bosing — «Sizda … bormi?» savoli ochiladi. Roʻyxatdagilarning koʻpi retseptsiz sotiladi, lekin retsept kerak boʻlsa, farmatsevt aytadi.',
  ),
  hkNames: t(
    'В Гонконге и Макао называйте лекарство по-английски: китайские названия там бывают другими (парацетамол — 撲熱息痛, марка Panadol — 必理痛).',
    'In Hong Kong and Macao use the English name: Chinese names there can differ (paracetamol is 撲熱息痛, Panadol is 必理痛).',
    'Гонконг пен Макаода дәріні ағылшынша атаңыз: онда қытайша атаулары басқаша болуы мүмкін (парацетамол — 撲熱息痛, Panadol маркасы — 必理痛).',
    'Gonkong va Makaoda dorini inglizcha ayting: u yerda xitoycha nomlari boshqacha boʻlishi mumkin (paratsetamol — 撲熱息痛, Panadol markasi — 必理痛).',
  ),
  rx: t('Рецепт и без рецепта', 'Prescription and OTC', 'Рецептпен және рецептсіз', 'Retseptli va retseptsiz'),
  rxCn: [
    t('Знак OTC на упаковке — без рецепта. Красный OTC (甲类) продают только в аптеке, зелёный (乙类) — и в обычных магазинах.', 'An OTC mark means no prescription needed. Red OTC (甲类) is sold only in pharmacies, green (乙类) also in ordinary shops.', 'Қораптағы OTC белгісі — рецептсіз. Қызыл OTC (甲类) тек дәріханада, жасыл (乙类) кәдімгі дүкенде де сатылады.', 'Qutidagi OTC belgisi — retseptsiz. Qizil OTC (甲类) faqat dorixonada, yashil (乙类) oddiy doʻkonlarda ham sotiladi.'),
    t('处方药 (chǔfāngyào) — по рецепту врача. Антибиотики в Китае — только по рецепту.', '处方药 (chǔfāngyào) means prescription only. Antibiotics in China require a prescription.', '处方药 (chǔfāngyào) — дәрігер рецептімен. Қытайда антибиотиктер тек рецептпен.', '处方药 (chǔfāngyào) — shifokor retsepti bilan. Xitoyda antibiotiklar faqat retsept bilan.'),
    t('Средства от кашля с декстрометорфаном с 1 июля 2024 года — психотропные, только по особому рецепту. Препараты с эфедрином и псевдоэфедрином (含麻黄碱) продают понемногу и с записью документа — возьмите паспорт.', 'Since 1 July 2024 dextromethorphan cough medicines are controlled psychotropics, special prescription only. Products with ephedrine or pseudoephedrine (含麻黄碱) are sold in small amounts with ID registration — bring your passport.', '2024 жылғы 1 шілдеден бастап декстрометорфаны бар жөтел дәрілері — психотроптық, тек арнайы рецептпен. Эфедрин мен псевдоэфедрині бар дәрілерді (含麻黄碱) аз мөлшерде, құжатты тіркеп сатады — төлқұжатты алыңыз.', '2024-yil 1-iyuldan dekstrometorfanli yoʻtal dorilari — psixotrop, faqat maxsus retsept bilan. Efedrin va psevdoefedrinli dorilar (含麻黄碱) oz miqdorda, hujjatni roʻyxatga olib sotiladi — pasportni oling.'),
    t('Аптеки продают и китайскую традиционную медицину (中成药) — инструкция только по-китайски. Хотите привычное — карточка «Мне нужно обычное лекарство».', 'Pharmacies also sell traditional Chinese medicine (中成药) with Chinese-only leaflets. For familiar medicine, use the card “I want Western medicine”.', 'Дәріханалар қытайдың дәстүрлі дәрілерін (中成药) де сатады — нұсқаулығы тек қытайша. Үйреншікті дәрі керек болса — «Маған кәдімгі дәрі керек» карточкасы.', 'Dorixonalar Xitoy anʼanaviy dorilarini (中成药) ham sotadi — yoʻriqnomasi faqat xitoycha. Odatiy dori kerak boʻlsa — «Menga oddiy dori kerak» kartochkasi.'),
    t('Для страховки просите официальный чек — 发票 (fāpiào).', 'For insurance, ask for an official receipt — 发票 (fāpiào).', 'Сақтандыру үшін ресми чек сұраңыз — 发票 (fāpiào).', 'Sugʻurta uchun rasmiy chek soʻrang — 发票 (fāpiào).'),
  ],
  pay: t('Оплата', 'Payment', 'Төлем', 'Toʻlov'),
  payCn: t(
    'Alipay и WeChat Pay — везде, наличные юани тоже принимают. Российские Visa и Mastercard не работают.',
    'Alipay and WeChat Pay work everywhere; cash yuan is accepted too. Russian Visa and Mastercard cards do not work.',
    'Alipay мен WeChat Pay барлық жерде жұмыс істейді, қолма-қол юань да қабылданады. Ресейлік Visa мен Mastercard жұмыс істемейді.',
    'Alipay va WeChat Pay hamma joyda ishlaydi, naqd yuan ham qabul qilinadi. Rossiya Visa va Mastercard kartalari ishlamaydi.',
  ),
  footer: t(
    'Сети и названия лекарств проверены по открытым источникам 26.10.2026. Список сетей — подсказка, а не полный перечень; адресов в приложении нет — ближайшую аптеку ищите на карте.',
    'Chains and drug names were checked against public sources on 26.10.2026. The chain list is a hint, not a full list; there are no addresses in the app — find the nearest pharmacy on the map.',
    'Желілер мен дәрі атаулары 26.10.2026 ашық дереккөздер бойынша тексерілді. Желілер тізімі — толық емес, тек кеңес; қосымшада мекенжай жоқ — ең жақын дәріхананы картадан іздеңіз.',
    'Tarmoqlar va dori nomlari 26.10.2026 da ochiq manbalar boʻyicha tekshirildi. Tarmoqlar roʻyxati — toʻliq emas, faqat maslahat; ilovada manzillar yoʻq — eng yaqin dorixonani xaritadan qidiring.',
  ),
};
