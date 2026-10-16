// «Мой профиль»: питание (несколько вариантов), аллергия — на что именно и насколько серьёзно, номер, здоровье, языки,
// интересы. Координатор видит профиль целиком («кто есть кто»), рестораны — сводку группы без имён (решение 16.10.2026).
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { ALLERGENS, DIET_OPTS, ENG, HEALTH_OPTS, INTERESTS, MESSENGERS, foodLine, healthGiven } from '@/data/profile';
import { DELEGATES, ME } from '@/data/trip';
import { useToast } from '@/state/toast';
import { useTrip } from '@/state/trip';
import { Icon } from '@/ui/Icon';
import { Avatar, Button, Card, Chips, H3, Pick, Plain, Row, Seg, T, initials } from '@/ui/kit';
import { C, F } from '@/ui/theme';

const input = { borderWidth: 1, borderColor: '#d5dbe6', borderRadius: 10, padding: 10, minHeight: 44, fontFamily: F.regular, fontSize: 14, color: C.ink } as const;
const toggle = (list: string[], x: string) => (list.includes(x) ? list.filter((y) => y !== x) : list.concat(x));

export default function ProfileScreen() {
  const { profile: p, editProfile, saveProfile } = useTrip();
  const toast = useToast();
  const [pickMate, setPickMate] = useState(false);
  const mate = DELEGATES.find((d) => d.id === p.mate);

  const pickDiet = (k: string) => {
    if (k === 'none') return editProfile({ diets: p.diets.includes('none') ? [] : ['none'] });
    editProfile({ diets: toggle(p.diets.filter((x) => x !== 'none'), k) });
  };
  const save = () => {
    if (!p.diets.length) return toast('Выберите питание — хотя бы «Без ограничений»');
    if (p.algOn && !p.alg.length && !p.algOther.trim()) return toast('Отметьте, на что аллергия');
    if (healthGiven(p) && !p.consent) return toast('Нужно согласие на обработку сведений о здоровье');
    saveProfile();
    toast('Профиль сохранён — координатор видит его');
    router.back();
  };

  return (
    <Plain>
      <Card>
        <Row left={<Avatar text={initials(ME.lat)} size={46} />} title={ME.ru} sub={`${ME.roleRu} · ${ME.coRu} · ${ME.cityRu}`} />
        <T muted>Профиль целиком видит координатор — так он сразу понимает, кто есть кто. Компании видят только имя, должность и компанию; рестораны — питание и аллергии группы без имён.</T>
      </Card>

      <Card>
        <H3>Питание</H3>
        <T muted>Можно выбрать несколько вариантов</T>
        <Chips>{DIET_OPTS.map(([k, l]) => <Pick key={k} title={l} on={p.diets.includes(k)} onPress={() => pickDiet(k)} />)}</Chips>
      </Card>

      <Card>
        <H3>Аллергия</H3>
        <Seg options={[['0', 'Нет'], ['1', 'Есть']] as const} value={p.algOn ? '1' : '0'} onChange={(v) => editProfile({ algOn: v === '1' })} />
        {p.algOn ? (
          <>
            <T muted>На что — отметьте всё</T>
            <Chips>{ALLERGENS.map(([k, l]) => <Pick key={k} title={l} on={p.alg.includes(k)} onPress={() => editProfile({ alg: toggle(p.alg, k) })} />)}</Chips>
            <TextInput value={p.algOther} onChangeText={(v) => editProfile({ algOther: v })} placeholder="Другое: например, киви, клубника" placeholderTextColor={C.muted} accessibilityLabel="Другая аллергия" style={input} />
            <T muted>Насколько серьёзно</T>
            <Seg options={[['0', 'Лёгкая'], ['1', 'Серьёзная, опасна для жизни']] as const} value={p.severe ? '1' : '0'} onChange={(v) => editProfile({ severe: v === '1' })} />
            {p.severe ? <Card tone="warn"><T>Координатор и гид будут знать; в ресторанах блюда для вас готовят отдельно. Лекарства возьмите с собой.</T></Card> : null}
            {p.alg.length || p.algOther.trim() ? <Button title="Карточка для официанта по-китайски" icon="translate" kind="light" onPress={() => router.push('/waiter')} /> : null}
          </>
        ) : null}
      </Card>

      <Card>
        <H3>Проживание</H3>
        <Seg options={[['single', 'Одноместный номер'], ['double', 'Двухместный']] as const} value={p.room} onChange={(v) => editProfile({ room: v })} />
        {p.room === 'double' ? (
          <>
            <Row title={mate ? `С кем: ${mate.ru}` : 'Соседа подберёт координатор'} right={<Button title={pickMate ? 'Готово' : 'Изменить'} kind="light" small onPress={() => setPickMate(!pickMate)} />} />
            {pickMate ? (
              <Chips>
                <Pick title="Подберите соседа" on={!p.mate} onPress={() => editProfile({ mate: '' })} />
                {DELEGATES.filter((d) => d.id !== ME.id).map((d) => <Pick key={d.id} title={d.ru} on={p.mate === d.id} onPress={() => editProfile({ mate: d.id })} />)}
              </Chips>
            ) : null}
          </>
        ) : null}
      </Card>

      <Card>
        <H3>Здоровье и особенности</H3>
        <T muted>Необязательно. Видит только координатор.</T>
        <Chips>{HEALTH_OPTS.map((h) => <Pick key={h} title={h} on={p.health.includes(h)} onPress={() => editProfile({ health: toggle(p.health, h) })} />)}</Chips>
        <TextInput value={p.healthNote} onChangeText={(v) => editProfile({ healthNote: v })} placeholder="Что ещё важно знать координатору" placeholderTextColor={C.muted} multiline accessibilityLabel="Что ещё важно знать координатору" style={input} />
      </Card>

      <Card>
        <H3>Связь и языки</H3>
        <T muted>Английский</T>
        <Seg options={ENG} value={p.eng} onChange={(v) => editProfile({ eng: v })} />
        <T muted>Где удобнее писать</T>
        <Seg options={MESSENGERS.map((m) => [m, m] as const)} value={p.msg} onChange={(v) => editProfile({ msg: v })} />
      </Card>

      <Card>
        <H3>Что важно увидеть в поездке</H3>
        <T muted>Координатор подберёт вопросы компаниям и знакомства в группе</T>
        <Chips>{INTERESTS.map((x) => <Pick key={x} title={x} on={p.interests.includes(x)} onPress={() => editProfile({ interests: toggle(p.interests, x) })} />)}</Chips>
      </Card>

      <Card>
        <Pressable onPress={() => editProfile({ consent: !p.consent })} accessibilityRole="checkbox" accessibilityState={{ checked: p.consent }} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: p.consent ? C.blue : '#c3cad6', backgroundColor: p.consent ? C.blue : C.card, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
            {p.consent ? <Icon name="check" size={14} color="#fff" /> : null}
          </View>
          <Text style={{ flex: 1, fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.ink }}>Согласен(на) на обработку сведений о здоровье (аллергия, особенности) для организации поездки</Text>
        </Pressable>
        <T muted>Нужно, если указаны аллергия или здоровье. Хранятся на сервере в России, удаляются через 30 дней после поездки.</T>
      </Card>

      {p.saved ? <T muted>Сейчас у координатора: {foodLine(p)}</T> : null}
      <Button title={p.saved ? 'Сохранить изменения' : 'Сохранить профиль'} onPress={save} />
    </Plain>
  );
}
