// Движение (решение 21.10.2026): блоки экрана появляются по очереди, кнопки и плитки пружинят при нажатии.
// Включено «Уменьшить движение» в настройках телефона — всё появляется сразу, без анимации.
import { useEffect, useRef, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, type AccessibilityState, type StyleProp, type ViewStyle } from 'react-native';

import { tapFeel } from './haptics';

/** Нативный драйвер анимаций — на телефоне; в браузере его нет. */
export const ND = Platform.OS !== 'web';

let reduce = Platform.OS === 'web' && typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
AccessibilityInfo.isReduceMotionEnabled().then((v) => { reduce = v; }).catch(() => {});
AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => { reduce = v; });
export const reduceMotion = () => reduce;

/** Появление снизу с затуханием; i — место в очереди (каждый следующий блок чуть позже). */
export function Appear({ i = 0, children, style }: { i?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const a = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) { a.setValue(1); return; }
    Animated.timing(a, { toValue: 1, duration: 520, delay: 60 + Math.min(i, 8) * 70, easing: Easing.out(Easing.cubic), useNativeDriver: ND }).start();
  }, [a, i]);
  return (
    <Animated.View style={[style, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Пружинка нажатия: сжать при касании, отпустить с лёгким отскоком. */
export function usePress(to = 0.96) {
  const v = useRef(new Animated.Value(1)).current;
  return {
    scale: v,
    onPressIn: () => { if (!reduce) Animated.spring(v, { toValue: to, speed: 40, bounciness: 0, useNativeDriver: ND }).start(); },
    onPressOut: () => { Animated.spring(v, { toValue: 1, speed: 16, bounciness: 12, useNativeDriver: ND }).start(); },
  };
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Нажимаемый блок с пружинкой и лёгкой отдачей (вибро) — плитки, карточки, кнопки. */
export function Press({ onPress, style, children, label, state, scaleTo = 0.96, feel = true, hitSlop }: {
  onPress: () => void; style?: StyleProp<ViewStyle>; children: ReactNode; label?: string; state?: AccessibilityState; scaleTo?: number; feel?: boolean; hitSlop?: number;
}) {
  const p = usePress(scaleTo);
  return (
    <AnimatedPressable
      onPress={() => { if (feel) tapFeel(); onPress(); }}
      onPressIn={p.onPressIn}
      onPressOut={p.onPressOut}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={state}
      style={[style, { transform: [{ scale: p.scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}

/** Пульсирующая точка «сейчас» (как в макете: зелёная точка с расходящимся кольцом). */
export function Pulse({ color = '#5ef08f', size = 9 }: { color?: string; size?: number }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.timing(a, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: ND }));
    loop.start();
    return () => loop.stop();
  }, [a]);
  return (
    <Animated.View style={{ width: size, height: size }}>
      <Animated.View style={{ position: 'absolute', width: size, height: size, borderRadius: size, backgroundColor: color, opacity: a.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.7, 0, 0] }), transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [1, 3] }) }] }} />
      <Animated.View style={{ width: size, height: size, borderRadius: size, backgroundColor: color }} />
    </Animated.View>
  );
}
