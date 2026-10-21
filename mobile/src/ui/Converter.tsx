// Конвертер местной валюты в рубли и обратно — для страны поездки. Курс ЦБ РФ обновляется, когда есть интернет,
// и запоминается; без сети — последний сохранённый (по умолчанию — курс ЦБ на 21.10.2026). Если ЦБ курс валюты
// не публикует (ринггит), курс обменника вписывают вручную.
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { countryOf, type Currency } from '@/data/countries';
import { TRIP } from '@/data/trip';
import { useStored } from '@/state/store';
import { Icon } from './Icon';
import { Card, Chip, H3, T, inputStyle } from './kit';
import { C, F } from './theme';

type Rate = { rub: number; date: string };
const fmt = (n: number, d = 0) => n.toLocaleString('ru-RU', { minimumFractionDigits: d, maximumFractionDigits: d });

export function Converter({ currency = countryOf(TRIP.country).currency }: { currency?: Currency }) {
  const cur = currency;
  const [rate, setRate] = useStored<Rate>(`money.${cur.code}`, { rub: cur.rub || 0, date: cur.rub ? '21.10.2026' : '' });
  const [dir, setDir] = useState<'local' | 'rub'>('local');
  const [amount, setAmount] = useState(String(cur.quick[2] ?? 100));
  const [manual, setManual] = useState(rate.rub ? String(rate.rub).replace('.', ',') : '');

  useEffect(() => {
    if (!cur.cbr) return;
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 5000);
    fetch('https://www.cbr-xml-daily.ru/daily_json.js', { signal: ctl.signal })
      .then((r) => r.json())
      .then((d) => {
        const c = d?.Valute?.[cur.code];
        if (c?.Value && c?.Nominal) setRate({ rub: c.Value / c.Nominal, date: new Date(d.Date).toLocaleDateString('ru-RU') });
      })
      .catch(() => { /* нет сети — остаётся сохранённый курс */ })
      .finally(() => clearTimeout(t));
    return () => { clearTimeout(t); ctl.abort(); };
  }, [cur.cbr, cur.code, setRate]);

  const n = Number(amount.replace(',', '.').replace(/[^\d.]/g, '')) || 0;
  const result = rate.rub ? (dir === 'local' ? n * rate.rub : n / rate.rub) : 0;
  // небольшие суммы — с копейками (100 донгов ≈ 0,32 ₽), крупные — целыми
  const outDigits = result < 10 ? 2 : result < 100 ? 1 : 0;
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="yuan" size={22} color={C.blueInk} />
        <H3 style={{ flex: 1 }}>{`${cur.ru[0].toUpperCase()}${cur.ru.slice(1)} в рубли`}</H3>
        <Pressable onPress={() => { setDir(dir === 'local' ? 'rub' : 'local'); setAmount(fmt(result, 0).replace(/\s/g, '')); }} accessibilityRole="button" accessibilityLabel="Поменять направление" style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: C.blueSoft }}>
          <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.blueInk }}>{dir === 'local' ? `${cur.sym} → ₽` : `₽ → ${cur.sym}`}</Text>
        </Pressable>
      </View>
      {!cur.cbr ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: F.medium, fontSize: 13.5, color: C.ink }}>{`Курс: 1 ${cur.sym} =`}</Text>
          <TextInput value={manual} onChangeText={(v) => { setManual(v); const r = Number(v.replace(',', '.')); if (r > 0) setRate({ rub: r, date: 'вручную' }); }} keyboardType="decimal-pad" placeholder="курс обменника" placeholderTextColor={C.muted}
            accessibilityLabel={`Курс ${cur.code} в рублях`} style={[inputStyle, { flex: 1, minWidth: 0 }]} />
          <Text style={{ fontFamily: F.medium, fontSize: 13.5, color: C.ink }}>₽</Text>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" accessibilityLabel={dir === 'local' ? `Сумма, ${cur.code}` : 'Сумма в рублях'} style={[inputStyle, { flex: 1, minWidth: 0, width: '100%', fontSize: 22, fontFamily: F.bold }]} />
        <Text style={{ fontFamily: F.bold, fontSize: 22, color: C.muted }}>{dir === 'local' ? cur.sym : '₽'}</Text>
      </View>
      <Text style={{ fontFamily: F.display, fontSize: 40, lineHeight: 44, color: C.ink }} accessibilityLiveRegion="polite">
        {rate.rub ? `≈ ${fmt(result, outDigits)} ${dir === 'local' ? '₽' : cur.sym}` : 'Впишите курс'}
      </Text>
      {dir === 'local' && rate.rub ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {cur.quick.map((q) => (
            <Pressable key={q} onPress={() => setAmount(String(q))} accessibilityRole="button" accessibilityLabel={`${q} ${cur.code}`}>
              <Chip tone={n === q ? 'info' : 'plain'}>{`${cur.sym}${fmt(q)} ≈ ${fmt(q * rate.rub)} ₽`}</Chip>
            </Pressable>
          ))}
        </View>
      ) : null}
      <T muted>{cur.cbr
        ? `Курс ЦБ РФ на ${rate.date}: 1 ${cur.sym} = ${fmt(rate.rub, rate.rub < 1 ? 4 : 2)} ₽. В обменнике и при оплате картой курс будет немного хуже.`
        : `ЦБ РФ не публикует курс этой валюты — впишите курс обменника, он запомнится.`}</T>
    </Card>
  );
}
