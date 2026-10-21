// «Доступы»: команда и уровни доступа — полный и ограниченный (что входит в каждый, решим отдельно; ниже — предварительно).
import { useState } from 'react';
import { Text, View } from 'react-native';

import { ACCESS, PERMS, ROLES, type AccessLevel } from '@/data/admin';
import { useAdmin } from '@/state/admin';
import { useToast } from '@/state/toast';
import { AdminScreen, Columns } from '@/ui/admin-ui';
import { Avatar, Button, Card, Chip, Chips, Field, H3, Pick, Row, Seg, T, TitleRow, initials } from '@/ui/kit';
import { C, F } from '@/ui/theme';

const LEVELS = [['full', 'Полный'], ['limited', 'Ограниченный']] as const;

export default function AdminAccess() {
  const a = useAdmin();
  const toast = useToast();
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [role, setRole] = useState<string>('Координатор');
  const [level, setLevel] = useState<AccessLevel>('limited');
  const [trips, setTrips] = useState<string[]>([]);

  if (!a.can('access.manage')) {
    return (
      <AdminScreen title="Доступы">
        <Card tone="warn"><T>С ограниченным доступом выдавать доступы нельзя — это делает администратор.</T></Card>
        <Matrix />
      </AdminScreen>
    );
  }

  const send = () => {
    if (!name.trim() || !contact.trim()) return toast('Укажите имя и почту, телефон или WeChat');
    a.invite({ name: name.trim(), contact: contact.trim(), role, level, trips: level === 'full' ? [] : trips });
    setForm(false); setName(''); setContact(''); setTrips([]);
    toast(`Приглашение отправлено: ${name.trim()}`);
  };

  const team = (
    <Card>
      <TitleRow title={`Команда · ${a.team.length}`} right={<Button title={form ? 'Отмена' : 'Выдать доступ'} small kind={form ? 'ghost' : 'primary'} onPress={() => setForm(!form)} />} />
      {form ? (
        <View style={{ gap: 10, paddingVertical: 6 }}>
          <Field label="Имя" value={name} onChangeText={setName} placeholder="Например, Иван Петров" />
          <Field label="Почта, телефон или WeChat" value={contact} onChangeText={setContact} placeholder="куда отправить приглашение" />
          <T muted>Роль</T>
          <Chips>{ROLES.map((r) => <Pick key={r} title={r} on={role === r} onPress={() => setRole(r)} />)}</Chips>
          <T muted>Доступ</T>
          <Seg options={LEVELS} value={level} onChange={setLevel} />
          <T muted>{ACCESS[level].sub}</T>
          {level === 'limited' ? (
            <>
              <T muted>Какие поездки</T>
              <Chips>{a.trips.map((t) => <Pick key={t.id} title={t.title} on={trips.includes(t.id)} onPress={() => setTrips((x) => (x.includes(t.id) ? x.filter((i) => i !== t.id) : [...x, t.id]))} />)}</Chips>
            </>
          ) : null}
          <Button title="Отправить приглашение" icon="send" onPress={send} />
        </View>
      ) : null}
      {a.team.map((m) => (
        <View key={m.id} style={{ borderTopWidth: 1, borderTopColor: C.line2 }}>
          <Row left={<Avatar text={initials(m.name)} />} title={m.name} sub={`${m.role} · ${m.contact}${m.status === 'invited' ? ' · приглашение отправлено' : ''}`}
            right={<Chip tone={m.level === 'full' ? 'info' : 'warn'}>{ACCESS[m.level].ru.toLowerCase()}</Chip>}
            onPress={m.id === 'u-owner' ? undefined : () => setOpen(open === m.id ? null : m.id)} label={`${m.name}, доступ ${ACCESS[m.level].ru}`} />
          {open === m.id ? (
            <View style={{ gap: 8, paddingBottom: 10 }}>
              <Seg options={LEVELS} value={m.level} onChange={(l) => { a.updateMember(m.id, { level: l }); toast(`${m.name}: доступ ${ACCESS[l].ru.toLowerCase()}`); }} />
              {m.level === 'limited' ? (
                <Chips>{a.trips.map((t) => <Pick key={t.id} title={t.title} on={m.trips.includes(t.id)} onPress={() => a.updateMember(m.id, { trips: m.trips.includes(t.id) ? m.trips.filter((i) => i !== t.id) : [...m.trips, t.id] })} />)}</Chips>
              ) : null}
              <Button title="Закрыть доступ" kind="ghost" small onPress={() => { a.removeMember(m.id); setOpen(null); toast(`Доступ закрыт: ${m.name}`); }} />
            </View>
          ) : null}
        </View>
      ))}
    </Card>
  );

  return (
    <AdminScreen title="Доступы">
      <Columns left={team} right={<Matrix />} />
    </AdminScreen>
  );
}

/** Что можно на каждом уровне — предварительно. */
function Matrix() {
  const mark = (v: boolean | 'own') => (v === 'own' ? 'свои' : v ? 'да' : '—');
  return (
    <Card>
      <H3>Уровни доступа</H3>
      {(['full', 'limited'] as const).map((l) => <T key={l}>{`${ACCESS[l].ru}: ${ACCESS[l].sub.toLowerCase()}.`}</T>)}
      <View style={{ flexDirection: 'row', paddingTop: 6 }}>
        <Text style={{ flex: 1 }} />
        <Text style={{ width: 70, fontFamily: F.semibold, fontSize: 12, color: C.muted, textAlign: 'center' }}>Полный</Text>
        <Text style={{ width: 90, fontFamily: F.semibold, fontSize: 12, color: C.muted, textAlign: 'center' }}>Ограниченный</Text>
      </View>
      {PERMS.map((p) => (
        <View key={p.key} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: C.line2 }}>
          <Text style={{ flex: 1, fontFamily: F.regular, fontSize: 13.5, color: C.ink }}>{p.ru}</Text>
          <Text style={{ width: 70, fontFamily: F.semibold, fontSize: 13, color: C.ok, textAlign: 'center' }}>{mark(p.full)}</Text>
          <Text style={{ width: 90, fontFamily: F.semibold, fontSize: 13, color: p.limited ? C.ok : C.muted, textAlign: 'center' }}>{mark(p.limited)}</Text>
        </View>
      ))}
      <T muted>Предварительно — что входит в каждый уровень, решим отдельно.</T>
    </Card>
  );
}
