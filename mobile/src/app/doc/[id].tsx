// Документ крупно — для паспортного контроля и стойки отеля: на весь экран, на белом, можно повернуть и увеличить.
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Platform, ScrollView, View } from 'react-native';

import { useToast } from '@/state/toast';
import { useTrip } from '@/state/trip';
import { shareUri } from '@/ui/files';
import { Button, Plain, T } from '@/ui/kit';
import { PdfView } from '@/ui/PdfView';
import { C } from '@/ui/theme';

export default function DocView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { docs, removeDoc } = useTrip();
  const toast = useToast();
  const d = docs.find((x) => x.id === id);
  const [turn, setTurn] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [armed, setArmed] = useState(false);
  if (!d) return <Plain><T>Документ не найден</T></Plain>;
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Stack.Screen options={{ title: d.title }} />
      <View style={{ flex: 1 }} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {d.type === 'pdf' ? <PdfView uri={d.uri} title={d.title} /> : box.w ? (
          <ScrollView maximumZoomScale={4} minimumZoomScale={1} centerContent contentContainerStyle={{ width: box.w, height: box.h, alignItems: 'center', justifyContent: 'center' }}>
            <Image source={{ uri: d.uri }} resizeMode="contain" accessibilityLabel={d.title}
              style={turn ? { width: box.h, height: box.w, transform: [{ rotate: '90deg' }] } : { width: box.w, height: box.h }} />
          </ScrollView>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, padding: 12, paddingBottom: 28, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.card }}>
        {d.type === 'image' ? <View style={{ flex: 1 }}><Button title="Повернуть" kind="light" small onPress={() => setTurn(!turn)} /></View> : null}
        {Platform.OS !== 'web' ? <View style={{ flex: 1 }}><Button title="Поделиться" icon="share" kind="light" small onPress={() => shareUri(d.uri, d.type === 'pdf' ? 'pdf' : 'image', d.title)} /></View> : null}
        <View style={{ flex: 1 }}>
          <Button title={armed ? 'Точно удалить?' : 'Удалить'} icon="trash" kind="ghost" small onPress={() => {
            if (!armed) { setArmed(true); return; }
            removeDoc(d.id);
            toast('Документ удалён с телефона');
            router.back();
          }} />
        </View>
      </View>
    </View>
  );
}
