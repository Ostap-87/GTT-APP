// «Визиты»: статус каждой компании поездки. Компании работают в мини-программе WeChat или по ссылке (роль «Компания»).
import { router } from 'expo-router';

import { VISITS } from '@/data/group';
import { useCoord } from '@/state/coord';
import { Avatar, Card, Chip, Row, T } from '@/ui/kit';
import { CoordScreen } from '@/ui/coord-ui';

export default function Visits() {
  const k = useCoord();
  const stOf = (v: (typeof VISITS)[number]): ['ok' | 'warn' | 'info', string] => (v.id === 'hema' ? (k.hema === 'accepted' ? ['ok', 'перенос согласован'] : k.hema === 'discuss' ? ['info', 'обсуждаем'] : ['warn', 'предлагает 14:00'])
    : v.id === 'pdd' ? (k.pddReminded ? ['info', 'напомнили'] : ['warn', 'ссылку не открыли']) : v.st);
  const conf = VISITS.filter((v) => stOf(v)[0] === 'ok').length;
  return (
    <CoordScreen title={`Визиты · ${conf} из ${VISITS.length}`}>
      <Card>
        {VISITS.map((v) => (
          <Row key={v.id} left={<Avatar text={v.name.slice(0, 2).toUpperCase()} />} title={v.name} sub={v.id === 'hema' && k.hema === 'accepted' ? 'Ср 11 · 14:00' : v.when} right={<Chip tone={stOf(v)[0]}>{stOf(v)[1]}</Chip>}
            onPress={() => router.push(`/visit/${v.id}`)} label={v.name} />
        ))}
      </Card>
      <T muted>Нажмите на компанию — её визит: что она видит в мини-программе WeChat, предложения по времени, материалы и QR-код приглашения.</T>
    </CoordScreen>
  );
}
