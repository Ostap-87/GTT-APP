// Веб-версия заставки: та же страница во фрейме (WebView в браузере нет). События — через postMessage.
import { useEffect, useRef, useState } from 'react';

import { splashHtml, type SplashConfig, type SplashEvent } from '@/splash/config';

type SplashWindow = Window & { GTT_SPLASH_PAUSE?: (p: boolean) => void };

export function Splash3D({ config, paused, onEvent }: { config: SplashConfig; paused: boolean; onEvent: (e: SplashEvent) => void }) {
  const [html] = useState(() => splashHtml(config));
  const ref = useRef<HTMLIFrameElement>(null);
  const cb = useRef(onEvent);
  cb.current = onEvent;
  useEffect(() => {
    const h = (e: MessageEvent) => { if (e.source === ref.current?.contentWindow && e.data?.gttSplash) cb.current(e.data.gttSplash); };
    window.addEventListener('message', h);
    return () => window.removeEventListener('message', h);
  }, []);
  useEffect(() => { (ref.current?.contentWindow as SplashWindow | null)?.GTT_SPLASH_PAUSE?.(paused); }, [paused]);
  return <iframe ref={ref} srcDoc={html} title="Заставка Global Tech Tour" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, background: '#f1f6ff' }} />;
}
