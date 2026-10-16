// Состояние делегата на шаге 1 — в памяти телефона. На шаге 2 его заменит сервер (вход по приглашению, синхронизация).
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { foodLine, freshProfile, type Profile } from '@/data/profile';

type Note = { text: string; time: string };
type TripState = {
  inBus: boolean;
  setInBus: (v: boolean) => void;
  done: Record<string, boolean>;
  toggle: (key: string) => void;
  profile: Profile;
  /** Правка профиля — черновик; «Сохранить» делает его видимым координатору. */
  editProfile: (patch: Partial<Profile>) => void;
  saveProfile: () => void;
  /** Шаг анкеты при первом заполнении (0–3): можно прерваться и вернуться к тому же шагу. */
  pStep: number;
  setPStep: (n: number) => void;
  /** История изменений профиля — её видит координатор: [когда, что]. */
  pHist: [string, string][];
  addHist: (what: string) => void;
  downloaded: Record<string, boolean>;
  download: (key: string) => void;
  notes: Note[];
  addNote: (text: string) => void;
  intros: Record<string, boolean>;
  introduce: (id: string) => void;
};

const Ctx = createContext<TripState | null>(null);
const clock = () => new Date().toTimeString().slice(0, 5);

export function TripProvider({ children }: { children: ReactNode }) {
  const [inBus, setInBus] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({ passport: true, tickets: true, interests: true });
  const [profile, setProfile] = useState<Profile>(freshProfile);
  const [pStep, setPStep] = useState(0);
  const [pHist, setPHist] = useState<[string, string][]>([]);
  const [downloaded, setDownloaded] = useState<Record<string, boolean>>({ trip: true, memo: true, program: true });
  const [notes, setNotes] = useState<Note[]>([{ text: 'JD: спросить про сроки доставки в регионах', time: 'вчера' }]);
  const [intros, setIntros] = useState<Record<string, boolean>>({});

  const value = useMemo<TripState>(() => ({
    inBus,
    setInBus,
    done,
    toggle: (key) => setDone((d) => ({ ...d, [key]: !d[key] })),
    profile,
    editProfile: (patch) => setProfile((p) => ({ ...p, ...patch })),
    saveProfile: () => {
      setPHist((h) => [[`сегодня, ${clock()}`, `Анна: ${profile.saved ? 'изменила профиль' : 'заполнила профиль'} — ${foodLine(profile)}`], ...h]);
      setProfile((p) => ({ ...p, saved: true }));
      setDone((d) => ({ ...d, profile: true }));
    },
    pStep,
    setPStep,
    pHist,
    addHist: (what) => setPHist((h) => [[`сегодня, ${clock()}`, what], ...h]),
    downloaded,
    download: (key) => setDownloaded((d) => ({ ...d, [key]: true })),
    notes,
    addNote: (text) => setNotes((n) => [{ text, time: 'сейчас' }, ...n]),
    intros,
    introduce: (id) => setIntros((x) => ({ ...x, [id]: true })),
  }), [inBus, done, profile, pStep, pHist, downloaded, notes, intros]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTrip() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTrip вне TripProvider');
  return v;
}
