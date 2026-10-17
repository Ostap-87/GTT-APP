// «Мой профиль»: питание (несколько вариантов), аллергия — на что именно и насколько серьёзно, номер, здоровье, языки,
// интересы. Координатор видит профиль целиком («кто есть кто»), рестораны — сводку группы без имён (решение 16.10.2026).
// Первый раз — анкета из 4 шагов по очереди, потом — всё на одном экране; профиль можно сохранить для следующих поездок.
import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { ALLERGENS, DIET_OPTS, ENG, HEALTH_OPTS, INTERESTS, MESSENGERS, PSTEPS, algGiven, foodLine, healthOnlyGiven } from '@/data/profile';
import { DELEGATES, ME } from '@/data/trip';
import { useToast } from '@/state/toast';
import { useTrip } from '@/state/trip';
import { Avatar, Button, Card, Check, Chips, H3, Pick, Plain, Row, Seg, T, initials, inputStyle as input } from '@/ui/kit';
import { C, F } from '@/ui/theme';

const toggle = (list: string[], x: string) => (list.includes(x) ? list.filter((y) => y !== x) : list.concat(x));

export default function ProfileScreen() {
  const { profile: p, editProfile, saveProfile, pStep: step, setPStep } = useTrip();
  const toast = useToast();
  const [pickMate, setPickMate] = useState(false);
  const mate = DELEGATES.find((d) => d.id === p.mate);
  const consentNeeded = algGiven(p) || healthOnlyGiven(p);

  const pickDiet = (k: string) => {
    if (k === 'none') return editProfile({ diets: p.diets.includes('none') ? [] : ['none'] });
    editProfile({ diets: toggle(p.diets.filter((x) => x !== 'none'), k) });
  };
  /** Проверка питания и аллергии — и на шаге 2 анкеты, и при сохранении. Возвращает текст ошибки. */
  const foodError = () => {
    if (!p.diets.length) return 'Выберите питание — хотя бы «Без ограничений»';
    if (p.algOn && !p.alg.length && !p.algOther.trim()) return 'Отметьте, на что аллергия';
    if (algGiven(p) && !p.consent) return 'Нужно согласие на обработку сведений о здоровье';
    return '';
  };
  const next = () => {
    const err = step === 1 ? foodError() : step === 2 && healthOnlyGiven(p) && !p.consent ? 'Нужно согласие на обработку сведений о здоровье' : '';
    if (err) return toast(err);
    setPStep(Math.min(3, step + 1));
  };
  const save = () => {
    const err = foodError() || (consentNeeded && !p.consent ? 'Нужно согласие на обработку сведений о здоровье' : '');
    if (err) return toast(err);
    saveProfile();
    toast(p.saved ? 'Изменения сохранены — координатор их видит' : 'Профиль сохранён — координатор видит его');
    router.back();
  };

  const about = (
    <Card>
      <Row left={<Avatar text={initials(ME.lat)} size={46} />} title={ME.ru} sub={`${ME.roleRu} · ${ME.coRu} · ${ME.cityRu}`} />
      <T muted>{p.saved
        ? 'Профиль целиком видит координатор — так он сразу понимает, кто есть кто. Компании видят только имя, должность и компанию; рестораны — питание и аллергии группы без имён.'
        : 'Данные из вашей заявки. Если что-то не так — напишите координатору.'}</T>
    </Card>
  );

  const contact = (
    <Card>
      <H3>Связь и языки</H3>
      <T muted>Английский</T>
      <Seg options={ENG} value={p.eng} onChange={(v) => editProfile({ eng: v })} />
      <T muted>Где удобнее писать</T>
      <Seg options={MESSENGERS.map((m) => [m, m] as const)} value={p.msg} onChange={(v) => editProfile({ msg: v })} />
    </Card>
  );

  const food = (
    <>
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
            {p.severe ? <Card tone="warn"><T>Координатор, гид и переводчик будут знать; в ресторанах блюда для вас готовят отдельно. Лекарства возьмите с собой.</T></Card> : null}
            {algGiven(p) ? <Button title="Карточка для официанта по-китайски" icon="translate" kind="light" onPress={() => router.push('/waiter')} /> : null}
          </>
        ) : null}
      </Card>
    </>
  );

  const room = (
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
  );

  const health = (
    <Card>
      <H3>Здоровье и особенности</H3>
      <T muted>Необязательно. Видит только координатор.</T>
      <Chips>{HEALTH_OPTS.map((h) => <Pick key={h} title={h} on={p.health.includes(h)} onPress={() => editProfile({ health: toggle(p.health, h) })} />)}</Chips>
      <TextInput value={p.healthNote} onChangeText={(v) => editProfile({ healthNote: v })} placeholder="Что ещё важно знать координатору" placeholderTextColor={C.muted} multiline accessibilityLabel="Что ещё важно знать координатору" style={input} />
    </Card>
  );

  const goals = (
    <Card>
      <H3>Что важно увидеть в поездке</H3>
      <T muted>Координатор подберёт вопросы компаниям и знакомства в группе</T>
      <Chips>{INTERESTS.map((x) => <Pick key={x} title={x} on={p.interests.includes(x)} onPress={() => editProfile({ interests: toggle(p.interests, x) })} />)}</Chips>
    </Card>
  );

  const consent = (
    <Card>
      <Check on={p.consent} onPress={() => editProfile({ consent: !p.consent })}>Согласен(на) на обработку сведений о здоровье (аллергия, особенности) для организации поездки</Check>
      <T muted>Нужно, если указаны аллергия или здоровье. Хранятся на сервере в России.</T>
    </Card>
  );

  const keep = (
    <Card>
      <Check on={p.keep} onPress={() => editProfile({ keep: !p.keep })}>Сохранить профиль для следующих поездок</Check>
      <T muted>В следующий раз анкета уже будет заполнена — останется подтвердить. Без галочки сведения о здоровье удаляются через 30 дней после поездки. Отменить можно в любой момент.</T>
    </Card>
  );

  // Первый раз — анкета по шагам; key у Plain возвращает экран к началу на каждом шаге.
  if (!p.saved) {
    const steps = [
      <>{about}{contact}</>,
      <>{food}{algGiven(p) ? consent : null}</>,
      <>{room}{health}{healthOnlyGiven(p) ? consent : null}</>,
      <>{goals}{keep}</>,
    ];
    return (
      <Plain key={step}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <H3 style={{ flex: 1 }}>{`Шаг ${step + 1} из 4 · ${PSTEPS[step]}`}</H3>
            <T muted>≈ 3 мин</T>
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: C.line2, overflow: 'hidden' }}>
            <View style={{ width: `${(step + 1) * 25}%`, height: 6, borderRadius: 3, backgroundColor: C.blue }} />
          </View>
          <T muted>Можно прерваться — ответы сохраняются. Срок — до 26 октября.</T>
        </Card>
        {steps[step]}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {step ? <View style={{ flex: 1 }}><Button title="Назад" kind="ghost" onPress={() => setPStep(step - 1)} /></View> : null}
          <View style={{ flex: 2 }}>{step < 3 ? <Button title="Далее" onPress={next} /> : <Button title="Готово — сохранить" onPress={save} />}</View>
        </View>
      </Plain>
    );
  }

  return (
    <Plain>
      {about}
      {food}
      {room}
      {health}
      {contact}
      {goals}
      {consent}
      {keep}
      <T muted>Сейчас у координатора: {foodLine(p)}</T>
      <Button title="Сохранить изменения" onPress={save} />
    </Plain>
  );
}
