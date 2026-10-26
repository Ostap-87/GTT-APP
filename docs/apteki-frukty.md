# Аптеки и фруктовые лавки — что проверено и откуда

Разделы приложения делегата «Аптеки» (`/pharmacy`) и «Фруктовые лавки» (`/fruit`), решение пользователя 26.10.2026.
Данные — `mobile/src/data/shops.ts` (города, сети, слова для поиска), `pharmacy.ts` (карточки, вещества), `fruit.ts`
(фрукты, сезоны, фразы). Проверка — 26.10.2026 по открытым источникам ниже. Адресов магазинов в приложении нет и не будет:
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

## Ссылка на поиск в Amap

`https://uri.amap.com/search?keyword=<слово>&city=<город>&callnative=1` — проверено запросом 26.10.2026: на телефоне
переадресует в поиск m.amap.com (или открывает приложение Amap), в браузере — на ditu.amap.com.

## Что не проверено

- Класс OTC для каждого вещества в Китае: на экране — «большинство продаётся без рецепта, фармацевт скажет, если нужен рецепт».
- Наличие сетей в конкретном районе и число магазинов в городе — только «есть в городе или провинции».
- Перевод на казахский и узбекский — проверить носителю языка до пилота; китайские фразы — переводчику группы.
- В Гонконге и Макао карточки на упрощённых иероглифах (их там в основном читают); главная строка там — английская.
