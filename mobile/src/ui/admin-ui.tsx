// Общие элементы «Центра поездки»: экран с переключателем уровня доступа и шириной под компьютер.
import type { ReactNode } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import { ACCESS } from '@/data/admin';
import { useAdmin } from '@/state/admin';
import { Icon } from './Icon';
import { Screen } from './kit';
import { C, F } from './theme';

/** Компьютер или планшет: две колонки и меню слева. */
export const useWide = () => useWindowDimensions().width >= 900;

/** «Смотреть как»: полный ↔ ограниченный доступ — чтобы видеть, что останется у человека с ограниченным. */
export function LevelSwitch() {
  const { level, setLevel, me } = useAdmin();
  const next = level === 'full' ? 'limited' : 'full';
  return (
    <Pressable onPress={() => setLevel(next)} accessibilityRole="button" accessibilityLabel={`Доступ: ${ACCESS[level].ru}. Нажмите, чтобы смотреть как ${ACCESS[next].ru.toLowerCase()}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: level === 'full' ? C.blueSoft : C.warnSoft }}>
      <Icon name="lock" size={14} color={level === 'full' ? C.blueInk : C.warn} />
      <Text style={{ fontFamily: F.semibold, fontSize: 12, color: level === 'full' ? C.blueInk : C.warn }}>{`${ACCESS[level].ru} · ${me.name.split(' ')[0]}`}</Text>
    </Pressable>
  );
}

export function Wide({ children }: { children: ReactNode }) {
  return <View style={{ width: '100%', maxWidth: 1080, alignSelf: 'center', gap: 12 }}>{children}</View>;
}

export function AdminScreen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Screen eyebrow="Центр поездки · администратор" title={title} right={<LevelSwitch />}>
      <Wide>{children}</Wide>
    </Screen>
  );
}

/** Две колонки на компьютере, одна — на телефоне. */
export function Columns({ left, right }: { left: ReactNode; right: ReactNode }) {
  const wide = useWide();
  if (!wide) return <>{left}{right}</>;
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <View style={{ flex: 3, gap: 12, minWidth: 0 }}>{left}</View>
      <View style={{ flex: 2, gap: 12, minWidth: 0 }}>{right}</View>
    </View>
  );
}
