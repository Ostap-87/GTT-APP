// Кнопки «Отзывы · Dianping» и «Доставка · Meituan»: китайское название — в буфер обмена, затем поиск в приложении.
// Используются в «Аптеках», «Фруктовых лавках», «Рядом с вами» и в карточке адреса (рестораны, места, отели).
import * as Clipboard from 'expo-clipboard';
import { Text, View } from 'react-native';

import { CN_APPS, openInApp, type CnApp } from '@/data/apps';
import { fill, t, tr, type Lang } from '@/data/lang';
import { useToast } from '@/state/toast';
import { Button } from './kit';
import { C, F } from './theme';

const OA = {
  dianping: t('Отзывы · Dianping', 'Reviews · Dianping', 'Пікірлер · Dianping', 'Sharhlar · Dianping'),
  meituan: t('Доставка · Meituan', 'Delivery · Meituan', 'Жеткізу · Meituan', 'Yetkazish · Meituan'),
  copied: t(
    '«{q}» скопировано. Если поиск не открылся — вставьте название в поиск {app}.',
    '“{q}” copied. If the search did not open, paste it into {app} search.',
    '«{q}» көшірілді. Іздеу ашылмаса — атауды {app} іздеуіне қойыңыз.',
    '“{q}” nusxalandi. Qidiruv ochilmasa — nomni {app} qidiruviga qoʻying.',
  ),
  store: t(
    '{app} не установлен — открываем страницу приложения. Название уже скопировано.',
    '{app} is not installed — opening its store page. The name is already copied.',
    '{app} орнатылмаған — қолданба бетін ашамыз. Атауы көшірілді.',
    '{app} oʻrnatilmagan — ilova sahifasi ochiladi. Nomi nusxalandi.',
  ),
  hint: t(
    'Dianping — отзывы, фото и рейтинг места; Meituan — доставка. Приложения на китайском; заказ обычно оплачивают через Alipay или WeChat Pay.',
    'Dianping — reviews, photos and ratings; Meituan — delivery. The apps are in Chinese; orders are usually paid via Alipay or WeChat Pay.',
    'Dianping — пікірлер, фото және рейтинг; Meituan — жеткізу. Қолданбалар қытай тілінде; тапсырысты әдетте Alipay не WeChat Pay арқылы төлейді.',
    'Dianping — sharhlar, foto va reyting; Meituan — yetkazib berish. Ilovalar xitoy tilida; buyurtma odatda Alipay yoki WeChat Pay orqali toʻlanadi.',
  ),
};

export function OpenInApps({ q, lang = 'ru', apps = ['dianping', 'meituan'], hint }: { q: string; lang?: Lang; apps?: CnApp[]; hint?: boolean }) {
  const toast = useToast();
  const go = async (app: CnApp) => {
    try { await Clipboard.setStringAsync(q); } catch { /* буфер недоступен — поиск всё равно откроется */ }
    const opened = await openInApp(app, q);
    const v = { q, app: CN_APPS[app].name };
    toast(fill(tr(opened === 'store' ? OA.store : OA.copied, lang), v));
  };
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {apps.map((a) => (
          <View key={a} style={{ flex: 1 }}>
            <Button title={tr(OA[a], lang)} icon={a === 'dianping' ? 'star' : 'suitcase'} kind="ghost" small label={`${tr(OA[a], lang)}: ${q}`} onPress={() => { go(a); }} />
          </View>
        ))}
      </View>
      {hint ? <Text style={{ fontFamily: F.regular, fontSize: 12, lineHeight: 17, color: C.muted }}>{tr(OA.hint, lang)}</Text> : null}
    </View>
  );
}

/** Одна строка под списком кнопок: что такое Dianping и Meituan. */
export function OpenInAppsHint({ lang = 'ru' }: { lang?: Lang }) {
  return <Text style={{ fontFamily: F.regular, fontSize: 12, lineHeight: 17, color: C.muted }}>{tr(OA.hint, lang)}</Text>;
}
