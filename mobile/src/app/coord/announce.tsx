// «Объявление»: шаблон или свой текст → делегатам (push), компании по-китайски, в Telegram группы.
import { router } from 'expo-router';
import { useState } from 'react';
import { Switch, TextInput, View } from 'react-native';

import { TEMPLATES } from '@/data/group';
import { useCoord } from '@/state/coord';
import { usePolls } from '@/state/polls';
import { useToast } from '@/state/toast';
import { Button, Card, Check, Chips, H3, Pick, Row, T, inputStyle } from '@/ui/kit';
import { CoordScreen } from '@/ui/coord-ui';
import { C, F } from '@/ui/theme';

export default function Announce() {
  const k = useCoord();
  const P = usePolls();
  const toast = useToast();
  const [tpl, setTpl] = useState<string>(TEMPLATES[0].key);
  const [text, setText] = useState<string>(TEMPLATES[0].ru);
  const [to, setTo] = useState({ d: true, h: true, tg: true });
  const zh = TEMPLATES.find((x) => x.key === tpl && x.ru === text)?.zh || '';
  const send = () => {
    if (!text.trim()) return toast('Напишите текст объявления');
    if (!to.d && !to.h && !to.tg) return toast('Выберите, кому отправить');
    k.sendAnn({ ru: text.trim(), zh, toD: to.d, toH: to.h, tg: to.tg });
    toast(`Отправлено: ${[to.d && 'делегатам', to.h && 'JD.com', to.tg && 'Telegram'].filter(Boolean).join(', ')}`);
  };
  return (
    <CoordScreen title="Объявление">
      <Card>
        <H3>Быстрые шаблоны</H3>
        <Chips>{TEMPLATES.map((x) => <Pick key={x.key} title={x.label} on={tpl === x.key} onPress={() => { setTpl(x.key); setText(x.ru); }} />)}</Chips>
        <TextInput value={text} onChangeText={(v) => { setText(v); setTpl(''); }} multiline accessibilityLabel="Текст объявления"
          style={{ ...inputStyle, minHeight: 72 }} />
        {zh ? <T muted>{`По-китайски для компании: ${zh}`}</T> : to.h ? <T muted>Свой текст компании переведёт переводчик перед отправкой.</T> : null}
        <Check on={to.d} onPress={() => setTo({ ...to, d: !to.d })}>Делегатам (18) — push</Check>
        <Check on={to.h} onPress={() => setTo({ ...to, h: !to.h })}>JD.com (中文)</Check>
        <Check on={to.tg} onPress={() => setTo({ ...to, tg: !to.tg })}>Telegram группы</Check>
        <Button title="Отправить" icon="send" onPress={send} />
      </Card>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <H3>Опросы в группе</H3>
            <T muted>{P.enabled ? `Включены · идёт ${P.live.length} · черновиков ${P.list.filter((p) => p.status === 'draft').length}` : 'Выключены: включайте на время поездки, когда опросы подготовлены'}</T>
          </View>
          <Switch value={P.enabled} onValueChange={(v) => { P.setEnabled(v); toast(v ? 'Опросы включены' : 'Опросы выключены — у делегатов они скрыты'); }}
            accessibilityLabel="Опросы для группы" trackColor={{ true: C.blue, false: C.line }} thumbColor="#ffffff" />
        </View>
        <T muted>Ресторан на ужин, дополнительная экскурсия, вопросы к компании перед визитом — делегаты видят только запущенный опрос.</T>
        <Button title="Открыть опросы" icon="poll" kind="light" onPress={() => router.push('/polls')} />
      </Card>
      <Card>
        <H3>Отправлено</H3>
        {k.anns.slice(0, 5).map((a) => <Row key={a.id} title={a.ru} sub={`${a.time} · ${[a.toD && 'делегатам', a.toH && 'JD.com по-китайски', a.tg && 'Telegram'].filter(Boolean).join(', ')}`} />)}
      </Card>
    </CoordScreen>
  );
}
