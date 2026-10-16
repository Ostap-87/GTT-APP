// Журнал переездов: факт против плана — в следующих поездках закладываем реальное время в пути.
import { LEGS, PAST_LEGS, diffTxt, dur, plural, toMin } from '@/data/group';
import { useCoord } from '@/state/coord';
import { Card, Chip, H3, Plain, Row, T } from '@/ui/kit';

export default function LegLog() {
  const { legs } = useCoord();
  const rows = PAST_LEGS.concat(LEGS.filter((l) => legs[l.id]?.arr).map((l) => ({ day: 'Вт, 10 ноября', from: l.from, to: l.to, dep: legs[l.id].dep!, arr: legs[l.id].arr!, min: l.min })));
  const avg = Math.round(rows.reduce((s, x) => s + (toMin(x.arr) - toMin(x.dep) - x.min), 0) / rows.length);
  return (
    <Plain>
      <Card>
        <H3>Новый ритейл</H3>
        <T muted>{`${rows.length} ${plural(rows.length, 'переезд', 'переезда', 'переездов')} · в среднем ${avg > 0 ? '+' : ''}${avg} мин к плану`}</T>
        {rows.map((x, i) => {
          const m = toMin(x.arr) - toMin(x.dep);
          return <Row key={i} title={`${x.from} → ${x.to}`} sub={`${x.day} · ${x.dep} → ${x.arr} · ${diffTxt(m, x.min)}`} right={<Chip tone={m - x.min > 5 ? 'warn' : 'ok'}>{dur(m)}</Chip>} />;
        })}
      </Card>
      <T muted>По журналу видно реальное время в пути — в следующих поездках закладываем его в план. Выгрузка в Excel — в веб-панели (шаг 2).</T>
    </Plain>
  );
}
