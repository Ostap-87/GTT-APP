import { Tabs, router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCoord } from '@/state/coord';
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
  const { viewing, setViewing } = useCoord();
  const insets = useSafeAreaInsets();
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
      {/* Координатор смотрит глазами делегата — кнопка возврата к пульту */}
      {viewing ? (
        <Pressable
          onPress={() => { setViewing(false); router.replace('/coord'); }}
          accessibilityRole="button"
          accessibilityLabel="Вернуться к пульту координатора"
          style={{ position: 'absolute', right: 14, bottom: insets.bottom + 62, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.dark, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 }}
        >
          <Icon name="grid" size={16} color="#fff" />
          <Text style={{ fontFamily: F.bold, fontSize: 13, color: '#fff' }}>Пульт координатора</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
