// «Начать демо заново»: стирает сохранённое на телефоне и пересобирает состояние всех ролей.
import { createContext, useContext } from 'react';

export const ResetContext = createContext<() => Promise<void>>(async () => {});
export const useResetAll = () => useContext(ResetContext);

/** Открыть в демо делегата программу сайта по id (пусто — подробное демо «Новый ритейл Китая»); экраны пересобираются. */
export const DemoContext = createContext<(programId: string) => void>(() => {});
export const useOpenDemo = () => useContext(DemoContext);
