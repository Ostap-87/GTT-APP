// Сканер визиток: фото → распознавание китайского и английского текста на телефоне → поля с переводом → сохранение
// к визиту. Без интернета в первый раз распознавание не скачается — тогда поля заполняются вручную, фото сохраняется.
// Снимок визитки хранится вместе с контактом и прикреплён к компании визита (её можно поменять); «В контакты телефона» —
// файл vCard.
import { SaveFormat, ImageManipulator } from 'expo-image-manipulator';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';

import { emptyCard, nameLatin, parseCard, translateCompany, translateTitle, type BizCard } from '@/data/card';
import { VISITS } from '@/data/group';
import { keepFile } from '@/data/media';
import { ocrStage, type OcrEvent } from '@/ocr/ocr-html';
import { useToast } from '@/state/toast';
import { useVisits } from '@/state/visits';
import { shareCard } from '@/ui/card-ui';
import { Button, Card, Chips, Field, H3, Pick, Plain, T } from '@/ui/kit';
import { pickPhoto } from '@/ui/notes-ui';
import { OcrEngine } from '@/ui/OcrEngine';
import { C, F } from '@/ui/theme';

const HAN = /\p{Script=Han}/u;

export default function CardScan() {
  const { visit = 'jd', id } = useLocalSearchParams<{ visit?: string; id?: string }>();
  const { cards, saveCard, removeCard } = useVisits();
  const toast = useToast();
  const existing = id ? cards.find((c) => c.id === id) : undefined;
  const [card, setCard] = useState<BizCard>(existing || emptyCard(visit));
  const [job, setJob] = useState<{ id: number; image: string } | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const v = VISITS.find((x) => x.id === card.visit);
  const set = (patch: Partial<BizCard>) => setCard((c) => ({ ...c, ...patch }));

  const shoot = async (from: 'camera' | 'library') => {
    try {
      const p = await pickPhoto(from);
      if (!p) return;
      // уменьшаем до 1600 px: распознаётся быстрее, а текст визитки читается так же хорошо
      const ctx = ImageManipulator.manipulate(p.uri).resize({ width: 1600 });
      const img = await (await ctx.renderAsync()).saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: true });
      set({ photo: await keepFile(img.uri, 'jpg') });
      setStage('Готовлю распознавание…');
      setJob({ id: Date.now(), image: `data:image/jpeg;base64,${img.base64}` });
    } catch {
      toast('Не получилось открыть фото');
    }
  };

  const onOcr = (e: OcrEvent) => {
    if (e.type === 'progress') setStage(ocrStage(e.status, e.p));
    if (e.type === 'error') {
      setStage(null);
      toast('Распознать не вышло — нужен интернет в первый раз. Заполните поля вручную, фото сохранено');
    }
    if (e.type === 'result') {
      setStage(null);
      const parsed = parseCard(e.text, e.lines);
      setCard((c) => ({ ...c, ...parsed }));
      toast(parsed.name || parsed.company ? 'Визитка распознана — проверьте поля' : 'Текст почти не читается — переснимите ближе или заполните вручную');
    }
  };

  const save = () => {
    if (!card.name && !card.latin && !card.company && !card.phones.length) return toast('Заполните хотя бы имя, компанию или телефон');
    saveCard(card);
    toast(existing ? 'Визитка обновлена' : `Визитка сохранена к визиту ${v?.name || ''}`);
    router.back();
  };

  return (
    <Plain>
      <OcrEngine job={job} onEvent={onOcr} />
      <Card>
        <H3>{existing ? 'Визитка' : `Новая визитка · ${v?.name || ''}`}</H3>
        {card.photo ? <Image source={{ uri: card.photo }} style={{ width: '100%', aspectRatio: 1.75, borderRadius: 12, backgroundColor: C.line2 }} resizeMode="contain" /> : null}
        {stage ? (
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <ActivityIndicator color={C.blue} />
            <Text style={{ flex: 1, fontFamily: F.medium, fontSize: 13.5, color: C.ink }}>{stage}</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Button title={card.photo ? 'Переснять' : 'Сфотографировать'} icon="camera" onPress={() => shoot('camera')} /></View>
          <View style={{ flex: 1 }}><Button title="Из галереи" kind="light" onPress={() => shoot('library')} /></View>
        </View>
        {!card.photo ? <T muted>Положите визитку на ровный стол, снимайте сверху при хорошем свете. Если визитка двусторонняя — снимите сторону с иероглифами.</T> : null}
      </Card>

      <Card>
        <H3>Контакт</H3>
        <Field label="Имя (иероглифами)" value={card.name} onChangeText={(t) => set({ name: t, latin: HAN.test(t) ? nameLatin(t) : card.latin })} placeholder="王小明" />
        <Field label="Имя латиницей" value={card.latin} onChangeText={(t) => set({ latin: t })} placeholder="Wang Xiaoming" />
        <Field label="Должность" value={card.title} onChangeText={(t) => set({ title: t, titleRu: HAN.test(t) ? translateTitle(t) : card.titleRu })} />
        <Field label="Должность по-русски" value={card.titleRu} onChangeText={(t) => set({ titleRu: t })} />
        <Field label="Компания" value={card.company} onChangeText={(t) => set({ company: t, companyRu: HAN.test(t) ? translateCompany(t) : card.companyRu })} />
        <Field label="Компания по-русски" value={card.companyRu} onChangeText={(t) => set({ companyRu: t })} />
        <Field label="Телефоны (через запятую)" value={card.phones.join(', ')} onChangeText={(t) => set({ phones: t.split(',').map((x) => x.trim()).filter(Boolean) })} keyboardType="phone-pad" />
        <Field label="Email" value={card.email} onChangeText={(t) => set({ email: t })} keyboardType="email-address" />
        <Field label="WeChat" value={card.wechat} onChangeText={(t) => set({ wechat: t })} />
        <Field label="Сайт" value={card.site} onChangeText={(t) => set({ site: t })} />
        <Field label="Адрес" value={card.address} onChangeText={(t) => set({ address: t })} multiline />
        <T muted>Перевод — по встроенному словарю деловых слов, без интернета; незнакомые части названия — латиницей. Поправьте, если нужно.</T>
        {card.raw ? (
          <>
            <Button title={showRaw ? 'Скрыть распознанный текст' : 'Показать распознанный текст'} kind="ghost" small onPress={() => setShowRaw(!showRaw)} />
            {showRaw ? <T muted>{card.raw}</T> : null}
          </>
        ) : null}
      </Card>

      <Card>
        <H3>Компания</H3>
        <T muted>Визитка прикреплена к визиту — её видно в карточке компании, в «Визитнице» и в итогах поездки.</T>
        <Chips>{VISITS.map((x) => <Pick key={x.id} title={x.name} on={card.visit === x.id} onPress={() => set({ visit: x.id })} />)}</Chips>
      </Card>

      <Button title={existing ? 'Сохранить изменения' : 'Сохранить визитку'} onPress={save} />
      {card.name || card.latin || card.phones.length ? (
        <Button title="В контакты телефона" icon="people" kind="light" onPress={() => { shareCard(card).then((ok) => { if (!ok) toast('На этом устройстве поделиться нельзя'); }).catch(() => toast('Не получилось подготовить контакт')); }} />
      ) : null}
      {existing ? <Button title="Удалить визитку" kind="ghost" onPress={() => { removeCard(existing.id); toast('Визитка удалена'); router.back(); }} /> : null}
    </Plain>
  );
}
