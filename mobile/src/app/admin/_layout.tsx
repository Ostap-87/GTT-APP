import { Tabs } from 'expo-router';

import { Icon } from '@/ui/Icon';
import type { IconName } from '@/ui/icon-paths';
import { useWide } from '@/ui/admin-ui';
import { C, F } from '@/ui/theme';

// Администратор («Центр поездки»): поездки, программы сайта, доступы команды, журнал изменений.
// На компьютере меню слева, на телефоне — внизу.
const TABS: [string, string, IconName][] = [
  ['index', 'Поездки', 'suitcase'],
  ['programs', 'Программы', 'globe'],
  ['access', 'Доступы', 'lock'],
  ['log', 'Журнал', 'doc'],
];

export default function AdminTabs() {
  const wide = useWide();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: wide ? 'left' : 'bottom',
        tabBarVariant: wide ? 'material' : 'uikit',
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
