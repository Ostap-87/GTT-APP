// «Начать демо заново»: стирает сохранённое на телефоне и пересобирает состояние всех ролей.
import { createContext, useContext } from 'react';

export const ResetContext = createContext<() => Promise<void>>(async () => {});
export const useResetAll = () => useContext(ResetContext);
