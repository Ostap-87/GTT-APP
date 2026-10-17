// Стартовый экран (вариант B, решение 17.10.2026): 3D-заставка — светлый глобус, маршруты из Москвы и счётчик стран,
// затем точки слетаются в объёмные буквы GTT. Касание пропускает анимацию; при повторном входе и при «Уменьшить движение»
// сразу готовые буквы. Кнопки входа делегата, координатора, агента и каталог видны всё время.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import catalog from '@/data/catalog.json';
import { TRIP } from '@/data/trip';
import { GLOBE_Y, LETTER_H, LETTER_Y, unitPx, type SplashConfig, type SplashEvent } from '@/splash/config';
import { Button } from '@/ui/kit';
import { Splash3D } from '@/ui/Splash3D';
import { C, F } from '@/ui/theme';

const plural = (n: number, a: string, b: string, c: string) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c; };
const native = Platform.OS !== 'web';
/** Заставку целиком показываем один раз за запуск, дальше — сразу готовый кадр. */
let seenSplash = false;

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [cfg, setCfg] = useState<SplashConfig | null>(null);
  const [count, setCount] = useState(0);
  const [stage, setStage] = useState<'globe' | 'gtt'>('globe');
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const top = useRef(new Animated.Value(1)).current;
  const tag = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false).then((reduce) => {
      if (!alive) return;
      const final = reduce || seenSplash;
      seenSplash = true;
      if (final) { setStage('gtt'); setCount(9); top.setValue(0); tag.setValue(1); }
      setCfg({ final, globeY: GLOBE_Y, letterY: LETTER_Y });
    });
    return () => { alive = false; };
  }, [top, tag]);

  // Пока сверху открыт каталог, заставка не рисуется
  useFocusEffect(useCallback(() => { setPaused(false); return () => setPaused(true); }, []));

  const onEvent = useCallback((e: SplashEvent) => {
    if (e.type === 'count' && typeof e.n === 'number') setCount(e.n);
    if (e.type === 'error') { setFailed(true); setStage('gtt'); }
    if (e.type === 'stage' && e.stage === 'gtt') setStage('gtt');
    if (e.type === 'skip') setCount(9);
  }, []);

  useEffect(() => {
    if (stage !== 'gtt' || !cfg || cfg.final) return;
    Animated.timing(top, { toValue: 0, duration: 600, useNativeDriver: native }).start();
    // подпись появляется, когда буквы собрались (сборка идёт 2,6 с)
    Animated.timing(tag, { toValue: 1, duration: 600, delay: 2300, useNativeDriver: native }).start();
  }, [stage, cfg, top, tag]);

  const u = unitPx(height);
  const lettersTop = height / 2 - (LETTER_Y + LETTER_H / 2) * u;
  const tagTop = height / 2 - (LETTER_Y - LETTER_H / 2) * u + 16;

  return (
    <View style={st.wrap}>
      {cfg && !failed ? <Splash3D config={cfg} paused={paused} onEvent={onEvent} /> : null}

      <Animated.View pointerEvents="none" style={[st.topBlock, { paddingTop: insets.top + 24, opacity: top }]}>
        <Text style={st.brand}>GLOBAL TECH TOUR</Text>
        <Text style={st.big} accessibilityLiveRegion="polite">
          <Text style={st.num}>{count}</Text> {plural(count, 'страна', 'страны', 'стран')}
        </Text>
        <Text style={st.sub}>Экспедиции к лидерам технологий — с выездом из Москвы.</Text>
      </Animated.View>

      {failed ? (
        <View pointerEvents="none" style={[st.center, { top: lettersTop, height: LETTER_H * u }]}>
          <Text style={[st.fallback, { fontSize: LETTER_H * u * 1.15, lineHeight: LETTER_H * u * 1.15 }]}>GTT</Text>
        </View>
      ) : null}

      <Animated.View pointerEvents="none" style={[st.center, { top: tagTop, opacity: tag }]}>
        <Text style={st.brand}>GLOBAL TECH TOUR</Text>
        <Text style={st.tagline}>{`Экспедиции в будущее\n9 стран · ${catalog.length} программ`}</Text>
      </Animated.View>

      <View style={[st.bottom, { paddingBottom: insets.bottom + 16 }]}>
        <Button title="Войти в поездку" onPress={() => router.replace('/trip')} label={`Войти в поездку: ${TRIP.title}, демо`} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Button title="Координатор" kind="light" icon="grid" label="Войти как координатор" onPress={() => router.replace('/coord')} /></View>
          <View style={{ flex: 1 }}><Button title="Агент" kind="light" icon="send" label="Войти как агент" onPress={() => router.replace('/agent')} /></View>
        </View>
        <Button title={`Программы GTT · ${catalog.length}`} kind="ghost" icon="globe" onPress={() => router.push('/catalog')} />
        <Text style={st.note}>{`Демо: ${TRIP.title}, ${TRIP.dates}. Участники вымышленные.`}</Text>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f1f6ff' },
  topBlock: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 22, gap: 6 },
  brand: { fontFamily: F.bold, fontSize: 12, letterSpacing: 1.6, color: C.blue },
  big: { fontFamily: F.display, fontSize: 40, lineHeight: 52, color: C.ink, textTransform: 'uppercase' },
  num: { fontFamily: F.display, fontSize: 64, color: C.ink },
  sub: { fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: C.muted, maxWidth: 260 },
  center: { position: 'absolute', left: 20, right: 20, alignItems: 'center', gap: 8 },
  tagline: { fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.muted, textAlign: 'center' },
  fallback: { fontFamily: F.display, color: C.blue },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, gap: 10 },
  note: { fontFamily: F.regular, fontSize: 12, color: C.muted, textAlign: 'center' },
});
