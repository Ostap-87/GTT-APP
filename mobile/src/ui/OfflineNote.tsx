// Плашка «Нет интернета»: приложение продолжает работать — всё нужное в поездке хранится в телефоне.
import { useNetworkState } from 'expo-network';
import { Text, View } from 'react-native';

import { Icon } from './Icon';
import { C, F } from './theme';

export function OfflineNote({ what = 'Программа, адреса для такси, отели, фразы переводчика, материалы и ваши заметки' }: { what?: string }) {
  const net = useNetworkState();
  if (net.isConnected !== false && net.isInternetReachable !== false) return null;
  return (
    <View accessibilityRole="alert" style={{ flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: C.warnSoft, borderRadius: 12, padding: 12 }}>
      <Icon name="wifiOff" size={20} color={C.warn} />
      <Text style={{ flex: 1, fontFamily: F.medium, fontSize: 13, lineHeight: 18, color: C.ink }}>{`Нет интернета. ${what} — в телефоне и открываются без сети.`}</Text>
    </View>
  );
}
// плашки чаще нет — в очередь появления экрана она не встаёт (см. Cascade в kit.tsx)
OfflineNote.noAppear = true;
