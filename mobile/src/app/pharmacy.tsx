// «Аптеки» (решение пользователя 26.10.2026): как узнать аптеку, сети в городе поездки, слова для поиска на карте,
// карточки «покажите фармацевту» (симптомы, фразы, действующие вещества), рецепт и без рецепта, оплата. Язык раздела —
// русский, английский, казахский или узбекский; китайский текст для фармацевта — всегда по-китайски с пиньинем.
import { Stack } from 'expo-router';
import { Text, View } from 'react-native';

import { tr } from '@/data/lang';
import { MEDS, PHARMA_PHRASES, PH, SYMPTOMS, medCard } from '@/data/pharmacy';
import { PHARMA, PHARMA_NATIONAL, PHARMA_WORDS, UI, ambulanceOf } from '@/data/shops';
import { Card, H3, Plain, Row, T } from '@/ui/kit';
import { OfflineNote } from '@/ui/OfflineNote';
import { CardTiles, ChainRows, EmergencyLine, OtherSection, PhraseRow, SearchWords, ShopHead, Zh, openCard, useShopCity, useShopLang } from '@/ui/shops-ui';
import { C, F } from '@/ui/theme';

/** «Ibuprofen · Ibuprofen» не пишем: МНН показываем, только если название на языке раздела другое. */
const sameName = (a: string, b: string) => { const x = a.toLowerCase(), y = b.toLowerCase(); return x.startsWith(y) || y.startsWith(x); };

export default function Pharmacy() {
  const [lang, setLang] = useShopLang();
  const cs = useShopCity();
  const { city } = cs;
  const cn = city.region === 'cn';
  const open = (id: string) => openCard(id, lang, city, 'ph');
  const num = ambulanceOf(city);
  return (
    <Plain>
      <Stack.Screen options={{ title: tr(PH.title, lang) }} />
      <OfflineNote what="Карточки для фармацевта, названия лекарств и слова для поиска" />
      <ShopHead lang={lang} setLang={setLang} cs={cs} />

      <Card tone="warn">
        <T>{tr(PH.disclaimer, lang)}</T>
        <T muted>{tr(PH.danger, lang)}</T>
        <EmergencyLine num={num} label={tr(PH.ambulance, lang)} />
      </Card>

      {city.note ? <Card tone="info"><T>{tr(city.note, lang)}</T></Card> : null}

      <Card>
        <H3>{tr(PH.show, lang)}</H3>
        <T muted>{tr(PH.showSub, lang)}</T>
        <CardTiles cards={SYMPTOMS} lang={lang} onOpen={(c) => open(c.id)} />
      </Card>

      <Card>
        <H3>{tr(PH.howLook, lang)}</H3>
        {cn ? <View style={{ flexDirection: 'row', gap: 18, flexWrap: 'wrap' }}><Zh zh="药店" size={26} /><Zh zh="药房" size={26} /><Zh zh="大药房" size={26} /></View>
          : <View style={{ flexDirection: 'row', gap: 18 }}><Zh zh="藥房" size={26} /><Text style={{ fontFamily: F.display, fontSize: 30, color: C.green }}>Rx</Text></View>}
        {(cn ? PH.lookCn : PH.lookHk).map((x, i) => <T key={i}>{`• ${tr(x, lang)}`}</T>)}
      </Card>

      <Card>
        <H3>{tr(PH.chains, lang)}</H3>
        {city.ph.length ? <ChainRows ids={city.ph} dict={PHARMA} lang={lang} fromTx={tr(PH.from, lang)} /> : <T>{tr(PH.chainsNone, lang)}</T>}
        {cn ? (
          <>
            <T muted>{tr(PH.national, lang)}</T>
            <Text style={{ fontSize: 15, lineHeight: 22, color: C.ink }}>{PHARMA_NATIONAL.filter((id) => !city.ph.includes(id)).map((id) => `${PHARMA[id].zh} (${PHARMA[id].lat})`).join(' · ')}</Text>
          </>
        ) : null}
      </Card>

      <Card>
        <H3>{tr(PH.find, lang)}</H3>
        <T>{tr(cn ? PH.findCn : PH.findHk, lang)}</T>
        <SearchWords words={PHARMA_WORDS[city.region]} city={city} lang={lang} copyTx={tr(PH.copy, lang)} openTx={tr(PH.openMap, lang)} copiedTx={tr(PH.copied, lang)} />
        {cn ? <T muted>{tr(PH.delivery, lang)}</T> : null}
      </Card>

      <Card>
        <H3>{tr(PH.phrases, lang)}</H3>
        {PHARMA_PHRASES.map((c) => <PhraseRow key={c.id} c={c} lang={lang} onOpen={(x) => open(x.id)} />)}
      </Card>

      <Card>
        <H3>{tr(PH.meds, lang)}</H3>
        <T muted>{tr(PH.medsSub, lang)}</T>
        {!cn ? <T>{tr(PH.hkNames, lang)}</T> : null}
        {MEDS.map((m) => (
          <Row key={m.id} onPress={() => open(medCard(m).id)} label={tr(m.name, lang)}
            title={<View style={{ gap: 2 }}>
              <Text style={{ fontFamily: F.semibold, fontSize: 14.5, color: C.ink }}>{`${tr(m.name, lang)}${sameName(tr(m.name, lang), m.inn) ? '' : ` · ${m.inn}`}`}</Text>
              <Zh zh={m.zh} size={17} />
            </View>}
            sub={`${tr(m.use, lang)}${m.note ? `\n${tr(m.note, lang)}` : ''}`} />
        ))}
      </Card>

      {cn ? (
        <Card>
          <H3>{tr(PH.rx, lang)}</H3>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ backgroundColor: C.red, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={{ fontFamily: F.bold, color: '#fff' }}>OTC 甲类</Text></View>
            <View style={{ backgroundColor: C.green, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={{ fontFamily: F.bold, color: '#fff' }}>OTC 乙类</Text></View>
          </View>
          {PH.rxCn.map((x, i) => <T key={i}>{`• ${tr(x, lang)}`}</T>)}
        </Card>
      ) : null}

      {cn ? <Card><H3>{tr(PH.pay, lang)}</H3><T>{tr(PH.payCn, lang)}</T></Card> : null}

      <OtherSection title={tr(UI.fruitLink, lang)} sub={tr(UI.fruitLinkSub, lang)} icon="apple" to="/fruit" />
      <T muted>{tr(PH.footer, lang)}</T>
    </Plain>
  );
}
