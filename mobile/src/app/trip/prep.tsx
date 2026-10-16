// «Поездка»: подготовка до выезда — документы, интересы, памятка, предпочтения в еде; после поездки — отзыв (шаг 2).
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CHECKLIST, DIETS, ME } from '@/data/trip';
import { useToast } from '@/state/toast';
import { useTrip } from '@/state/trip';
import { Icon } from '@/ui/Icon';
import { Card, Chips, H3, Pick, Screen, T, TitleRow } from '@/ui/kit';
import { C, F } from '@/ui/theme';

export default function Prep() {
  const { done, toggle, diet, setDiet } = useTrip();
  const toast = useToast();
  const [stage, setStage] = useState<'before' | 'during' | 'after'>('before');
  const count = CHECKLIST.filter((c) => done[c.key]).length;
  return (
    <Screen eyebrow={`${ME.ru} · делегат`} title="Моя поездка">
      <View style={{ flexDirection: 'row', backgroundColor: C.line2, borderRadius: 10, padding: 3 }}>
        {([['before', 'До'], ['during', 'В поездке'], ['after', 'После']] as const).map(([k, l]) => (
          <Pressable key={k} onPress={() => setStage(k)} accessibilityRole="button" accessibilityState={{ selected: stage === k }}
            style={{ flex: 1, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: stage === k ? C.card : 'transparent' }}>
            <Text style={{ fontFamily: stage === k ? F.bold : F.medium, fontSize: 13, color: C.ink }}>{l}</Text>
          </Pressable>
        ))}
      </View>
      {stage === 'before' ? (
        <>
          <Card>
            <TitleRow title={`Подготовка · ${count} из ${CHECKLIST.length}`} />
            <View style={{ height: 8, borderRadius: 4, backgroundColor: C.line2, overflow: 'hidden' }}>
              <View style={{ width: `${(count / CHECKLIST.length) * 100}%`, height: '100%', backgroundColor: C.green }} />
            </View>
            {CHECKLIST.map((c) => {
              const on = !!done[c.key];
              const sub = c.key === 'diet' && diet ? `Указано: ${diet}` : c.sub;
              return (
                <Pressable key={c.key} onPress={() => (c.key === 'diet' ? null : toggle(c.key))} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                  style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.line2 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: on ? C.green : '#c3cad6', backgroundColor: on ? C.green : C.card, alignItems: 'center', justifyContent: 'center' }}>
                    {on ? <Icon name="check" size={14} color="#fff" /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.ink }}>{c.title}</Text>
                    <Text style={{ fontFamily: F.regular, fontSize: 12.5, color: C.muted }}>{sub}</Text>
                  </View>
                </Pressable>
              );
            })}
          </Card>
          <Card>
            <H3>Предпочтения в еде</H3>
            <T muted>Координатор передаст их в забронированные рестораны.</T>
            <Chips>
              {DIETS.map((x) => <Pick key={x} title={x} on={diet === x} onPress={() => { setDiet(x); toast('Координатор учтёт в ресторанах'); }} />)}
            </Chips>
          </Card>
        </>
      ) : stage === 'during' ? (
        <Card>
          <H3>В поездке</H3>
          <T>Главное — на вкладке «Сегодня»: выезд, «Я в автобусе», адрес для такси по-китайски, план дня и связь с координатором.</T>
          <T muted>Переводчик, радиогид и раздел «Город» появятся на следующих шагах — они уже есть в кликабельном прототипе.</T>
        </Card>
      ) : (
        <Card>
          <H3>После поездки</H3>
          <T>Фото и видео, итоговый отчёт, «Хочу продолжить» с компаниями и отзыв текстом или видео откроются после возвращения.</T>
          <T muted>В шаге 1 этот раздел показан как заглушка.</T>
        </Card>
      )}
    </Screen>
  );
}
