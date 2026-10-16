// Сводка для ресторана: питание и аллергии группы на китайском, без имён (решение 16.10.2026).
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { ALG_BY, DIET_BY } from '@/data/group';
import { useCoord } from '@/state/coord';
import { useToast } from '@/state/toast';
import { Button, Card, Plain, T } from '@/ui/kit';
import { C, F } from '@/ui/theme';

export default function FoodSummary() {
  const k = useCoord();
  const toast = useToast();
  const g = k.food;
  const dz = Object.entries(g.dc).map(([key, n]) => `${DIET_BY[key][2]} ${n}位`).join('；');
  const az = Object.entries(g.ac).map(([key, n]) => `${ALG_BY[key][2]} ${n}位${g.sev[key] ? `（其中${g.sev[key]}位严重过敏）` : ''}`).join('；');
  const zh = `客人共18位，另有2位组织者。${dz ? `饮食要求：${dz}。` : ''}${az ? `食物过敏：${az}。请为过敏的客人单独准备，上菜时告诉我们。` : ''}谢谢！`;
  const dr = Object.entries(g.dc).map(([key, n]) => `${String(DIET_BY[key][1]).toLowerCase()} — ${n}`).join(', ');
  const ar = Object.entries(g.ac).map(([key, n]) => `${String(ALG_BY[key][1]).toLowerCase()} — ${n}${g.sev[key] ? ` (серьёзная у ${g.sev[key]})` : ''}`).join(', ');
  return (
    <Plain>
      <T muted>{`Без имён · по профилям ${g.filled} из 18${g.filled < 18 ? ' — остальных уточните' : ''}`}</T>
      <Card tone="info">
        <Text style={{ fontFamily: F.semibold, fontSize: 17, lineHeight: 26, color: C.ink }}>{zh}</Text>
      </Card>
      <View style={{ gap: 4 }}>
        <T bold>По-русски</T>
        <T>{`Гостей 18 + 2 организатора.${dr ? ` Питание: ${dr}.` : ''}${ar ? ` Аллергии: ${ar} — готовить отдельно, предупредить при подаче.` : ''}`}</T>
      </View>
      <T muted>Кто именно — видно в профилях; за столом гид и переводчик подскажут официанту.</T>
      <Button title="Отправить ресторанам" icon="send" onPress={() => { k.sendFood(); toast('Сводка ушла ресторанам в WeChat (в демо без отправки)'); router.back(); }} />
      <Button title="Скопировать по-китайски" icon="copy" kind="ghost" onPress={async () => { await Clipboard.setStringAsync(zh); toast('Скопировано'); }} />
    </Plain>
  );
}
