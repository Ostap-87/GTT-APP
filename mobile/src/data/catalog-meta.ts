// Подписи стран и склонения для каталога (сам каталог — catalog.json, его пишет tools/sync-catalog.mjs).
export const COUNTRY_RU: Record<string, string> = { cn: 'Китай', jp: 'Япония', kr: 'Корея', th: 'Таиланд', vn: 'Вьетнам', id: 'Индонезия', in: 'Индия', my: 'Малайзия', ae: 'ОАЭ' };
export const COUNTRY_ORDER = ['cn', 'jp', 'kr', 'th', 'vn', 'id', 'in', 'my', 'ae'];

export const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
};
