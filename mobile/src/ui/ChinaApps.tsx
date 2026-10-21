// Приложения для страны поездки: на iPhone — App Store, на Android — Google Play, в браузере — обе.
// Если на iPhone приложения нет в российском App Store — вместо кнопки подсказка (мини-программа или Apple ID другой страны).
import { Linking, Platform, Text, View } from 'react-native';

import { appStoreUrl, playUrl } from '@/data/china-apps';
import { countryOf } from '@/data/countries';
import { TRIP } from '@/data/trip';
import { Button, Card, H3, T } from './kit';
import { C, F } from './theme';

export function CountryApps({ code = TRIP.country }: { code?: string }) {
  const c = countryOf(code);
  const ios = Platform.OS === 'ios', android = Platform.OS === 'android';
  return (
    <Card>
      <H3>{`Приложения для ${c.ofRu}`}</H3>
      <T muted>Поставьте до вылета, пока есть привычный интернет, и зарегистрируйтесь по своему номеру.</T>
      {c.apps.map((a) => {
        const showIos = !android && !!a.ios && !a.iosCn;
        const showAndroid = !ios && !!a.android;
        const notes = [
          !android && a.iosCn ? `На iPhone с российским Apple ID не скачать — откройте его как ${a.inside}` : '',
          !android && a.iosNote ? a.iosNote : '',
          !ios && a.androidNote ? a.androidNote : '',
        ].filter(Boolean);
        return (
          <View key={a.key} style={{ gap: 6, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.line2 }}>
            <Text style={{ fontFamily: F.semibold, fontSize: 14.5, color: C.ink }}>{a.zh ? `${a.name}  ${a.zh}` : a.name}</Text>
            <Text style={{ fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: C.muted }}>{a.what}</Text>
            {notes.map((n) => <Text key={n} style={{ fontFamily: F.medium, fontSize: 12.5, lineHeight: 17, color: C.warn }}>{n}</Text>)}
            {showIos || showAndroid ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {showIos ? <View style={{ flex: 1 }}><Button title="App Store" small kind="light" label={`${a.name} в App Store`} onPress={() => Linking.openURL(appStoreUrl(a.ios!))} /></View> : null}
                {showAndroid ? <View style={{ flex: 1 }}><Button title={a.androidNote ? 'Taobao в Google Play' : 'Google Play'} small kind="light" label={`${a.name} в Google Play`} onPress={() => Linking.openURL(playUrl(a.android!))} /></View> : null}
              </View>
            ) : null}
          </View>
        );
      })}
    </Card>
  );
}

/** Совместимость: «Приложения для Китая» — то же самое для страны текущей поездки. */
export const ChinaApps = () => <CountryApps />;
