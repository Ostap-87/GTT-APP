// Профиль делегата (решение пользователя 16.10.2026): питание — несколько вариантов, аллергия — на что именно,
// номер, языки, интересы. Китайские названия — для карточки официанту; переводы проверит переводчик группы.
export const DIET_OPTS = [
  ['none', 'Без ограничений', '没有饮食限制'], ['veg', 'Вегетарианское', '素食'], ['vegan', 'Веганское', '纯素'],
  ['pork', 'Без свинины', '不吃猪肉'], ['beef', 'Без говядины', '不吃牛肉'], ['halal', 'Халяль', '清真'], ['kosher', 'Кошер', '犹太洁食'],
  ['sea', 'Без рыбы и морепродуктов', '不吃鱼和海鲜'], ['spicy', 'Без острого', '不吃辣'], ['gluten', 'Без глютена', '无麸质'],
  ['lactose', 'Без лактозы', '无乳糖'], ['sugar', 'Без сахара', '无糖'],
] as const;

export const ALLERGENS = [
  ['peanut', 'Арахис', '花生'], ['nuts', 'Орехи', '坚果'], ['shellfish', 'Креветки, крабы, моллюски', '虾、蟹和贝类'], ['fish', 'Рыба', '鱼'],
  ['milk', 'Молоко', '牛奶和乳制品'], ['egg', 'Яйца', '鸡蛋'], ['wheat', 'Пшеница (глютен)', '小麦（麸质）'], ['soy', 'Соя', '大豆'],
  ['sesame', 'Кунжут', '芝麻'], ['celery', 'Сельдерей', '芹菜'], ['mustard', 'Горчица', '芥末'], ['msg', 'Глутамат натрия', '味精'],
  ['honey', 'Мёд', '蜂蜜'], ['citrus', 'Цитрусовые', '柑橘类水果'],
] as const;

export const HEALTH_OPTS = ['Тяжело долго ходить', 'Укачивает в транспорте', 'Нужен холодильник для лекарств', 'Нужен номер на нижнем этаже'];
export const INTERESTS = ['Собственные марки', 'Доставка', 'Логистика и склады', 'Автоматизация', 'Поставщики', 'Маркетинг', 'Инвестиции', 'Технологии'];
export const ENG = [['no', 'Не говорю'], ['basic', 'Базовый'], ['fluent', 'Свободно']] as const;
export const MESSENGERS = ['Telegram', 'WhatsApp', 'WeChat'] as const;

const DIET_BY = Object.fromEntries(DIET_OPTS.map((x) => [x[0], x]));
const ALG_BY = Object.fromEntries(ALLERGENS.map((x) => [x[0], x]));

export type Profile = {
  diets: string[];
  algOn: boolean;
  alg: string[];
  algOther: string;
  severe: boolean;
  room: 'single' | 'double';
  mate: string;
  eng: (typeof ENG)[number][0];
  msg: (typeof MESSENGERS)[number];
  interests: string[];
  health: string[];
  healthNote: string;
  consent: boolean;
  saved: boolean;
};

export const freshProfile = (): Profile => ({
  diets: [], algOn: false, alg: [], algOther: '', severe: false, room: 'double', mate: 'd7', eng: 'basic', msg: 'Telegram',
  interests: ['Собственные марки', 'Доставка'], health: [], healthNote: '', consent: false, saved: false,
});

export const dietNames = (p: Profile) => p.diets.map((k) => DIET_BY[k][1]);
export const algNames = (p: Profile) => (p.algOn ? p.alg.map((k) => ALG_BY[k][1] as string).concat(p.algOther.trim() ? [p.algOther.trim()] : []) : []);
/** Сведения о здоровье — особая категория персональных данных (152-ФЗ): без согласия не сохраняем. */
export const healthGiven = (p: Profile) => (p.algOn && (p.alg.length > 0 || p.algOther.trim() !== '')) || p.health.length > 0 || p.healthNote.trim() !== '';

export function foodLine(p: Profile) {
  const a = algNames(p);
  return [dietNames(p).join(', ') || 'питание не указано', a.length ? `аллергия: ${a.join(', ')}${p.severe ? ' (серьёзная)' : ''}` : '']
    .filter(Boolean).join(' · ');
}

/** Карточка для официанта: что нельзя и как готовить — по-китайски, с переводом. */
export function waiterText(p: Profile) {
  const alg = p.algOn ? p.alg.map((k) => ALG_BY[k][2] as string).concat(p.algOther.trim() ? [p.algOther.trim()] : []) : [];
  const diets = p.diets.filter((k) => k !== 'none');
  const zh: string[] = [];
  const ru: string[] = [];
  if (alg.length) {
    zh.push(`我对以下食物过敏：${alg.join('、')}。请不要在我的菜里放这些食物，也不要用接触过它们的锅和油。`);
    ru.push(`У меня аллергия: ${algNames(p).join(', ')}. Пожалуйста, не добавляйте это в мои блюда и не готовьте в той же посуде и масле.`);
    if (p.severe) { zh.push('我的过敏很严重，可能危及生命。'); ru.push('Аллергия серьёзная, опасна для жизни.'); }
  }
  if (diets.length) {
    zh.push(`饮食要求：${diets.map((k) => DIET_BY[k][2]).join('，')}。`);
    ru.push(`Питание: ${diets.map((k) => (DIET_BY[k][1] as string).toLowerCase()).join(', ')}.`);
  }
  zh.push('谢谢！');
  ru.push('Спасибо!');
  return { zh: zh.join(''), ru: ru.join(' ') };
}
