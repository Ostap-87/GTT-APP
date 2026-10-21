import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { BackToCoord } from '@/ui/coord-ui';
import { TabBar3D } from '@/ui/TabBar3D';
import { C } from '@/ui/theme';

const TABS: [string, string][] = [
  ['index', 'Сегодня'],
  ['plan', 'План'],
  ['library', 'Материалы'],
  ['people', 'Люди'],
  ['prep', 'Поездка'],
];

export default function TripTabs() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* плавающая панель с объёмными значками; вкладки сменяются плавным сдвигом */}
      <Tabs tabBar={(p) => <TabBar3D {...p} three />} screenOptions={{ headerShown: false, animation: 'shift', sceneStyle: { backgroundColor: C.bg } }}>
        {TABS.map(([name, title]) => <Tabs.Screen key={name} name={name} options={{ title }} />)}
      </Tabs>
      {/* Координатор смотрит глазами делегата — кнопка возврата к пульту */}
      <BackToCoord />
    </View>
  );
}
