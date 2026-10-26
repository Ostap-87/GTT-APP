// «Фруктовые лавки» (решение пользователя 26.10.2026): цена за 斤 (500 г) с пересчётом в килограммы и рубли, как
// называются лавки, сети в городе, слова для поиска на карте, карточки для продавца, фрукты с сезонами и местные сорта.
// Список фруктов — вкладки «На вес» (称重) и «Нарезка» (果切), у каждого фрукта фото (src/ui/fruit-ui.tsx).
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { countryOf, type Currency } from '@/data/countries';
import { FR, FRUITS, FRUIT_PHRASES, allYear, fruitCard, fruitOf, inSeason } from '@/data/fruit';
import { MONTHS, fill, tr, type Lang } from '@/data/lang';
import { PH } from '@/data/pharmacy';
import { FRUIT_CHAINS, FRUIT_WORDS, UI, type ShopCity } from '@/data/shops';
import { TRIP } from '@/data/trip';
import { useRate } from '@/ui/Converter';
import { CutSection, FruitPhoto, PhotoCredit, fruitTabs, useFruitTab } from '@/ui/fruit-ui';
import { Card, Chip, H3, Plain, Row, Seg, T, inputStyle } from '@/ui/kit';
import { OfflineNote } from '@/ui/OfflineNote';
import { CardTiles, ChainRows, OtherSection, PhraseRow, SearchWords, ShopHead, Zh, openCard, useShopCity, useShopLang } from '@/ui/shops-ui';
import { C, F } from '@/ui/theme';

/** Гонконгский доллар: курс публикует ЦБ РФ, по умолчанию пусто — тогда рубли не показываем, пока нет сети. */
const HKD: Currency = { code: 'HKD', sym: 'HK$', ru: 'гонконгские доллары', cbr: true, quick: [] };
const fmt = (n: number, d = 0) => n.toLocaleString('ru-RU', { minimumFractionDigits: d, maximumFractionDigits: d });
const tripMonth = () => Number((TRIP.start || '').split('-')[1]) || new Date().getMonth() + 1;

/** Пересчёт цены за 斤 в цену за килограмм и в рубли. */
function JinCalc({ city, lang }: { city: ShopCity; lang: Lang }) {
  const cn = city.region === 'cn';
  const cur = city.region === 'hk' ? HKD : countryOf('cn').currency;
  const [rate] = useRate(cur);
  const [v, setV] = useState('15');
  const price = Number(v.replace(',', '.')) || 0;
  // на материке 斤 = 500 г; в Гонконге и Макао — 604,79 г
  const perKg = cn ? price * 2 : price / 0.60479;
  const sym = city.region === 'cn' ? '¥' : city.region === 'hk' ? 'HK$' : 'MOP$';
  const rub = city.region !== 'mo' && rate.rub ? perKg * rate.rub : 0;
  return (
    <Card tone="info">
      <H3>{tr(FR.jin, lang)}</H3>
      <T>{tr(cn ? FR.jinCn : FR.jinHk, lang)}</T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 12.5, color: C.muted }}>{tr(FR.calcLabel, lang)}</Text>
          <TextInput value={v} onChangeText={setV} keyboardType="decimal-pad" accessibilityLabel={tr(FR.calcLabel, lang)}
            style={[inputStyle, { fontFamily: F.bold, fontSize: 20 }]} />
        </View>
        <View style={{ flex: 1.2, gap: 2 }}>
          <Text style={{ fontFamily: F.display, fontSize: 34, lineHeight: 38, color: C.blueInk }}>{`${sym}${fmt(perKg, perKg < 100 && !Number.isInteger(perKg) ? 1 : 0)}`}</Text>
          <Text style={{ fontFamily: F.medium, fontSize: 12.5, color: C.muted }}>{tr(FR.perKg, lang)}{rub ? ` · ≈ ${fmt(rub)} ₽` : ''}</Text>
        </View>
      </View>
    </Card>
  );
}

export default function Fruit() {
  const [lang, setLang] = useShopLang();
  const cs = useShopCity();
  const { city } = cs;
  const cn = city.region === 'cn';
  const open = (id: string) => openCard(id, lang, city, 'fr');
  const [tab, setTab] = useFruitTab();
  const tabs = <Seg options={fruitTabs(lang)} value={tab} onChange={setTab} />;
  const m = tripMonth();
  const list = FRUITS.filter((x) => !x.hidden);
  // сначала то, что в сезон во время поездки
  const sorted = [...list.filter((x) => inSeason(x, m) && !allYear(x)), ...list.filter((x) => !inSeason(x, m) || allYear(x))];
  const seasonText = (months: number[]) => (months.length === 12 ? tr(FR.allYear, lang)
    : months.length === 1 ? MONTHS[lang][months[0] - 1] : `${MONTHS[lang][months[0] - 1]} – ${MONTHS[lang][months[months.length - 1] - 1]}`);
  return (
    <Plain>
      <Stack.Screen options={{ title: tr(FR.title, lang) }} />
      <OfflineNote what="Фразы для продавца, сезоны и пересчёт цены" />
      <ShopHead lang={lang} setLang={setLang} cs={cs} />
      <JinCalc city={city} lang={lang} />

      {city.note ? <Card tone="info"><T>{tr(city.note, lang)}</T></Card> : null}

      <Card>
        <H3>{tr(FR.phrases, lang)}</H3>
        <T muted>{tr(PH.showSub, lang)}</T>
        <CardTiles cards={FRUIT_PHRASES.slice(0, 8)} lang={lang} onOpen={(c) => open(c.id)} />
        {FRUIT_PHRASES.slice(8).map((c) => <PhraseRow key={c.id} c={c} lang={lang} onOpen={(x) => open(x.id)} />)}
      </Card>

      {city.local?.length ? (
        <Card>
          <H3>{`${tr(FR.local, lang)}: ${tr(city.name, lang)}`}</H3>
          <T muted>{tr(FR.localSub, lang)}</T>
          {city.local.map((x) => {
            const fr = fruitOf(x.fruit);
            return (
              <Row key={x.zh} title={<Zh zh={x.zh} size={18} />} left={<FruitPhoto id={x.photo || x.fruit} size={48} />}
                sub={`${x.tx ? tr(x.tx, lang) : fr ? tr(fr.name, lang) : ''}${fr ? ` · ${seasonText(fr.months)}` : ''}`}
                right={fr && inSeason(fr, m) ? <Chip tone="ok">{tr(FR.inTrip, lang)}</Chip> : undefined} />
            );
          })}
        </Card>
      ) : null}

      <Card>
        <H3>{tr(FR.names, lang)}</H3>
        {(cn ? FR.namesCn : FR.namesHk).map(([zh, x]) => <Row key={zh} title={<Zh zh={zh} size={19} />} sub={tr(x, lang)} />)}
      </Card>

      <Card>
        <H3>{tr(FR.where, lang)}</H3>
        <T muted>{tr(FR.whereNote, lang)}</T>
        <ChainRows ids={city.fr} dict={FRUIT_CHAINS} lang={lang} fromTx={tr(PH.from, lang)} />
      </Card>

      <Card>
        <H3>{tr(FR.find, lang)}</H3>
        <SearchWords words={FRUIT_WORDS[city.region]} city={city} lang={lang} copyTx={tr(PH.copy, lang)} openTx={tr(PH.openMap, lang)} copiedTx={tr(PH.copied, lang)} />
        {cn ? <T muted>{tr(FR.delivery, lang)}</T> : null}
      </Card>

      <Card>
        <H3>{tr(FR.how, lang)}</H3>
        {FR.howLines.map((x, i) => <T key={i}>{`• ${tr(x, lang)}`}</T>)}
      </Card>

      {tab === 'cut' ? <CutSection tabs={tabs} lang={lang} city={city} onOpen={open} /> : (
        <Card>
          {tabs}
          <H3>{tr(FR.fruits, lang)}</H3>
          <T muted>{`${tr(FR.weightNote, lang)} ${tr(FR.fruitsSub, lang)}`}</T>
          {sorted.map((fr) => (
            <Row key={fr.id} onPress={() => open(fruitCard(fr).id)} label={tr(fr.name, lang)}
              left={<FruitPhoto id={fr.id} size={64} fallback={fr.emoji ? <Text style={{ fontSize: 24 }}>{fr.emoji}</Text> : <Text style={{ fontSize: 20, fontWeight: '700', color: C.blueInk }}>{fr.zh[0]}</Text>} />}
              title={<View style={{ gap: 2 }}>
                <Text style={{ fontFamily: F.semibold, fontSize: 14.5, color: C.ink }}>{tr(fr.name, lang)}</Text>
                <Zh zh={fr.zh} size={17} />
              </View>}
              sub={`${seasonText(fr.months)}${fr.note ? `\n${tr(fr.note, lang)}` : ''}`}
              right={inSeason(fr, m) && !allYear(fr) ? <Chip tone="ok">{fill(tr(FR.seasonNow, lang), { month: MONTHS[lang][m - 1] })}</Chip> : undefined} />
          ))}
        </Card>
      )}
      <PhotoCredit lang={lang} />

      <OtherSection title={tr(UI.pharmaLink, lang)} sub={tr(UI.pharmaLinkSub, lang)} icon="pill" to="/pharmacy" />
      <T muted>{tr(FR.footer, lang)}</T>
    </Plain>
  );
}
