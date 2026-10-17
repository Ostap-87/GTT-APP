// «Материалы» агента: презентации без цен, ролики для соцсетей, условия сотрудничества, связь с координатором.
import { DEPS, tourById } from '@/data/agent';
import { useToast } from '@/state/toast';
import { AgentScreen, AgentTerms } from '@/ui/agent-ui';
import { Avatar, Button, Card, Chip, H3, Row, T, TitleRow } from '@/ui/kit';

const REELS: [string, string][] = [['Автопром и электромобили Китая', '1:48'], ['Чай и кофе Китая', '1:31'], ['Косметика и anti-age', '1:35']];

export default function AgentKit() {
  const toast = useToast();
  const pres = DEPS.slice(1, 6).map((d) => tourById[d.tour]);
  return (
    <AgentScreen title="Материалы">
      <Card>
        <TitleRow title="Презентации для клиентов" right={<Chip tone="info">76</Chip>} />
        {pres.map((t) => <Row key={t.id} title={t.title} sub="PDF · без цен · можно отправлять клиенту" right={<Button title="" icon="down" kind="ghost" small label={`Скачать презентацию: ${t.title}`} onPress={() => toast('Презентация скачана · PDF без цен')} />} />)}
        <T muted>Презентация есть у каждой программы — кнопка в её карточке в «Каталоге».</T>
      </Card>
      <Card>
        <H3>Ролики и фото для ваших соцсетей</H3>
        {REELS.map(([n, d]) => <Row key={n} title={n} sub={`Reels · ${d}`} right={<Button title="" icon="down" kind="ghost" small label={`Скачать ролик: ${n}`} onPress={() => toast(`Ролик «${n}» скачан`)} />} />)}
        <T muted>Правила использования и отметка GTT — [уточнить].</T>
      </Card>
      <Card>
        <H3>Условия сотрудничества</H3>
        <AgentTerms />
        <T muted>Поля подготовлены: стоимость и комиссию для агентов координатор укажет позже. Договор — [уточнить].</T>
      </Card>
      <Card>
        <Row left={<Avatar text="ОД" />} title="Остап Доценко" sub="Координатор · заявки агентов" right={<Button title="Написать" kind="light" small onPress={() => toast('Открываем чат с координатором в Telegram')} />} />
      </Card>
    </AgentScreen>
  );
}
