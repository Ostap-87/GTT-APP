// Файлы делегата (фото к заметкам, голосовые заметки, снимки визиток) лежат в папке приложения на телефоне —
// так они переживают перезапуск и открываются без интернета. В вебе браузер не даёт папку, поэтому файл
// хранится как data:-строка (для демо; фото там сжимаются сильнее).
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

const web = Platform.OS === 'web';

function folder() {
  const d = new Directory(Paths.document, 'gtt');
  if (!d.exists) d.create();
  return d;
}

async function blobToDataUrl(uri: string): Promise<string> {
  const blob = await (await fetch(uri)).blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/** Перенести файл из временной папки в постоянную (на телефоне) или превратить в data:-строку (в вебе). */
export async function keepFile(uri: string, ext: string): Promise<string> {
  if (web) return uri.startsWith('data:') ? uri : blobToDataUrl(uri);
  try {
    const dst = new File(folder(), `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`);
    new File(uri).copy(dst);
    return dst.uri;
  } catch {
    return uri;
  }
}

/** Содержимое файла в base64 — для картинок внутри PDF. */
export async function base64Of(uri: string): Promise<string | null> {
  try {
    if (uri.startsWith('data:')) return uri.slice(uri.indexOf(',') + 1);
    if (web) return (await blobToDataUrl(uri)).split(',')[1];
    return await new File(uri).base64();
  } catch {
    return null;
  }
}

/** Удалить файл заметки вместе с заметкой. */
export function dropFile(uri?: string) {
  if (!uri || web || uri.startsWith('data:')) return;
  try { new File(uri).delete(); } catch { /* уже нет */ }
}

export const nowLabel = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}, ${d.toTimeString().slice(0, 5)}`;
};
