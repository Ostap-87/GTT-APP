# Аптеки и фруктовые лавки — что проверено и откуда

Разделы приложения делегата «Аптеки» (`/pharmacy`) и «Фруктовые лавки» (`/fruit`), решение пользователя 26.10.2026.
Данные — `mobile/src/data/shops.ts` (города, сети, слова для поиска), `pharmacy.ts` (карточки, вещества), `fruit.ts`
(фрукты, сезоны, фразы, нарезка), `fruit-photos.ts` (авторы фото). Проверка — 26.10.2026 по открытым источникам ниже. Адресов магазинов в приложении нет и не будет:
только слова для поиска на карте (Amap на материке, Google Карты в Гонконге и Макао).

## Города (20)

Пекин, Шанхай, Гуанчжоу, Шэньчжэнь, Фошань, Ханчжоу, Сучжоу, Нанкин, Чэнду, Чунцин, Сиань, Ухань, Чанша, Сямэнь, Санья,
Харбин, Циндао, Тяньцзинь, Гонконг, Макао. Город раздел берёт из поездки (`CITY[TRIP.today]`); если его нет в списке —
ближайший в пределах 150 км (Нинбо → Ханчжоу, Хуэйчжоу → Шэньчжэнь, Чанчжоу/Чаншу → Сучжоу, Хэфэй → Нанкин), иначе
город выбирают вручную. Проверено на всех 76 программах каталога: ни одной ошибки, без города — только Нинся,
Внутренняя Монголия, Тайчжоу и Чжаньцзян.

## Сети аптек — правило

В списке города — только сети, о присутствии которых в городе или его провинции есть данные. Нет данных — экран прямо
пишет «местные сети не проверены, ищите 药店 на карте» и показывает крупные сети страны с пометкой «проверьте на карте».

| Город | Сети в приложении | Источник |
| --- | --- | --- |
| Крупные сети страны | 国大药房 (Sinopharm, Шанхай), 老百姓大药房 (Чанша, 18 провинций), 益丰大药房 (Чанша), 大参林 (Гуанчжоу, 20+ провинций), 一心堂 (Куньмин), 海王星辰 (Шэньчжэнь, 70+ городов) | [voc.com.cn](https://m.voc.com.cn/xhn/news/202508/30294947.html), [bjnews](https://www.bjnews.com.cn/detail/1776941490168654.html), [gelonghui](https://m.gelonghui.com/news/5230407), [usmart](https://www.usmart.hk/en/news-detail/6691996460596199483), [Wikipedia: Nepstar](https://en.wikipedia.org/wiki/Nepstar), [36kr: 一心堂](https://pitchhub.36kr.com/project/1678228750038018) |
| Пекин | 同仁堂, 金象大药房, 国大药房 | [maigoo](https://m.maigoo.com/top/439518.html), [nbd](https://www.nbd.com.cn/articles/2018-12-25/1285024.html) |
| Шанхай | 第一医药, 雷允上, 国大药房, 益丰 | [yicai](https://www.yicai.com/news/101007681.html), [pharnexcloud](https://www.pharnexcloud.com/qiye/shanghaidiyiyiyaogufenyouxiangongsi), [industrialhistoryhk](https://industrialhistoryhk.org/?p=65675), [maigoo (益丰, 9 провинций)](https://m.maigoo.com/top/440576.html) |
| Гуанчжоу, Фошань | 大参林 (Гуандун) | [gelonghui](https://m.gelonghui.com/news/5230407) |
| Шэньчжэнь | 海王星辰 (головной офис), 大参林 | [Wikipedia: Nepstar](https://en.wikipedia.org/wiki/Nepstar), [jiemian](https://m.jiemian.com/article/10028112.html) |
| Ханчжоу | 胡庆余堂 (с 1874 г.), 九洲大药房, 益丰 (Чжэцзян) | [Wikipedia: Hu Qing Yu Tang](https://en.wikipedia.org/wiki/Hu_Qing_Yu_Tang), [PR Newswire: Jo-Jo](https://prnewswire.com/news-releases/china-jo-jo-adds-seven-new-retail-drugstores-in-hangzhou-300566487.html) |
| Сучжоу | 雷允上 (с 1734 г.) | [industrialhistoryhk](https://industrialhistoryhk.org/?p=65675), [cnpp](https://www.cnpp.cn/pinpai/39350.html) |
| Нанкин | 益丰, 百信药房 (Nanjing Pharmaceutical), 先声再康 | [pharnexcloud](https://www.pharnexcloud.com/zixun/sx_2289), [maigoo](https://m.maigoo.com/top/440576.html) |
| Чэнду | 一心堂 (~450 в Сычуани), 和平药房 (Сычуань, Чунцин, Гуйчжоу) | [scol](https://cbgc.scol.com.cn/news/7701420), [maigoo](https://m.maigoo.com/top/439563.html) |
| Чунцин | 和平药房, 桐君阁, 鑫斛药房, 一心堂 | [maigoo](https://m.maigoo.com/top/439563.html), [sina 2006](https://finance.sina.com.cn/roll/20060605/0245726949.shtml), [bendibao](https://m.cq.bendibao.com/wangdian/yiliaojiankang/pengshuimiaozutujiaz/list5.htm) |
| Сиань | 怡康医药 (1 700+ магазинов), 老百姓 (Шэньси) | [pedaily](https://news.pedaily.cn/201808/435318.shtml); 广济大药房 не включён — банкротство ([sina](https://cj.sina.com.cn/articles/view/6192937794/17120bb4202002njp6)) |
| Ухань | 益丰 (провинция Хубэй) | [maigoo](https://m.maigoo.com/top/440576.html) |
| Чанша | 老百姓, 益丰 (оба оттуда) | см. «Крупные сети» |
| Сямэнь | только крупные сети страны | название розничной сети 鹭燕 проверить не удалось |
| Санья | 一心堂 (провинция Хайнань) | [36kr](https://pitchhub.36kr.com/project/1678228750038018) |
| Харбин | 人民同泰, 大参林 (сильные позиции в Хэйлунцзяне) | [pharnexcloud](https://www.pharnexcloud.com/trz/trz_24c53b7d2509163c419837cad3adb157), [cs.com.cn](https://epaper.cs.com.cn/zgzqb/images/2026-04/24/B383/zqB38324.pdf) |
| Циндао | 漱玉平民 (дочерняя компания в Циндао) | [sina](https://finance.sina.cn/2023-04-04/detail-imypemip3049550.d.html) |
| Тяньцзинь | 津一堂, 瑞澄大药房, 老百姓 | [maigoo](https://www.maigoo.com/top/439524.html) |
| Гонконг | 屈臣氏 Watsons, 萬寧 Mannings; 藥房 (фармацевт, знак Rx) / 藥行 | [LegCo](https://www.legco.gov.hk/yr08-09/chinese/panels/hs/papers/hs0331cb2-1168-2-c.pdf), [星島](https://www.stheadline.com/columnists/lifestyle/1868376/168家健康買藥認明註冊藥最安全) |
| Макао | 屈臣氏 Watsons (Mannings не подтверждён — не включён) | [A.S. Watson](https://www.aswatson.com/wp-content/uploads/2021/06/WatsOn66c.pdf) |

## Лекарства и правила

- Названия — только МНН и официальные китайские названия (布洛芬, 对乙酰氨基酚, 氯雷他定, 西替利嗪, 蒙脱石散,
  口服补液盐, 洛哌丁胺, 茶苯海明, 铝碳酸镁, 法莫替丁, 氨溴索, 双氯芬酸二乙胺乳胶剂, 炉甘石洗剂, 碘伏, 乳果糖);
  дозировок нет, на каждом экране — «уточните у фармацевта или врача; при угрозе жизни — 120» (Гонконг и Макао — 999).
- Декстрометорфан **не включён**: с 01.07.2024 — психотропное вещество 2-й группы
  ([thepaper](https://www.thepaper.cn/newsDetail_forward_27283380), [ycwb](https://news.ycwb.com/2024-06/25/content_52766436.htm)).
- Средства с эфедрином/псевдоэфедрином — запись документа, не больше 2 упаковок
  ([pharnexcloud](https://www.pharnexcloud.com/data/zcfg_3422c902fadb3c65edb966e29d89e201.html)).
- OTC красный (甲类) и зелёный (乙类), антибиотики — по рецепту ([thepaper](https://www.thepaper.cn/newsDetail_forward_30614083)).
- Амброксол — есть типовая инструкция НМПА как безрецептурного ([nmpa.gov.cn](https://www.nmpa.gov.cn/directory/web/nmpa/images/1626254262060024018.doc)).
- Мелатонин в Китае — БАД (保健食品).
- Доставка лекарств Meituan ~30 минут ([sfccn](https://www.sfccn.com/2025/4-15/wNMDE0NDlfMjAyMzUwNQ.html)).
- Гонконг: парацетамол — 撲熱息痛 (Panadol — 必理痛); показывать английское название.
- Номера: материк 120; Гонконг 999; Макао 999, 110 и 112 соединяют туда же
  ([Wikipedia](https://en.wikipedia.org/wiki/Telephone_numbers_in_Macau)).

## Фрукты

- 斤 на материке = 500 г; в Гонконге = 604,79 г (кэтти), там же цены за 磅 (454 г)
  ([Wikipedia: Jin](https://en.wikipedia.org/wiki/Jin_(mass))).
- 百果园 Pagoda — около 4 700 магазинов в 180+ городах 22 провинций (I полугодие 2026,
  [10jqka](https://stock.10jqka.com.cn/20260901/c679465560.shtml)); 果多美 — Пекин, группа Pagoda
  ([cnpp](https://www.cnpp.cn/china/list_8569.html)); 鲜丰水果 — Чжэцзян, Шанхай, Цзянсу, Аньхой, Чунцин (данные 2020,
  [36kr](https://www.36kr.com/p/663040879830407)).
- Макао: 紅街市 (фрукты — верхний этаж и уличный базар, [macaulifestyle](https://macaulifestyle.com/city-guide/red-market/));
  Гонконг: 油麻地果欄, супермаркеты 百佳 и 惠康.
- Сезоны — основные в Китае, примерно ([China Daily](https://language.chinadaily.com.cn/a/202407/31/WS66aa01dfa3104e74fddb7d12.html),
  [cnhnb](https://news.cnhnb.com/mrdzx/detail/449332), [sina 2026](https://finance.sina.com.cn/jjxw/2026-05-12/doc-inhxqeev1646930.shtml)).
- Местные сорта (平谷大桃, 增城荔枝, 塘栖枇杷, 周至猕猴桃, 奉节脐橙, 冻梨 и др.) — известные географические
  указания; по отдельности источники не собирали.

## Нарезка (果切) — вкладка «Нарезка»

Вкладки «На вес · 称重» и «Нарезка · 果切» — решение пользователя 26.10.2026. Что написано в приложении и откуда:

| Утверждение в приложении | Источник |
| --- | --- |
| Нарезку продают в коробочках (盒装果切), в лавках, супермаркетах и с доставкой | [虎嗅, 10.07.2026](https://www.huxiu.com/article/4874188.html) («台面上整整齐齐码着五颜六色的水果盒», «开盒即食的果切»); [市监科普, 汉中市市场监管局, 09.04.2026](https://m.thepaper.cn/newsDetail_forward_32940782) («习惯购买已打包的盒装果切») |
| Обычно цена за коробку, но бывает за вес — спросите цену до нарезки и взвешивания | [界面新闻](https://www.jiemian.com/article/9838686.html) / [钛媒体](https://www.tmtpost.com/6638262.html): цена «14,8 юаня за полцзиня», взвесили после нарезки — почти 100 юаней; «要先挑选再称重才能知道价格»; [虎嗅](https://www.huxiu.com/article/4874188.html): «称重自选模式» у 水果捞 |
| Нарезка в разы дороже целых фруктов | [虎嗅](https://www.huxiu.com/article/4874188.html): «一斤应季西瓜零售价不过两三元，切好装盒就翻了好几倍» |
| На коробке должно быть время нарезки (制作时间) — только для материка | [市监科普](https://m.thepaper.cn/newsDetail_forward_32940782): «《食用农产品市场销售质量安全监督管理办法》规定，销售即食食用农产品应当如实标明具体制作时间» |
| Берите из холодильника | там же: «全程冷链的果切手感较冰凉» |
| Съесть за 2 часа; в холодильнике (0–4 °C) — не дольше 12 часов | там же: «建议2小时内食用完毕；若需暂存…冷藏（0—4℃），且不超过12小时» |
| Не брать, если заветрилось, течёт, потемнело или пахнет брожением | там же: «发蔫、渗水、褐变…发酵味、酒味、馊味，说明已经变质» |
| Надёжнее всего — целый фрукт | [虎嗅](https://www.huxiu.com/article/4874188.html): «最安全的做法是购买整果自行处理» |

- Набор нарезки (арбуз, ананас, дыня Хами, манго, питахайя, мякоть дуриана, джекфрут, очищенное помело, вскрытый кокос,
  ассорти) — самые частые виды в тех же статьях (西瓜、哈密瓜、火龙果、芒果 — «最受欢迎» в [虎嗅](https://www.huxiu.com/article/4874188.html));
  в карточках — только вопрос «есть ли у вас… и сколько стоит коробка», без утверждений о цене.
- Фразы «за коробку или за 斤?», «скажите цену до нарезки», «когда нарезали?», «нарежьте при мне», «коробка поменьше»,
  «вилочку» — просьбы и вопросы, утверждений о том, как принято, в них нет. Что к коробке дают вилочку или зубочистки —
  источника не нашли, поэтому в приложении это только просьба.
- 切 в разделе всегда «резать» — пиньинь qiē (pinyin-pro давал qiè, исправлено в `PY_WORDS`, это поправило и карточку
  «Порежьте и положите в коробку»).

## Фото

Все фото — настоящие фотографии с Wikimedia Commons (не генерации), лицензии только CC0, общественное достояние, CC BY и
CC BY-SA (проверены 26.10.2026). Каждое проверено глазами: правильный вид (杨梅 — Myrica rubra, 砂糖橘 — маленькие
мандарины, 哈密瓜 — дыня Хами, 车厘子 — крупная тёмная черешня), без логотипов, наклеек, надписей и лиц. Изменения:
обрезаны до квадрата 480×480 (у студийных снимков фон продолжен по краю), JPG ~80 %, 12–42 КБ; файлы —
`mobile/assets/fruit/<файл>`. В приложении — строка «Фото: Wikimedia Commons · авторы и лицензии» внизу списка фруктов
и экран `/fruit-photos` (автор, лицензия со ссылкой на текст, страница файла). CC BY-SA распространяется на сами фото
(при изменении — та же лицензия), а не на код приложения.

| Файл | Что на фото | Автор | Лицензия | Страница файла |
| --- | --- | --- | --- | --- |
| `lychee.jpg` | Личи 荔枝 | Ivar Leidus | CC BY-SA 4.0 | [Lychee fruits and seed.jpg](https://commons.wikimedia.org/wiki/File:Lychee_fruits_and_seed.jpg) |
| `longan.jpg` | Лонган 龙眼 | Dinkun Chen | CC BY-SA 4.0 | [Dimocarpus longan (2).jpg](https://commons.wikimedia.org/wiki/File:Dimocarpus_longan_(2).jpg) |
| `mango.jpg` | Манго 芒果 | Ivar Leidus | CC BY-SA 4.0 | [Mangos - single and halved.jpg](https://commons.wikimedia.org/wiki/File:Mangos_-_single_and_halved.jpg) |
| `durian.jpg` | Дуриан 榴莲 | Rod Waddington | CC BY-SA 2.0 | [Durian Fruit in Yunnan.jpg](https://commons.wikimedia.org/wiki/File:Durian_Fruit_in_Yunnan.jpg) |
| `mangosteen.jpg` | Мангостин 山竹 | Ivar Leidus | CC BY-SA 4.0 | [Mangosteens - whole and opened.jpg](https://commons.wikimedia.org/wiki/File:Mangosteens_-_whole_and_opened.jpg) |
| `pitaya.jpg` | Питахайя 火龙果 | Webysther Nunes | CC BY-SA 4.0 | [Webysther 20150409032418 - Pitaya.jpg](https://commons.wikimedia.org/wiki/File:Webysther_20150409032418_-_Pitaya.jpg) |
| `bayberry.jpg` | Восковница 杨梅 (Myrica rubra) | Dinkun Chen | CC BY-SA 4.0 | [Myrica rubra in China.jpg](https://commons.wikimedia.org/wiki/File:Myrica_rubra_in_China.jpg) |
| `loquat.jpg` | Локва 枇杷 | Dinkun Chen | CC BY-SA 4.0 | [Loquat (Eriobotrya japonica) in China.jpg](https://commons.wikimedia.org/wiki/File:Loquat_(Eriobotrya_japonica)_in_China.jpg) |
| `kiwi.jpg` | Киви 猕猴桃 | André Karwath aka Aka | CC BY-SA 2.5 | [Kiwi aka.jpg](https://commons.wikimedia.org/wiki/File:Kiwi_aka.jpg) |
| `pomelo.jpg` | Помело 柚子 | Ivar Leidus | CC BY-SA 4.0 | [Pomelo fruit.jpg](https://commons.wikimedia.org/wiki/File:Pomelo_fruit.jpg) |
| `orange.jpg` | Апельсин 橙子 | Evan-Amos | CC BY-SA 3.0 | [Orange-Fruit-Pieces.jpg](https://commons.wikimedia.org/wiki/File:Orange-Fruit-Pieces.jpg) |
| `mandarin.jpg` | Мандарин 砂糖橘 (на фото — мандарины с листьями, Citrus reticulata) | Joe Ravi | CC BY-SA 3.0 | [Mandarin Oranges (Citrus Reticulata).jpg](https://commons.wikimedia.org/wiki/File:Mandarin_Oranges_(Citrus_Reticulata).jpg) |
| `strawberry.jpg` | Клубника 草莓 | Ivar Leidus | CC BY-SA 4.0 | [Garden strawberry (Fragaria × ananassa) single2.jpg](https://commons.wikimedia.org/wiki/File:Garden_strawberry_(Fragaria_%C3%97_ananassa)_single2.jpg) |
| `watermelon.jpg` | Арбуз 西瓜 | Mishra12krati | CC BY-SA 4.0 | [Watermelon slice.jpg](https://commons.wikimedia.org/wiki/File:Watermelon_slice.jpg) |
| `hami.jpg` | Дыня Хами 哈密瓜 | Harrison Keely | CC BY 4.0 | [A hami melon for sale at a Publix market in Knoxville, Tennessee.jpg](https://commons.wikimedia.org/wiki/File:A_hami_melon_for_sale_at_a_Publix_market_in_Knoxville,_Tennessee.jpg) |
| `cherry.jpg` | Черешня местная 樱桃 (Яньтай) | Jinsin chen | CC BY-SA 4.0 | [Cherries in Yantai, China.jpg](https://commons.wikimedia.org/wiki/File:Cherries_in_Yantai,_China.jpg) |
| `chelizi.jpg` | Черешня импортная 车厘子 (чилийская) | Fumikas Sagisavas | CC0 | [Chilean cherries (1).jpg](https://commons.wikimedia.org/wiki/File:Chilean_cherries_(1).jpg) |
| `grape.jpg` | Виноград 葡萄 | Anna.Massini | CC BY 4.0 | [Uva nera da vino - grappoli 1.jpg](https://commons.wikimedia.org/wiki/File:Uva_nera_da_vino_-_grappoli_1.jpg) |
| `peach.jpg` | Персик 桃子 | Takkk | CC BY-SA 3.0 | [Prunus persica - Peach Hungary.jpg](https://commons.wikimedia.org/wiki/File:Prunus_persica_-_Peach_Hungary.jpg) |
| `persimmon.jpg` | Хурма 柿子 | Joe Ravi | CC BY-SA 3.0 | [Fuyu Persimmon (Diospyros Kaki).jpg](https://commons.wikimedia.org/wiki/File:Fuyu_Persimmon_(Diospyros_Kaki).jpg) |
| `pomegranate.jpg` | Гранат 石榴 | Ivar Leidus | CC BY-SA 4.0 | [Pomegranate fruit - whole and piece with arils.jpg](https://commons.wikimedia.org/wiki/File:Pomegranate_fruit_-_whole_and_piece_with_arils.jpg) |
| `pineapple.jpg` | Ананас 菠萝 | UneksAbdullahi | CC BY-SA 4.0 | [Pineapple-fruit.jpg](https://commons.wikimedia.org/wiki/File:Pineapple-fruit.jpg) |
| `coconut.jpg` | Кокос 椰子 (молодой, обрезанный) | Thamizhpparithi Maari | CC BY-SA 4.0 | ["Tender Coconut".jpg](https://commons.wikimedia.org/wiki/File:%22Tender_Coconut%22.jpg) |
| `pear.jpg` | Груша 梨 (азиатская, Pyrus pyrifolia) | JJ Harrison | CC BY-SA 3.0 | [Pyrus pyrifolia.jpg](https://commons.wikimedia.org/wiki/File:Pyrus_pyrifolia.jpg) |
| `apple.jpg` | Яблоко 苹果 (Фудзи) | Superbass | CC BY-SA 4.0 | [Apfel-Fuji.jpg](https://commons.wikimedia.org/wiki/File:Apfel-Fuji.jpg) |
| `radish.jpg` | Зелёная редька 沙窝萝卜 (Тяньцзинь) | Fumikas Sagisavas | CC0 | [Green radish.jpg](https://commons.wikimedia.org/wiki/File:Green_radish.jpg) |
| `frozen-pear.jpg` | Мороженая груша 冻梨 (Харбин) | 闫恩铭 / Enming Yan | CC BY-SA 4.0 | [Rime Island Hantun Village 16 Frozen Pear (Dongli) and persimmon (cropped).jpg](https://commons.wikimedia.org/wiki/File:Rime_Island_Hantun_Village_16_Frozen_Pear_(Dongli)_and_persimmon_(cropped).jpg) |
| `yellow-peach.jpg` | Жёлтый персик 炎陵黄桃 (Чанша) | Jack Dykinga, USDA | общественное достояние | [Autumn Red peaches.jpg](https://commons.wikimedia.org/wiki/File:Autumn_Red_peaches.jpg) |
| `cut-watermelon.jpg` | Нарезка: арбуз | Cheikh cherif | CC BY-SA 4.0 | [Pastèque-2025.jpg](https://commons.wikimedia.org/wiki/File:Past%C3%A8que-2025.jpg) |
| `cut-pineapple.jpg` | Нарезка: ананас в коробке | B722N | CC BY-SA 4.0 | [Sliced pineapple in a plastic container.jpg](https://commons.wikimedia.org/wiki/File:Sliced_pineapple_in_a_plastic_container.jpg) |
| `cut-hami.jpg` | Нарезка: дыня Хами | Dinkun Chen | CC BY-SA 4.0 | [HAMI MELON INSIDE.jpg](https://commons.wikimedia.org/wiki/File:HAMI_MELON_INSIDE.jpg) |
| `cut-mango.jpg` | Нарезка: манго «ёжиком» | Zantastik | CC BY-SA 3.0 | [Sliced-cubed Mango 01.jpg](https://commons.wikimedia.org/wiki/File:Sliced-cubed_Mango_01.jpg) |
| `cut-pitaya.jpg` | Нарезка: питахайя | rajucreddy | CC0 | [Whispers of Serenity White Dragon Fruit Cubes by Raju C Reddy.jpg](https://commons.wikimedia.org/wiki/File:Whispers_of_Serenity_White_Dragon_Fruit_Cubes_by_Raju_C_Reddy.jpg) |
| `cut-durian.jpg` | Нарезка: мякоть дуриана в коробке (Чунцин) | TarnishedPath | CC BY-SA 4.0 | [Durian flesh image 1.jpg](https://commons.wikimedia.org/wiki/File:Durian_flesh_image_1.jpg) |
| `cut-jackfruit.jpg` | Нарезка: джекфрут 菠萝蜜 | PattayaPatrol | CC BY-SA 4.0 | [DFC 4176 Golden jackfruit bulbs piled together ready to eat.jpg](https://commons.wikimedia.org/wiki/File:DFC_4176_Golden_jackfruit_bulbs_piled_together_ready_to_eat.jpg) |
| `cut-pomelo.jpg` | Нарезка: очищенное помело | Allen Timothy Chang (Allentchang) | CC BY-SA 3.0 | [Pomelo peeled sectioned.jpg](https://commons.wikimedia.org/wiki/File:Pomelo_peeled_sectioned.jpg) |
| `cut-coconut.jpg` | Нарезка: вскрытый кокос с трубочкой | Benjaminong | CC BY-SA 2.5 | [Coconut drink.jpg](https://commons.wikimedia.org/wiki/File:Coconut_drink.jpg) |
| `cut-mixed.jpg` | Нарезка: ассорти в коробке | HaJunkiyada (Liat Portal) | CC BY-SA 4.0 | [Liat Portal for Foodie Disorder - Assorted Fresh Fruit Tray.jpg](https://commons.wikimedia.org/wiki/File:Liat_Portal_for_Foodie_Disorder_-_Assorted_Fresh_Fruit_Tray.jpg) |

- Местные сорта со своим видом (冻梨, 炎陵黄桃, 沙窝萝卜) — своё фото (`LocalFruit.photo` в `shops.ts`), остальные сорта
  показывают фото своего фрукта. 释迦 (сахарное яблоко) и 莲雾 (восковое яблоко) в списках раздела пока нет — фото для них
  не искали.

## Ссылка на поиск в Amap

`https://uri.amap.com/search?keyword=<слово>&city=<город>&callnative=1` — проверено запросом 26.10.2026: на телефоне
переадресует в поиск m.amap.com (или открывает приложение Amap), в браузере — на ditu.amap.com.

## Что не проверено

- Класс OTC для каждого вещества в Китае: на экране — «большинство продаётся без рецепта, фармацевт скажет, если нужен рецепт».
- Наличие сетей в конкретном районе и число магазинов в городе — только «есть в городе или провинции».
- Перевод на казахский и узбекский — проверить носителю языка до пилота; китайские фразы — переводчику группы.
- В Гонконге и Макао карточки на упрощённых иероглифах (их там в основном читают); главная строка там — английская.
- Нарезка: дают ли к коробке вилочку или зубочистки и как принято продавать мякоть дуриана и джекфрута (за коробку или
  за вес) — источников нет, в приложении это только вопросы продавцу. Правило о времени нарезки — материковое; для
  Гонконга и Макао его не показываем.
