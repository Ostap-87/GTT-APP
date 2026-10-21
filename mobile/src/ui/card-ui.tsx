// Визитки: миниатюра снимка и «В контакты телефона» — визитка уходит файлом vCard: телефон предложит сохранить
// её в «Контакты» или переслать (WeChat, почта, Telegram). Разрешение на доступ к контактам не нужно.
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Image, Platform, View } from 'react-native';

import { vcard, type BizCard } from '@/data/card';
import { Icon } from './Icon';
import { C } from './theme';

export function CardThumb({ uri, w = 64 }: { uri?: string; w?: number }) {
  const h = Math.round(w / 1.75);
  if (!uri) return <View style={{ width: w, height: h, borderRadius: 6, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' }}><Icon name="card" size={20} color={C.blueInk} /></View>;
  return <Image source={{ uri }} style={{ width: w, height: h, borderRadius: 6, backgroundColor: C.line2 }} resizeMode="cover" accessibilityLabel="Снимок визитки" />;
}

const fileName = (c: BizCard) => `${(c.latin || c.name || 'contact').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'contact'}.vcf`;

/** Отдать визитку в «Контакты» или переслать: на телефоне — файл vCard через «Поделиться», в браузере — скачать. */
export async function shareCard(c: BizCard) {
  const text = vcard(c);
  if (Platform.OS === 'web') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/vcard' }));
    a.download = fileName(c);
    a.click();
    return true;
  }
  const f = new File(Paths.cache, fileName(c));
  if (f.exists) f.delete();
  f.create();
  f.write(text);
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(f.uri, { mimeType: 'text/vcard', UTI: 'public.vcard', dialogTitle: 'Сохранить контакт' });
  return true;
}
