// «Программы»: 76 программ сайта (правятся на сайте). Из программы — новая поездка: выбрать дату начала и «Создать».
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { PROGRAMS, addDays, dayTitle } from '@/data/admin';
import { useAdmin } from '@/state/admin';
import { useToast } from '@/state/toast';
import { AdminScreen } from '@/ui/admin-ui';
import { Button, Card, Chips, Field, Pick, T, TitleRow, Chip } from '@/ui/kit';

/** Ближайшие понедельники — даты начала на выбор. */
function nextMondays(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7) + 14);
  return Array.from({ length: n }, (_, i) => addDays(d.toISOString().slice(0, 10), i * 7));
}

export default function AdminPrograms() {
  const a = useAdmin();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const starts = nextMondays(4);
  const list = PROGRAMS.filter((p) => !q.trim() || `${p.title} ${p.cities.join(' ')}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <AdminScreen title="Программы">
      <T muted>Программы, города и компании правятся на сайте globaltechtour.ru — приложение забирает их при каждой сборке сайта.</T>
      <Field value={q} onChangeText={setQ} placeholder="Поиск: название или город" />
      {list.map((p) => (
        <Card key={p.id}>
          <TitleRow title={p.title} right={<Chip tone="info">{`${p.days} дн.`}</Chip>} />
          <T muted>{`${p.cities.join(' → ') || 'города уточняются'} · компаний ${p.companiesCount}`}</T>
          {open === p.id ? (
            <View style={{ gap: 8 }}>
              <T>Дата начала</T>
              <Chips>
                {starts.map((s) => (
                  <Pick key={s} title={dayTitle(s, 0)} on={false} onPress={() => {
                    const id = a.createTrip(p, s);
                    setOpen(null);
                    toast(`Поездка создана — черновик, ${dayTitle(s, 0)}`);
                    router.push(`/admin-trip/${id}`);
                  }} />
                ))}
              </Chips>
            </View>
          ) : a.can('trip.create') ? (
            <Button title="Создать поездку" small kind="light" onPress={() => setOpen(p.id)} />
          ) : null}
        </Card>
      ))}
      {!a.can('trip.create') ? <T muted>С ограниченным доступом поездки создаёт администратор.</T> : null}
    </AdminScreen>
  );
}
