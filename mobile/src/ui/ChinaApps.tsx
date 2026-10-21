// Ссылки на приложения для Китая: на iPhone — App Store, на Android — Google Play, в браузере — обе.
import { Linking, Platform, Text, View } from 'react-native';

import { CHINA_APPS, appStoreUrl, playUrl } from '@/data/china-apps';
import { Button, Card, H3, T } from './kit';
import { C, F } from './theme';

export function ChinaApps() {
  const ios = Platform.OS === 'ios', android = Platform.OS === 'android';
  return (
    <Card>
      <H3>Приложения для Китая</H3>
      <T muted>Поставьте до вылета, пока есть привычный интернет, и зарегистрируйтесь по своему номеру.</T>
      {CHINA_APPS.map((a) => (
        <View key={a.key} style={{ gap: 6, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.line2 }}>
          <Text style={{ fontFamily: F.semibold, fontSize: 14.5, color: C.ink }}>{`${a.name}  ${a.zh}`}</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 13, lineHeight: 18, color: C.muted }}>{a.what}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {!android ? <View style={{ flex: 1 }}><Button title="App Store" small kind="light" label={`${a.name} в App Store`} onPress={() => Linking.openURL(appStoreUrl(a.ios))} /></View> : null}
            {!ios ? <View style={{ flex: 1 }}><Button title="Google Play" small kind="light" label={`${a.name} в Google Play`} onPress={() => Linking.openURL(playUrl(a.android))} /></View> : null}
          </View>
        </View>
      ))}
    </Card>
  );
}
