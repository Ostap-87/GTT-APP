// PDF в браузере — во встроенном просмотрщике (файл хранится как data:-строка, показываем через blob-ссылку).
import { useEffect, useState } from 'react';

export function PdfView({ uri, title }: { uri: string; title: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let url = '';
    fetch(uri).then((r) => r.blob()).then((b) => { url = URL.createObjectURL(new Blob([b], { type: 'application/pdf' })); setSrc(url); }).catch(() => setSrc(uri));
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [uri]);
  return src ? <iframe src={src} title={title} style={{ flex: 1, width: '100%', height: '100%', border: 0, background: '#fff' }} /> : null;
}
