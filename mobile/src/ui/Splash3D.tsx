// 3D-заставка стартового экрана в WebView (страница splash/scene.js, собранная без интернета). Со страницы приходят
// события (счётчик стран, сборка букв, пропуск касанием); paused останавливает отрисовку, пока экран закрыт другим.
import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

import { splashHtml, type SplashConfig, type SplashEvent } from '@/splash/config';

export function Splash3D({ config, paused, onEvent }: { config: SplashConfig; paused: boolean; onEvent: (e: SplashEvent) => void }) {
  const [html] = useState(() => splashHtml(config));
  const ref = useRef<WebView>(null);
  const cb = useRef(onEvent);
  cb.current = onEvent;
  useEffect(() => { ref.current?.injectJavaScript(`window.GTT_SPLASH_PAUSE && window.GTT_SPLASH_PAUSE(${paused}); true;`); }, [paused]);
  return (
    <WebView
      ref={ref}
      source={{ html }}
      originWhitelist={['*']}
      onMessage={(e) => { try { cb.current(JSON.parse(e.nativeEvent.data)); } catch { /* чужое сообщение */ } }}
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
      showsVerticalScrollIndicator={false}
      setSupportMultipleWindows={false}
      style={st.view}
      containerStyle={StyleSheet.absoluteFill}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const st = StyleSheet.create({ view: { flex: 1, backgroundColor: '#f1f6ff' } });
