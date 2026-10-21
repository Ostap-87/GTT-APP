// Веб-версия распознавания: та же страница в невидимом фрейме.
import { useEffect, useRef, useState } from 'react';

import { OCR_HTML, type OcrEvent } from '@/ocr/ocr-html';

export function OcrEngine({ job, onEvent }: { job: { id: number; image: string; langs?: string[] } | null; onEvent: (e: OcrEvent) => void }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const cb = useRef(onEvent);
  cb.current = onEvent;
  useEffect(() => {
    const h = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow || !e.data?.gttOcr) return;
      const m = e.data.gttOcr as OcrEvent;
      if (m.type === 'ready') setReady(m.ok);
      cb.current(m);
    };
    window.addEventListener('message', h);
    return () => window.removeEventListener('message', h);
  }, []);
  useEffect(() => {
    if (ready && job) ref.current?.contentWindow?.postMessage({ gttOcrRun: job.image, langs: job.langs }, '*');
  }, [ready, job]);
  return <iframe ref={ref} srcDoc={OCR_HTML} title="Распознавание визитки" aria-hidden style={{ position: 'absolute', width: 1, height: 1, opacity: 0, border: 0, pointerEvents: 'none' }} />;
}
