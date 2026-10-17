// Визит компании глазами координатора: время и статус, что компания видит в мини-программе WeChat (гости без телефонов,
// вопросы на китайском), её предложения по времени и материалы, QR-код приглашения.
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { BASE_Q, qrXml } from '@/data/extras';
import { byId, VISITS } from '@/data/group';
import { useCoord } from '@/state/coord';
import { useToast } from '@/state/toast';
import { Button, Card, Chip, H3, Plain, Row, T } from '@/ui/kit';
import { C, F } from '@/ui/theme';

export default function Visit() {
  const { id = 'jd' } = useLocalSearchParams<{ id: string }>();
  const k = useCoord();
  const toast = useToast();
  const [qr, setQr] = useState(false);
  const [matOpen, setMatOpen] = useState(false);
  const v = VISITS.find((x) => x.id === id) || VISITS[0];
  const isJd = v.id === 'jd';
  const hema = v.id === 'hema';
  const pdd = v.id === 'pdd';
  const st: ['ok' | 'warn' | 'info', string] = hema ? (k.hema === 'accepted' ? ['ok', 'перенос согласован'] : k.hema === 'discuss' ? ['info', 'обсуждаем'] : ['warn', 'предлагает 14:00'])
    : pdd ? (k.pddReminded ? ['info', 'напомнили'] : ['warn', 'ссылку не открыли']) : v.st;
  const when = hema && k.hema === 'accepted' ? 'Ср 11 · 14:00' : v.when;
  return (
    <Plain>
      <Card>
        <Text style={{ fontFamily: F.display, fontSize: 34, lineHeight: 36, color: C.ink, textTransform: 'uppercase' }}>{v.name}</Text>
        <Row title="Когда" right={<T>{when}</T>} />
        <Row title="Статус" right={<Chip tone={st[0]}>{st[1]}</Chip>} />
        <Row title="Ссылка визита" right={<T>{pdd && !k.pddReminded ? 'не открывали' : isJd ? 'открывали 6 раз · вчера' : 'открыта'}</T>} />
      </Card>

      {hema && k.hema === 'pending' ? (
        <Card tone="warn">
          <T bold>Hema предлагает 14:00 вместо 13:30</T>
          <T muted>Ср, 11 ноября · написали на странице визита</T>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Button title="Принять и сообщить группе" small onPress={() => { k.setHema('accepted'); toast('Принято: делегаты и автобус узнают о 14:00'); }} />
            <Button title="Обсудить" kind="ghost" small onPress={() => { k.setHema('discuss'); toast('Откроется чат с Hema в мини-программе'); }} />
          </View>
        </Card>
      ) : null}
      {pdd && !k.pddReminded ? (
        <Card tone="warn">
          <T bold>Pinduoduo не открыла ссылку визита · 3 дня</T>
          <Button title="Напомнить в WeChat" small onPress={() => { k.remindPdd(); toast('Pinduoduo получит напоминание в WeChat'); }} />
        </Card>
      ) : null}

      <Card>
        <H3>Что видит компания</H3>
        <T>18 гостей: имя, должность, компания. Телефонов нет — контакты передаются только с согласия делегата.</T>
        <T>{`Вопросы делегации на китайском: ${isJd ? BASE_Q.length : 'пока нет'}`}</T>
        {isJd ? BASE_Q.slice(0, 3).map((q) => <Row key={q.zh} title={q.zh} sub={`${q.ru} · ${byId[q.by].ru}`} />) : null}
        {isJd ? <T muted>{`И ещё ${BASE_Q.length - 3} вопроса — компания видит их в мини-программе.`}</T> : null}
      </Card>

      {isJd ? (
        <Card>
          <H3>Материалы компании</H3>
          <Row title="京东公司介绍.pdf" sub="12 МБ · делегаты увидят после вашей проверки" right={matOpen ? <Chip tone="ok">открыто делегатам</Chip> : <Button title="Открыть делегатам" small onPress={() => { setMatOpen(true); toast('Делегаты видят презентацию JD.com в «Материалах»'); }} />} />
        </Card>
      ) : null}

      <Card>
        <H3>Приглашение компании</H3>
        <T muted>Менеджер компании сканирует QR-код в WeChat и сразу видит страницу своего визита — ничего не нужно ставить.</T>
        {qr ? <View style={{ alignSelf: 'center', width: 200, height: 200 }}><SvgXml xml={qrXml()} width="100%" height="100%" /></View> : null}
        <Button title={qr ? 'Скрыть QR-код' : 'Показать QR-код приглашения'} kind="light" onPress={() => setQr(!qr)} />
        <T muted>QR-код здесь — образец; настоящий выдаёт WeChat, когда подключим аккаунт мини-программы.</T>
      </Card>
    </Plain>
  );
}
