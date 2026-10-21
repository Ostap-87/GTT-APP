// Майндмэп (решение 20.10.2026): карта дня — компании, темы встреч, договорённости, контакты; карта всей поездки —
// главные темы и вехи. Собирается на телефоне из заметок, рассказа гида и визиток; пока своих заметок нет — пример.
// Сохраняется отдельным PDF (альбомный лист) и входит в «Итоги поездки».
import * as Print from 'expo-print';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { VISITS } from '@/data/group';
import { nowLabel } from '@/data/media';
import { SAMPLE } from '@/data/mind-sample';
import { DAYS_WITH_VISITS, MAP_W, VISIT_DAY, dayLabel, dayTree, mindSvg, tripSummary, tripTree, visitName, type MindSource } from '@/data/mindmap';
import { mindPdfHtml } from '@/data/report';
import { DAYS, TRIP } from '@/data/trip';
import { useToast } from '@/state/toast';
import { useVisits } from '@/state/visits';
import { Icon } from '@/ui/Icon';
import { Button, Card, Chips, H3, Pick, Plain, Row, Seg, T, TitleRow } from '@/ui/kit';
import { C, F } from '@/ui/theme';

const APP_FONTS = { regular: F.regular, semibold: F.semibold, bold: F.bold };
const BIG = 0.8; // «Крупно»: подписи как в обычном тексте, карта листается

export default function MindMap() {
  const params = useLocalSearchParams<{ day?: string }>();
  const { notesOf, cardsOf } = useVisits();
  const toast = useToast();
  const mine: MindSource[] = VISITS.map((v) => ({ visit: v.id, notes: notesOf(v.id), cards: cardsOf(v.id) }));
  const hasMine = mine.some((s) => s.notes.length || s.cards.length);
  // пример заметок написан под визиты подробного демо; у программ сайта его нет
  const sampleOk = SAMPLE.some((x) => VISITS.some((v) => v.id === x.visit));
  const [src, setSrc] = useState<'mine' | 'sample'>(hasMine || !sampleOk ? 'mine' : 'sample');
  const first = String(DAYS_WITH_VISITS.includes(TRIP.today) ? TRIP.today : DAYS_WITH_VISITS[0]);
  const [view, setView] = useState(params.day === 'trip' || DAYS_WITH_VISITS.includes(Number(params.day)) ? String(params.day) : first);
  const [zoom, setZoom] = useState<'fit' | 'big'>('fit');
  const [boxW, setBoxW] = useState(0);
  const [busy, setBusy] = useState(false);
  const [focusX, setFocusX] = useState(0.5); // куда смотреть в «Крупно»: доля ширины карты
  const fitRef = useRef<View>(null);

  const data = src === 'mine' ? mine : SAMPLE;
  const day = view === 'trip' ? undefined : Number(view);
  const tree = day === undefined ? tripTree(data) : dayTree(day, data);
  const map = mindSvg(tree, APP_FONTS);
  const sum = tripSummary(data, day);
  const heading = day === undefined ? 'Вся поездка: главные темы и вехи' : `${dayLabel(day)} · ${tree.sub}`;

  const share = async () => {
    setBusy(true);
    try {
      const html = mindPdfHtml(tree, sum, heading, nowLabel());
      if (Platform.OS === 'web') await Print.printAsync({ html });
      else {
        const { uri } = await Print.printToFileAsync({ html, width: 842, height: 595 });
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Майндмэп' });
        else toast('PDF готов, но поделиться на этом устройстве нельзя');
      }
    } catch {
      toast('Не получилось собрать PDF');
    } finally {
      setBusy(false);
    }
  };

  const fitScale = boxW / MAP_W;
  const bigX = Math.max(0, Math.min(MAP_W * BIG - boxW, focusX * MAP_W * BIG - boxW / 2));
  const scale = zoom === 'fit' ? fitScale : BIG;
  return (
    <Plain>
      <Chips>
        {DAYS_WITH_VISITS.map((d) => <Pick key={d} title={`${DAYS[d].wd} ${DAYS[d].n}`} on={view === String(d)} onPress={() => setView(String(d))} />)}
        <Pick title="Вся поездка" on={view === 'trip'} onPress={() => setView('trip')} />
      </Chips>

      {sampleOk ? <Seg options={[['mine', 'Мои заметки'], ['sample', 'Пример']] as const} value={src} onChange={setSrc} /> : null}
      {src === 'sample' ? (
        <Card tone="info">
          <T>{hasMine ? 'Пример вымышленного делегата — так карта выглядит, когда заметок много.' : 'Своих заметок пока нет — показываем пример вымышленного делегата. Добавьте заметки на визитах, и карта соберётся из них.'}</T>
        </Card>
      ) : null}

      <Card style={{ padding: 8 }}>
        <View onLayout={(e) => setBoxW(e.nativeEvent.layout.width)}>
          {boxW ? (
            zoom === 'fit' ? (
              // На iPhone карту можно увеличить двумя пальцами
              <ScrollView maximumZoomScale={4} minimumZoomScale={1} bouncesZoom centerContent style={{ height: map.h * fitScale }} contentContainerStyle={{ width: boxW }}>
                <Pressable ref={fitRef} onPress={(e) => {
                  const { pageX } = e.nativeEvent;
                  fitRef.current?.measure((_x, _y, w, _h, px) => { setFocusX(w ? Math.min(1, Math.max(0, (pageX - px) / w)) : 0.5); setZoom('big'); });
                }} accessibilityRole="button" accessibilityLabel="Увеличить карту">
                  <SvgXml xml={map.xml} width={boxW} height={map.h * fitScale} />
                </Pressable>
              </ScrollView>
            ) : (
              // открываем сразу на месте нажатия: contentOffset — на телефоне, scrollLeft — в браузере
              <ScrollView key={`${focusX}-${view}-${src}`} horizontal contentOffset={{ x: bigX, y: 0 }}
                onLayout={(e) => { const el = (e.nativeEvent as unknown as { target?: { scrollLeft?: number } }).target; if (Platform.OS === 'web' && el) el.scrollLeft = bigX; }}>
                <SvgXml xml={map.xml} width={MAP_W * scale} height={map.h * scale} />
              </ScrollView>
            )
          ) : <View style={{ height: 200 }} />}
        </View>
        <View style={{ paddingHorizontal: 6, paddingTop: 6, gap: 8 }}>
          <Seg options={[['fit', 'Вся карта'], ['big', 'Крупно']] as const} value={zoom} onChange={(z) => { if (z === 'big') setFocusX(0.5); setZoom(z); }} />
          <T muted>{zoom === 'fit' ? 'Нажмите на карту — увеличится это место.' : 'Карту можно листать влево и вправо.'}</T>
        </View>
      </Card>

      {sum.brief.length ? (
        <Card>
          <H3>Коротко</H3>
          {sum.brief.map((p, i) => (
            <Text key={i} style={{ fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.ink }}>
              <Text style={{ fontFamily: F.semibold, color: C.blueInk }}>{`${visitName(p.from || '')}: `}</Text>{p.text}
            </Text>
          ))}
          <T muted>Главные фразы из заметок и расшифровок — выбраны на телефоне, без ИИ.</T>
        </Card>
      ) : null}

      <Card>
        <H3>{day === undefined ? 'Темы поездки' : `Темы · ${dayLabel(day)}`}</H3>
        {sum.themes.length ? sum.themes.slice(0, 6).map((t) => (
          <View key={t.key} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.color, marginTop: 5 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.ink }}>{t.ru}</Text>
              <Text style={{ fontFamily: F.regular, fontSize: 12.5, lineHeight: 17, color: C.muted }}>{t.visits.map((v) => visitName(v.visit)).join(', ')}</Text>
            </View>
          </View>
        )) : <T muted>Тем пока нет — они появятся из заметок.</T>}
      </Card>

      <Card>
        <TitleRow title={`Вехи и договорённости · ${sum.deals.length}`} />
        {sum.deals.length ? sum.deals.map((d, i) => (
          <View key={i} style={{ borderTopWidth: i ? 1 : 0, borderTopColor: C.line2, paddingTop: i ? 8 : 0, gap: 2 }}>
            <Text style={{ fontFamily: F.semibold, fontSize: 12.5, color: C.warn }}>{`${DAYS[d.day]?.wd} ${DAYS[d.day]?.n} · ${visitName(d.visit)}`}</Text>
            <Text style={{ fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.ink }}>{d.text}</Text>
          </View>
        )) : <T muted>Отметьте у заметки «Договорённость» — или напишите «договорились», «пришлют», «следующий шаг».</T>}
        {sum.contacts ? <T muted>{`Контакты с визиток: ${sum.contacts}`}</T> : null}
      </Card>

      <Button title={busy ? 'Собираю PDF…' : 'Сохранить майндмэп PDF'} icon="doc" onPress={() => { if (!busy) share(); }} />

      {day !== undefined ? (
        <Card>
          <H3>Заметки визитов дня</H3>
          {VISITS.filter((v) => VISIT_DAY[v.id] === day).map((v) => (
            <Row key={v.id} left={<Icon name="building" size={22} color={C.blueInk} />} title={v.name} sub={`${notesOf(v.id).length} заметок · ${cardsOf(v.id).length} визиток`} onPress={() => router.push(`/company/${v.id}`)} label={`Заметки: ${v.name}`} />
          ))}
        </Card>
      ) : (
        <Button title="Итоги поездки — PDF" icon="doc" kind="ghost" onPress={() => router.push('/report')} />
      )}

      <T muted>Темы и «Коротко» находятся по словам в заметках и в расшифровке экскурсии — у каждой заметки темы можно поправить («Изменить темы»). Голосовым заметкам и фото темы ставите вы. Расшифровку делает приложение переводчика — её вставляют в карточке визита.</T>
    </Plain>
  );
}
