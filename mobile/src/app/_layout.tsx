// Шрифты подключаем по одному начертанию: так в сборку попадают только нужные файлы
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { SofiaSansExtraCondensed_800ExtraBold } from '@expo-google-fonts/sofia-sans-extra-condensed/800ExtraBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AgentProvider } from '@/state/agent';
import { ResetContext } from '@/state/reset';
import { CoordProvider } from '@/state/coord';
import { clearStore, loadStore } from '@/state/store';
import { TripProvider } from '@/state/trip';
import { VisitsProvider } from '@/state/visits';
import { ToastProvider } from '@/state/toast';
import { C, F } from '@/ui/theme';

export default function RootLayout() {
  const [loaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, SofiaSansExtraCondensed_800ExtraBold });
  // Сохранённое на телефоне читается до первого экрана; «Начать демо заново» меняет gen — состояние собирается с нуля
  const [stored, setStored] = useState(false);
  const [gen, setGen] = useState(0);
  useEffect(() => { loadStore().finally(() => setStored(true)); }, []);
  const resetAll = useCallback(async () => { await clearStore(); setGen((g) => g + 1); }, []);
  if (!loaded || !stored) return null;
  return (
    <SafeAreaProvider>
      <ResetContext.Provider value={resetAll}>
      <TripProvider key={gen}>
        <CoordProvider>
        <AgentProvider>
        <VisitsProvider>
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
            <Stack.Screen name="profile" options={{ title: 'Мой профиль' }} />
            <Stack.Screen name="waiter" options={{ title: 'Карточка для официанта', presentation: 'modal' }} />
            <Stack.Screen name="coord" options={{ headerShown: false }} />
            <Stack.Screen name="person/[id]" options={{ title: 'Профиль участника' }} />
            <Stack.Screen name="leg" options={{ title: 'Переезд', presentation: 'modal' }} />
            <Stack.Screen name="legs" options={{ title: 'Журнал переездов', presentation: 'modal' }} />
            <Stack.Screen name="food-summary" options={{ title: 'Сводка для ресторана', presentation: 'modal' }} />
            <Stack.Screen name="rooming" options={{ title: 'Список для отеля', presentation: 'modal' }} />
            <Stack.Screen name="view-as" options={{ title: 'Смотреть как…', presentation: 'modal' }} />
            <Stack.Screen name="agent" options={{ headerShown: false }} />
            <Stack.Screen name="agent-tour/[id]" options={{ title: 'Программа' }} />
            <Stack.Screen name="agent-apply" options={{ title: 'Заявка в GTT', presentation: 'modal' }} />
            <Stack.Screen name="calc/[id]" options={{ title: 'ТЗ на расчёт' }} />
            <Stack.Screen name="translator" options={{ title: 'Переводчик', presentation: 'modal' }} />
            <Stack.Screen name="guide" options={{ title: 'Слушать гида', presentation: 'modal' }} />
            <Stack.Screen name="city" options={{ title: 'Город · Пекин' }} />
            <Stack.Screen name="place/[id]" options={{ title: 'Место', presentation: 'modal' }} />
            <Stack.Screen name="followup" options={{ title: 'Хочу продолжить', presentation: 'modal' }} />
            <Stack.Screen name="visit/[id]" options={{ title: 'Визит компании' }} />
            <Stack.Screen name="company/[id]" options={{ title: 'Визит' }} />
            <Stack.Screen name="card-scan" options={{ title: 'Визитка' }} />
            <Stack.Screen name="report" options={{ title: 'Итоги поездки' }} />
            <Stack.Screen name="mindmap" options={{ title: 'Майндмэп' }} />
          </Stack>
        </ToastProvider>
        </VisitsProvider>
        </AgentProvider>
        </CoordProvider>
      </TripProvider>
      </ResetContext.Provider>
    </SafeAreaProvider>
  );
}
