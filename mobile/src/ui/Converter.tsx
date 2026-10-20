// Конвертер юаней в «Городе»: сколько это в рублях и обратно. Курс ЦБ РФ обновляется, когда есть интернет,
// и запоминается; без сети — последний сохранённый (по умолчанию — курс ЦБ на 20.10.2026).
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { useStored } from '@/state/store';
import { Icon } from './Icon';
import { Card, Chip, H3, T, inputStyle } from './kit';
import { C, F } from './theme';

type Rate = { rub: number; date: string };
const DEFAULT_RATE: Rate = { rub: 12.3869, date: '20.10.2026' };
const QUICK = [10, 50, 100, 500, 1000];
const fmt = (n: number, d = 0) => n.toLocaleString('ru-RU', { minimumFractionDigits: d, maximumFractionDigits: d });

export function Converter() {
  const [rate, setRate] = useStored<Rate>('money.cny', DEFAULT_RATE);
  const [dir, setDir] = useState<'cny' | 'rub'>('cny');
  const [amount, setAmount] = useState('100');

  useEffect(() => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 5000);
    fetch('https://www.cbr-xml-daily.ru/daily_json.js', { signal: ctl.signal })
      .then((r) => r.json())
      .then((d) => {
        const c = d?.Valute?.CNY;
        if (c?.Value && c?.Nominal) setRate({ rub: c.Value / c.Nominal, date: new Date(d.Date).toLocaleDateString('ru-RU') });
      })
      .catch(() => { /* нет сети — остаётся сохранённый курс */ })
      .finally(() => clearTimeout(t));
    return () => { clearTimeout(t); ctl.abort(); };
  }, [setRate]);

  const n = Number(amount.replace(',', '.').replace(/[^\d.]/g, '')) || 0;
  const result = dir === 'cny' ? n * rate.rub : n / rate.rub;
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="yuan" size={22} color={C.blueInk} />
        <H3 style={{ flex: 1 }}>Сколько это в рублях</H3>
        <Pressable onPress={() => { setDir(dir === 'cny' ? 'rub' : 'cny'); setAmount(fmt(result, 0).replace(/\s/g, '')); }} accessibilityRole="button" accessibilityLabel="Поменять направление" style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: C.blueSoft }}>
          <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.blueInk }}>{dir === 'cny' ? '¥ → ₽' : '₽ → ¥'}</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" accessibilityLabel={dir === 'cny' ? 'Сумма в юанях' : 'Сумма в рублях'} style={[inputStyle, { flex: 1, minWidth: 0, width: '100%', fontSize: 22, fontFamily: F.bold }]} />
        <Text style={{ fontFamily: F.bold, fontSize: 22, color: C.muted }}>{dir === 'cny' ? '¥' : '₽'}</Text>
      </View>
      <Text style={{ fontFamily: F.display, fontSize: 40, lineHeight: 44, color: C.ink }} accessibilityLiveRegion="polite">
        {`≈ ${fmt(result, dir === 'cny' ? 0 : 1)} ${dir === 'cny' ? '₽' : '¥'}`}
      </Text>
      {dir === 'cny' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {QUICK.map((q) => (
            <Pressable key={q} onPress={() => setAmount(String(q))} accessibilityRole="button" accessibilityLabel={`${q} юаней`}>
              <Chip tone={n === q ? 'info' : 'plain'}>{`¥${q} ≈ ${fmt(q * rate.rub)} ₽`}</Chip>
            </Pressable>
          ))}
        </View>
      ) : null}
      <T muted>{`Курс ЦБ РФ на ${rate.date}: 1 ¥ = ${fmt(rate.rub, 2)} ₽. В обменнике и при оплате картой курс будет немного хуже.`}</T>
    </Card>
  );
}
