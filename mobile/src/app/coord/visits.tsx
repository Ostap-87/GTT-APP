// «Визиты»: статус каждой компании поездки. Компании работают в мини-программе WeChat или по ссылке (роль «Компания»).
import { VISITS } from '@/data/group';
import { useToast } from '@/state/toast';
import { Avatar, Card, Chip, Row, T } from '@/ui/kit';
import { CoordScreen } from '@/ui/coord-ui';

export default function Visits() {
  const toast = useToast();
  const conf = VISITS.filter((v) => v.st[0] === 'ok').length;
  return (
    <CoordScreen title={`Визиты · ${conf} из ${VISITS.length}`}>
      <Card>
        {VISITS.map((v) => (
          <Row key={v.id} left={<Avatar text={v.name.slice(0, 2).toUpperCase()} />} title={v.name} sub={v.when} right={<Chip tone={v.st[0]}>{v.st[1]}</Chip>}
            onPress={() => toast(`${v.name}: страница визита — в мини-программе WeChat (роль «Компания»)`)} label={v.name} />
        ))}
      </Card>
      <T muted>Компания подтверждает время, видит состав делегации без телефонов и вопросы на китайском; что она меняет — приходит на «Пульт».</T>
    </CoordScreen>
  );
}
