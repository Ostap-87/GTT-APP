// Шрифты подключаем по одному начертанию: так в сборку попадают только нужные файлы
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { SofiaSansExtraCondensed_800ExtraBold } from '@expo-google-fonts/sofia-sans-extra-condensed/800ExtraBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TripProvider } from '@/state/trip';
import { ToastProvider } from '@/state/toast';
import { C, F } from '@/ui/theme';

export default function RootLayout() {
  const [loaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, SofiaSansExtraCondensed_800ExtraBold });
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <TripProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerTintColor: C.blue,
              headerTitleStyle: { fontFamily: F.bold, color: C.ink },
              headerStyle: { backgroundColor: C.card },
              headerBackTitle: 'Назад',
              contentStyle: { backgroundColor: C.bg },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="trip" options={{ headerShown: false }} />
            <Stack.Screen name="catalog/index" options={{ title: 'Программы GTT' }} />
            <Stack.Screen name="catalog/[id]" options={{ title: 'Программа' }} />
            <Stack.Screen name="hotel/[id]" options={{ title: 'Отель' }} />
            <Stack.Screen name="meal/[id]" options={{ title: 'Ресторан' }} />
            <Stack.Screen name="culture/[id]" options={{ title: 'Культурная программа' }} />
            <Stack.Screen name="contacts" options={{ title: 'Контакты поездки', presentation: 'modal' }} />
            <Stack.Screen name="driver" options={{ title: 'Показать водителю', presentation: 'modal' }} />
          </Stack>
        </ToastProvider>
      </TripProvider>
    </SafeAreaProvider>
  );
}
