// «Авторы фото» раздела «Фруктовые лавки» (26.10.2026): фото с Wikimedia Commons по лицензиям CC0, CC BY, CC BY-SA и
// общественное достояние — у каждого автор, лицензия (ссылка на текст) и страница файла. Так требует CC BY.
import { Stack } from 'expo-router';
import { Linking, Text } from 'react-native';

import { CUTS, FR, FRUITS, cutOf, fruitOf } from '@/data/fruit';
import { LOCAL_PHOTO_NAMES, PHOTO_CREDITS, licenseUrl } from '@/data/fruit-photos';
import { tr, type Lang } from '@/data/lang';
import { FruitPhoto } from '@/ui/fruit-ui';
import { Card, Plain, Row, T } from '@/ui/kit';
import { useShopLang } from '@/ui/shops-ui';
import { C, F } from '@/ui/theme';

const nameOf = (id: string, lang: Lang) => {
  const x = fruitOf(id)?.name || cutOf(id)?.name || LOCAL_PHOTO_NAMES[id];
  const cut = id.startsWith('cut-') ? ` · 果切` : '';
  return x ? `${tr(x, lang)}${cut}` : id;
};

// порядок: фрукты на вес, местные сорта, нарезка
const ORDER = [...FRUITS.filter((x) => !x.hidden).map((x) => x.id), ...Object.keys(LOCAL_PHOTO_NAMES), 'radish', ...CUTS.map((x) => x.id)]
  .filter((id) => PHOTO_CREDITS[id]);

export default function FruitPhotos() {
  const [lang] = useShopLang();
  return (
    <Plain>
      <Stack.Screen options={{ title: tr(FR.photosTitle, lang) }} />
      <Card tone="info"><T>{tr(FR.photosNote, lang)}</T></Card>
      <Card>
        {ORDER.map((id) => {
          const c = PHOTO_CREDITS[id];
          const lic = c.license === 'PD' ? tr(FR.pd, lang) : c.license;
          const url = licenseUrl(c.license);
          return (
            <Row key={id} onPress={() => { Linking.openURL(c.page).catch(() => {}); }} label={`${nameOf(id, lang)}: ${c.author}, ${lic}`}
              left={<FruitPhoto id={id} size={52} />}
              title={nameOf(id, lang)}
              sub={
                <Text style={{ fontFamily: F.regular, fontSize: 12.5, lineHeight: 18, color: C.muted, marginTop: 2 }}>
                  {`${tr(FR.author, lang)}: ${c.author} · `}
                  {url ? <Text style={{ fontFamily: F.semibold, color: C.blue }} onPress={() => { Linking.openURL(url).catch(() => {}); }}>{lic}</Text> : lic}
                </Text>
              } />
          );
        })}
      </Card>
    </Plain>
  );
}
