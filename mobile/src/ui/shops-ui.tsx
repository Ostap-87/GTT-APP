// Общие элементы разделов «Аптеки» и «Фруктовые лавки»: язык раздела, город (по поездке или вручную), китайский текст
// с пиньинем, плитки карточек «покажите…», слова для поиска на карте, список сетей.
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { LANGS, fill, isLang, tr, type Lang } from '@/data/lang';
import type { ShowCard } from '@/data/pharmacy';
import { SHOP_CITIES, UI, cityFromTrip, mapSearchUrl, py, shopCity, type Chain, type SearchWord, type ShopCity } from '@/data/shops';
import { useStored } from '@/state/store';
import { useToast } from '@/state/toast';
import { Icon } from './Icon';
import { Button, Card, Chip, Chips, Label, Pick, Row, Seg, T } from './kit';
import { Press } from './motion';
import { C, F, SH } from './theme';

/** Язык разделов — один на оба раздела, сохраняется на телефоне. */
export function useShopLang() {
  const [l, setL] = useStored<Lang>('shops.lang', 'ru');
  return [isLang(l) ? l : 'ru', setL] as const;
}

/** Город раздела: выбранный вручную или город поездки (ближайший из списка). */
export function useShopCity() {
  const [picked, setPicked] = useStored<string>('shops.city', '');
  const auto = cityFromTrip();
  const city: ShopCity = shopCity(picked) || auto?.city || SHOP_CITIES[0];
  return { city, auto, manual: !!shopCity(picked), pick: setPicked };
}

/** Язык и город — шапка раздела. */
export function ShopHead({ lang, setLang, cs }: { lang: Lang; setLang: (l: Lang) => void; cs: ReturnType<typeof useShopCity> }) {
  const [open, setOpen] = useState(false);
  const { city, auto, manual, pick } = cs;
  const sub = !manual && auto ? (auto.near ? fill(tr(UI.near, lang), { city: auto.tripRu }) : tr(UI.fromTrip, lang)) : '';
  return (
    <Card>
      <Label>{tr(UI.lang, lang)}</Label>
      <Seg options={LANGS} value={lang} onChange={setLang} />
      <Row title={<Text style={{ fontFamily: F.bold, fontSize: 17, color: C.ink }}>{`${tr(city.name, lang)}  ${city.zh}`}</Text>}
        sub={sub || undefined} left={<Icon name="pin" size={22} color={C.blueInk} />}
        right={<Button title={open ? tr(UI.done, lang) : tr(UI.change, lang)} kind="light" small onPress={() => setOpen(!open)} />} />
      {!auto && !manual ? <T muted>{tr(UI.notInList, lang)}</T> : null}
      {open ? (
        <>
          <Chips>
            {SHOP_CITIES.map((c) => (
              <Pick key={c.id} title={tr(c.name, lang)} on={c.id === city.id} onPress={() => { pick(c.id); setOpen(false); }} />
            ))}
          </Chips>
          {manual && auto ? <Button title={tr(UI.backToTrip, lang)} kind="ghost" small onPress={() => { pick(''); setOpen(false); }} /> : null}
        </>
      ) : null}
    </Card>
  );
}

/** Китайский текст крупно и пиньинь мелко под ним. Шрифт не задаём: иероглифы рисует системный шрифт. */
export function Zh({ zh, size = 20, center }: { zh: string; size?: number; center?: boolean }) {
  const p = py(zh);
  return (
    <View style={{ gap: 2 }}>
      <Text selectable style={{ fontSize: size, lineHeight: Math.round(size * 1.35), fontWeight: '700', color: C.ink, textAlign: center ? 'center' : 'left' }}>{zh}</Text>
      {p ? <Text style={{ fontFamily: F.regular, fontSize: Math.max(11.5, Math.round(size * 0.5)), lineHeight: Math.round(Math.max(11.5, size * 0.5) * 1.35), color: C.muted, textAlign: center ? 'center' : 'left' }}>{p}</Text> : null}
    </View>
  );
}

export const openCard = (id: string, lang: Lang, city: ShopCity, who: 'ph' | 'fr') =>
  router.push({ pathname: '/show-card', params: { id, l: lang, c: city.id, who } });

/** Плитки карточек по две в ряд: значок, подпись на языке раздела, китайский текст мелко. */
export function CardTiles({ cards, lang, onOpen }: { cards: ShowCard[]; lang: Lang; onOpen: (c: ShowCard) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {cards.map((c) => {
        const label = c.label ? tr(c.label, lang) : tr(c.tx, lang);
        return (
          <Press key={c.id} onPress={() => onOpen(c)} label={label} scaleTo={0.95}
            style={{ flexBasis: '46%', flexGrow: 1, minHeight: 96, borderRadius: 18, padding: 12, gap: 4, backgroundColor: C.card, boxShadow: SH.small }}>
            {c.emoji ? <Text style={{ fontSize: 24, lineHeight: 30 }}>{c.emoji}</Text> : null}
            <Text style={{ fontFamily: F.semibold, fontSize: 13.5, lineHeight: 18, color: C.ink }}>{label}</Text>
            <Text numberOfLines={2} style={{ fontSize: 13, lineHeight: 18, color: C.muted }}>{c.zh}</Text>
          </Press>
        );
      })}
    </View>
  );
}

/** Фраза строкой: китайский с пиньинем, ниже перевод; нажатие — крупная карточка. */
export function PhraseRow({ c, lang, onOpen }: { c: ShowCard; lang: Lang; onOpen: (c: ShowCard) => void }) {
  return (
    <Row onPress={() => onOpen(c)} label={tr(c.tx, lang)}
      left={c.emoji ? <Text style={{ fontSize: 20, width: 26, textAlign: 'center' }}>{c.emoji}</Text> : undefined}
      title={<Zh zh={c.zh} size={16} />} sub={tr(c.tx, lang)} />
  );
}

/** Слова для поиска на карте: копировать и открыть карту. */
export function SearchWords({ words, city, lang, copyTx, openTx, copiedTx }: { words: SearchWord[]; city: ShopCity; lang: Lang; copyTx: string; openTx: string; copiedTx: string }) {
  const toast = useToast();
  return (
    <>
      {words.map(([w, meaning]) => (
        <View key={w} style={{ gap: 8, paddingVertical: 6, borderTopWidth: 1, borderTopColor: C.line2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1 }}><Zh zh={w} size={22} /></View>
            <Chip tone="plain">{tr(meaning, lang)}</Chip>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Button title={copyTx} icon="copy" kind="ghost" small onPress={() => { Clipboard.setStringAsync(w).then(() => toast(`${copiedTx}: ${w}`)).catch(() => toast(w)); }} /></View>
            <View style={{ flex: 1 }}><Button title={openTx} icon="map" kind="light" small onPress={() => { Linking.openURL(mapSearchUrl(w, city)).catch(() => toast(w)); }} /></View>
          </View>
        </View>
      ))}
    </>
  );
}

/** Сети: китайское название крупно, пиньинь, латиница, откуда сеть и примечание. */
export function ChainRows({ ids, dict, lang, fromTx }: { ids: string[]; dict: Record<string, Chain>; lang: Lang; fromTx: string }) {
  return (
    <>
      {ids.map((id) => dict[id]).filter(Boolean).map((ch) => (
        <Row key={ch.id} title={<Zh zh={ch.zh} size={17} />}
          sub={`${ch.lat} · ${fill(fromTx, { city: tr(ch.from, lang) })}${ch.note ? `\n${tr(ch.note, lang)}` : ''}`} />
      ))}
    </>
  );
}

/** Экстренный номер крупно, нажатие — звонок. */
export function EmergencyLine({ num, label }: { num: string; label: string }) {
  return (
    <Pressable onPress={() => Linking.openURL(`tel:${num}`)} accessibilityRole="button" accessibilityLabel={`${label}: ${num}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text style={{ fontFamily: F.display, fontSize: 44, lineHeight: 46, color: C.red }}>{num}</Text>
      <Text style={{ flex: 1, fontFamily: F.semibold, fontSize: 14, color: C.ink }}>{label}</Text>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', boxShadow: SH.small }}>
        <Icon name="phone" size={20} color={C.red} />
      </View>
    </Pressable>
  );
}

/** Ссылка на соседний раздел. */
export function OtherSection({ title, sub, icon, to }: { title: string; sub: string; icon: 'pill' | 'apple'; to: '/pharmacy' | '/fruit' }) {
  return (
    <Card onPress={() => router.replace(to)} label={title}>
      <Row left={<Icon name={icon} size={24} color={C.blueInk} />} title={title} sub={sub} />
    </Card>
  );
}

