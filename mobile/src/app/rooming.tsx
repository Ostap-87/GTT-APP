// Список расселения для отеля — латиницей, как в паспортах; нерешённые номера видны отдельно.
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { Platform, Text } from 'react-native';

import { byId, passportName } from '@/data/group';
import { hotelOf } from '@/data/trip';
import { useCoord } from '@/state/coord';
import { useToast } from '@/state/toast';
import { Button, Card, Plain, T } from '@/ui/kit';
import { C } from '@/ui/theme';

export default function Rooming() {
  const k = useCoord();
  const toast = useToast();
  const r = k.rooming();
  const h = hotelOf(1)!;
  const lines = r.pairs.map(([a, b], i) => `${i + 1}. ${passportName(a)} / ${passportName(b)} — twin`)
    .concat(r.singles.map((id, i) => `${r.pairs.length + i + 1}. ${passportName(id)} — single`));
  return (
    <Plain>
      <T muted>{`${h.name} · ${h.nights} · латиницей, как в паспортах`}</T>
      <Card tone="info">
        <Text style={{ fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: 12.5, lineHeight: 20, color: C.ink }}>{lines.join('\n')}</Text>
      </Card>
      {r.open.length ? <Card tone="warn"><T>{`Ещё не решено: ${r.open.map((id) => byId[id].ru).join(', ')} — допишем, когда заполнят профиль или вы назначите номер.`}</T></Card> : null}
      <Button title="Отправить отелю" icon="send" onPress={() => { toast('Список ушёл отелю на почту (в демо без отправки)'); router.back(); }} />
      <Button title="Скопировать" icon="copy" kind="ghost" onPress={async () => { await Clipboard.setStringAsync(lines.join('\n')); toast('Скопировано'); }} />
    </Plain>
  );
}
