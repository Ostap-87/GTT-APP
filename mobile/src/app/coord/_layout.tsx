import { Tabs } from 'expo-router';

import { Icon } from '@/ui/Icon';
import { TabBar3D } from '@/ui/TabBar3D';
import type { IconName } from '@/ui/icon-paths';
import { C, F } from '@/ui/theme';

// Координатор: «Пульт» — только то, что требует действия; «Группа» — люди, питание, расселение; визиты компаний;
// заявки агентов и с сайта; объявления.
const TABS: [string, string, IconName][] = [
  ['index', 'Пульт', 'grid'],
  ['visits', 'Визиты', 'building'],
  ['group', 'Группа', 'people'],
  ['leads', 'Заявки', 'inbox'],
  ['announce', 'Объявление', 'megaphone'],
];

export default function CoordTabs() {
  return (
    <Tabs
      tabBar={(p) => <TabBar3D {...p} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.blue,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontFamily: F.semibold, fontSize: 11 },
        tabBarStyle: { backgroundColor: C.card, borderTopColor: C.line },
      }}
    >
      {TABS.map(([name, title, icon]) => (
        <Tabs.Screen key={name} name={name} options={{ title, tabBarIcon: ({ color }) => <Icon name={icon} size={24} color={String(color)} /> }} />
      ))}
    </Tabs>
  );
}
