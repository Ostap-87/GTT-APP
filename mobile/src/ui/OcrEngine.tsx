// Невидимый WebView с распознаванием (src/ocr/ocr-html.ts). job — картинка data:-строкой; новый job — новое распознавание.
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

import { OCR_HTML, type OcrEvent } from '@/ocr/ocr-html';

export function OcrEngine({ job, onEvent }: { job: { id: number; image: string; langs?: string[] } | null; onEvent: (e: OcrEvent) => void }) {
  const ref = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const cb = useRef(onEvent);
  cb.current = onEvent;
  useEffect(() => {
    if (ready && job) ref.current?.postMessage(JSON.stringify({ gttOcrRun: job.image, langs: job.langs }));
  }, [ready, job]);
  return (
    <View style={{ width: 1, height: 1, opacity: 0, position: 'absolute' }} pointerEvents="none">
      <WebView
        ref={ref}
        source={{ html: OCR_HTML, baseUrl: 'https://localhost/' }}
        originWhitelist={['*']}
        onMessage={(e) => {
          try {
            const m = JSON.parse(e.nativeEvent.data) as OcrEvent;
            if (m.type === 'ready') setReady(m.ok);
            cb.current(m);
          } catch { /* чужое сообщение */ }
        }}
      />
    </View>
  );
}
