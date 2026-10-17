// «Смотреть как…»: координатор видит приложение глазами делегата, компании или агента (правило доступа — CLAUDE.md).
import { router } from 'expo-router';

import { AGENCY } from '@/data/agent';
import { ME } from '@/data/trip';
import { useCoord } from '@/state/coord';
import { useToast } from '@/state/toast';
import { Avatar, Card, Plain, Row, T, initials } from '@/ui/kit';

export default function ViewAs() {
  const { setViewing } = useCoord();
  const toast = useToast();
  const go = (path: '/trip' | '/agent') => { setViewing(true); router.dismissAll(); router.replace(path); };
  return (
    <Plain>
      <T muted>Вы видите ровно то, что видит этот человек; вернуться — кнопка «Пульт координатора».</T>
      <Card>
        <Row left={<Avatar text={initials(ME.lat)} />} title={`Делегат · ${ME.ru}`} sub="Сегодня, план, материалы, люди, анкета профиля" onPress={() => go('/trip')} label="Смотреть как делегат" />
        <Row left={<Avatar text="ИМ" />} title={`Агент · ${AGENCY}`} sub="Каталог, выезды и места, расчёт, свои заявки" onPress={() => go('/agent')} label="Смотреть как агент" />
        <Row left={<Avatar text="JD" />} title="Компания · JD.com" sub="Мини-программа WeChat: визит, делегация без телефонов, вопросы на китайском"
          onPress={() => toast('Компания работает в мини-программе WeChat — её экраны в прототипе и в miniprogram/')} label="Смотреть как компания" />
      </Card>
      <Card>
        <Row title="Стартовый экран" sub="Выйти и войти другой ролью (в демо)" onPress={() => { setViewing(false); router.dismissAll(); router.replace('/'); }} label="Выйти на стартовый экран" />
      </Card>
    </Plain>
  );
}
