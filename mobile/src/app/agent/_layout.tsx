import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '@/ui/Icon';
import type { IconName } from '@/ui/icon-paths';
import { BackToCoord } from '@/ui/coord-ui';
import { C, F } from '@/ui/theme';

// Агент: каталог программ, выезды и свободные места, запрос на расчёт, свои заявки, материалы для клиентов.
const TABS: [string, string, IconName][] = [
  ['index', 'Каталог', 'globe'],
  ['dates', 'Даты', 'cal'],
  ['calc', 'Расчёт', 'calc'],
  ['apps', 'Заявки', 'send'],
  ['kit', 'Материалы', 'book'],
];

export default function AgentTabs() {
  return (
    <View style={{ flex: 1 }}>
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
      <BackToCoord />
    </View>
  );
}
