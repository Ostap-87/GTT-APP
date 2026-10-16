import { Tabs } from 'expo-router';

import { Icon } from '@/ui/Icon';
import type { IconName } from '@/ui/icon-paths';
import { C, F } from '@/ui/theme';

const TABS: [string, string, IconName][] = [
  ['index', 'Сегодня', 'sun'],
  ['plan', 'План', 'cal'],
  ['library', 'Материалы', 'book'],
  ['people', 'Люди', 'people'],
  ['prep', 'Поездка', 'suitcase'],
];

export default function TripTabs() {
  return (
    <Tabs
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
