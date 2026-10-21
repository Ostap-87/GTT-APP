// «Мои документы» (решение 21.10.2026): паспорт, виза, билеты, страховка, бронь отеля — снимок или PDF. Хранятся только
// на этом телефоне (в папке приложения), открываются без интернета и никуда не отправляются: координатор видит лишь
// отметку в чек-листе. Персональные данные в репозиторий и на сервер не попадают.
export type DocKind = 'passport' | 'visa' | 'tickets' | 'insurance' | 'hotel' | 'other';
export type TripDoc = { id: string; kind: DocKind; title: string; uri: string; type: 'image' | 'pdf'; at: string };

export const DOC_KINDS: { key: DocKind; ru: string; sub: string }[] = [
  { key: 'passport', ru: 'Паспорт', sub: 'Разворот с фото — для паспортного контроля и отеля' },
  { key: 'visa', ru: 'Виза', sub: 'Если нужна для страны поездки' },
  { key: 'tickets', ru: 'Билеты', sub: 'Электронные билеты и посадочные' },
  { key: 'insurance', ru: 'Страховка', sub: 'Полис на время поездки' },
  { key: 'hotel', ru: 'Бронь отеля', sub: 'Подтверждение брони' },
  { key: 'other', ru: 'Другое', sub: 'Приглашение, доверенность, справки' },
];
export const docKindRu = (k: DocKind) => DOC_KINDS.find((d) => d.key === k)?.ru || 'Документ';

/** Чек-лист подготовки считает пункт сделанным, когда документ есть в «Моих документах». */
export const CHECK_DOCS: Record<string, DocKind[]> = { passport: ['passport'], tickets: ['tickets', 'insurance'] };
