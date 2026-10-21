import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { TENANT } from '@/data/tenant';
import { BackToCoord } from '@/ui/coord-ui';
import { Icon } from '@/ui/Icon';
import type { IconName } from '@/ui/icon-paths';
import { TabBar3D } from '@/ui/TabBar3D';
import { C } from '@/ui/theme';

const TABS: [string, string, IconName][] = [
  ['index', 'Сегодня', 'sun'],
  ['plan', 'План', 'cal'],
  ['library', 'Материалы', 'book'],
  ['people', 'Люди', 'people'],
  ['prep', 'Поездка', 'suitcase'],
];

export default function TripTabs() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* плавающая панель с объёмными значками (TENANT.icons3d), без них — контурные в цвете бренда */}
      <Tabs tabBar={(p) => <TabBar3D {...p} three={TENANT.icons3d} hide={[TENANT.tabs.library ? '' : 'library', TENANT.tabs.people ? '' : 'people']} />} screenOptions={{ headerShown: false, animation: 'shift', sceneStyle: { backgroundColor: C.bg } }}>
        {TABS.map(([name, title, icon]) => (
          <Tabs.Screen key={name} name={name} options={{ title, tabBarIcon: ({ color }) => <Icon name={icon} size={24} color={String(color)} /> }} />
        ))}
      </Tabs>
      {/* Координатор смотрит глазами делегата — кнопка возврата к пульту */}
      <BackToCoord />
    </View>
  );
}
