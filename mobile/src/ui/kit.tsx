// Общие элементы экранов: шапка, карточка, строка списка, кнопка, метка. Внешний вид — как в прототипе.
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from './Icon';
import type { IconName } from './icon-paths';
import { C, F } from './theme';

export function Screen({ eyebrow, title, dark, children, right }: { eyebrow?: string; title: string; dark?: boolean; children: ReactNode; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={[s.head, dark && s.headDark, { paddingTop: insets.top + 12 }]}>
        <View style={s.rowBetween}>
          {eyebrow ? <Text style={[s.eyebrow, dark && s.eyebrowDark]}>{eyebrow}</Text> : <View />}
          {right}
        </View>
        <Text style={[s.title, dark && { color: '#fff' }]} accessibilityRole="header">{title}</Text>
      </View>
      <ScrollView contentContainerStyle={s.body}>{children}</ScrollView>
    </View>
  );
}

/** Экран без большой шапки — для деталей, открытых из стека (заголовок даёт навигация). */
export function Plain({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={s.body}>
      {children}
    </ScrollView>
  );
}

export function Card({ children, tone, style, onPress, label }: { children: ReactNode; tone?: 'dark' | 'info' | 'warn' | 'accent'; style?: StyleProp<ViewStyle>; onPress?: () => void; label?: string }) {
  const st = [s.card, tone === 'dark' && s.cardDark, tone === 'info' && s.cardInfo, tone === 'warn' && s.cardWarn, tone === 'accent' && s.cardAccent, style];
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [...st, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={st}>{children}</View>;
}

export function H3({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.h3, style]}>{children}</Text>;
}

export function T({ children, style, muted, bold, numberOfLines }: { children: ReactNode; style?: StyleProp<TextStyle>; muted?: boolean; bold?: boolean; numberOfLines?: number }) {
  return <Text numberOfLines={numberOfLines} style={[s.t, muted && s.muted, bold && { fontFamily: F.semibold }, style]}>{children}</Text>;
}

export function TitleRow({ title, right }: { title: ReactNode; right?: ReactNode }) {
  return (
    <View style={s.rowBetween}>
      {typeof title === 'string' ? <H3>{title}</H3> : title}
      {right}
    </View>
  );
}

type ChipTone = 'ok' | 'warn' | 'info' | 'dark' | 'new' | 'plain';
export function Chip({ children, tone = 'info' }: { children: ReactNode; tone?: ChipTone }) {
  const map: Record<ChipTone, [string, string]> = {
    ok: [C.okSoft, C.ok], warn: [C.warnSoft, C.warn], info: [C.blueSoft, C.blueInk], dark: [C.dark, '#fff'], new: [C.red, '#fff'], plain: [C.line2, C.muted],
  };
  const [bg, fg] = map[tone];
  return (
    <View style={[s.chip, { backgroundColor: bg }]}>
      <Text style={[s.chipText, { color: fg }]}>{children}</Text>
    </View>
  );
}

export function Button({ title, onPress, kind = 'primary', icon, small, full, label }: { title: string; onPress: () => void; kind?: 'primary' | 'ghost' | 'light' | 'dark'; icon?: IconName; small?: boolean; full?: boolean; label?: string }) {
  const bg = kind === 'primary' ? C.blue : kind === 'dark' ? C.dark : kind === 'light' ? C.blueSoft : C.card;
  const fg = kind === 'primary' || kind === 'dark' ? '#fff' : kind === 'light' ? C.blueInk : C.ink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label || title}
      style={({ pressed }) => [s.btn, small && s.btnSmall, full && { alignSelf: 'stretch' }, { backgroundColor: bg, borderColor: kind === 'ghost' ? C.line : bg }, pressed && { opacity: 0.8 }]}
    >
      {icon ? <Icon name={icon} size={small ? 16 : 18} color={fg} /> : null}
      <Text style={[s.btnText, small && { fontSize: 13 }, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Row({ title, sub, left, right, onPress, label }: { title: ReactNode; sub?: ReactNode; left?: ReactNode; right?: ReactNode; onPress?: () => void; label?: string }) {
  const body = (
    <>
      {left}
      <View style={{ flex: 1, minWidth: 0 }}>
        {typeof title === 'string' ? <Text style={s.rowTitle}>{title}</Text> : title}
        {sub ? (typeof sub === 'string' ? <Text style={s.rowSub}>{sub}</Text> : sub) : null}
      </View>
      {right}
    </>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}>
        {body}
      </Pressable>
    );
  }
  return <View style={s.row}>{body}</View>;
}

export function Avatar({ text, size = 36 }: { text: string; size?: number }) {
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={s.avatarText}>{text}</Text>
    </View>
  );
}

export function Pick({ title, on, onPress }: { title: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} style={[s.pick, on && s.pickOn]}>
      <Text style={[s.pickText, on && { color: '#fff', fontFamily: F.bold }]}>{title}</Text>
    </Pressable>
  );
}

export function Chips({ children }: { children: ReactNode }) {
  return <View style={s.chips}>{children}</View>;
}

/** Переключатель из 2–3 вариантов (как «До / В поездке / После»). */
export function Seg<K extends string>({ options, value, onChange }: { options: readonly (readonly [K, string])[]; value: K; onChange: (k: K) => void }) {
  return (
    <View style={s.seg}>
      {options.map(([k, l]) => (
        <Pressable key={k} onPress={() => onChange(k)} accessibilityRole="button" accessibilityState={{ selected: value === k }}
          style={[s.segBtn, value === k && s.segOn]}>
          <Text style={{ fontFamily: value === k ? F.bold : F.medium, fontSize: 13, color: C.ink, textAlign: 'center' }}>{l}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Галочка: согласие, «сохранить», «кому отправить». */
export function Check({ on, onPress, children }: { on: boolean; onPress: () => void; children: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 2 }}>
      <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: on ? C.blue : '#c3cad6', backgroundColor: on ? C.blue : C.card, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
        {on ? <Icon name="check" size={14} color="#fff" /> : null}
      </View>
      <Text style={{ flex: 1, fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.ink }}>{children}</Text>
    </Pressable>
  );
}

export const inputStyle = { borderWidth: 1, borderColor: '#d5dbe6', borderRadius: 10, padding: 10, minHeight: 44, fontFamily: F.regular, fontSize: 14, color: C.ink, backgroundColor: C.card } as const;

/** Поле ввода с подписью сверху. */
export function Field({ label, value, onChangeText, placeholder, multiline, keyboardType }: { label?: string; value: string; onChangeText: (v: string) => void; placeholder?: string; multiline?: boolean; keyboardType?: KeyboardTypeOptions }) {
  return (
    <View style={{ gap: 4 }}>
      {label ? <Text style={{ fontFamily: F.semibold, fontSize: 12.5, color: C.muted }}>{label}</Text> : null}
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={C.muted} multiline={multiline} keyboardType={keyboardType}
        accessibilityLabel={label || placeholder} style={[inputStyle, multiline && { minHeight: 64, textAlignVertical: 'top' }]} />
    </View>
  );
}

/** Подпись над группой вариантов («Страна поездки», «Кто едет»). */
export const Label = ({ children }: { children: string }) => <Text style={{ fontFamily: F.semibold, fontSize: 12.5, color: C.muted }}>{children}</Text>;

export const initials = (lat: string) => lat.split(' ').map((w) => w[0]).join('');

export const s = StyleSheet.create({
  head: { backgroundColor: C.card, paddingHorizontal: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.line, gap: 6 },
  headDark: { backgroundColor: C.dark, borderBottomColor: C.dark },
  eyebrow: { fontFamily: F.semibold, fontSize: 12, color: C.muted },
  eyebrowDark: { color: C.orange, textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { fontFamily: F.display, fontSize: 36, lineHeight: 36, color: C.ink, textTransform: 'uppercase' },
  body: { padding: 14, gap: 12, paddingBottom: 40 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, gap: 8 },
  cardDark: { backgroundColor: C.dark, borderColor: C.dark },
  cardInfo: { backgroundColor: C.blueSoft, borderColor: C.blueSoft },
  cardWarn: { backgroundColor: '#fff8f2', borderColor: C.warnLine },
  cardAccent: { borderColor: C.blue },
  h3: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  t: { fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.ink },
  muted: { color: C.muted, fontSize: 12.5, lineHeight: 18 },
  chip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'flex-start' },
  chipText: { fontFamily: F.bold, fontSize: 11.5 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, minHeight: 46 },
  btnSmall: { minHeight: 34, paddingHorizontal: 12, borderRadius: 10 },
  btnText: { fontFamily: F.bold, fontSize: 14.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.line2 },
  rowTitle: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
  rowSub: { fontFamily: F.regular, fontSize: 12.5, color: C.muted, marginTop: 2 },
  avatar: { backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: F.bold, fontSize: 12, color: C.blueInk },
  pick: { borderWidth: 1, borderColor: '#d5dbe6', backgroundColor: C.card, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, maxWidth: '100%' },
  pickOn: { backgroundColor: C.dark, borderColor: C.dark },
  pickText: { fontFamily: F.medium, fontSize: 13, color: C.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  seg: { flexDirection: 'row', backgroundColor: C.line2, borderRadius: 10, padding: 3 },
  segBtn: { flex: 1, minHeight: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  segOn: { backgroundColor: C.card },
});
