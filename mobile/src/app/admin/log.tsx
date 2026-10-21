// «Журнал»: кто и что поменял — по всем поездкам (полный доступ) или по своим (ограниченный).
import { useAdmin } from '@/state/admin';
import { AdminScreen } from '@/ui/admin-ui';
import { Card, Row, T } from '@/ui/kit';

export default function AdminLog() {
  const a = useAdmin();
  const mine = new Set(a.myTrips.map((t) => t.id));
  const list = a.log.filter((l) => a.level === 'full' || (l.trip && mine.has(l.trip)));
  return (
    <AdminScreen title="Журнал">
      <T muted>История изменений: на шаге 2 любую правку можно будет откатить.</T>
      <Card>
        {list.map((l) => (
          <Row key={l.id} title={l.what} sub={`${l.at} · ${l.who}${l.trip ? ` · ${a.trip(l.trip)?.title || ''}` : ''}`} />
        ))}
        {!list.length ? <T muted>Пока пусто.</T> : null}
      </Card>
    </AdminScreen>
  );
}
