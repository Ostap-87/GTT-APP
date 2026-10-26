// Фото фруктов и вкладки «На вес / Нарезка» раздела «Фруктовые лавки» (решение пользователя 26.10.2026: «для всех фруктов
// надо сделать фото… разделение — фрукты весом и фрукты нарезанные»). Фото — настоящие, с Wikimedia Commons (авторы —
// data/fruit-photos.ts, экран /fruit-photos), файлы assets/fruit/<id>.jpg 480×480.
import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CUTS, CUT_PHRASES, CUT_WHOLE_IDS, FR, FRUIT_PHRASES, type CutFruit, type FruitShowCard } from '@/data/fruit';
import { tr, type Lang } from '@/data/lang';
import type { ShopCity } from '@/data/shops';
import { useStored } from '@/state/store';
import { Icon } from './Icon';
import { Card, H3, T } from './kit';
import { Press } from './motion';
import { CardTiles, PhraseRow, Zh } from './shops-ui';
import { C, F, SH } from './theme';

// require — только строками: так Metro кладёт файлы в сборку
const PHOTOS: Record<string, number> = {
  lychee: require('../../assets/fruit/lychee.jpg'),
  longan: require('../../assets/fruit/longan.jpg'),
  mango: require('../../assets/fruit/mango.jpg'),
  durian: require('../../assets/fruit/durian.jpg'),
  mangosteen: require('../../assets/fruit/mangosteen.jpg'),
  pitaya: require('../../assets/fruit/pitaya.jpg'),
  bayberry: require('../../assets/fruit/bayberry.jpg'),
  loquat: require('../../assets/fruit/loquat.jpg'),
  kiwi: require('../../assets/fruit/kiwi.jpg'),
  pomelo: require('../../assets/fruit/pomelo.jpg'),
  orange: require('../../assets/fruit/orange.jpg'),
  mandarin: require('../../assets/fruit/mandarin.jpg'),
  strawberry: require('../../assets/fruit/strawberry.jpg'),
  watermelon: require('../../assets/fruit/watermelon.jpg'),
  hami: require('../../assets/fruit/hami.jpg'),
  cherry: require('../../assets/fruit/cherry.jpg'),
  chelizi: require('../../assets/fruit/chelizi.jpg'),
  grape: require('../../assets/fruit/grape.jpg'),
  peach: require('../../assets/fruit/peach.jpg'),
  persimmon: require('../../assets/fruit/persimmon.jpg'),
  pomegranate: require('../../assets/fruit/pomegranate.jpg'),
  pineapple: require('../../assets/fruit/pineapple.jpg'),
  coconut: require('../../assets/fruit/coconut.jpg'),
  pear: require('../../assets/fruit/pear.jpg'),
  apple: require('../../assets/fruit/apple.jpg'),
  radish: require('../../assets/fruit/radish.jpg'),
  'frozen-pear': require('../../assets/fruit/frozen-pear.jpg'),
  'yellow-peach': require('../../assets/fruit/yellow-peach.jpg'),
  'cut-watermelon': require('../../assets/fruit/cut-watermelon.jpg'),
  'cut-pineapple': require('../../assets/fruit/cut-pineapple.jpg'),
  'cut-hami': require('../../assets/fruit/cut-hami.jpg'),
  'cut-mango': require('../../assets/fruit/cut-mango.jpg'),
  'cut-pitaya': require('../../assets/fruit/cut-pitaya.jpg'),
  'cut-durian': require('../../assets/fruit/cut-durian.jpg'),
  'cut-jackfruit': require('../../assets/fruit/cut-jackfruit.jpg'),
  'cut-pomelo': require('../../assets/fruit/cut-pomelo.jpg'),
  'cut-coconut': require('../../assets/fruit/cut-coconut.jpg'),
  'cut-mixed': require('../../assets/fruit/cut-mixed.jpg'),
};
export const hasPhoto = (id?: string): id is string => !!id && id in PHOTOS;

/** Фото фрукта в скруглённой рамке; fill — на всю ширину (квадрат). Нет фото — fallback (значок или иероглиф). */
export function FruitPhoto({ id, size = 64, fill, fallback }: { id?: string; size?: number; fill?: boolean; fallback?: ReactNode }) {
  const radius = fill ? 16 : Math.round(size * 0.26);
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden', backgroundColor: C.well, alignItems: 'center', justifyContent: 'center' },
      fill ? { width: '100%', aspectRatio: 1 } : { width: size, height: size, boxShadow: SH.small }]}>
      {hasPhoto(id)
        ? <Image source={PHOTOS[id]} contentFit="cover" transition={120} style={{ width: '100%', height: '100%' }} accessibilityIgnoresInvertColors />
        : fallback}
    </View>
  );
}

/** Вкладка списка фруктов — сохраняется на телефоне, как язык раздела. */
export type FruitTab = 'weight' | 'cut';
export function useFruitTab() {
  const [v, set] = useStored<FruitTab>('shops.fruitTab', 'weight');
  return [v === 'cut' ? 'cut' : 'weight', set] as const;
}
export const fruitTabs = (lang: Lang) => [['weight', `${tr(FR.tabWeight, lang)} · 称重`], ['cut', `${tr(FR.tabCut, lang)} · 果切`]] as const;

/** Нарезка плитками по две: фото, название, китайский с пиньинем, примечание. */
function CutTiles({ items, lang, onOpen }: { items: CutFruit[]; lang: Lang; onOpen: (id: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {items.map((c) => (
        <Press key={c.id} onPress={() => onOpen(c.id)} label={tr(c.name, lang)} scaleTo={0.96}
          style={{ flexBasis: '46%', flexGrow: 1, borderRadius: 20, padding: 8, gap: 6, backgroundColor: C.card, boxShadow: SH.small }}>
          <FruitPhoto id={c.id} fill />
          <View style={{ paddingHorizontal: 4, paddingBottom: 4, gap: 2 }}>
            <Text style={{ fontFamily: F.semibold, fontSize: 13.5, lineHeight: 18, color: C.ink }}>{tr(c.name, lang)}</Text>
            <Zh zh={c.zh} size={15} />
            {c.note ? <Text style={{ fontFamily: F.regular, fontSize: 11.5, lineHeight: 16, color: C.muted }}>{tr(c.note, lang)}</Text> : null}
          </View>
        </Press>
      ))}
    </View>
  );
}

/** Вкладка «Нарезка»: как продают 果切, что бывает нарезанным (с фото), вопросы продавцу. */
export function CutSection({ tabs, lang, city, onOpen }: { tabs: ReactNode; lang: Lang; city: ShopCity; onOpen: (id: string) => void }) {
  const lines = [FR.cutLines[0], FR.cutLines[1], ...(city.region === 'cn' ? [FR.cutLabel] : []), ...FR.cutLines.slice(2)];
  const whole = CUT_WHOLE_IDS.map((id) => FRUIT_PHRASES.find((c) => c.id === id)).filter((c): c is FruitShowCard => !!c);
  return (
    <View style={{ gap: 14 }}>
      <Card>
        {tabs}
        <H3>{tr(FR.cutTitle, lang)}</H3>
        {lines.map((x, i) => <T key={i}>{`• ${tr(x, lang)}`}</T>)}
      </Card>
      <Card>
        <H3>{tr(FR.cutList, lang)}</H3>
        <T muted>{tr(FR.cutListSub, lang)}</T>
        <CutTiles items={CUTS} lang={lang} onOpen={onOpen} />
      </Card>
      <Card>
        <H3>{tr(FR.cutPhrases, lang)}</H3>
        <CardTiles cards={CUT_PHRASES} lang={lang} onOpen={(c) => onOpen(c.id)} />
        <H3 style={{ marginTop: 6 }}>{tr(FR.cutWhole, lang)}</H3>
        {whole.map((c) => <PhraseRow key={c.id} c={c} lang={lang} onOpen={(x) => onOpen(x.id)} />)}
      </Card>
    </View>
  );
}

/** Строка «Фото: Wikimedia Commons» внизу раздела — по нажатию список авторов и лицензий (так требует CC BY). */
export function PhotoCredit({ lang }: { lang: Lang }) {
  return (
    <Pressable onPress={() => router.push('/fruit-photos')} accessibilityRole="link" accessibilityLabel={`${tr(FR.photos, lang)}: ${tr(FR.photosSub, lang)}`}
      hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 }}>
      <Icon name="camera" size={16} color={C.muted} />
      <Text style={{ flex: 1, fontFamily: F.medium, fontSize: 12.5, lineHeight: 18, color: C.muted }}>
        {`${tr(FR.photos, lang)} · `}<Text style={{ fontFamily: F.semibold, color: C.blue }}>{tr(FR.photosSub, lang)}</Text>
      </Text>
    </Pressable>
  );
}
