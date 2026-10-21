// «Расходы» для командировочного отчёта (решение 21.10.2026): фото чека → сумма распознаётся с чека (её можно поправить) →
// пересчёт в рубли по курсу ЦБ РФ → в конце поездки Excel или PDF с чеками для бухгалтерии. Всё хранится на телефоне.
import { SaveFormat, ImageManipulator } from 'expo-image-manipulator';
import * as Print from 'expo-print';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, Text, TextInput, View } from 'react-native';

import { countryOf } from '@/data/countries';
import { plural } from '@/data/group';
import { EXPENSE_CATS, catRu, expenseHtml, expenseRows, money, receiptAmount, rub, type Expense, type ExpenseCat } from '@/data/expenses';
import { base64Of, keepFile } from '@/data/media';
import { ME, TRIP } from '@/data/trip';
import { xlsx } from '@/data/xlsx';
import { ocrStage, type OcrEvent } from '@/ocr/ocr-html';
import { useToast } from '@/state/toast';
import { useTrip } from '@/state/trip';
import { useRate } from '@/ui/Converter';
import { safeName, shareFile, shareUri } from '@/ui/files';
import { Icon } from '@/ui/Icon';
import { Button, Card, Chip, Chips, Field, H3, Pick, Plain, Row, T, TitleRow, inputStyle } from '@/ui/kit';
import { pickPhoto } from '@/ui/notes-ui';
import { OcrEngine } from '@/ui/OcrEngine';
import { C, F } from '@/ui/theme';

const tripKey = () => TRIP.programId || 'demo';

export default function Expenses() {
  const { expenses, addExpense, removeExpense } = useTrip();
  const toast = useToast();
  const cur = countryOf(TRIP.country).currency;
  const [rate] = useRate(cur);
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState<ExpenseCat>('taxi');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<string | undefined>();
  const [job, setJob] = useState<{ id: number; image: string; langs?: string[] } | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const list = expenses.filter((e) => e.trip === tripKey());
  const total = list.reduce((a, e) => a + rub(e), 0);
  const totalLocal = list.filter((e) => e.cur === cur.code).reduce((a, e) => a + e.amount, 0);
  const n = Number(amount.replace(/\s/g, '').replace(',', '.'));

  const snap = async (from: 'camera' | 'library') => {
    const p = await pickPhoto(from);
    if (!p) return;
    try {
      const img = await (await ImageManipulator.manipulate(p.uri).resize({ width: 1400 }).renderAsync()).saveAsync({ format: SaveFormat.JPEG, compress: 0.75, base64: true });
      setPhoto(await keepFile(img.uri, 'jpg'));
      setStage('Готовлю распознавание…');
      setJob({ id: Date.now(), image: `data:image/jpeg;base64,${img.base64}`, langs: countryOf(TRIP.country).lang.ocr });
    } catch {
      toast('Не получилось открыть фото');
    }
  };
  const onOcr = (e: OcrEvent) => {
    if (e.type === 'progress') setStage(ocrStage(e.status, e.p));
    if (e.type === 'error') { setStage(null); toast('Сумму не распознать без интернета в первый раз — впишите её, чек сохранён'); }
    if (e.type === 'result') {
      setStage(null);
      const a = receiptAmount(e.text);
      if (a) { setAmount(String(a).replace('.', ',')); toast(`С чека: ${money(a)} ${cur.sym} — проверьте`); } else toast('Сумму на чеке не нашли — впишите её');
    }
  };
  const save = () => {
    if (!(n > 0)) return toast('Впишите сумму');
    addExpense({
      id: `e${Date.now()}`, at: new Date().toISOString(), trip: tripKey(), amount: n, cur: cur.code, sym: cur.sym,
      rate: rate.rub || 0, rateNote: rate.rub ? (cur.cbr ? `ЦБ РФ на ${rate.date}` : 'курс обменника') : '', cat, note: note.trim(), photo,
    });
    setAmount(''); setNote(''); setPhoto(undefined);
    toast(rate.rub ? `Записано: ≈ ${money(n * rate.rub, 0)} ₽` : 'Записано — курс впишите в конвертере «Город»');
  };

  const meta = { who: `${ME.ru}, ${ME.roleRu}, ${ME.coRu}`, trip: TRIP.title, dates: TRIP.dates, made: new Date().toLocaleDateString('ru-RU') };
  const toExcel = async () => {
    await shareFile(`Расходы-${safeName(TRIP.title)}.xlsx`, xlsx([{ name: 'Расходы', rows: expenseRows(list), widths: [12, 20, 34, 12, 8, 12, 18, 14, 16] }]), 'xlsx', 'Отчёт о расходах');
  };
  const toPdf = async () => {
    setBusy(true);
    try {
      const photos: Record<string, string> = {};
      for (const e of list) if (e.photo) { const b = await base64Of(e.photo); if (b) photos[e.id] = `data:image/jpeg;base64,${b}`; }
      const html = expenseHtml(list, meta, photos);
      if (Platform.OS === 'web') await Print.printAsync({ html });
      else { const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 }); await shareUri(uri, 'pdf', 'Отчёт о расходах'); }
    } catch {
      toast('Не получилось собрать PDF');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Plain>
      <OcrEngine job={job} onEvent={onOcr} />
      <Card tone="dark">
        <Text style={{ fontFamily: F.medium, fontSize: 12.5, color: C.onDark }}>{`${TRIP.title} · ${list.length} ${plural(list.length, 'расход', 'расхода', 'расходов')}`}</Text>
        <Text style={{ fontFamily: F.display, fontSize: 40, lineHeight: 44, color: '#fff' }}>{`≈ ${money(total, 0)} ₽`}</Text>
        <Text style={{ fontFamily: F.medium, fontSize: 13, color: C.onDark }}>{`${money(totalLocal)} ${cur.sym} · ${rate.rub ? `курс ${cur.cbr ? `ЦБ на ${rate.date}` : 'обменника'}: 1 ${cur.sym} = ${money(rate.rub, 4)} ₽` : 'курс не задан'}`}</Text>
      </Card>

      <Card tone="accent">
        <H3>Новый расход</H3>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Button title="Фото чека" icon="camera" onPress={() => snap('camera')} /></View>
          <View style={{ flex: 1 }}><Button title="Из галереи" kind="light" onPress={() => snap('library')} /></View>
        </View>
        {photo ? (
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Image source={{ uri: photo }} style={{ width: 54, height: 72, borderRadius: 6, backgroundColor: C.line2 }} />
            {stage ? <><ActivityIndicator color={C.blue} /><T muted>{stage}</T></> : <T muted>Чек сохранён — попадёт в PDF-отчёт</T>}
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="Сумма" placeholderTextColor={C.muted} accessibilityLabel={`Сумма, ${cur.code}`}
            style={[inputStyle, { flex: 1, minWidth: 0, fontSize: 22, fontFamily: F.bold }]} />
          <Text style={{ fontFamily: F.bold, fontSize: 22, color: C.muted }}>{cur.sym}</Text>
        </View>
        {n > 0 && rate.rub ? <T muted>{`≈ ${money(n * rate.rub)} ₽`}</T> : null}
        <Chips>{EXPENSE_CATS.map(([k, ru]) => <Pick key={k} title={ru} on={cat === k} onPress={() => setCat(k)} />)}</Chips>
        <Field value={note} onChangeText={setNote} placeholder="Что это: такси в аэропорт, ужин с партнёром, SIM-карта" />
        <Button title="Записать расход" onPress={save} />
        {!rate.rub ? <Button title="Задать курс в конвертере" kind="ghost" small onPress={() => router.push('/city')} /> : null}
      </Card>

      {list.length ? (
        <Card>
          <TitleRow title="Отчёт для бухгалтерии" right={<Chip tone="info">{`${list.length}`}</Chip>} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Button title="Excel" icon="doc" kind="light" onPress={toExcel} /></View>
            <View style={{ flex: 1 }}><Button title={busy ? 'Собираю…' : 'PDF с чеками'} icon="receipt" kind="light" onPress={() => { if (!busy) toPdf(); }} /></View>
          </View>
          <T muted>Дата, категория, сумма в валюте, курс ЦБ РФ и сумма в рублях; в PDF — ещё и снимки чеков.</T>
        </Card>
      ) : null}

      {list.length ? (
        <Card>
          <H3>Расходы поездки</H3>
          {list.map((e: Expense) => (
            <Row key={e.id}
              left={e.photo ? <Image source={{ uri: e.photo }} style={{ width: 36, height: 48, borderRadius: 4, backgroundColor: C.line2 }} /> : <Icon name="receipt" size={22} color={C.blueInk} />}
              title={`${money(e.amount)} ${e.sym} · ${catRu(e.cat)}`}
              sub={[new Date(e.at).toLocaleDateString('ru-RU'), e.note, e.rate ? `≈ ${money(rub(e), 0)} ₽` : 'без курса'].filter(Boolean).join(' · ')}
              right={
                <Pressable onPress={() => { if (armed !== e.id) { setArmed(e.id); return; } removeExpense(e.id); setArmed(null); }} accessibilityRole="button" accessibilityLabel={armed === e.id ? 'Точно удалить' : 'Удалить расход'} hitSlop={8} style={{ padding: 4 }}>
                  {armed === e.id ? <Text style={{ fontFamily: F.bold, fontSize: 12, color: C.warn }}>Удалить?</Text> : <Icon name="trash" size={18} color={C.muted} />}
                </Pressable>
              } />
          ))}
        </Card>
      ) : <T muted>Расходов пока нет. Сфотографируйте чек — сумма распознается сама, останется выбрать категорию.</T>}
    </Plain>
  );
}
