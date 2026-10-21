// Визитки поездки одним файлом (решение 21.10.2026): Excel — для таблицы и amoCRM, CSV — для импорта в Bitrix24
// (заголовки — как поля контакта Bitrix24), все визитки одним .vcf — в «Контакты» телефона или Google Контакты.
import { vcard, type BizCard } from './card';
import { VISITS } from './group';
import { TRIP } from './trip';
import type { Cell } from './xlsx';

export const CARD_HEAD = ['Имя', 'Имя (как на визитке)', 'Должность', 'Должность (оригинал)', 'Компания', 'Компания (оригинал)', 'Рабочий телефон',
  'Мобильный телефон', 'Рабочий e-mail', 'WeChat', 'Сайт', 'Адрес', 'Где познакомились', 'Дата', 'Комментарий'];
export const CARD_WIDTHS = [22, 16, 26, 18, 26, 22, 18, 18, 24, 14, 22, 30, 22, 12, 40];

export function cardRows(cards: BizCard[]): Cell[][] {
  return [CARD_HEAD, ...cards.map((c) => {
    const v = VISITS.find((x) => x.id === c.visit);
    return [
      c.latin || c.name, c.name !== c.latin ? c.name : '', c.titleRu || c.title, c.titleRu ? c.title : '', c.companyRu || c.company, c.companyRu ? c.company : '',
      c.phones[0] || '', c.phones[1] || '', c.email, c.wechat, c.site, c.address, v ? `Визит: ${v.name}` : '', c.at,
      [`Global Tech Tour · ${TRIP.title}`, c.phones.length > 2 ? `ещё телефоны: ${c.phones.slice(2).join(', ')}` : ''].filter(Boolean).join(' · '),
    ];
  })];
}

export const allVcards = (cards: BizCard[]) => cards.map(vcard).join('\r\n');
