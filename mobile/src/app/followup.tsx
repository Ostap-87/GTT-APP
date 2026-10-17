// «Хочу продолжить»: после визита делегат просит образцы, переговоры или повторную встречу — координатор передаёт
// запрос компании по-китайски. Контакты делегата компания получает только с его согласия.
import { router } from 'expo-router';
import { useState } from 'react';

import { FOLLOW_COMPANIES, FOLLOW_TYPES } from '@/data/extras';
import { useCoord } from '@/state/coord';
import { useToast } from '@/state/toast';
import { Button, Card, Check, Chips, H3, Pick, Plain, T } from '@/ui/kit';

export default function Followup() {
  const { addFollowup } = useCoord();
  const toast = useToast();
  const [company, setCompany] = useState(FOLLOW_COMPANIES[0]);
  const [type, setType] = useState<string>(FOLLOW_TYPES[0].key);
  const [consent, setConsent] = useState(true);
  const send = () => {
    const t = FOLLOW_TYPES.find((x) => x.key === type)!;
    addFollowup({ company, typeRu: t.ru, zh: t.zh, consent });
    toast('Запрос у координатора — он передаст его компании');
    router.back();
  };
  return (
    <Plain>
      <Card>
        <H3>С какой компанией</H3>
        <Chips>{FOLLOW_COMPANIES.map((c) => <Pick key={c} title={c} on={company === c} onPress={() => setCompany(c)} />)}</Chips>
        <H3>Что нужно</H3>
        <Chips>{FOLLOW_TYPES.map((t) => <Pick key={t.key} title={t.ru} on={type === t.key} onPress={() => setType(t.key)} />)}</Chips>
        <Check on={consent} onPress={() => setConsent(!consent)}>Разрешаю передать компании мои контакты</Check>
        <T muted>Без галочки координатор передаст запрос без ваших контактов, а ответ компании перешлёт вам сам.</T>
      </Card>
      <Button title="Отправить координатору" icon="send" onPress={send} />
    </Plain>
  );
}
