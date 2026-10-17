// Каталог агента: 76 программ с сайта по странам; сначала — программы с ближайшими выездами. Цен нет.
import { useMemo, useState } from 'react';

import catalog from '@/data/catalog.json';
import { depsOf } from '@/data/agent';
import { COUNTRY_ORDER, COUNTRY_RU } from '@/data/catalog-meta';
import { useAgent } from '@/state/agent';
import { AgentScreen, TourRow } from '@/ui/agent-ui';
import { Card, Chip, Chips, Pick, T, TitleRow } from '@/ui/kit';

export default function AgentCatalog() {
  const { depFree } = useAgent();
  const [c, setC] = useState('all');
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    catalog.forEach((t) => { m[t.country] = (m[t.country] || 0) + 1; });
    return m;
  }, []);
  const list = catalog.filter((t) => c === 'all' || t.country === c);
  const withDates = list.filter((t) => depsOf(t.id).length);
  return (
    <AgentScreen title="Каталог программ">
      <Card>
        <Chips>
          <Pick title={`Все · ${catalog.length}`} on={c === 'all'} onPress={() => setC('all')} />
          {COUNTRY_ORDER.map((k) => <Pick key={k} title={`${COUNTRY_RU[k]} · ${counts[k] || 0}`} on={c === k} onPress={() => setC(k)} />)}
        </Chips>
      </Card>
      {withDates.length ? (
        <Card>
          <TitleRow title="С ближайшими выездами" right={<Chip tone="ok">{String(withDates.length)}</Chip>} />
          {withDates.map((t) => {
            const next = depsOf(t.id).find((d) => depFree(d) > 0);
            return <TourRow key={t.id} t={t} right={next ? <Chip tone="ok">{next.short}</Chip> : <Chip tone="dark">набрана</Chip>} />;
          })}
        </Card>
      ) : null}
      <Card>
        <TitleRow title={c === 'all' ? 'Все программы' : COUNTRY_RU[c]} right={<Chip tone="info">{String(list.length)}</Chip>} />
        {list.filter((t) => !depsOf(t.id).length).map((t) => <TourRow key={t.id} t={t} right={<Chip tone="info">под группу</Chip>} />)}
      </Card>
      <T muted>Программы, маршруты и компании — с сайта globaltechtour.ru. Стоимость для агента и комиссия — в карточке программы (пока не указаны).</T>
    </AgentScreen>
  );
}
