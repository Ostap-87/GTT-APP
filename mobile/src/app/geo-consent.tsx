// «Геопозиция для координатора» (решение пользователя 27.10.2026: «только с отдельного согласия участника, это персональные
// данные»). По умолчанию выключено. Что видит координатор, когда и сколько хранится — здесь же, до включения.
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import { Switch, View } from 'react-native';

import { GEO_CONNECTED, LAG_M, distText } from '@/data/live-geo';
import { TRIP } from '@/data/trip';
import { useGeo } from '@/state/geo';
import { useToast } from '@/state/toast';
import { Icon } from '@/ui/Icon';
import { Button, Card, H3, Plain, Row, T } from '@/ui/kit';
import { C } from '@/ui/theme';

const RULES: [string, string][] = [
  ['Кто видит', 'Только координатор вашей поездки. Другие участники и компании — нет.'],
  ['Когда', 'Только в дни поездки и пока приложение открыто. Фоновой слежки нет.'],
  ['Что именно', 'Последняя точка — без истории перемещений. Координатор видит, если вы дальше 300 м от группы.'],
  ['Сколько хранится', 'Выключили согласие или поездка закончилась — точка удаляется.'],
  ['SOS', 'Кнопка SOS отправляет точку и без этого согласия — только по вашему нажатию.'],
];

export default function GeoConsent() {
  const g = useGeo();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const turn = async (on: boolean) => {
    if (!on) { g.setConsent(false); toast('Выключено: последняя точка удалена'); return; }
    setBusy(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) { toast('Разрешите геопозицию для приложения в настройках телефона'); return; }
      g.setConsent(true);
      toast('Включено: координатор видит вашу последнюю точку');
    } catch {
      toast('Не удалось включить геопозицию на этом устройстве');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Plain>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon name="locate" size={26} color={g.consent.on ? C.ok : C.muted} />
          <View style={{ flex: 1, gap: 2 }}>
            <H3>Показывать координатору, где я</H3>
            <T muted>{g.consent.on ? `Включено ${g.consent.at || ''}` : 'Выключено'}</T>
          </View>
          <Switch value={g.consent.on} disabled={busy} onValueChange={turn} accessibilityLabel="Согласие: показывать координатору мою геопозицию"
            trackColor={{ true: C.green, false: C.line }} thumbColor="#ffffff" />
        </View>
        <T muted>{`Зачем: если вы отстали от группы больше чем на ${distText(LAG_M)} или потерялись в незнакомом городе, координатор увидит это сам и позвонит.`}</T>
        {g.consent.on && g.myFix ? <T muted>{`Последняя точка: ${new Date(g.myFix.at).toTimeString().slice(0, 5)}, точность ±${Math.round(g.myFix.acc || 0)} м`}</T> : null}
      </Card>
      <Card>
        {RULES.map(([t, s], i) => <Row key={t} first={i === 0} title={t} sub={s} />)}
      </Card>
      {!GEO_CONNECTED ? (
        <Card tone="info">
          <T bold>Сервер ещё не подключён</T>
          <T muted>Это заготовка: точки никуда не отправляются. Когда появится сервер в России, координатор будет видеть их на карте группы.</T>
        </Card>
      ) : null}
      <Button title="Кнопка SOS и помощь" kind="light" icon="help" onPress={() => router.push('/help')} />
      <T muted>{`Поездка: ${TRIP.title}. Согласие можно выключить в любой момент — здесь или на экране «Помощь».`}</T>
    </Plain>
  );
}
