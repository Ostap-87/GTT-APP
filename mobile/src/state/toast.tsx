// Короткое всплывающее сообщение внизу экрана («Скачано», «Координатор видит…»).
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, F } from '@/ui/theme';

const Ctx = createContext<(text: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const show = useCallback((t: string) => {
    setText(t);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setText(null), 2600);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      {text ? (
        <View pointerEvents="none" style={[st.wrap, { bottom: insets.bottom + 76 }]} accessibilityLiveRegion="polite">
          <Text style={st.text}>{text}</Text>
        </View>
      ) : null}
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

const st = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, backgroundColor: C.dark, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16 },
  text: { color: '#fff', fontFamily: F.semibold, fontSize: 14 },
});
