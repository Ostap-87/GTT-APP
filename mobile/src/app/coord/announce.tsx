// «Объявление»: шаблон или свой текст → делегатам (push), компании по-китайски, в Telegram группы.
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { TEMPLATES } from '@/data/group';
import { useCoord } from '@/state/coord';
import { useToast } from '@/state/toast';
import { Icon } from '@/ui/Icon';
import { Button, Card, Chips, H3, Pick, Row, T } from '@/ui/kit';
import { CoordScreen } from '@/ui/coord-ui';
import { C, F } from '@/ui/theme';

function Check({ on, onPress, children }: { on: boolean; onPress: () => void; children: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 4 }}>
      <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: on ? C.blue : '#c3cad6', backgroundColor: on ? C.blue : C.card, alignItems: 'center', justifyContent: 'center' }}>
        {on ? <Icon name="check" size={14} color="#fff" /> : null}
      </View>
      <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.ink }}>{children}</Text>
    </Pressable>
  );
}

export default function Announce() {
  const k = useCoord();
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
          style={{ borderWidth: 1, borderColor: '#d5dbe6', borderRadius: 10, padding: 10, minHeight: 72, fontFamily: F.regular, fontSize: 14, color: C.ink }} />
        {zh ? <T muted>{`По-китайски для компании: ${zh}`}</T> : to.h ? <T muted>Свой текст компании переведёт переводчик перед отправкой.</T> : null}
        <Check on={to.d} onPress={() => setTo({ ...to, d: !to.d })}>Делегатам (18) — push</Check>
        <Check on={to.h} onPress={() => setTo({ ...to, h: !to.h })}>JD.com (中文)</Check>
        <Check on={to.tg} onPress={() => setTo({ ...to, tg: !to.tg })}>Telegram группы</Check>
        <Button title="Отправить" icon="send" onPress={send} />
      </Card>
      <Card>
        <H3>Отправлено</H3>
        {k.anns.slice(0, 5).map((a) => <Row key={a.id} title={a.ru} sub={`${a.time} · ${[a.toD && 'делегатам', a.toH && 'JD.com по-китайски', a.tg && 'Telegram'].filter(Boolean).join(', ')}`} />)}
      </Card>
    </CoordScreen>
  );
}
