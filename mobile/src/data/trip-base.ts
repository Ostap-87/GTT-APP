// Тестовая поездка «Новый ритейл Китая», 9–14 ноября 2026 — из кликабельного прототипа (design/prototype/index.html).
// Все делегаты вымышленные; отели, рестораны, погода и телефоны — примеры. В приложении данные придут с сервера.
// Массивы и словари поездки меняются на месте, когда в демо выбирают другую программу (data/active.ts).

export type Delegate = { id: string; ru: string; lat: string; roleRu: string; roleZh: string; roleEn: string; coRu: string; coZh: string; coEn: string; cityRu: string; cityZh: string; cityEn: string; ind: string };
export type Hotel = { name: string; city: string; addrZh: string; addrRu: string; addrEn: string; nights: string; phone: string; desc: string };
export type Meal = { title: string; when: string; place: string; addrZh: string; cuisine: string; options: string[] };
export type Culture = { title: string; when: string; desc: string; bring: string };

const ROWS: string[][] = [
    ['d1', 'Анна Смирнова', 'Anna Smirnova', 'Коммерческий директор', '商业总监', 'Commercial Director', 'Сеть супермаркетов', '连锁超市', 'Supermarket chain', 'Казань', '喀山', 'Kazan', 'retail'],
    ['d2', 'Дмитрий Орлов', 'Dmitry Orlov', 'Основатель', '创始人', 'Founder', 'Доставка свежих продуктов', '生鲜配送平台', 'Fresh-food delivery', 'Москва', '莫斯科', 'Moscow', 'retail'],
    ['d3', 'Елена Ковалёва', 'Elena Kovaleva', 'Директор по закупкам', '采购总监', 'Purchasing Director', 'Производитель снеков', '休闲食品制造商', 'Snack manufacturer', 'Санкт-Петербург', '圣彼得堡', 'Saint Petersburg', 'manufacturing'],
    ['d4', 'Игорь Белов', 'Igor Belov', 'Партнёр', '合伙人', 'Partner', 'Фонд инвестиций в ритейл', '零售投资基金', 'Retail investment fund', 'Москва', '莫斯科', 'Moscow', 'investment'],
    ['d5', 'Марина Лебедева', 'Marina Lebedeva', 'Руководитель e-commerce', '电商负责人', 'Head of E-commerce', 'Сеть одежды', '服装零售', 'Fashion retail', 'Екатеринбург', '叶卡捷琳堡', 'Yekaterinburg', 'retail'],
    ['d6', 'Павел Соколов', 'Pavel Sokolov', 'Операционный директор', '运营总监', 'Operations Director', 'Сеть магазинов у дома', '便利店连锁', 'Convenience stores', 'Новосибирск', '新西伯利亚', 'Novosibirsk', 'retail'],
    ['d7', 'Ольга Морозова', 'Olga Morozova', 'Категорийный менеджер', '品类经理', 'Category Manager', 'Гипермаркет', '大型超市', 'Hypermarket', 'Москва', '莫斯科', 'Moscow', 'retail'],
    ['d8', 'Сергей Волков', 'Sergey Volkov', 'Директор по логистике', '物流总监', 'Logistics Director', 'Розничная группа', '零售集团', 'Retail group', 'Санкт-Петербург', '圣彼得堡', 'Saint Petersburg', 'retail'],
    ['d9', 'Наталья Фёдорова', 'Natalia Fedorova', 'Директор по маркетингу', '市场总监', 'Marketing Director', 'Маркетплейс', '电商平台', 'E-commerce platform', 'Москва', '莫斯科', 'Moscow', 'retail'],
    ['d10', 'Алексей Кузнецов', 'Alexey Kuznetsov', 'Генеральный директор', '首席执行官', 'CEO', 'Магазины техники', '家电零售', 'Appliance retail', 'Краснодар', '克拉斯诺达尔', 'Krasnodar', 'retail'],
    ['d11', 'Юлия Попова', 'Yulia Popova', 'Продакт-менеджер', '产品经理', 'Product Manager', 'Собственные марки', '自有品牌', 'Private label', 'Москва', '莫斯科', 'Moscow', 'retail'],
    ['d12', 'Андрей Васильев', 'Andrey Vasiliev', 'Генеральный директор', '总经理', 'General Manager', 'Пищевая фабрика', '食品工厂', 'Food factory', 'Тула', '图拉', 'Tula', 'manufacturing'],
    ['d13', 'Екатерина Новикова', 'Ekaterina Novikova', 'Менеджер цепочки поставок', '供应链经理', 'Supply Chain Manager', 'Производитель напитков', '饮料制造商', 'Beverage maker', 'Самара', '萨马拉', 'Samara', 'manufacturing'],
    ['d14', 'Михаил Зайцев', 'Mikhail Zaitsev', 'Технический директор', '技术总监', 'Technical Director', 'Производство упаковки', '包装生产', 'Packaging', 'Нижний Новгород', '下诺夫哥罗德', 'Nizhny Novgorod', 'manufacturing'],
    ['d15', 'Роман Павлов', 'Roman Pavlov', 'Инвестиционный менеджер', '投资经理', 'Investment Manager', 'Венчурный фонд', '风险投资', 'Venture capital', 'Москва', '莫斯科', 'Moscow', 'investment'],
    ['d16', 'Светлана Егорова', 'Svetlana Egorova', 'Директор', '董事', 'Director', 'Семейный офис', '家族办公室', 'Family office', 'Москва', '莫斯科', 'Moscow', 'investment'],
    ['d17', 'Виктор Степанов', 'Victor Stepanov', 'Консультант', '顾问', 'Consultant', 'Консалтинг в ритейле', '零售咨询', 'Retail consulting', 'Москва', '莫斯科', 'Moscow', 'other'],
    ['d18', 'Ирина Макарова', 'Irina Makarova', 'Журналист', '记者', 'Journalist', 'Деловое издание', '商业媒体', 'Business media', 'Москва', '莫斯科', 'Moscow', 'other'],
  ];
export const DELEGATES: Delegate[] = ROWS.map((r) => ({ id: r[0], ru: r[1], lat: r[2], roleRu: r[3], roleZh: r[4], roleEn: r[5], coRu: r[6], coZh: r[7], coEn: r[8], cityRu: r[9], cityZh: r[10], cityEn: r[11], ind: r[12] }));
export const ME = DELEGATES[0];
export type Weather = { icon: 'sun' | 'cloud' | 'rain'; max: string; min: string; text: string };
export const DAYS: { wd: string; n: number; city: string }[] = [
    { wd: 'Пн', n: 9, city: 'Пекин' }, { wd: 'Вт', n: 10, city: 'Пекин' }, { wd: 'Ср', n: 11, city: 'Шанхай' },
    { wd: 'Чт', n: 12, city: 'Шанхай' }, { wd: 'Пт', n: 13, city: 'Ханчжоу' }, { wd: 'Сб', n: 14, city: 'Шэньчж.' },
  ];
export const CITY = ['Пекин', 'Пекин', 'Шанхай', 'Шанхай', 'Ханчжоу', 'Шэньчжэнь'];
export const WEATHER: Weather[] = [
    { icon: 'sun', max: '+13°', min: '+3°', text: 'Ясно, ветер 3 м/с' },
    { icon: 'sun', max: '+12°', min: '+2°', text: 'Солнечно и сухо' },
    { icon: 'cloud', max: '+18°', min: '+12°', text: 'Облачно' },
    { icon: 'rain', max: '+17°', min: '+13°', text: 'Небольшой дождь — возьмите зонт' },
    { icon: 'cloud', max: '+18°', min: '+11°', text: 'Переменная облачность' },
    { icon: 'sun', max: '+26°', min: '+19°', text: 'Тепло и влажно' },
  ];
export const HOTELS: Record<string, Hotel> = {
    beijing: { name: 'Отель у улицы Ванфуцзин', city: 'Пекин', addrZh: '北京市东城区王府井', addrRu: 'Пекин, район Дунчэн, улица Ванфуцзин', addrEn: 'Wangfujing, Dongcheng District, Beijing', nights: '9–11 ноября · 2 ночи', phone: '+86 10 0000 0000', desc: 'Заселение с 14:00, завтрак 06:30–10:00, Wi‑Fi в номере. До JD.com около 40 минут на автобусе.' },
    shanghai: { name: 'Отель на набережной Бунд', city: 'Шанхай', addrZh: '上海市黄浦区外滩', addrRu: 'Шанхай, район Хуанпу, набережная Бунд', addrEn: 'The Bund, Huangpu District, Shanghai', nights: '11–13 ноября · 2 ночи', phone: '+86 21 0000 0000', desc: 'Номера с видом на реку, завтрак 06:30–10:30, фитнес-зал. Рядом метро.' },
    shenzhen: { name: 'Отель в районе Футянь', city: 'Шэньчжэнь', addrZh: '深圳市福田区', addrRu: 'Шэньчжэнь, район Футянь', addrEn: 'Futian District, Shenzhen', nights: '13–14 ноября · 1 ночь', phone: '+86 755 0000 0000', desc: 'Заезд около 21:00 после перелёта, завтрак 06:30–10:00. Выезд 14 ноября до 12:00, багаж можно оставить у стойки.' },
  };
export const HOTEL_BY_DAY: (string | null)[] = ['beijing', 'beijing', 'shanghai', 'shanghai', 'shenzhen', null];
/** Примечания программы по дням (прилёт, «по согласованию» и т. п.) — у программ с сайта; в подробном демо пусто. */
export const DAY_NOTES: string[] = ['', '', '', '', '', ''];
export const MEALS: Record<string, Meal> = {
    'm-mon-d': { title: 'Приветственный ужин', when: 'Пн, 9 ноября · 19:30', place: 'Ресторан пекинской кухни', addrZh: '北京市东城区（地址见预订）', cuisine: 'Пекинская утка, холодные закуски, овощи на воке.', options: ['Классическое меню', 'Вегетарианское', 'Без свинины'] },
    'm-tue-l': { title: 'Обед', when: 'Вт, 10 ноября · 13:00', place: 'Ресторан кантонской кухни рядом с JD.com', addrZh: '北京市大兴区（地址见预订）', cuisine: 'Димсамы, рис с овощами, суп дня.', options: ['Классическое меню', 'Вегетарианское', 'Без морепродуктов'] },
    'm-tue-d': { title: 'Ужин группы', when: 'Вт, 10 ноября · 19:00', place: 'Ресторан хого (горячий котёл)', addrZh: '北京市东城区（地址见预订）', cuisine: 'Каждый варит мясо, овощи и тофу в бульоне за столом.', options: ['Неострый бульон', 'Острый сычуаньский', 'Грибной вегетарианский'] },
    'm-wed-l': { title: 'Обед', when: 'Ср, 11 ноября · 12:00', place: 'Ресторан шанхайской кухни', addrZh: '上海市黄浦区（地址见预订）', cuisine: 'Сяолунбао — пельмени с бульоном, тушёная свинина по-шанхайски.', options: ['Классическое меню', 'Вегетарианское', 'Без свинины'] },
    'm-thu-l': { title: 'Обед', when: 'Чт, 12 ноября · 12:30', place: 'Бизнес-ланч рядом с RT-Mart', addrZh: '上海市（地址见预订）', cuisine: 'Сет из трёх блюд: суп, горячее, фрукты.', options: ['Классическое меню', 'Вегетарианское'] },
    'm-thu-d': { title: 'Ужин на набережной', when: 'Чт, 12 ноября · 20:00', place: 'Ресторан с видом на реку', addrZh: '上海市黄浦区外滩（地址见预订）', cuisine: 'Китайская и европейская кухня на выбор.', options: ['Китайское меню', 'Европейское меню', 'Вегетарианское'] },
    'm-fri-l': { title: 'Обед', when: 'Пт, 13 ноября · 13:30', place: 'Ресторан ханчжоуской кухни', addrZh: '杭州市西湖区（地址见预订）', cuisine: 'Рыба из озера Сиху в кисло-сладком соусе, креветки с чаем Лунцзин.', options: ['Классическое меню', 'Без рыбы и морепродуктов', 'Вегетарианское'] },
    'm-sat-l': { title: 'Обед', when: 'Сб, 14 ноября · 12:00', place: 'Ресторан кантонской кухни', addrZh: '深圳市福田区（地址见预订）', cuisine: 'Морепродукты, жареный рис, кантонские десерты.', options: ['Классическое меню', 'Без морепродуктов', 'Вегетарианское'] },
  };
export const MEAL_ADDR: Record<string, [string, string]> = {
    'm-mon-d': ['Пекин, район Дунчэн', 'Dongcheng District, Beijing'],
    'm-tue-l': ['Пекин, район Дасин, рядом с JD.com', 'Daxing District, Beijing, near JD.com'],
    'm-tue-d': ['Пекин, район Дунчэн', 'Dongcheng District, Beijing'],
    'm-wed-l': ['Шанхай, район Хуанпу', 'Huangpu District, Shanghai'],
    'm-thu-l': ['Шанхай, рядом с RT-Mart', 'Shanghai, near RT-Mart'],
    'm-thu-d': ['Шанхай, набережная Бунд', 'The Bund, Shanghai'],
    'm-fri-l': ['Ханчжоу, район Сиху', 'Xihu District, Hangzhou'],
    'm-sat-l': ['Шэньчжэнь, район Футянь', 'Futian District, Shenzhen'],
  };
export const CULTURE: Record<string, Culture> = {
    'c-bund': { title: 'Прогулка по набережной Бунд', when: 'Чт, 12 ноября · 18:00–19:30', desc: 'Вечерняя прогулка с гидом вдоль исторических зданий набережной, вид на небоскрёбы Пудуна. Сбор у отеля.', bring: 'Удобная обувь и лёгкая куртка: вечером у реки ветрено.' },
    'c-tea': { title: 'Чайная церемония Лунцзин', when: 'Пт, 13 ноября · 15:00–16:00', desc: 'Как собирают и заваривают зелёный чай Лунцзин, дегустация с мастером.', bring: 'Чай можно купить с собой — оплата WeChat Pay или Alipay.' },
  };
