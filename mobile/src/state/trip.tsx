// Состояние делегата на шаге 1 — в памяти телефона. На шаге 2 его заменит сервер (вход по приглашению, синхронизация).
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type Note = { text: string; time: string };
type TripState = {
  inBus: boolean;
  setInBus: (v: boolean) => void;
  done: Record<string, boolean>;
  toggle: (key: string) => void;
  diet: string | null;
  setDiet: (v: string) => void;
  downloaded: Record<string, boolean>;
  download: (key: string) => void;
  notes: Note[];
  addNote: (text: string) => void;
  intros: Record<string, boolean>;
  introduce: (id: string) => void;
};

const Ctx = createContext<TripState | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
  const [inBus, setInBus] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({ passport: true, tickets: true, interests: true });
  const [diet, setDietState] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<Record<string, boolean>>({ trip: true, memo: true, program: true });
  const [notes, setNotes] = useState<Note[]>([{ text: 'JD: спросить про сроки доставки в регионах', time: 'вчера' }]);
  const [intros, setIntros] = useState<Record<string, boolean>>({});

  const value = useMemo<TripState>(() => ({
    inBus,
    setInBus,
    done,
    toggle: (key) => setDone((d) => ({ ...d, [key]: !d[key] })),
    diet,
    setDiet: (v) => { setDietState(v); setDone((d) => ({ ...d, diet: true })); },
    downloaded,
    download: (key) => setDownloaded((d) => ({ ...d, [key]: true })),
    notes,
    addNote: (text) => setNotes((n) => [{ text, time: 'сейчас' }, ...n]),
    intros,
    introduce: (id) => setIntros((x) => ({ ...x, [id]: true })),
  }), [inBus, done, diet, downloaded, notes, intros]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTrip() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTrip вне TripProvider');
  return v;
}
